#!/usr/bin/env node
'use strict';

// One-shot helper: `node architecture-bootstrap-render.js render --project <root> ...`
// Invoked synchronously from architecture.js (legacy open) when index.html is missing
// so the sync `main()` can still bootstrap an empty tree without duplicating elk layout.

const cli = require('../lib/atlas/cli');

(async () => {
  const code = await cli.dispatch(process.argv.slice(2));
  process.exit(typeof code === 'number' ? code : 1);
})().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
