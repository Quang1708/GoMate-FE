const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { existsSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { chromium } = require('playwright');
const root = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(root + '/package.json');
const be = name => import(pathToFileURL(root + '/src/' + name + '.js').href);
(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { hashPassword }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/auth/password'].map(be));
  const mongo = await MongoMemoryServer.create();
  const client = createClient(readConfig({ MONGODB_URI: mongo.getUri('portal_browser') }));
  let browser, server;
  try {
    await client.connect(); const db = client.db(); await initializeDatabase(db);
    const auth = createAuthRepository(db), passwordHash = await hashPassword('PortalTest123!');
    for (const role of ['user', 'staff', 'admin']) {
      const user = await auth.createUser({ email: role + '@example.com', name: 'Portal ' + role, passwordHash });
      await db.collection('users').updateOne({ id: user.id }, { $set: { email_verified: true, role } });
    }
    server = createApp(readConfig({}), { authRepository: auth }).listen(0, '127.0.0.1'); await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
    const pages = [], errors = [];
    const signIn = async role => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage(); pages.push(page); page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/portal'); await page.getByLabel('Email', { exact: true }).fill(role + '@example.com'); await page.getByLabel('Mật khẩu', { exact: true }).fill('PortalTest123!'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
      try { await page.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor(); }
      catch (error) { console.log('Portal visible text:', await page.locator('body').innerText()); console.log('Page errors:', errors); throw error; }
      await page.waitForURL(base + (role === 'user' ? '/business' : '/' + role));
      await page.locator(role === 'admin' ? '.workspace-admin' : role === 'staff' ? '.workspace-staff' : '.workspace-business').waitFor();
      if (role !== 'user') {
        await page.goto(base + '/');
        await page.waitForURL(base + '/' + role);
        await page.locator('.workspace-' + role).waitFor();
        await page.goto(base + (role === 'admin' ? '/staff' : '/admin'));
        await page.waitForURL(base + '/' + role);
        await page.locator('.workspace-' + role).waitFor();
      }
      return page;
    };
    const member = await signIn('user');
    await member.getByLabel('Tên doanh nghiệp').fill('Browser Business'); await member.getByLabel('Danh mục', { exact: true }).fill('Events');
    await member.getByLabel(/Giấy tờ xác minh/).setInputFiles({ name: 'proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nTest business proof') });
    await member.getByRole('button', { name: 'Gửi hồ sơ xét duyệt' }).click(); await member.getByText('Hồ sơ đang chờ quản trị viên xem xét.').waitFor();
    const admin = await signIn('admin'); await admin.locator('nav').getByRole('button', { name: 'Duyệt doanh nghiệp', exact: true }).click();
    const application = admin.locator('article').filter({ hasText: 'Browser Business' }); await application.getByRole('button', { name: 'Đã duyệt', exact: true }).click();
    await application.locator('.gm-status').filter({ hasText: 'Đã duyệt' }).waitFor();
    await member.getByRole('button', { name: 'Kiểm tra trạng thái' }).click(); await member.getByRole('button', { name: 'Bài đăng', exact: true }).waitFor();
    await admin.locator('nav button').nth(6).click(); const user = admin.locator('article').filter({ hasText: 'user@example.com' });
    await user.getByLabel('Gói', { exact: true }).selectOption('plus'); await user.getByRole('button', { name: 'Lưu gói' }).click(); await user.getByText('Đã lưu', { exact: true }).waitFor();
    await member.reload(); await member.getByRole('button', { name: 'Bài đăng', exact: true }).click();
    await member.getByLabel('Tiêu đề', { exact: true }).fill('Persisted browser post'); await member.getByLabel('Nội dung', { exact: true }).fill('An approved business announcement.'); await member.getByLabel('Trang trí Plus').check(); await member.getByLabel('Nhãn', { exact: true }).fill('New'); await member.getByRole('button', { name: 'Gửi duyệt', exact: true }).click();
    await member.getByRole('heading', { name: 'Persisted browser post' }).waitFor();
    const staff = await signIn('staff'); await staff.getByRole('button', { name: 'Bài đăng', exact: true }).click(); const article = staff.locator('article').filter({ hasText: 'Persisted browser post' }); await article.getByRole('button', { name: 'Đã duyệt', exact: true }).click();
    await article.locator('.gm-status').filter({ hasText: 'Đã duyệt' }).waitFor();
    await member.getByRole('button', { name: 'Bài đã xuất bản', exact: true }).click(); await member.getByRole('heading', { name: 'Persisted browser post' }).waitFor();
    await member.getByRole('button', { name: 'Hỗ trợ', exact: true }).click(); await member.getByLabel('Tiêu đề', { exact: true }).fill('Browser ticket'); await member.getByLabel('Nội dung cần hỗ trợ').fill('Please help with my plan'); await member.getByRole('button', { name: 'Gửi yêu cầu', exact: true }).click(); await member.getByRole('heading', { name: 'Browser ticket' }).waitFor();
    await staff.getByRole('button', { name: 'Hỗ trợ', exact: true }).click(); const ticket = staff.locator('article').filter({ hasText: 'Browser ticket' }); await ticket.getByLabel('Trả lời', { exact: true }).fill('Your plan is active'); await ticket.getByLabel('Trạng thái', { exact: true }).selectOption('closed'); await ticket.getByRole('button', { name: 'Gửi trả lời' }).click();
    await ticket.getByText('Your plan is active').waitFor();
    await member.reload(); await member.getByRole('button', { name: 'Hỗ trợ', exact: true }).click(); await member.getByText('Your plan is active').waitFor();
    mkdirSync(resolve(__dirname, '../test-results'), { recursive: true });
    assert.ok((await member.locator('.portal-main').boundingBox()).width > 700, 'Desktop content should fill the available width');
    await member.screenshot({ path: resolve(__dirname, '../test-results/portal-business.png'), fullPage: true });
    await member.setViewportSize({ width: 390, height: 844 }); await member.screenshot({ path: resolve(__dirname, '../test-results/portal-mobile.png'), fullPage: true });
    assert.ok(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile portal must not overflow horizontally');
    await member.locator('.portal-main').getByRole('button', { name: 'Gửi trả lời' }).scrollIntoViewIfNeeded();
    assert.ok(await member.locator('.gomate-portal').evaluate(element => element.scrollTop > 0), 'Mobile portal must scroll inside the Expo root');
    await admin.locator('nav').getByRole('button', { name: 'Tổng quan', exact: true }).click(); await admin.getByRole('button', { name: 'Xuất báo cáo tổng quan' }).waitFor();
    const download = admin.waitForEvent('download'); await admin.getByRole('button', { name: 'Xuất báo cáo tổng quan' }).click(); assert.equal((await download).suggestedFilename(), 'gomate-report.json');
    for (const [role, page] of [['admin', admin], ['staff', staff]]) {
      await page.screenshot({ path: resolve(__dirname, '../test-results/portal-' + role + '.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), role + ' must fit mobile');
    }
    await admin.setViewportSize({ width: 1440, height: 1000 });
    await admin.locator('nav button').nth(1).click();
    const staffRow = admin.locator('article').filter({ hasText: 'staff@example.com' });
    await staffRow.getByLabel('Vai trò', { exact: true }).selectOption('admin');
    await staffRow.getByRole('button', { name: 'Lưu vai trò', exact: true }).click();
    await staffRow.getByRole('status').waitFor();
    assert.equal((await db.collection('users').findOne({ email: 'staff@example.com' })).role, 'admin');
    await staff.reload();
    await staff.getByLabel('Email', { exact: true }).waitFor();
    assert.deepEqual(errors, []); console.log('Portal browser flow passed: login, application, approval, Plus, posting, moderation, feed, tickets, persistence, export and mobile layout.');
  } finally { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); await client.close(); await mongo.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
