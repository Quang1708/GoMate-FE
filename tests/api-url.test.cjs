const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = readFileSync(resolve(__dirname, '../src/services/apiUrl.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(code, { module: moduleValue, exports: moduleValue.exports, URL });
const { resolveApiBaseUrl } = moduleValue.exports;

test('native development follows Expo host after a network change', () => {
  for (const host of ['192.168.2.237', '10.87.28.73']) {
    assert.equal(resolveApiBaseUrl({ development: true, platform: 'android', hostUri: `${host}:8081` }), `http://${host}:3000/api`);
  }
});
test('web development uses browser host while exported web uses same-origin API', () => {
  assert.equal(resolveApiBaseUrl({ development: true, platform: 'web', webOrigin: 'http://localhost:8081' }), 'http://localhost:3000/api');
  assert.equal(resolveApiBaseUrl({ development: true, platform: 'web', webOrigin: 'http://192.168.2.237:8081' }), 'http://192.168.2.237:3000/api');
  assert.equal(resolveApiBaseUrl({ development: false, platform: 'web', webOrigin: 'https://gomate.example' }), '/api');
});
test('explicit URL wins and emulator fallback remains reachable', () => {
  assert.equal(resolveApiBaseUrl({ configuredUrl: ' https://api.example/api/ ', development: true, platform: 'android', hostUri: '192.168.2.237:8081' }), 'https://api.example/api');
  assert.equal(resolveApiBaseUrl({ development: true, platform: 'android', hostUri: 'invalid host' }), 'http://10.0.2.2:3000/api');
  assert.equal(resolveApiBaseUrl({ configuredUrl: '/api', development: false, platform: 'web' }), '/api');
});
