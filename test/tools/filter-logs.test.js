const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { filterLogsHandler } = require('../../dist/lib/tools/filter-logs');

function createMemoryStream() {
  let data = '';
  return {
    write(chunk) {
      data += chunk;
      return true;
    },
    toString() {
      return data;
    },
  };
}

function writeTempLog(dir, name, lines) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

const SAMPLE_LOG_LINES = [
  '2026-01-15T08:00:00Z [INFO] Server started',
  '2026-01-15T10:00:00Z [INFO] Processing request',
  '2026-01-15T12:00:00Z [WARN] High memory usage',
  '2026-01-15T14:00:00Z [ERROR] Connection timeout',
  '2026-01-15T16:00:00Z [INFO] Request completed',
  '2026-01-15T18:00:00Z [INFO] Server shutting down',
];

test('filterLogsHandler filters lines by --start and --end range', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const logPath = writeTempLog(tmpDir, 'app.log', SAMPLE_LOG_LINES);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath, '--start', '2026-01-15T09:00:00Z', '--end', '2026-01-15T15:00:00Z'],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  const lines = stdout.toString().trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 3);
  assert.match(lines[0], /10:00:00.*Processing request/);
  assert.match(lines[1], /12:00:00.*High memory usage/);
  assert.match(lines[2], /14:00:00.*Connection timeout/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler returns all lines when no time bounds are given', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const logPath = writeTempLog(tmpDir, 'app.log', SAMPLE_LOG_LINES);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  const lines = stdout.toString().trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 6);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler with --count-only returns the match count', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const logPath = writeTempLog(tmpDir, 'app.log', SAMPLE_LOG_LINES);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath, '--start', '2026-01-15T11:00:00Z', '--end', '2026-01-15T17:00:00Z', '--count-only'],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  assert.equal(stdout.toString().trim(), '3');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler returns error for --start after --end', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const logPath = writeTempLog(tmpDir, 'app.log', SAMPLE_LOG_LINES);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath, '--start', '2026-01-15T18:00:00Z', '--end', '2026-01-15T08:00:00Z'],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 1);
  assert.match(stderr.toString(), /--start must be earlier than or equal to --end/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler returns error for invalid timezone', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    ['--assume-timezone', 'Invalid/Zone'],
    { stdout, stderr },
  );

  assert.equal(code, 1);
  assert.match(stderr.toString(), /invalid timezone/);
});

test('filterLogsHandler returns error for invalid timestamp', async () => {
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    ['--start', 'not-a-date'],
    { stdout, stderr },
  );

  assert.equal(code, 1);
  assert.match(stderr.toString(), /invalid timestamp/);
});

test('filterLogsHandler with --keep-undated includes lines without timestamps', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const mixedLines = [
    '2026-01-15T10:00:00Z [INFO] First',
    'This line has no timestamp',
    '2026-01-15T12:00:00Z [WARN] Second',
    'Another undated line',
  ];
  const logPath = writeTempLog(tmpDir, 'app.log', mixedLines);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath, '--keep-undated'],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  const lines = stdout.toString().trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 4);
  assert.match(lines[0], /10:00:00.*First/);
  assert.match(lines[1], /no timestamp/);
  assert.match(lines[2], /12:00:00.*Second/);
  assert.match(lines[3], /undated line/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler without --keep-undated skips undated lines', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  const mixedLines = [
    '2026-01-15T10:00:00Z [INFO] First',
    'This line has no timestamp',
    '2026-01-15T12:00:00Z [WARN] Second',
  ];
  const logPath = writeTempLog(tmpDir, 'app.log', mixedLines);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [logPath],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  const lines = stdout.toString().trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 2);
  assert.match(lines[0], /10:00:00.*First/);
  assert.match(lines[1], /12:00:00.*Second/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('filterLogsHandler processes multiple input files', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apltk-filter-test-'));
  writeTempLog(tmpDir, 'app1.log', [
    '2026-01-15T10:00:00Z [INFO] First',
    '2026-01-15T12:00:00Z [WARN] Second',
  ]);
  writeTempLog(tmpDir, 'app2.log', [
    '2026-01-15T14:00:00Z [ERROR] Third',
    '2026-01-15T16:00:00Z [INFO] Fourth',
  ]);
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();

  const code = await filterLogsHandler(
    [path.join(tmpDir, 'app1.log'), path.join(tmpDir, 'app2.log')],
    { stdout, stderr, sourceRoot: tmpDir },
  );

  assert.equal(code, 0, stderr.toString());
  const lines = stdout.toString().trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 4);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
