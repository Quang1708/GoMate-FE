const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const beRoot = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(beRoot + '/package.json');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);

(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { seedWorkshopDemo }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/activities/repository', 'modules/chat/repository', 'database/workshop-demo'].map(be));
  const artifacts = mkdtempSync(join(tmpdir(), 'gomate-business-demo-')); console.log('Business demo artifacts:', artifacts);
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('business_demo_ui') }));
  await client.connect(); const db = client.db(); await initializeDatabase(db); await seedWorkshopDemo(db);
  const auth = createAuthRepository(db), activities = createActivityRepository(db), chat = createChatRepository(db);
  const server = createApp(readConfig({}), { authRepository: auth, activityRepository: activities, chatRepository: chat }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`, errors = [];
  let browser, business, staff, member;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
    business = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); staff = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); member = await browser.newPage({ viewport: { width: 390, height: 900 } });
    for (const page of [business, staff, member]) { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); }
    const visible = (page, text) => page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' });
    const click = (page, text) => page.getByText(text, { exact: true }).last().click();
    const enter = async (page, label) => { await page.goto(base + '/demo'); await page.getByRole('button', { name: 'Dùng tài khoản ' + label, exact: true }).click(); };
    await member.goto(base + '/demo'); await member.screenshot({ path: join(artifacts, 'demo-hub-390.png'), fullPage: true });
    await enter(business, 'Đối tác mới'); await visible(business, 'Hồ sơ xác minh doanh nghiệp');
    await business.getByLabel('Tên doanh nghiệp', { exact: true }).fill('DEMO Studio Browser');
    await business.getByLabel('Mã số thuế', { exact: true }).fill('0312345678');
    await business.getByLabel('Địa chỉ chi tiết', { exact: true }).fill('15 Nguyen Hue, Ben Nghe Ward, District 1, Ho Chi Minh City');
    await business.getByLabel('Họ và tên người đại diện', { exact: true }).fill('Linh Nguyen');
    await business.getByLabel('Chức vụ', { exact: true }).fill('Director');
    await business.getByLabel('Email liên hệ', { exact: true }).fill('linh@demo-studio.vn');
    await business.getByLabel('Số điện thoại', { exact: true }).fill('+84901234567');
    await business.getByLabel('Hồ sơ xác minh', { exact: true }).setInputFiles({ name: 'proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nBrowser demo verification') });
    await business.getByRole('button', { name: 'Gửi hồ sơ xác minh', exact: true }).click(); await visible(business, 'Chờ duyệt');
    await enter(staff, 'Linh · Staff'); await visible(staff, 'Hồ sơ doanh nghiệp');
    const applicationCard = staff.locator('.gm-live-review').filter({ has: staff.getByRole('heading', { name: 'DEMO Studio Browser', exact: true }) });
    await applicationCard.getByRole('button', { name: 'Duyệt doanh nghiệp', exact: true }).click();
    await visible(staff, 'Đã duyệt thành công.');
    await business.getByRole('button', { name: 'Làm mới', exact: true }).click(); await visible(business, 'Doanh nghiệp đã xác minh');
    const title = 'DEMO Business Browser Event';
    await business.getByLabel('Tên sự kiện', { exact: true }).fill(title);
    await business.getByLabel('Mô tả sự kiện', { exact: true }).fill('Một sự kiện thật được kiểm duyệt qua API để thử đa trình duyệt.');
    await business.getByLabel('Nội dung ưu đãi', { exact: true }).fill('Tặng một đồ uống GoMate');
    await business.getByLabel('Điều kiện áp dụng', { exact: true }).fill('Một lần cho mỗi người tham gia.');
    await business.getByRole('button', { name: 'Gửi sự kiện cho staff duyệt', exact: true }).click(); await visible(business, 'Đã gửi sự kiện cho staff. Sau khi được duyệt, bài sẽ xuất hiện trong app.');
    const post = await db.collection('business_posts').findOne({ title }); assert.equal(post.status, 'pending'); assert.equal(await db.collection('activities').countDocuments({ id: post.activityId }), 0);
    await staff.getByRole('button', { name: 'Làm mới', exact: true }).click();
    const postCard = staff.locator('.gm-live-review').filter({ has: staff.getByRole('heading', { name: title, exact: true }) });
    await postCard.getByRole('button', { name: 'Duyệt và đưa lên app', exact: true }).click(); await visible(staff, 'Đã duyệt thành công.');
    const activity = await activities.get(post.activityId); assert.equal(activity.business.verified, true); assert.equal(activity.business.discountPercent, 20); assert.ok(activity.scheduleConfirmedAt);
    await staff.screenshot({ path: join(artifacts, 'staff-review-1440.png'), fullPage: true });
    console.log('PASS real demo login, business verification by staff and event publication into the activity collection');

    await enter(member, 'An · Người tham gia'); await visible(member, 'Tìm hoạt động');
    await member.getByLabel('Tìm tên hoạt động', { exact: true }).fill(title); await member.getByRole('button', { name: 'Tìm kiếm hoạt động', exact: true }).click();
    await member.getByRole('button', { name: 'Xem hoạt động ' + title, exact: true }).waitFor(); await visible(member, 'Doanh nghiệp đã xác minh'); await visible(member, '−20%');
    await member.screenshot({ path: join(artifacts, 'business-search-card-390.png'), fullPage: true });
    await member.getByRole('button', { name: 'Xem hoạt động ' + title, exact: true }).click(); await visible(member, 'Tặng một đồ uống GoMate');
    await click(member, 'Gửi yêu cầu tham gia'); await visible(member, 'Yêu cầu tham gia');
    assert.equal((await activities.get(activity.id)).joinRequests[0].status, 'pending');
    await business.goto(base + '/#/app/home/manage'); await visible(business, title); await click(business, 'Duyệt'); await visible(business, 'Chưa có yêu cầu mới');
    await click(business, 'Mở chat nhóm'); await business.getByLabel('Tin nhắn', { exact: true }).waitFor();
    assert.equal(await business.getByText('Nội dung đã chia sẻ', { exact: true }).count(), 0);
    const shared = business.getByRole('button', { name: 'Xem ảnh, tệp và liên kết đã gửi', exact: true }); const sharedBox = await shared.boundingBox(); assert.ok(sharedBox.y < 80);
    await shared.click(); await visible(business, 'Nội dung đã chia sẻ'); await business.getByRole('button', { name: 'Quay lại', exact: true }).last().click();
    await business.getByRole('button', { name: 'Tùy chọn cuộc trò chuyện', exact: true }).click(); await click(business, 'Kế hoạch của nhóm');
    await business.getByText('Cuộc trò chuyện', { exact: true }).waitFor({ state: 'hidden' });
    await visible(business, 'Chương trình sự kiện'); await visible(business, 'Lịch chính thức');
    await business.screenshot({ path: join(artifacts, 'business-plan-1440.png'), fullPage: true });
    await business.getByRole('tab', { name: 'Thành viên', exact: true }).click(); assert.equal(await business.getByText('Thêm bạn bè vào nhóm', { exact: true }).count(), 0);
    await business.getByRole('tab', { name: 'Chat', exact: true }).click();
    await business.getByLabel('Tin nhắn', { exact: true }).fill('Chào mừng bạn đến với sự kiện'); await business.getByLabel('Gửi tin nhắn', { exact: true }).click();
    await member.goto(base + '/#/app/home/group/' + activity.id); await visible(member, 'Chào mừng bạn đến với sự kiện');
    assert.equal(await member.getByRole('tab', { name: 'Quản lý', exact: true }).count(), 0);
    assert.equal(await member.getByLabel(/^Tiến trình hoạt động:/).count(), 0);
    await member.getByRole('button', { name: 'Tùy chọn cuộc trò chuyện', exact: true }).click(); assert.equal(await member.getByText('Quản lý hoạt động', { exact: true }).count(), 0); await click(member, 'Thành viên trong nhóm'); await visible(member, 'Thành viên (2)');
    await member.getByRole('tab', { name: 'Chat', exact: true }).click();
    for (const width of [360, 390, 768, 1440]) { await member.setViewportSize({ width, height: 900 }); assert.ok(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); const box = await member.getByRole('button', { name: 'Xem ảnh, tệp và liên kết đã gửi', exact: true }).boundingBox(); assert.ok(box.y < 80 && box.x + box.width <= width); }
    await member.setViewportSize({ width: 390, height: 900 }); await member.screenshot({ path: join(artifacts, 'business-group-chat-390.png'), fullPage: true });
    await business.goto(base + '/portal'); await visible(business, 'Doanh nghiệp đã xác minh'); await business.screenshot({ path: join(artifacts, 'business-portal-1440.png'), fullPage: true });
    await business.setViewportSize({ width: 390, height: 900 }); assert.ok(await business.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await business.screenshot({ path: join(artifacts, 'business-portal-390.png'), fullPage: true });
    assert.deepEqual(errors, []); console.log('PASS separate sessions, searchable verified offer cards, join approval/chat, header library/menu, official business plan and responsive portal');
  } catch (error) {
    for (const [name, page] of [['business', business], ['staff', staff], ['member', member]]) if (page) { console.log(name, page.url(), (await page.locator('body').innerText()).slice(0, 4200)); await page.screenshot({ path: join(artifacts, name + '-failure.png'), fullPage: true }).catch(() => {}); }
    throw error;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
