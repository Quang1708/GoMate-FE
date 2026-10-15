const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync, readFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const artifacts = mkdtempSync(join(tmpdir(), 'gomate-mapbox-maps-'));
const beRoot = resolve(__dirname, '../../GoMate-BE'), beRequire = createRequire(beRoot + '/package.json');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);
(async () => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { createChatRepository }, { hashPassword }] = await Promise.all(['app', 'config/env', 'database/mongo', 'modules/auth/repository', 'modules/activities/repository', 'modules/chat/repository', 'modules/auth/password'].map(be));
  const mongo = await MongoMemoryServer.create(), client = createClient(readConfig({ MONGODB_URI: mongo.getUri('mapbox_maps_browser') })); await client.connect(); const db = client.db(); await initializeDatabase(db);
  const authRepository = createAuthRepository(db), activityRepository = createActivityRepository(db), chatRepository = createChatRepository(db), passwordHash = await hashPassword('123456'), users = [];
  for (let index = 0; index < 2; index++) {
    const user = await authRepository.createUser({ name: 'Maps user ' + index, email: `maps-ui${index}@example.com`, passwordHash });
    await db.collection('users').updateOne({ id: user.id }, { $set: { email_verified: true, birthDate: '2000-01-01', gender: 'undisclosed', location: 'TP. Hồ Chí Minh', bio: 'Discover together', interests: ['Cà phê'], languages: ['Tiếng Việt'] } }); users.push(user);
  }
  await activityRepository.create({ title: 'Mapbox activity', description: 'Directions to the meeting point', category: 'Cà phê', location: 'Hà Nội', startsAt: new Date('2099-01-01T02:00:00Z'), endsAt: new Date('2099-01-01T04:00:00Z'), estimatedCost: 0, maxParticipants: 6, coordinates: { type: 'Point', coordinates: [105.84, 21.03] } }, users[1]);
  const calls = []; let denyPlaces = false, noRoute = false;
  const fetcher = async (url, options) => {
    const query = new URL(url).searchParams.get('text');
    calls.push({ url, params: Object.fromEntries(new URL(url).searchParams) });
    if (query === 'slow address') await new Promise(resolve => setTimeout(resolve, 1200));
    const data = url.includes('/autocomplete/v4') ? [{ ref_id: 'auto:gomate-demo', name: query === 'fresh address' ? 'Fresh address' : 'GoMate Cafe', display: '12 Test Road, Phường Hoàn Kiếm, Hà Nội, Việt Nam', boundaries: [{ type: 0, full_name: 'Hà Nội' }, { type: 2, full_name: 'Phường Hoàn Kiếm' }] }]
      : url.includes('/place/v4') ? { display: '12 Test Road, Phường Hoàn Kiếm, Hà Nội, Việt Nam', name: 'GoMate Cafe', city: 'Hà Nội', ward: 'Phường Hoàn Kiếm', district: '', lat: 21.03, lng: 105.84 }
      : { code: noRoute ? 'NoRoute' : 'Ok', routes: noRoute ? [] : [{ distance: 4200, duration: 900, geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' }] };
    return new Response(JSON.stringify(query === 'no results' ? [] : data), { status: denyPlaces && url.includes('/autocomplete/v4') ? 403 : 200 });
  };
  const config = readConfig({ MAPBOX_ACCESS_TOKEN: 'pk.fake-public-token', VIETMAP_API_KEY: 'fake-server-only-vietmap-key' });
  const server = createApp(config, { authRepository, activityRepository, chatRepository, mapsOptions: { fetcher } }).listen(0, '127.0.0.1'); await once(server, 'listening'); const base = 'http://127.0.0.1:' + server.address().port;
  const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  let browser, page; const errors = [];
  try {
    browser = await chromium.launch({ executablePath: chrome, headless: true }); page = await browser.newPage({ viewport: { width: 390, height: 900 } }); page.setDefaultTimeout(20000); page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.mapbox.com/mapbox-gl-js/v3.33.0/mapbox-gl.js', route => route.fulfill({ contentType: 'application/javascript', body: readFileSync(resolve(__dirname, 'fixtures/mapbox-maps.js'), 'utf8') }));
    const click = text => page.getByText(text, { exact: true }).last().click();
    const visible = text => page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' });
    await page.goto(base + '/#/auth/login'); await page.getByLabel('Email', { exact: true }).fill('maps-ui0@example.com'); await page.getByLabel('Mật khẩu', { exact: true }).fill('123456'); await click('Đăng nhập'); await page.getByText('Maps user 0', { exact: false }).first().waitFor();
    await page.goto(base + '/#/app/create'); await page.getByLabel('Tên hoạt động', { exact: true }).fill('Map selected activity'); await page.getByLabel('Mô tả', { exact: true }).fill('Choose a real meeting point'); await click('Tiếp tục');
    const addressInput = page.getByLabel('Địa chỉ', { exact: true });
    const mapsConfig = await (await page.request.get(base + '/api/maps/config')).json(); assert.equal(mapsConfig.searchProvider, 'vietmap'); assert.equal(mapsConfig.provider, 'mapbox'); assert.ok(!JSON.stringify(mapsConfig).includes('fake-server-only-vietmap-key'));
    await addressInput.fill('g'); await page.waitForTimeout(550); assert.equal(calls.length, 0);
    await addressInput.fill('go'); await addressInput.fill('gomate cafe');
    await page.getByLabel('Gợi ý địa chỉ GoMate Cafe', { exact: true }).waitFor();
    await visible('Địa điểm từ VIETMAP');
    assert.equal(calls.filter(call => call.url.includes('/autocomplete/v4')).length, 1);
    await page.waitForFunction(() => { const box = document.querySelector('[aria-label="Gợi ý địa chỉ GoMate Cafe"]')?.getBoundingClientRect(); return box && box.top > 0 && box.bottom < innerHeight - 170; });
    await page.screenshot({ path: join(artifacts, 'inline-address-suggestions-390.png'), fullPage: true });
    await page.getByLabel('Gợi ý địa chỉ GoMate Cafe', { exact: true }).click();
    await visible('21.03000, 105.84000'); assert.match(await page.getByLabel('Phường / xã (tùy chọn)', { exact: true }).innerText(), /Hoàn Kiếm/); assert.equal(await addressInput.inputValue(), 'GoMate Cafe · 12 Test Road');
    assert.equal(await page.getByLabel('Ẩn gợi ý địa chỉ', { exact: true }).count(), 0);
    await addressInput.fill('no results'); await visible('Không tìm thấy địa chỉ. Bạn vẫn có thể nhập địa chỉ và chọn ghim thủ công.');
    assert.equal(await page.getByText('21.03000, 105.84000', { exact: true }).count(), 0);
    denyPlaces = true; await addressInput.fill('denied address'); await page.getByRole('alert').waitFor(); denyPlaces = false;
    await click('Thử lại gợi ý địa chỉ'); await page.getByLabel('Gợi ý địa chỉ GoMate Cafe', { exact: true }).waitFor();
    await addressInput.fill('slow address'); await page.waitForTimeout(550); await addressInput.fill('fresh address');
    await page.getByLabel('Gợi ý địa chỉ Fresh address', { exact: true }).waitFor(); await page.waitForTimeout(850);
    assert.equal(await page.getByLabel('Gợi ý địa chỉ GoMate Cafe', { exact: true }).count(), 0);
    await page.getByLabel('Ẩn gợi ý địa chỉ', { exact: true }).click();
    const inlineCalls = calls.filter(call => call.url.includes('/autocomplete/v4')).length;
    console.log('PASS inline address suggestions, debounce, direct selection, stale coordinates/results, empty state and error retry');
    await page.getByLabel('Tìm địa chỉ', { exact: true }).click(); await page.getByLabel('Tìm địa chỉ hoặc địa điểm', { exact: true }).fill('gomate cafe');
    await page.getByLabel('Chọn địa điểm GoMate Cafe', { exact: true }).click(); await page.frameLocator('iframe[title="Bản đồ hoạt động"]').locator('[data-testid="mapbox-map-canvas"]').waitFor();
    await click('Dùng địa điểm này'); assert.equal(await page.getByLabel('Địa chỉ', { exact: true }).inputValue(), 'GoMate Cafe · 12 Test Road'); assert.match(await page.getByLabel('Tỉnh / thành phố', { exact: true }).innerText(), /Hà Nội/);
    const picker = page.frameLocator('iframe[title="Chọn điểm trên bản đồ"]'); await picker.locator('[data-testid="mapbox-map-canvas"]').click({ position: { x: 100, y: 100 } }); await visible('21.03100, 105.84100');
    assert.equal(calls.filter(call => call.url.includes('/autocomplete/v4')).length, inlineCalls + 1); assert.equal(calls.find(call => call.url.includes('/autocomplete/v4')).params.display_type, '1'); await page.screenshot({ path: join(artifacts, 'place-picker-390.png'), fullPage: true });
    console.log('PASS VIETMAP suggestions/place selection, address/province fill and map pin bridge (stubbed provider)');
    const future = new Date(Date.now() + 7 * 3600000 + 2 * 86400000).toISOString().slice(0, 10), display = future.slice(8, 10) + '/' + future.slice(5, 7) + '/' + future.slice(0, 4);
    await page.getByLabel('Ngày bắt đầu và kết thúc', { exact: true }).click(); await page.getByLabel('Chọn tháng và năm', { exact: true }).click(); await page.getByLabel('Tháng: ' + future.slice(5, 7), { exact: true }).click(); await page.getByLabel('Năm: ' + future.slice(0, 4), { exact: true }).click(); await click('Xem lịch'); await page.getByRole('button', { name: display, exact: true }).click(); await page.getByRole('button', { name: display, exact: true }).click(); await click('Dùng khoảng ngày');
    await click('Tiếp tục'); await click('Tiếp tục'); await visible('Bài đăng hiển thị trên Match'); await click('Đăng hoạt động'); await visible('Cùng nhóm sẵn sàng lên đường');
    const published = await db.collection('activities').findOne({ title: 'Map selected activity' });
    assert.ok(Math.abs(published.coordinates.coordinates[0] - 105.841) < 1e-8); assert.ok(Math.abs(published.coordinates.coordinates[1] - 21.031) < 1e-8); assert.equal(published.province, 'Hà Nội'); assert.equal(published.address, 'GoMate Cafe · 12 Test Road');
    console.log('PASS VIETMAP address/manual pin survives activity publish into MongoDB');
    await db.collection('users').updateOne({ id: users[0].id }, { $set: { location: 'Hà Nội' } });
    await page.goto(base + '/#/app/match/discover'); await page.reload(); await visible('Mapbox activity'); await page.context().grantPermissions(['geolocation'], { origin: base }); await page.context().setGeolocation({ latitude: 10.77, longitude: 106.7 });
    await click('Tính đường từ vị trí của tôi'); await visible('4,2 km · 15 phút'); await page.frameLocator('iframe[title="Bản đồ hoạt động"]').locator('[data-route="shown"]').waitFor();
    assert.equal(calls.filter(call => call.url.includes('/directions/')).at(-1).url.includes('/driving/'), true); await page.getByLabel('Chỉ đường: Đi bộ', { exact: true }).click(); await click('Tính đường từ vị trí của tôi'); await visible('4,2 km · 15 phút'); assert.equal(calls.filter(call => call.url.includes('/directions/')).at(-1).url.includes('/walking/'), true);
    for (const width of [390, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: join(artifacts, `directions-${width}.png`), fullPage: true }); }
    noRoute = true; await click('Tính đường từ vị trí của tôi'); await page.getByRole('alert').filter({ hasText: 'Chưa tìm được tuyến đường' }).waitFor(); assert.equal(await page.frameLocator('iframe[title="Bản đồ hoạt động"]').locator('[data-route="shown"]').count(), 0); noRoute = false;
    console.log('PASS route/GPS, driving/walking, polyline bridge, no-route feedback and responsive layouts (stubbed provider)');
    await page.goto(base + '/#/app/match/discover'); await page.getByLabel('Mở bộ lọc', { exact: true }).click(); await page.getByLabel('Tìm địa chỉ', { exact: true }).click(); denyPlaces = true;
    await page.getByLabel('Tìm địa chỉ hoặc địa điểm', { exact: true }).fill('denied cafe'); await page.getByRole('alert').waitFor(); denyPlaces = false; await click('Thử lại tìm địa điểm'); await page.getByLabel('Chọn địa điểm GoMate Cafe', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Quay lại', exact: true }).last().click();
    console.log('PASS provider denial has a safe retry path');
    const conversation = await page.evaluate(async userId => {
      const headers = { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('gomate.session')).accessToken, 'Content-Type': 'application/json' };
      const response = await fetch('/api/conversations', { method: 'POST', headers, body: JSON.stringify({ type: 'direct', userId }) }); const result = await response.json();
      await fetch(`/api/conversations/${result.conversation.id}/messages`, { method: 'POST', headers, body: JSON.stringify({ text: '', clientMessageId: 'map-location', location: { latitude: 21.03, longitude: 105.84, label: 'Điểm gặp GoMate' } }) }); return result.conversation;
    }, users[1].id);
    await page.goto(base + '/#/app/messages/chat/' + conversation.id); await page.getByLabel('Mở vị trí trên bản đồ', { exact: true }).click(); await page.getByRole('button', { name: 'Quay lại', exact: true }).last().waitFor(); await page.frameLocator('iframe[title="Bản đồ hoạt động"]').locator('[data-testid="mapbox-map-canvas"]').waitFor();
    await page.getByRole('button', { name: 'Quay lại', exact: true }).last().click(); await page.getByLabel('Thêm ảnh, tệp hoặc vị trí', { exact: true }).click(); await page.getByRole('button',{name:'Tìm địa điểm để chia sẻ',exact:true}).click(); await page.getByLabel('Tìm địa chỉ hoặc địa điểm', { exact: true }).fill('cafe'); await page.getByLabel('Chọn địa điểm GoMate Cafe', { exact: true }).click(); await click('Dùng địa điểm này'); await page.getByLabel('Bỏ vị trí', { exact: true }).waitFor(); await page.getByLabel('Gửi tin nhắn', { exact: true }).click(); await visible('GoMate Cafe');
    const stored = await db.collection('chat_messages').findOne({ conversationId: conversation.id, 'location.label': 'GoMate Cafe' }); assert.deepEqual(stored.location, { latitude: 21.03, longitude: 105.84, label: 'GoMate Cafe' });
    assert.equal(calls.filter(call => call.url.includes('/forward')).length, 0);
    assert.deepEqual(errors, []); console.log('PASS chat map viewer/place sharing persistence; no browser runtime errors. Artifacts:', artifacts);
  } catch (error) { if (page) { console.log('FAILED', page.url(), (await page.locator('body').innerText()).slice(0, 5000), errors); await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true }).catch(() => { }); } throw error; }
  finally { await browser?.close(); await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }); await client.close(); await mongo.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
