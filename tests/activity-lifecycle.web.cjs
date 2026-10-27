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
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { hashPassword }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/activities/repository', 'modules/chat/repository', 'modules/auth/password'].map(be));
  const artifacts = mkdtempSync(join(tmpdir(), 'gomate-lifecycle-ui-'));
  console.log('Lifecycle UI artifacts:', artifacts);
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('lifecycle_ui') }));
  await client.connect(); const db = client.db(); await initializeDatabase(db);
  const auth = createAuthRepository(db), activities = createActivityRepository(db), chat = createChatRepository(db), users = [];
  const passwordHash = await hashPassword('123456');
  for (const [index, name] of ['Lifecycle Host', 'Lifecycle Friend One', 'Lifecycle Friend Two', 'Lifecycle Joiner'].entries()) {
    const user = await auth.createUser({ name, email: `lifecycle-ui${index}@example.com`, passwordHash }); users.push(user);
    await db.collection('users').updateOne({ id: user.id }, { $set: { email_verified: true, birthDate: '2000-01-01', gender: 'undisclosed', location: 'Hà Nội', bio: 'Lifecycle test', interests: ['Cà phê'], languages: ['Tiếng Việt'] } });
  }
  for (const index of [1, 2]) { const request = await auth.friendRequest(users[0].id, users[index].id); await auth.decideFriend(users[index].id, request.id, 'accepted'); }
  const activity = await activities.create({ title: 'Lifecycle UI Meetup', description: 'A group with two initial account members', category: 'Cà phê', location: 'Hà Nội', meetingPoint: 'Cổng chính', startsAt: new Date(Date.now() + 2 * 86400000), endsAt: new Date(Date.now() + 2 * 86400000 + 7200000), estimatedCost: 0, minParticipants: 4, maxParticipants: 6, initialMembers: [users[1], users[2]] }, users[0]);
  const conversation = await chat.create(users[0].id, { type: 'group', activityId: activity.id });
  const server = createApp(readConfig({}), { authRepository: auth, activityRepository: activities, chatRepository: chat }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port, errors = [];
  let browser, host, member, joiner;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
    host = await browser.newPage({ viewport: { width: 390, height: 900 } }); member = await browser.newPage({ viewport: { width: 390, height: 900 } }); joiner = await browser.newPage({ viewport: { width: 390, height: 900 } });
    for (const page of [host, member, joiner]) { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); }
    const visible = (page, text) => page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' });
    const click = (page, text) => page.getByText(text, { exact: true }).last().click();
    const phase = (page, label) => page.getByLabel('Tiến trình hoạt động: ' + label, { exact: true }).first().waitFor({ state: 'visible' });
    const noTimeline = async page => assert.equal(await page.getByLabel(/^Tiến trình hoạt động:/).count(), 0);
    const notice = async (page, title) => { await visible(page, title); await noTimeline(page); for (const label of ['Chốt lịch đi', 'Bắt đầu hoạt động', 'Điểm danh & kết thúc', 'Xem tổng kết']) assert.equal(await page.getByRole('button', { name: label, exact: true }).count(), 0); };
    const call = (page, path, method = 'GET', body) => page.evaluate(async ({ path, method, body }) => {
      const session = JSON.parse(localStorage.getItem('gomate.session'));
      const response = await fetch('/api' + path, { method, headers: { Authorization: 'Bearer ' + session.accessToken, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    }, { path, method, body });
    const login = async (page, index) => {
      await page.goto(base + '/#/auth/login'); await page.getByLabel('Email', { exact: true }).fill(`lifecycle-ui${index}@example.com`); await page.getByLabel('Mật khẩu', { exact: true }).fill('123456'); await click(page, 'Đăng nhập'); await page.getByText(users[index].name, { exact: false }).first().waitFor({ state: 'visible' });
    };
    await login(host, 0); await login(member, 1); await login(joiner, 3);
    const groupBefore = await activities.get(activity.id);
    assert.equal(groupBefore.memberCount, 1);
    await member.goto(base+'/#/app/profile'); await member.getByRole('button',{name:'Bạn bè',exact:true}).click();
    await member.getByRole('button',{name:'Đồng ý tham gia '+activity.title,exact:true}).click();
    await member.getByRole('button',{name:'Đồng ý tham gia '+activity.title,exact:true}).waitFor({state:'hidden'});
    // Accept the second seeded friend's invitation through its own authenticated account.
    const second = await browser.newPage(); await login(second,2); await second.goto(base+'/#/app/messages/friends');
    await second.getByRole('button',{name:'Đồng ý tham gia '+activity.title,exact:true}).click(); await second.getByRole('button',{name:'Đồng ý tham gia '+activity.title,exact:true}).waitFor({state:'hidden'}); await second.close();
    assert.equal((await activities.get(activity.id)).memberCount,3);
    assert.equal((await call(host,'/activities/'+activity.id+'/start','POST',{})).status,409);
    await host.goto(base+'/#/app/home/activityDetail/'+activity.id); await click(host,'Quản lý hoạt động');
    assert.equal(await host.getByRole('button',{name:'Chốt lịch đi',exact:true}).isDisabled(),true);
    assert.equal((await call(joiner, '/activities?q=Lifecycle')).body.items.some(row=>row.id===activity.id),true);
    assert.equal((await call(host, '/activities?q=Lifecycle')).body.items.some(row=>row.id===activity.id),false);
    await joiner.goto(base+'/#/app/match/discover'); await visible(joiner,'Lifecycle UI Meetup');
    await joiner.getByLabel('Gửi yêu cầu tham gia',{exact:true}).click(); await visible(joiner,'Cam kết tham gia');
    await joiner.getByRole('checkbox',{name:'Tôi đồng ý với cam kết tham gia',exact:true}).click(); await click(joiner,'Xác nhận và gửi yêu cầu');
    await visible(joiner,'Đã gửi yêu cầu tham gia');

    const groupUrl = base + '/#/app/messages/chat/' + conversation.id;
    await host.goto(groupUrl); await notice(host, 'Nhóm đang lên kế hoạch');
    await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await visible(host, 'Bước tiếp theo của host');
    await phase(host, 'Lên kế hoạch');
    await click(host, 'Duyệt'); await visible(host, 'Chưa có yêu cầu mới');
    assert.equal((await activities.get(activity.id)).memberCount, 4);
    await joiner.goto(groupUrl); await joiner.getByLabel('Tin nhắn', { exact: true }).fill('Mình vừa tham gia nhóm'); await joiner.getByLabel('Gửi tin nhắn', { exact: true }).click();
    await member.goto(groupUrl); await notice(member, 'Nhóm đang lên kế hoạch'); await visible(member, 'Mình vừa tham gia nhóm');
    assert.equal(await member.getByRole('tab', { name: 'Quản lý', exact: true }).count(), 0);
    assert.equal(await member.getByRole('button', { name: 'Chốt lịch đi', exact: true }).count(), 0);
    assert.equal(await member.getByRole('button', { name: 'Bắt đầu hoạt động', exact: true }).count(), 0);

    await host.getByRole('tab', { name: 'Kế hoạch', exact: true }).click(); await click(host, 'Chỉnh sửa kế hoạch chuyến đi');
    await noTimeline(host);
    await host.getByLabel('Link Google Sheets / kế hoạch online', { exact: true }).fill('https://example.com/group-plan'); await click(host, 'Lưu kế hoạch'); await visible(host, 'Chỉnh sửa kế hoạch chuyến đi');
    await click(host, 'Sang Quản lý để chốt lịch & bắt đầu →');
    await host.getByRole('button', { name: 'Chốt lịch đi', exact: true }).click(); await visible(host, 'Chốt lịch đi?');
    await click(host, 'Để sau'); assert.equal((await activities.get(activity.id)).scheduleConfirmedAt ?? null, null);
    await host.getByRole('button', { name: 'Chốt lịch đi', exact: true }).click(); await click(host, 'Xác nhận'); await phase(host, 'Đã chốt lịch');
    assert.ok((await activities.get(activity.id)).scheduleConfirmedAt);
    await host.reload(); await notice(host, 'Host đã chốt lịch đi'); await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await phase(host, 'Đã chốt lịch'); await member.reload(); await notice(member, 'Host đã chốt lịch đi');
    console.log('PASS two initial members, new join approval, cross-user chat, plan save and visible schedule confirmation/cancel/persistence');

    // Editing the actual appointment invalidates confirmation; the timeline must follow the server.
    assert.equal((await call(host, '/activities/' + activity.id, 'PATCH', { meetingPoint: 'Cổng phía đông' })).status, 200);
    await host.reload(); await notice(host, 'Nhóm đang lên kế hoạch'); await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await phase(host, 'Lên kế hoạch'); await host.getByRole('button', { name: 'Chốt lịch đi', exact: true }).click(); await visible(host, 'Cổng phía đông'); await click(host, 'Xác nhận'); await phase(host, 'Đã chốt lịch');
    await host.getByText('Xác nhận', { exact: true }).waitFor({ state: 'hidden' });
    await host.screenshot({ path: join(artifacts, 'host-management-timeline-390.png'), fullPage: true });
    await host.getByRole('tab', { name: 'Chat', exact: true }).click(); await notice(host, 'Host đã chốt lịch đi');
    for (const width of [360, 390, 768, 1440]) {
      await host.setViewportSize({ width, height: 900 });
      assert.ok(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const composer = await host.getByLabel('Tin nhắn', { exact: true }).boundingBox(); assert.ok(composer && composer.height >= 40 && composer.y + composer.height <= 900);
      await host.screenshot({ path: join(artifacts, `chat-notice-${width}.png`), fullPage: true });
    }
    await host.setViewportSize({ width: 390, height: 900 });
    await host.getByRole('tab', { name: 'Thành viên', exact: true }).click(); await visible(host, 'Thành viên (4)'); await noTimeline(host);
    await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await host.getByRole('button', { name: 'Bắt đầu hoạt động', exact: true }).click(); await click(host, 'Để sau'); assert.equal((await activities.get(activity.id)).status, 'published');
    await host.getByRole('button', { name: 'Bắt đầu hoạt động', exact: true }).click(); await click(host, 'Xác nhận');
    await visible(host, 'Điểm danh (0/4)'); await noTimeline(host);
    assert.equal(await host.getByRole('button',{name:'Kết thúc hoạt động',exact:true}).isDisabled(),true);
    await host.getByRole('button', { name: 'Lọc điểm danh: Chưa điểm danh', exact: true }).click();
    await host.getByRole('button', { name: `Điểm danh ${users[0].name}: Có mặt`, exact: true }).click(); await visible(host, 'Điểm danh (1/4)');
    assert.equal(await host.getByRole('button', { name: `Điểm danh ${users[0].name}: Có mặt`, exact: true }).count(), 0);
    await host.getByRole('button', { name: 'Lọc điểm danh: Tất cả', exact: true }).click();
    for (const user of users.slice(1)) { await host.getByRole('button', { name: `Điểm danh ${user.name}: Có mặt`, exact: true }).click(); }
    await visible(host, 'Điểm danh (4/4)'); await host.reload(); await visible(host, 'Điểm danh (4/4)');
    await member.reload(); await notice(member, 'Hoạt động đã bắt đầu'); await member.getByRole('tab', { name: 'Kế hoạch', exact: true }).click(); await noTimeline(member); await member.getByRole('button', { name: 'Xem diễn biến', exact: true }).click(); await visible(member, 'Điểm danh (4/4)'); await noTimeline(member);
    await host.goto(groupUrl); await notice(host, 'Hoạt động đã bắt đầu'); await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await phase(host, 'Đang diễn ra'); await host.getByRole('button', { name: 'Điểm danh & kết thúc', exact: true }).click(); await visible(host, 'Điểm danh (4/4)');
    assert.equal(await member.getByText('Kết thúc hoạt động', { exact: true }).count(), 0);
    await host.screenshot({ path: join(artifacts, 'host-attendance-390.png'), fullPage: true });
    await click(host, 'Kết thúc hoạt động'); await click(host, 'Xác nhận kết thúc'); await visible(host, 'Tổng kết hoạt động'); await noTimeline(host);
    assert.equal((await activities.get(activity.id)).status, 'completed');
    await member.goto(groupUrl); await notice(member, 'Hoạt động đã kết thúc'); await member.getByRole('tab', { name: 'Kế hoạch', exact: true }).click(); await member.getByRole('button', { name: 'Xem tổng kết', exact: true }).click(); await visible(member, 'Tổng kết hoạt động'); await noTimeline(member);
    await click(member, 'Đánh giá trải nghiệm'); await member.getByLabel('Trải nghiệm: 5 sao', { exact: true }).click(); await member.getByLabel('Lifecycle Host: 4 sao', { exact: true }).click();
    await member.getByLabel('Nhận xét (không bắt buộc)', { exact: true }).fill('Lịch hẹn và các bước rất rõ ràng'); await click(member, 'Gửi đánh giá'); await visible(member, 'Cảm ơn bạn đã chia sẻ!');
    assert.equal(await db.collection('activity_ratings').countDocuments({ authorId: users[1].id }), 1);
    // A real post-trip friend request and recipient acceptance, without auto-friending.
    await member.getByText(users[3].name,{exact:true}).locator('..').getByRole('button',{name:'Gửi lời mời kết bạn',exact:true}).click();
    await visible(member,'Đã gửi lời mời kết bạn');
    await joiner.goto(base+'/#/app/messages/friends');
    await joiner.getByRole('button',{name:'Chấp nhận '+users[1].name,exact:true}).click();
    await visible(joiner,'Bạn bè (1)');

    await host.screenshot({ path: join(artifacts, 'host-summary-390.png'), fullPage: true });
    await host.goto(groupUrl); await notice(host, 'Hoạt động đã kết thúc'); await host.getByRole('tab', { name: 'Quản lý', exact: true }).click(); await phase(host, 'Đã kết thúc');
    console.log('PASS host-management-only timeline, chat notices for both roles, schedule reset, responsive composer, attendance, completion and rating through Plans');
    const expired = await activities.create({ title: 'Expired without starting', description: 'Never started', category: 'Cà phê', location: 'Hà Nội', startsAt: new Date(Date.now()+86400000), endsAt: new Date(Date.now()+93600000), estimatedCost: 0, minParticipants: 2, maxParticipants: 4 }, users[0]);
    await db.collection('activities').updateOne({id:expired.id},{$set:{status:'expired'}});
    await host.goto(base+'/#/app/home/group/'+expired.id); await visible(host,'Hoạt động đã hết hạn');
    await host.getByRole('tab',{name:'Quản lý',exact:true}).click(); await visible(host,'ĐÃ HẾT HẠN');
    assert.equal(await host.getByRole('button',{name:'Bắt đầu hoạt động',exact:true}).count(),0);
    console.log('PASS expiry has no start action or fake completion');
    assert.deepEqual(errors, []); console.log('PASS no browser runtime errors');
  } catch (error) {
    for (const [name, page] of [['host', host], ['member', member]]) if (page) { console.log(name, page.url(), (await page.locator('body').innerText()).slice(0, 4500)); await page.screenshot({ path: join(artifacts, name + '-failure.png'), fullPage: true }).catch(() => {}); }
    throw error;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
