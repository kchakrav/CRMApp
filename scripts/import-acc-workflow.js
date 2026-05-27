#!/usr/bin/env node
/**
 * Import Adobe Campaign Classic workflow export JSON (mdata XML) into a CRMApp workflow orchestration.
 *
 * Usage:
 *   node scripts/import-acc-workflow.js --file sampleJson/subway_mkt_prod1-WKF25094.json --dry-run
 *   node scripts/import-acc-workflow.js --file sampleJson/subway_mkt_prod1-WKF25094.json --create
 *   node scripts/import-acc-workflow.js --file sampleJson/subway_mkt_prod1-WKF25094.json --workflow-id 1
 *
 * Options:
 *   --file <path>       Required. Path to ACC export JSON (contains mdata string).
 *   --dry-run           Print summary and warnings only; do not write DB.
 *   --create            Insert a new draft workflow with imported orchestration.
 *   --workflow-id <n>   Update existing workflow's orchestration (and optional name/description).
 *   --name <text>       Override workflow name (with --create or --workflow-id).
 *   --type <type>       workflow_type for --create only (default: broadcast).
 */

const fs = require('fs');
const path = require('path');

const { query } = require('../src/database');
const { importAccWorkflowJsonFileObject } = require('../src/services/accWorkflowMdataImport');

function parseArgs(argv) {
  const out = {
    file: null,
    dryRun: false,
    create: false,
    workflowId: null,
    name: null,
    workflowType: 'broadcast'
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--create') out.create = true;
    else if (a === '--file') out.file = argv[++i];
    else if (a === '--workflow-id') out.workflowId = parseInt(argv[++i], 10);
    else if (a === '--name') out.name = argv[++i];
    else if (a === '--type') out.workflowType = argv[++i];
  }
  return out;
}

function main() {
  const opts = parseArgs(process.argv);
  if (!opts.file) {
    console.error('Missing --file <path-to-export.json>');
    process.exit(1);
  }
  if (opts.create && opts.workflowId) {
    console.error('Use either --create or --workflow-id, not both.');
    process.exit(1);
  }
  if (!opts.dryRun && !opts.create && opts.workflowId == null) {
    console.error('Specify --dry-run, --create, or --workflow-id <n>');
    process.exit(1);
  }

  const abs = path.isAbsolute(opts.file) ? opts.file : path.join(process.cwd(), opts.file);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }

  let json;
  try {
    json = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }

  const imported = importAccWorkflowJsonFileObject(json);
  const orch = {
    nodes: imported.nodes,
    connections: imported.connections,
    acc_import: {
      at: new Date().toISOString(),
      source_file: path.basename(abs),
      warnings: imported.warnings,
      activity_count: imported.activityCount,
      ...imported.meta
    }
  };

  console.log('Import summary');
  console.log('  Workflow name:', opts.name || imported.workflowName);
  console.log('  Nodes:', imported.nodes.length);
  console.log('  Connections:', imported.connections.length);
  console.log('  Activities (XML):', imported.activityCount);
  if (imported.warnings.length) {
    console.log('  Warnings (' + imported.warnings.length + '):');
    imported.warnings.slice(0, 30).forEach((w) => console.log('   -', w));
    if (imported.warnings.length > 30) {
      console.log('   ... and', imported.warnings.length - 30, 'more');
    }
  }

  if (opts.dryRun) {
    console.log('\nDry run — no database changes.');
    process.exit(0);
  }

  const wfName = (opts.name || imported.workflowName || 'ACC import').slice(0, 500);
  const wfDesc = (imported.workflowDescription || '').slice(0, 2000);

  if (opts.create) {
    const now = new Date().toISOString();
    const { record } = query.insert('workflows', {
      name: wfName,
      description: wfDesc,
      workflow_type: opts.workflowType || 'broadcast',
      entry_trigger: { type: 'manual', config: {} },
      orchestration: orch,
      audience_config: {},
      status: 'draft',
      created_by: 'ACC import CLI',
      updated_by: 'ACC import CLI',
      folder_id: null,
      entry_count: 0,
      completion_count: 0,
      active_count: 0,
      last_run_at: null,
      next_run_at: null,
      created_at: now,
      updated_at: now
    });
    console.log('\nCreated workflow id', record.id);
    process.exit(0);
  }

  if (opts.workflowId != null) {
    const existing = query.get('workflows', opts.workflowId);
    if (!existing) {
      console.error('Workflow not found:', opts.workflowId);
      process.exit(1);
    }
    const updates = {
      orchestration: orch,
      updated_by: 'ACC import CLI'
    };
    if (opts.name) updates.name = wfName;
    else if (imported.workflowName) updates.name = wfName;
    if (imported.workflowDescription) updates.description = wfDesc;

    query.update('workflows', opts.workflowId, updates);
    console.log('\nUpdated workflow', opts.workflowId);
    process.exit(0);
  }
}

main();
