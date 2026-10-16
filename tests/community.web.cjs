const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const artifacts = mkdtempSync(join(tmpdir(), 'gomate-community-ui-'));
const beRoot = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(beRoot + '/package.json');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);
(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { hashPassword }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/activities/repository', 'modules/chat/repository', 'modules/auth/password'].map(be));
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('community_ui') }));
  await client.connect(); const db = client.db(); await initializeDatabase(db);
  const auth = createAuthRepository(db), activities = createActivityRepository(db), chat = createChatRepository(db), users = [];
  const passwordHash = await hashPassword('123456');
  for (const [index, name] of ['Community Host', 'Community Member'].entries()) {
    const user = await auth.createUser({ name, email: `community-ui${index}@example.com`, passwordHash }); users.push(user);
    await db.collection('users').updateOne({ id: user.id }, { $set: { email_verified: true, birthDate: '2000-01-01', gender: 'undisclosed', location: 'Hà Nội', bio: 'Real community test', interests: ['Cà phê'], languages: ['Tiếng Việt'] } });
  }
  const draft = { title: 'Community Upcoming', description: 'An upcoming activity for reports and notifications', category: 'Cà phê', location: 'Hà Nội', startsAt: new Date('2099-01-01T02:00:00Z'), endsAt: new Date('2099-01-01T04:00:00Z'), estimatedCost: 0, maxParticipants: 6 };
  const upcoming = await activities.create(draft, users[0]);
  await activities.create({ ...draft, title:'Community Report Target' }, users[0]);
  const past = await activities.create({ ...draft, title: 'Community Completed', initialMembers: [users[1]] }, users[0]);
  await db.collection('activities').updateOne({ id: past.id }, { $set: { status: 'completed', attendance: users.map(user => ({ userId: user.id, name: user.name, status: 'present' })) } });
  const server = createApp(readConfig({}), { authRepository: auth, activityRepository: activities, chatRepository: chat }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port, errors = [];
  let browser, member, host;
  try {
    browser = await chromium.launch({ executablePath: existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined, headless: true });
    member = await browser.newPage({ viewport: { width: 390, height: 900 } }); host = await browser.newPage({ viewport: { width: 768, height: 1000 } });
    for (const page of [member, host]) { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); }
    const click = (page, text) => page.getByText(text, { exact: true }).last().click();
    const visible = (page, text) => page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' });
    const login = async (page, index, password = '123456') => { await page.goto(base + '/#/auth/login'); await page.getByLabel('Email', { exact: true }).fill(`community-ui${index}@example.com`); await page.getByLabel('Mật khẩu', { exact: true }).fill(password); await click(page, 'Đăng nhập'); await page.getByText(users[index].name, { exact: false }).first().waitFor({state:'visible'}); };
    const call = (page, path, method = 'GET', body) => page.evaluate(async ({ path, method, body }) => { const session = JSON.parse(localStorage.getItem('gomate.session')); const res = await fetch('/api' + path, { method, headers: { Authorization: 'Bearer ' + session.accessToken, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: res.status, body: res.status === 204 ? null : await res.json() }; }, { path, method, body });
    await login(member, 1); await login(host, 0);
    await member.goto(base + '/#/app/profile/settings'); await click(member, 'Quyền riêng tư & an toàn');
    const saved = member.waitForResponse(res => res.url().endsWith('/community/settings') && res.request().method() === 'PATCH');
    await member.getByLabel('Nhận lời mời kết bạn', { exact: true }).click(); assert.equal((await saved).status(), 200);
    await member.reload(); await click(member, 'Quyền riêng tư & an toàn'); assert.equal(await member.getByLabel('Nhận lời mời kết bạn', { exact: true }).isChecked(), false);
    assert.ok(member.url().endsWith('/settings/privacy')); await member.goBack(); await visible(member,'Tài khoản'); await member.goForward(); await member.getByLabel('Nhận lời mời kết bạn',{exact:true}).waitFor();
    console.log('PASS settings persist after reload and restore with Back/Forward');

    assert.equal((await call(member, `/activities/${upcoming.id}/join-requests`, 'POST', {})).status, 201);
    await host.goto(base + '/#/app/home/notifications'); await visible(host, 'Yêu cầu tham gia mới'); await click(host, 'Yêu cầu tham gia mới'); await visible(host, 'Community Member');
    await click(host, 'Duyệt'); await visible(host, 'Chưa có yêu cầu mới');
    await member.goto(base + '/#/app/home/notifications'); await visible(member, 'Yêu cầu đã được duyệt'); await click(member, 'Yêu cầu đã được duyệt'); await member.getByLabel('Tin nhắn', { exact: true }).waitFor();
    await member.getByLabel('Tin nhắn', { exact: true }).fill('Hello from a real notification'); await member.getByLabel('Gửi tin nhắn', { exact: true }).click(); await visible(member, 'Hello from a real notification');
    console.log('PASS real notifications, host approval and group deep link');

    await member.goto(base + '/#/app/home/rating/' + past.id); await click(member, 'Gửi đánh giá'); await member.getByRole('alert').waitFor();
    await member.getByLabel('Trải nghiệm: 5 sao', { exact: true }).click(); await member.getByLabel('Community Host: 4 sao', { exact: true }).click();
    await member.getByLabel('Nhận xét (không bắt buộc)', { exact: true }).fill('A thoughtful host'); await click(member, 'Gửi đánh giá'); await visible(member, 'Cảm ơn bạn đã chia sẻ!');
    await member.reload(); await visible(member, 'Cảm ơn bạn đã chia sẻ!');
    await host.goto(base + '/#/app/profile/myReviews'); await visible(host, '4.0 / 5'); await visible(host, 'A thoughtful host');
    assert.equal(await db.collection('activity_ratings').countDocuments({ authorId: users[1].id }), 1);
    console.log('PASS real ratings persist and update host reviews');

    await member.goto(base + '/#/app/match/discover'); await member.getByLabel('Tùy chọn và báo cáo hoạt động', { exact: true }).click(); await click(member, 'Báo cáo hoạt động'); await click(member, 'Thông tin sai sự thật');
    await member.getByLabel('Mô tả báo cáo', { exact: true }).fill('Please check this listing'); await click(member, 'Gửi báo cáo'); await member.getByText('Đã tiếp nhận báo cáo.', { exact: false }).waitFor(); await click(member, 'Đóng');
    await member.goto(base + '/#/app/profile/settings'); await click(member, 'Báo cáo của tôi'); await visible(member, 'Please check this listing');
    assert.equal(await db.collection('reports').countDocuments({ reporterId: users[1].id }), 1);
    console.log('PASS reporting stores real reports and shows status');

    const conversation = await call(member, '/conversations', 'POST', { type: 'direct', userId: users[0].id });
    await member.goto(base + '/#/app/messages/chat/' + conversation.body.conversation.id); await click(member, 'Chặn tài khoản này'); await click(member, 'Xác nhận chặn');
    assert.equal((await call(host, '/conversations/' + conversation.body.conversation.id)).status, 403);
    await member.goto(base + '/#/app/profile/settings'); await click(member, 'Quyền riêng tư & an toàn'); await click(member, 'Tài khoản đã chặn'); await member.getByLabel('Bỏ chặn Community Host', { exact: true }).click(); await visible(member, 'Bạn chưa chặn tài khoản nào.');
    assert.equal((await call(host, '/conversations/' + conversation.body.conversation.id)).status, 200);
    console.log('PASS blocking revokes direct access and unblock restores it');

    await member.goto(base + '/#/app/profile/settings'); await click(member, 'Tài khoản'); await click(member, 'Đổi mật khẩu');
    assert.equal(await member.getByLabel('Mật khẩu hiện tại', { exact: true }).inputValue(), '');
    await member.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('123456'); await member.getByLabel('Mật khẩu mới', { exact: true }).fill('654321'); await member.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('654321'); await click(member, 'Cập nhật mật khẩu'); await visible(member, 'Tham gia GoMate');
    assert.equal(await member.evaluate(() => localStorage.getItem('gomate.session')), null); await login(member, 1, '654321');
    console.log('PASS password change revokes the session and accepts the new password');
    await member.goto(base + '/#/app/profile/settings'); await member.screenshot({ path: join(artifacts, 'settings-390.png'), fullPage: true });
    assert.deepEqual(errors, []); console.log('PASS no browser runtime errors; artifacts:', artifacts);
  } catch (error) { for (const [name, page] of [['member', member], ['host', host]]) if (page) { console.log(name, page.url(), (await page.locator('body').innerText()).slice(0, 3000)); await page.screenshot({ path: join(artifacts, name + '-failure.png'), fullPage: true }).catch(() => {}); } throw error; }
  finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
