const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('profile service authenticates requests, resolves avatar URLs and preserves session on errors', async () => {
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  let session = { accessToken: 'test-token', user: { name: 'Before' } };
  let status = 200;
  let payload = { profile: { id: '1', name: 'After', avatarUrl: '/api/profile/1/avatar?v=123', interests: [] } };
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/legacyProfileService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, {
    exports, require: () => ({ ApiError, getSession: () => session }),
    process: { env: { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com/api/' } },
    URL, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      return { ok: status < 400, status, json: async () => structuredClone(payload) };
    },
  });
  const profile = await exports.getProfile();
  assert.equal(calls[0].url, 'https://api.example.com/api/profile/me');
  assert.equal(calls[0].headers.Authorization, 'Bearer test-token');
  assert.equal(profile.avatarUrl, 'https://api.example.com/api/profile/1/avatar?v=123');
  assert.equal(session.user.name, 'After');
  const fields = { name: 'After', username: 'after', bio: '', location: '', interests: ['Coffee'] };
  await exports.updateProfile(fields);
  assert.equal(calls.at(-1).method, 'PATCH');
  assert.deepEqual(JSON.parse(calls.at(-1).body), fields);
  await exports.uploadAvatar('AAAA');
  assert.equal(calls.at(-1).url, 'https://api.example.com/api/profile/me/avatar');
  assert.equal(calls.at(-1).method, 'PUT');
  assert.deepEqual(JSON.parse(calls.at(-1).body), { base64: 'AAAA' });
  status = 409; payload = { error: 'Username already in use' };
  await assert.rejects(exports.updateProfile(fields), error => error.status === 409);
  assert.equal(session.user.name, 'After');
  status = 401;
  await assert.rejects(exports.getProfile(), error => error.status === 401);
  session = null;
  const before = calls.length;
  await assert.rejects(exports.getProfile());
  assert.equal(calls.length, before);
});
