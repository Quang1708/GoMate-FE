const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = readFileSync(resolve(__dirname, '../src/services/profileDate.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(code, { module: moduleValue, exports: moduleValue.exports, Date, Error });
const { formatBirthInput, birthDateDisplay, birthDateIso, daysInMonth } = moduleValue.exports;
test('birthday formatting inserts separators as each day/month completes and supports backspace', () => {
  assert.equal(formatBirthInput('1'), '1');
  assert.equal(formatBirthInput('12'), '12-');
  assert.equal(formatBirthInput('12-0'), '12-0');
  assert.equal(formatBirthInput('12-03'), '12-03-');
  assert.equal(formatBirthInput('12032000'), '12-03-2000');
  assert.equal(formatBirthInput('12', '12-'), '1');
  assert.equal(formatBirthInput('12-03', '12-03-'), '12-0');
  assert.equal(formatBirthInput('12-03-2000abc99'), '12-03-2000');
});
test('birthday display roundtrips ISO and rejects impossible or future dates', () => {
  assert.equal(birthDateDisplay('2000-02-29'), '29-02-2000');
  assert.equal(birthDateIso('29-02-2000'), '2000-02-29');
  for (const value of ['29-02-2001', '31-04-2000', '00-01-2000', '01-13-2000', '1-1-2000', '01-01-1899', '01-01-2999']) assert.throws(() => birthDateIso(value));
  assert.equal(daysInMonth(2, 2000), 29); assert.equal(daysInMonth(2, 2001), 28);
});
