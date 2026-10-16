const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const beRoot = resolve(__dirname, '../../GoMate-BE');
const beRequire = createRequire(resolve(beRoot, 'package.json'));
const be = path => import(pathToFileURL(resolve(beRoot, path)).href);

// Run the actual FE service code with only React Native's platform/assets replaced.
function frontend(baseUrl, storage = new Map()) {
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name).exports;
    const module = { exports: {} }; cache.set(name, module);
    const source = readFileSync(resolve(__dirname, `../src/services/${name}.ts`), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, {
      module, exports: module.exports, require: path => path === 'react-native' ? { Platform: { OS: 'web' } }
        : path === 'expo-constants' ? { default: { expoConfig: null } } : path.startsWith('./') ? load(path.slice(2)) : path.startsWith('../data/') ? load(path) : 'test-asset',
      localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
      __DEV__: false, URL, process: { env: { EXPO_PUBLIC_API_BASE_URL: baseUrl } }, fetch, AbortController, setTimeout, clearTimeout, Date, Error, URLSearchParams,
    }, { filename: `${name}.ts` });
    return module.exports;
  }
  return { reload: () => frontend(baseUrl, storage), api: load('api'), activities: load('activityApi'), draft: load('activityService'), profile: load('profileService'), filters: load('filterService') };
}

