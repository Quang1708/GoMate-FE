// Opt-in live test: a few potentially billable VIETMAP/Mapbox requests using BE .env.
// Never prints tokens, provider URLs or unfiltered network errors.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { existsSync, mkdtempSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const beRoot = resolve(__dirname, '../../GoMate-BE');
const be = name => import(pathToFileURL(beRoot + '/src/' + name + '.js').href);
(async () => {
  process.loadEnvFile(join(beRoot, '.env'));
  const [{ createApp }, { readConfig }, { hashToken, newToken }] = await Promise.all(['app', 'config/env', 'modules/auth/token'].map(be));
  const config = readConfig(); assert.ok(config.mapboxAccessToken, 'Set a public MAPBOX_ACCESS_TOKEN in BE .env first');
  const accessToken = newToken(), authRepository = { async findSession(hash) { return hash === hashToken(accessToken) ? { user: { id: 'mapbox-live-test' }, expiresAt: new Date(Date.now() + 300000) } : null; } };
  const server = createApp(config, { authRepository }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port, artifacts = mkdtempSync(join(tmpdir(), 'gomate-mapbox-live-'));
  const request = async (path, body) => { const response = await fetch(base + '/api/maps/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken }, body: JSON.stringify(body) }); const data = await response.json(); assert.equal(response.status, 200, data.error || 'Map API failed'); return data; };
  let browser;
  try {
    const sessionToken = '851ab459-82df-4d43-8f11-e5d45de4ce13';
    const predictions = await request('places/autocomplete', { input: 'Nguyen Hue Ho Chi Minh', sessionToken, bias: { latitude: 10.7769, longitude: 106.7009 } }); assert.ok(predictions.items.length);
    const { place } = await request('places/details', { id: predictions.items[0].id, sessionToken }); assert.ok(Number.isFinite(place.point.latitude));
    assert.equal(place.provider, config.vietmapApiKey ? 'vietmap' : 'mapbox');
    const publicConfig = await (await fetch(base + '/api/maps/config')).json();
    if (config.vietmapApiKey) assert.ok(!JSON.stringify(publicConfig).includes(config.vietmapApiKey));
    console.log('PASS live ' + (config.vietmapApiKey ? 'VIETMAP Autocomplete/Place v4' : 'Mapbox permanent Geocoding') + ' and authenticated address selection');
    const origin = { latitude: 10.7769, longitude: 106.7009 }, destination = { latitude: 10.782, longitude: 106.695 };
    let route;
    for (const mode of ['DRIVE', 'WALK']) { const result = await request('routes', { origin, destination, mode }); assert.ok(result.route.distanceMeters > 0); assert.ok(result.route.durationSeconds > 0); route = result.route; console.log('PASS live Mapbox ' + mode + ' route/distance/ETA'); }
    const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
    browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 600 } }), runtimeErrors = [], badRequests = [];
    page.on('pageerror', () => runtimeErrors.push('Map runtime error'));
    page.on('response', response => { if (response.url().includes('api.mapbox.com') && response.status() >= 400) badRequests.push(response.status()); });
    await page.addInitScript(() => {
      let sdk;
      Object.defineProperty(window, 'mapboxgl', { configurable: true, get: () => sdk, set(value) { sdk = value; const Original = value.Map; value.Map = class extends Original { constructor(options) { super(options); window.__testMap = this; } }; } });
      window.addEventListener('message', event => { if (event.data?.type === 'gomate-map-point') window.__chosenPoint = event.data.point; });
    });
    await page.goto(base + '/map.html?lat=10.7769&lng=106.7009&pick=1&radius=3');
    await page.waitForFunction(() => window.__testMap?.loaded(), { timeout: 60000 });
    assert.equal(await page.locator('#error').innerText(), '');
    assert.equal(await page.locator('.mapboxgl-canvas').count(), 1);
    assert.ok(await page.evaluate(() => Boolean(window.__testMap.getSource('gomate-radius'))));
    await page.locator('.mapboxgl-canvas').click({ position: { x: 150, y: 200 } });
    await page.waitForFunction(() => Number.isFinite(window.__chosenPoint?.latitude));
    await page.evaluate(({ route, origin }) => window.postMessage({ type: 'gomate-map-route', route: { encodedPolyline: route.encodedPolyline, origin } }, location.origin), { route, origin });
    await page.waitForFunction(() => Boolean(window.__testMap.getLayer('gomate-route')));
    // Render completion, real tiles, mandatory logo and attribution.
    await page.waitForFunction(() => window.__testMap.loaded());
    await page.locator('.mapboxgl-ctrl-logo').waitFor();
    await page.locator('.mapboxgl-ctrl-attrib').waitFor();
    await page.screenshot({ path: join(artifacts, 'mapbox-live-390.png') });
    await page.setViewportSize({ width: 1000, height: 650 });
    await page.waitForFunction(() => window.__testMap.loaded());
    await page.screenshot({ path: join(artifacts, 'mapbox-live-1000.png') });
    await page.evaluate(() => window.postMessage({ type: 'gomate-map-route', route: null }, location.origin));
    await page.waitForFunction(() => !window.__testMap.getLayer('gomate-route'));
    assert.deepEqual(runtimeErrors, []); assert.deepEqual(badRequests, []);
    console.log('PASS real Mapbox GL rendering, radius, pin, route overlay/clear, attribution and responsive map. Artifacts:', artifacts);
  } finally { await browser?.close(); await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }); }
})().catch(error => { let message = String(error.message).replace(/pk\.[A-Za-z0-9_.-]+/g, '[REDACTED]'); for (const key of [process.env.VIETMAP_API_KEY, process.env.MAPBOX_ACCESS_TOKEN]) if (key) message = message.split(key).join('[REDACTED]'); console.error('Live Maps test failed:', message); process.exitCode = 1; });
