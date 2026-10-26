const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { existsSync } = require('node:fs');

// API fixtures keep browser regression checks independent of real accounts/data.
const base = process.env.GOMATE_WEB_TEST_BASE || 'http://localhost:8081';
const sessions = Object.fromEntries(['alice', 'bob'].map(id => [id, { accessToken: id, user: { id, name: id, email: `${id}@example.com` } }]));
const profile = id => ({ ...sessions[id].user, username: id, bio: 'Hello', location: 'Hà Nội', birthDate: '2000-01-01', gender: 'other', religion: 'undisclosed', alcohol: 'no', interests: ['Cà phê'], languages: ['Tiếng Việt'], availableTimes: [], photos: [], basicProfileComplete: true, profileComplete: true, missingFields: [], avatarUrl: null });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 950 } });
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let delayed = false, releaseOld;
    const oldResponse = new Promise(resolve => { releaseOld = resolve; });
    await page.route('**/api/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname.replace(/^\/api/, '');
      const owner = request.headers().authorization?.replace('Bearer ', '') || 'alice';
      let json = { items: [], total: 0, page: 1, limit: 20, hasMore: false };
      if (path === '/profile/me') json = { profile: profile(owner) };
      else if (path === '/portal/me') json = { ...profile(owner), role: 'business' };
      else if (path === '/portal/metrics') json = {};
      else if (path === '/auth/google/config') json = { clientId: null };
      else if (path === '/activity-draft') json = { draft: null };
      else if (path === '/me/match-preferences') {
        if (owner === 'alice' && delayed) await oldResponse;
        json = { filters: { province: owner === 'alice' ? 'Hà Nội' : 'Đà Nẵng', categories: owner === 'alice' ? ['Cà phê'] : ['Thể thao'] }, favoriteIds: owner === 'alice' ? ['alice-only'] : [] };
      }
      await route.fulfill({ json, headers: { 'Access-Control-Allow-Origin': '*' } }).catch(() => {});
    });

    await page.goto(base + '/portal');
    await page.getByRole('heading', { name: 'Đăng nhập portal', exact: true }).waitFor();
    await page.getByLabel('Ngôn ngữ').selectOption('en');
    await page.getByRole('heading', { name: 'Portal sign in', exact: true }).waitFor();
    await page.reload();
    assert.equal(await page.locator('#portal-language').inputValue(), 'en');
    const favicon = await page.locator('link[rel="icon"],link[rel="shortcut icon"]').first().getAttribute('href');
    assert.ok(favicon, 'favicon is configured');
    assert.equal((await page.request.get(new URL(favicon, base).href)).status(), 200);

    await page.evaluate(session => { localStorage.setItem('gomate.session', JSON.stringify(session)); localStorage.setItem('gomate.language', 'en'); }, sessions.alice);
    await page.reload();
    await page.getByRole('heading', { name: 'Create one post and multiple groups', exact: true }).waitFor();
    await page.getByLabel('Post title', { exact: true }).fill('Campaign draft');
    await page.getByLabel('Language').selectOption('vi');
    await page.getByRole('heading', { name: 'Tạo một bài đăng và nhiều nhóm', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Tiêu đề bài đăng', { exact: true }).inputValue(), 'Campaign draft');
    await page.getByRole('button', { name: 'Thư viện địa điểm', exact: true }).click();
    await page.getByRole('heading', { name: /Địa điểm đã lưu/ }).first().waitFor();
    await page.locator('#portal-language').selectOption('en');
    await page.getByRole('heading', { name: /Saved locations/ }).first().waitFor();
    await page.getByRole('button', { name: 'Business Staff', exact: true }).click();
    await page.getByRole('heading', { name: 'Staff accounts', exact: true }).waitFor();
    await page.locator('#portal-language').selectOption('vi');
    await page.getByRole('heading', { name: 'Tài khoản nhân sự', exact: true }).waitFor();

    await page.goto(base + '/#/app/match/filter');
    await page.getByRole('button', { name: 'Tỉnh / thành phố', exact: true }).filter({ hasText: 'Hà Nội' }).waitFor();
    await page.evaluate(session => { const oldValue = localStorage.getItem('gomate.session'), newValue = JSON.stringify(session); localStorage.setItem('gomate.session', newValue); window.dispatchEvent(new StorageEvent('storage', { key: 'gomate.session', oldValue, newValue })); }, sessions.bob);
    await page.getByRole('button', { name: 'Tỉnh / thành phố', exact: true }).filter({ hasText: 'Đà Nẵng' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Tỉnh / thành phố', exact: true }).filter({ hasText: 'Hà Nội' }).count(), 0);

    // Switch while Alice's preferences are still in flight: Bob's UI must stay isolated.
    delayed = true;
    await page.evaluate(session => { localStorage.setItem('gomate.session', JSON.stringify(session)); }, sessions.alice);
    const pendingPreferences = page.waitForRequest(request => request.url().includes('/me/match-preferences') && request.headers().authorization === 'Bearer alice');
    await page.reload();
    await pendingPreferences;
    await page.evaluate(session => { localStorage.setItem('gomate.session', JSON.stringify(session)); window.dispatchEvent(new StorageEvent('storage', { key: 'gomate.session', newValue: JSON.stringify(session) })); }, sessions.bob);
    await page.getByRole('button', { name: 'Tỉnh / thành phố', exact: true }).filter({ hasText: 'Đà Nẵng' }).waitFor();
    releaseOld();
    await page.getByText('Áp dụng bộ lọc', { exact: true }).click();
    await page.getByText('Không còn hoạt động phù hợp', { exact: true }).waitFor();

    await page.goto(base + '/#/app/create');
    await page.getByLabel('Tên hoạt động', { exact: true }).fill('Weekend meetup');
    await page.getByText('Tiếp tục', { exact: true }).click();
    await page.getByText('Đã hiểu', { exact: true }).waitFor();
    await page.getByRole('alert').filter({ hasText: 'Vui lòng nhập giới thiệu hoạt động.' }).first().waitFor();
    await page.getByText('Đã hiểu', { exact: true }).click();

    // Validation is visible in an app-owned dialog, including the Google fallback icon.
    await page.evaluate(() => localStorage.removeItem('gomate.session'));
    await page.goto(base + '/#/auth/login');
    await page.reload();
    const google = page.getByRole('button', { name: /Tiếp tục với Google|Continue with Google/ }).first();
    await google.waitFor();
    assert.ok(await google.locator('[style*="Ionicons"], [style*="ionicons"]').count(), 'Google button has a visible icon');
    await google.click();
    await page.getByText('Đã hiểu', { exact: true }).waitFor();
    await page.getByText('Đã hiểu', { exact: true }).click();
    assert.deepEqual(errors, []);
    console.log('PASS: portal EN/VI persistence and form preservation, favicon, account isolation (including delayed response), Google icon and app feedback dialog');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
