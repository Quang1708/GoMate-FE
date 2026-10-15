const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function native(store, options = {}) {
  const module = { exports: {} };
  const source = readFileSync(resolve(__dirname, '../src/services/api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const secure = { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, getItemAsync: async key => { if (options.failRead) throw new Error('Storage locked'); return store.get(key) ?? null; }, setItemAsync: async (key, value) => { if (options.failWrite) throw new Error('Storage locked'); await new Promise(resolve => setTimeout(resolve, 3)); store.set(key, value); }, deleteItemAsync: async key => { store.delete(key); } };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name === 'react-native' ? { Platform: { OS: 'android' } } : name === 'expo-constants' ? { default: { expoConfig: { hostUri: '192.168.1.2:8081' } } } : name === './apiUrl' ? { resolveApiBaseUrl: () => 'http://api.test/api' } : secure, __DEV__: true, process: { env: {} }, setTimeout, clearTimeout, AbortController, fetch: options.fetch || fetch });
  return module.exports;
}
test('native sessions restore from encrypted storage and logout serializes after a pending save', async () => {
  const store = new Map(), first = native(store), session = { accessToken: 'saved-token', user: { id: 'real-user', name: 'User', email: 'user@example.com' } };
  await first.persistSession(session);
  const fresh = native(store); assert.equal(fresh.getSession(), null); await fresh.initializeSession(); assert.equal(fresh.getSession().accessToken, 'saved-token');
  first.setSession(session); await first.persistSession(null); assert.equal(store.size, 0);
  const signedOut = native(store); await signedOut.initializeSession(); assert.equal(signedOut.getSession(), null);
});
test('corrupt storage is discarded and write errors are surfaced to the login caller', async () => {
  const store = new Map([['gomate.session', '{bad-json']]), api = native(store);
  await api.initializeSession(); assert.equal(api.getSession(), null); assert.equal(store.size, 0);
  const locked = native(store, { failWrite: true }); await assert.rejects(locked.persistSession({ accessToken: 'token', user: { id: 'user' } }), /Storage locked/); assert.equal(locked.getSession(), null);
});
test('an expired native token is cleared from memory and storage on authenticated 401', async () => {
  const store = new Map(), api = native(store, { fetch: async () => new Response(JSON.stringify({ error: 'Expired' }), { status: 401 }) });
  await api.persistSession({ accessToken: 'expired', user: { id: 'user' } }); let redirected = false; api.setUnauthorizedHandler(() => { redirected = true; });
  await assert.rejects(api.api('/profile/me')); await api.persistSession(null); assert.equal(redirected, true); assert.equal(api.getSession(), null); assert.equal(store.size, 0);
});

test('native startup can retry after the secure store becomes available', async () => {
  const session = { accessToken:'retry-token', user:{id:'user'} }, store = new Map([['gomate.session',JSON.stringify(session)]]), options = { failRead:true }, api = native(store,options);
  await assert.rejects(api.initializeSession(),/Storage locked/); options.failRead=false; await api.initializeSession(); assert.equal(api.getSession().accessToken,'retry-token');
});
