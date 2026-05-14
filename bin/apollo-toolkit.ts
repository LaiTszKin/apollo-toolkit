#!/usr/bin/env node

import { run } from '../lib/cli';

run(process.argv.slice(2)).then((code: number) => {
  process.exitCode = code;
});
