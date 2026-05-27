/**
 * Ensures draft workflows exist for each ACC export JSON under sampleJson/.
 * Idempotent: skips files already imported (matched by orchestration.acc_import.seed_source_file).
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../database');
const { importAccWorkflowJsonFileObject } = require('./accWorkflowMdataImport');

const NAME_PREFIX = '[ACC Sample]';
const SEED_MARKER = 'acc-sample-json-v1';

const SAMPLE_DIR = path.join(__dirname, '..', '..', 'sampleJson');

function listSampleJsonBasenames() {
  if (!fs.existsSync(SAMPLE_DIR)) return [];
  return fs
    .readdirSync(SAMPLE_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function collectExistingSeedFiles() {
  const set = new Set();
  for (const w of query.all('workflows')) {
    const f = w.orchestration?.acc_import?.seed_source_file;
    if (f) set.add(f);
  }
  return set;
}

/** Default folder for ACC JSON samples (same as seeded broadcast workflows). */
function resolveAccSampleWorkflowFolderId() {
  const folders = query.all('folders');
  const broadcast = folders.find(
    (f) => f.entity_type === 'workflows' && f.name === 'Broadcast'
  );
  return broadcast ? broadcast.id : null;
}

/**
 * Older seeds stored ACC samples with folder_id null — they vanish from the list when any folder is selected.
 * @returns {number} number of workflows updated
 */
function repairAccSampleWorkflowFolders() {
  const fid = resolveAccSampleWorkflowFolderId();
  if (!fid) return 0;
  let n = 0;
  for (const w of query.all('workflows')) {
    if (w.orchestration?.acc_import?.seed_marker !== SEED_MARKER) continue;
    if (w.folder_id != null && w.folder_id !== undefined) continue;
    query.update('workflows', w.id, { folder_id: fid });
    n++;
  }
  return n;
}

/**
 * @returns {{ created: number, skipped: number, failed: number, details: string[] }}
 */
function ensureAccSampleWorkflowsFromDisk() {
  const details = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  const already = collectExistingSeedFiles();
  const files = listSampleJsonBasenames();

  if (files.length === 0) {
    details.push(`No JSON files in ${SAMPLE_DIR}`);
    return { created, skipped, failed, details };
  }

  for (const basename of files) {
    const abs = path.join(SAMPLE_DIR, basename);
    if (already.has(basename)) {
      skipped++;
      continue;
    }

    let json;
    try {
      json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      failed++;
      details.push(`${basename}: invalid JSON (${e.message})`);
      continue;
    }

    if (typeof json.mdata !== 'string' || !json.mdata.trim()) {
      skipped++;
      details.push(`${basename}: skipped (no mdata)`);
      continue;
    }

    let imported;
    try {
      imported = importAccWorkflowJsonFileObject(json);
    } catch (e) {
      failed++;
      details.push(`${basename}: import error (${e.message})`);
      continue;
    }

    const stem = basename.replace(/\.json$/i, '');
    const wfName = `${NAME_PREFIX} ${stem}`.slice(0, 500);
    const customer = json._customer || '';
    const internal = json.sinternalname || '';
    const wfDesc = [
      `Seeded from sampleJson/${basename} (${SEED_MARKER}).`,
      customer && `Tenant: ${customer}`,
      internal && `ACC internal: ${internal}`,
      imported.workflowDescription || ''
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000);

    const orch = {
      nodes: imported.nodes,
      connections: imported.connections,
      acc_import: {
        seed_marker: SEED_MARKER,
        seed_source_file: basename,
        at: new Date().toISOString(),
        source_file: basename,
        warnings: imported.warnings,
        activity_count: imported.activityCount,
        ...(imported.meta || {})
      }
    };

    const now = new Date().toISOString();
    const folderId = resolveAccSampleWorkflowFolderId();
    try {
      const { record } = query.insert('workflows', {
        name: wfName,
        description: wfDesc,
        workflow_type: 'broadcast',
        entry_trigger: { type: 'manual', config: {} },
        orchestration: orch,
        audience_config: {},
        status: 'draft',
        created_by: 'ACC sample seed',
        updated_by: 'ACC sample seed',
        folder_id: folderId,
        entry_count: 0,
        completion_count: 0,
        active_count: 0,
        last_run_at: null,
        next_run_at: null,
        created_at: now,
        updated_at: now
      });
      already.add(basename);
      created++;
      details.push(`${basename} → workflow #${record.id}`);
    } catch (e) {
      failed++;
      details.push(`${basename}: insert failed (${e.message})`);
    }
  }

  return { created, skipped, failed, details };
}

module.exports = {
  ensureAccSampleWorkflowsFromDisk,
  repairAccSampleWorkflowFolders,
  NAME_PREFIX,
  SEED_MARKER,
  SAMPLE_DIR
};
