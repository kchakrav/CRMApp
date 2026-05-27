#!/usr/bin/env node
/**
 * Insert missing ACC sample workflows from sampleJson/ (same logic as server startup).
 */
require('../src/database');
const { ensureAccSampleWorkflowsFromDisk } = require('../src/services/accSampleWorkflowsSeed');

const r = ensureAccSampleWorkflowsFromDisk();
console.log(`ACC sample workflows: created=${r.created} skipped=${r.skipped} failed=${r.failed}`);
if (r.details.length) r.details.forEach((l) => console.log(' ', l));
process.exit(r.failed > 0 ? 1 : 0);
