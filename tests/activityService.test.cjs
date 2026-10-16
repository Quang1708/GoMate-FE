const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
test('activity service validates form dates, converts UTC+7, and uses CRUD endpoints', async () => {
  const exports = {}, calls = [];
  let status = 200;
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/legacyActivityService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, AbortController, setTimeout, clearTimeout,
    process: { env: { EXPO_PUBLIC_API_BASE_URL: 'https://example.com/api' } },
    require: () => ({ getSession: () => ({ accessToken: 'token' }), ApiError: class extends Error { constructor(message, value) { super(message); this.status = value; } } }),
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: status < 400, status, json: async () => ({ error: 'Failed', activity: { id: 'new' } }) }; },
  });
  const draft = { name: 'Weekend', category: 'Gaming', description: 'Games', date: '05/01/2099', startTime: '23:00', endTime: '01:00', endDate: '06/01/2099', location: 'Saigon', maxParticipants: '6', estimatedCost: '0', requirements: 'One\nTwo', latitude: '10.77', longitude: '106.7' };
  const body = exports.draftBody(draft);
  assert.equal(body.startsAt, '2099-01-05T16:00:00.000Z'); assert.equal(body.endsAt, '2099-01-05T18:00:00.000Z');
  assert.equal(body.estimatedCost, 0); assert.equal(body.coordinates.coordinates[0], 106.7);
  for (const invalid of [{ date: '31/02/2099' }, { date: 'tomorrow' }, { startTime: '24:00' }, { estimatedCost: '100.000d' }, { longitude: '' }]) assert.throws(() => exports.draftBody({ ...draft, ...invalid }));
  const restored = exports.recordDraft({ ...body, id: '1', title: draft.name });
  assert.equal(restored.date, draft.date); assert.equal(restored.endDate, draft.endDate); assert.equal(restored.startTime, draft.startTime);
  await exports.publishActivityDraft(draft); assert.equal(calls.at(-1).options.method, 'POST');
  assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer token');
  await exports.updateActivity('one/two', draft); assert.ok(calls.at(-1).url.endsWith('/one%2Ftwo')); assert.equal(calls.at(-1).options.method, 'PATCH');
  await exports.myHostedActivities(2); assert.ok(calls.at(-1).url.endsWith('/mine?page=2&limit=20'));
  await exports.getActivity('one'); assert.equal(calls.at(-1).options.method, 'GET');
  status = 204; assert.equal(await exports.deleteActivity('one'), undefined);
  status = 403; await assert.rejects(exports.deleteActivity('one'), error => error.status === 403);
});
