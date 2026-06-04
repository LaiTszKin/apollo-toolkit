import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

function isSafeSkillName(skillName) {
  const isWindows = process.platform === 'win32';
  return typeof skillName === 'string'
    && skillName.length > 0
    && !skillName.includes('\0')
    && !skillName.includes('/')
    && !(isWindows && skillName.includes('\\'))
    && !path.isAbsolute(skillName)
    && skillName !== '.'
    && skillName !== '..';
}

test('isSafeSkillName allows backslash on non-Windows', () => {
  assert.ok(isSafeSkillName('valid\\name'));
});

test('isSafeSkillName still blocks null byte', () => {
  assert.ok(!isSafeSkillName('bad\0name'));
});

test('isSafeSkillName blocks path separators', () => {
  assert.ok(!isSafeSkillName('a/b'));
  assert.ok(!isSafeSkillName('..'));
  assert.ok(!isSafeSkillName('.'));
});

test('isSafeSkillName blocks absolute paths', () => {
  assert.ok(!isSafeSkillName('/etc/passwd'));
});

test('isSafeSkillName rejects empty string', () => {
  assert.ok(!isSafeSkillName(''));
});

test('isSafeSkillName rejects non-string types', () => {
  assert.ok(!isSafeSkillName(null));
  assert.ok(!isSafeSkillName(undefined));
  assert.ok(!isSafeSkillName(123));
});
