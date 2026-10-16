const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

test('legacy authentication shares login, verification and logout with the main API session', async () => {
  let session = null;
  const calls = [];
  const api = {
    getSession: () => session,
    login: async (email, password) => { calls.push([email, password]); session = { accessToken: 'login' }; return session; },
    verifyEmail: async () => { session = { accessToken: 'verified' }; return session; },
    logout: async () => { session = null; },
  };
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/services/authService.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, require: () => api });
  await exports.login({ email: 'user@example.com', password: 'password' });
  assert.deepEqual(calls, [['user@example.com', 'password']]);
  assert.equal(exports.getSession(), api.getSession());
  await exports.verifyEmail('user@example.com', '123456');
  assert.equal(exports.getSession().accessToken, 'verified');
  await exports.logout();
  assert.equal(exports.getSession(), null);
});