test('real FE services against BE: login, creation, requests, decisions, lists, members and expiry', async t => {
  const { MongoMemoryServer } = beRequire('mongodb-memory-server');
  const [{ createApp }, { readConfig }, { createClient, initializeDatabase }, { createAuthRepository }, { createActivityRepository }, { hashPassword }] = await Promise.all([
    be('src/app.js'), be('src/config/env.js'), be('src/database/mongo.js'), be('src/modules/auth/repository.js'), be('src/modules/activities/repository.js'), be('src/modules/auth/password.js'),
  ]);
  const mongo = await MongoMemoryServer.create(); t.after(() => mongo.stop());
  const client = createClient(readConfig({ MONGODB_URI: mongo.getUri('fe_integration') }));
  await client.connect(); t.after(() => client.close());
  const db = client.db(); await initializeDatabase(db);
  const authRepository = createAuthRepository(db), activityRepository = createActivityRepository(db);
  const password = 'GoMate-test-2026!';
  const passwordHash = await hashPassword(password);
  for (const name of ['host', 'member', 'other']) {
    const user = await authRepository.createUser({ name, email: `${name}@example.com`, passwordHash });
    await db.collection('users').updateOne({ id: user.id }, { $set: { email_verified: true } });
  }
  let verificationCode;
  const verificationMailer = { assertConfigured() {}, async sendCode(_email, code) { verificationCode = code; } };
  const server = createApp(readConfig({}), { authRepository, activityRepository, verificationMailer }).listen(0, '127.0.0.1');
  await once(server, 'listening'); t.after(() => new Promise(resolve => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const host = frontend(baseUrl), member = frontend(baseUrl), other = frontend(baseUrl);
  for (const [name, user] of [['host', host], ['member', member], ['other', other]]) await user.api.login(`${name}@example.com`, password);
  const restoredHost = host.reload();
  assert.equal(restoredHost.api.getSession().accessToken, host.api.getSession().accessToken);
  assert.equal((await restoredHost.profile.getProfile()).name, 'host');
  const newcomer = frontend(baseUrl);
  await newcomer.api.post('/auth/register', { name: 'New User', email: 'new@example.com', password: '123456' });
  assert.match(verificationCode, /^\d{6}$/);
  const registered = await newcomer.api.verifyEmail('new@example.com', verificationCode);
  assert.equal(newcomer.api.getSession().user.id, registered.user.id);
  assert.equal((await newcomer.profile.getProfile()).profileComplete, false);
  const profileDraft = { name: 'New User', username: '', bio: 'I like coffee', location: 'TP.HCM', interests: ['Cà phê'], languages: ['English'], gender: 'female', religion: 'undisclosed', alcohol: 'no', birthDate: '2000-01-01' };
  assert.equal((await newcomer.profile.saveProfile(profileDraft)).profileComplete, true);
  assert.throws(() => host.draft.vietnamDate('31/02/2099', '09:00'), /Ngày/);
  for (const hours of [6,12,24]) {
    const draft = { date:'05/01/2099', startTime:'09:00', registrationDeadline:'', deadlineHoursBefore:hours };
    assert.equal(new Date(host.draft.vietnamDate(draft.date,draft.startTime))-new Date(host.draft.draftDeadline(draft)),hours*3600000);
    const later = {...draft, date:'06/01/2099'};
    assert.equal(new Date(host.draft.draftDeadline(later))-new Date(host.draft.draftDeadline(draft)),86400000);
  }
  assert.throws(()=>host.draft.draftDeadline({deadlineCustom:true,registrationDeadline:''}));

  const activity = await host.draft.publishActivityDraft({
    name: 'Integration meetup', description: 'Meet new friends', category: 'Ăn uống', photos: [],
    date: '05/01/2099', endDate: '', startTime: '09:00', endTime: '11:00', registrationDeadline: '04/01/2099 · 18:00',
    scheduleNote: '09:00 Meet', province: 'TP. Hồ Chí Minh', district: 'Quận 1', address: '123 Test', meetingPoint: 'Gate',
    minParticipants: '2', maxParticipants: '3', participantPreferences: { genders: ['female'], languages: ['English'], religions: [], alcohol: 'any', dressCode: 'Áo trắng' }, requirements: 'On time', financialConfig: {
      fundingMode: 'FULL_PREPAYMENT', estimatedCostPerMember: 100000, paymentDeadline: '04/01/2099 · 18:00',
      treasurerUserId: 'current-user', approvalThreshold: 1000000, approvalRule: 'MAJORITY',
    },
  });
  assert.equal(activity.startsAt, '2099-01-05T02:00:00.000Z');
  assert.equal(activity.financialConfig, undefined);
  assert.equal(activity.estimatedCost, 100000);
  assert.equal(activity.meetingPoint, 'Gate');
  assert.equal((await host.activities.listOwned()).length, 1);
  assert.equal((await host.activities.listJoined()).length, 0);
  assert.equal((await member.activities.listActivities())[0].id, activity.id);
  await assert.rejects(member.activities.joinActivity(activity.id), error => error.status === 403);
  await member.profile.saveProfile({ ...profileDraft, name: 'Member' });
  const filteredQuery = member.filters.activityQuery({ categories: [], minBudget: 0, maxBudget: 2000000, dateFrom: '05/01/2099', dateTo: '05/01/2099', fromTime: '09:00', toTime: '09:15', availableDays: [], minimumCapacity: 2, maximumCapacity: 3, preferences: { genders: ['female'], languages: [], religions: [], alcohol: 'any', dressCode: 'yes' } });
  assert.equal((await member.activities.listActivities(filteredQuery))[0].id, activity.id);
  await member.activities.joinActivity(activity.id);
  assert.equal((await member.activities.listMyRequests('pending'))[0].activity.id, activity.id);
  await assert.rejects(member.activities.joinActivity(activity.id), error => error.status === 409);
  await member.activities.cancelRequest(activity.id);
  assert.equal((await member.activities.listMyRequests('pending')).length, 0);
  const pending = (await member.activities.joinActivity(activity.id)).request;
  await assert.rejects(other.activities.decideRequest(activity.id, pending.id, 'approved'), error => error.status === 403);
  await host.activities.decideRequest(activity.id, pending.id, 'rejected');
  assert.equal((await member.activities.listMyRequests('rejected')).length, 1);
  const retry = (await member.activities.joinActivity(activity.id)).request;
  assert.equal((await host.activities.listRequests(activity.id))[0].id, retry.id);
  await host.activities.decideRequest(activity.id, retry.id, 'approved');
  assert.equal((await member.activities.listJoined())[0].id, activity.id);
  assert.equal((await member.activities.listMyRequests('pending')).length, 0);
  assert.equal((await member.activities.listMembers(activity.id)).length, 2);
  await member.activities.leaveActivity(activity.id);
  assert.equal((await member.activities.listJoined()).length, 0);
  const again = (await member.activities.joinActivity(activity.id)).request;
  await host.activities.decideRequest(activity.id, again.id, 'approved');
  await host.activities.removeMember(activity.id, member.api.getSession().user.id);
  assert.equal((await member.activities.listJoined()).length, 0);
  assert.equal((await host.activities.listMembers(activity.id)).length, 1);
  await assert.rejects(member.activities.listMembers(activity.id), error => error.status === 403);
  await db.collection('activities').updateOne({ id: activity.id }, { $set: { registrationDeadline: new Date('2000-01-01') } });
  await assert.rejects(member.activities.joinActivity(activity.id), error => error.status === 409);

  // The actual FE adapters drive persisted lifecycle and attendance.
  const updated = await host.api.api(`/activities/${activity.id}`, { method: 'PATCH', body: JSON.stringify({ title: 'Edited integration meetup', registrationDeadline: null }) });
  assert.equal(updated.activity.title, 'Edited integration meetup');
  assert.equal(updated.activity.registrationDeadline, null);
  const started = await host.activities.transitionActivity(activity.id, 'start');
  assert.equal(started.status, 'in-progress');
  await assert.rejects(other.activities.transitionActivity(activity.id, 'complete'), error => error.status === 403);
  const roster = await host.activities.listAttendance(activity.id);
  assert.equal(roster.length, 1);
  await host.activities.markAttendance(activity.id, roster[0].userId, 'present');
  assert.equal((await host.reload().activities.listAttendance(activity.id))[0].status, 'present');
  await host.activities.addActivityUpdate(activity.id, 'Arrived at meeting point');
  assert.equal((await host.activities.listUpdates(activity.id))[0].text, 'Arrived at meeting point');
  assert.equal((await host.activities.transitionActivity(activity.id, 'complete')).status, 'completed');
  await assert.rejects(host.activities.markAttendance(activity.id, roster[0].userId, 'absent'), error => error.status === 409);

  // A real second page ensures list adapters exhaust the backend pagination contract.
  const first = await activityRepository.get(activity.id);
  await db.collection('activities').insertMany(Array.from({ length: 51 }, (_, index) => ({ ...first, _id: undefined, id: `page-${index}` })));
  assert.equal((await host.activities.listOwned()).length, 52);
  const preflight = await fetch(`${baseUrl}/activities`, { method: 'OPTIONS', headers: {
    Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type',
  } });
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  let expired = false;
  member.api.setUnauthorizedHandler(() => { expired = true; });
  await db.collection('auth_sessions').deleteMany({});
  await assert.rejects(member.activities.listJoined(), error => error.status === 401);
  assert.equal(expired, true); assert.equal(member.api.getSession(), null);
  assert.equal(member.reload().api.getSession(), null);
});
