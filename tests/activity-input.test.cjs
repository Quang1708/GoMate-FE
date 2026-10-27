const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function service(name) {
  const source = readFileSync(resolve(__dirname, '../src/services/' + name + '.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: () => ({}), Date, Error, URLSearchParams, encodeURIComponent });
  return module.exports;
}

test('Google directions preserve destination, origin and requested transport', () => {
  const { directionsUrl } = service('mapsService');
  const point = { latitude: 10.77, longitude: 106.69 };
  for (const [mode, expected] of [['DRIVE', 'driving'], ['MOTORCYCLE', 'two-wheeler'], ['WALK', 'walking']]) {
    const url = new URL(directionsUrl(point, undefined, mode));
    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(url.searchParams.get('destination'), '10.77,106.69');
    assert.equal(url.searchParams.get('travelmode'), expected);
    assert.equal(url.searchParams.has('origin'), false);
  }
  assert.equal(new URL(directionsUrl(point, { latitude: 21.03, longitude: 105.83 })).searchParams.get('origin'), '21.03,105.83');
});

test('activity preferences reject under-12 and inverted age ranges before publishing', () => {
  const { validateActivityDraft } = service('activityService');
  const draft = { minParticipants: '2', maxParticipants: '6', reservedSeats: 1, initialFriendIds: ['friend'] };
  for (const participantPreferences of [{ minAge: 12, maxAge: 65 }, { minAge: 0, maxAge: 0 }]) {
    assert.doesNotThrow(() => validateActivityDraft({ ...draft, participantPreferences }, 3));
  }
  for (const participantPreferences of [{ minAge: 11 }, { maxAge: 11 }, { minAge: 65, maxAge: 12 }, { minAge: 12.5 }]) {
    assert.throws(() => validateActivityDraft({ ...draft, participantPreferences }, 3));
  }
  assert.doesNotThrow(() => validateActivityDraft({ ...draft, reservedSeats: 0, maxParticipants: '2' }, 3)); // Pending invites do not consume seats.
  assert.throws(() => validateActivityDraft({ ...draft, reservedSeats: 2, maxParticipants: '2' }, 3));
});
