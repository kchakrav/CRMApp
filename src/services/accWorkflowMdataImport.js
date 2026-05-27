/**
 * Parse Adobe Campaign Classic workflow XML (mdata) into CRMApp orchestration
 * { nodes, connections }.
 */

const { XMLParser } = require('fast-xml-parser');

const ACC_TAG_TO_TYPE = {
  start: 'entry',
  end: 'exit',
  schedule: 'scheduler',
  fork: 'fork',
  query: 'query',
  readGroup: 'read_group',
  enrich: 'enrichment',
  union: 'combine',
  exclusion: 'exclude',
  dedup: 'deduplication',
  extract: 'split',
  changeAxis: 'change_dimension',
  deliveryRecurring: 'recurring_delivery',
  signal: 'external_signal',
  jstest: 'script_condition',
  writer: 'data_writer',
  wait: 'wait',
  alert: 'alert',
  javascript: 'javascript',
  loadFile: 'load_file',
  transferFile: 'transfer_file',
  saveAudience: 'save_audience'
};

const CATEGORY_BY_TYPE = {
  entry: 'flow',
  exit: 'flow',
  stop: 'flow',
  scheduler: 'flow_control',
  fork: 'flow_control',
  wait: 'flow_control',
  condition: 'flow_control',
  script_condition: 'flow_control',
  external_signal: 'flow_control',
  alert: 'flow_control',
  jump: 'flow_control',
  random: 'flow_control',
  query: 'targeting',
  build_audience: 'targeting',
  segment: 'targeting',
  filter: 'targeting',
  exclude: 'targeting',
  combine: 'targeting',
  deduplication: 'targeting',
  enrichment: 'targeting',
  split: 'targeting',
  read_group: 'targeting',
  change_dimension: 'targeting',
  incremental_query: 'targeting',
  reconciliation: 'targeting',
  save_audience: 'targeting',
  change_data_source: 'targeting',
  email: 'channels',
  sms: 'channels',
  push: 'channels',
  recurring_delivery: 'channels',
  webhook: 'channels',
  direct_mail: 'channels',
  data_writer: 'actions',
  javascript: 'actions',
  load_file: 'actions',
  transfer_file: 'actions',
  update_tag: 'actions',
  update_field: 'actions',
  add_to_segment: 'actions',
  goal: 'tracking'
};

function slugId(name) {
  return String(name || 'node')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'node';
}

function getText(val) {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object' && val['#text'] != null) return String(val['#text']);
  return '';
}

function extractHumanCond(raw) {
  return getText(raw.humanCond).trim() || '';
}

function extractErrors(raw) {
  return getText(raw.errors).trim() || '';
}

function extractJstestExpression(raw) {
  const trans = raw.transitions || {};
  const test = Array.isArray(trans.test) ? trans.test[0] : trans.test;
  if (!test) return '';
  const cond = test.condition;
  if (typeof cond === 'string') return cond.trim();
  if (cond && typeof cond === 'object') {
    const inner = cond['#text'] || cond.__cdata || cond['#cdata-section'];
    if (inner) return String(inner).trim();
  }
  return '';
}

function collectGenericTargets(transRoot, out = []) {
  if (!transRoot || typeof transRoot !== 'object') return out;
  if (Array.isArray(transRoot)) {
    transRoot.forEach((x) => collectGenericTargets(x, out));
    return out;
  }
  if (transRoot['@_target']) {
    out.push({
      target: transRoot['@_target'],
      transitionName: transRoot['@_name'] || transRoot['@_label'] || 'transition'
    });
  }
  for (const [k, v] of Object.entries(transRoot)) {
    if (k.startsWith('@_') || k === '#text') continue;
    collectGenericTargets(v, out);
  }
  return out;
}

function buildSplitFromExtract(raw, idSlug) {
  const trans = raw.transitions || {};
  const transitions = [];
  const edges = [];

  const pushBranch = (label, target) => {
    if (!target) return;
    const id = `trans-${slugId(idSlug)}-${transitions.length}`;
    transitions.push({
      id,
      label: label || 'Branch',
      segment_code: '',
      enable_limit: false,
      skip_empty: false
    });
    edges.push({ transitionId: id, target });
  };

  for (const key of Object.keys(trans)) {
    if (key === '#text') continue;
    const val = trans[key];
    const arr = Array.isArray(val) ? val : [val];
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const target = item['@_target'];
      if (key === 'extractOutput' && target) {
        pushBranch(item['@_label'] || 'extractOutput', target);
      }
      if (key === 'remainder' && target && item['@_enabled'] !== '0' && item['@_enabled'] !== 'false') {
        pushBranch(item['@_label'] || 'remainder', target);
      }
    }
  }

  return { transitions, edges };
}

function mapActivityToNode(tag, raw, warnings) {
  const accName = raw['@_name'] || tag;
  const label = raw['@_label'] || accName;
  const mapped = ACC_TAG_TO_TYPE[tag];

  if (!mapped) {
    warnings.push(`Unmapped ACC activity <${tag}> name="${accName}" — omitted`);
    return { skip: true };
  }

  const type = mapped;
  const config = {
    acc_tag: tag,
    acc_internal_name: accName,
    acc_label: label,
    import_source: 'acc_mdata'
  };

  const err = extractErrors(raw);
  if (err) config.acc_import_errors = err.slice(0, 2000);

  if (type === 'query') {
    const hc = extractHumanCond(raw);
    if (hc) config.acc_human_cond = hc.slice(0, 4000);
    config.source_type = 'custom';
    config.query_json = JSON.stringify({
      note: 'Imported from ACC — link to segment or refine filters in the app',
      acc_schema: raw['@_schema'] || ''
    });
  }

  if (type === 'read_group') {
    const rg = raw.readGroup;
    const groupCs = (rg && rg['@_group-cs']) || label;
    config.external_list_label = groupCs;
    config.audience_id = '';
  }

  if (type === 'combine' && tag === 'union') {
    config.operation = 'union';
  }

  if (type === 'recurring_delivery') {
    const did = raw['@_delivery-id'];
    const idNum = parseInt(String(did || ''), 10);
    if (!Number.isNaN(idNum) && idNum > 0) config.delivery_id = String(idNum);
    config.cadence_summary = label;
    config.channel = 'email';
  }

  if (type === 'external_signal') {
    config.signal_key = accName || slugId(label);
  }

  if (type === 'script_condition') {
    config.expression = extractJstestExpression(raw) || 'vars.recCount > 0';
    config.execution_branch = 'true';
  }

  if (type === 'data_writer') {
    const schema = raw['@_schema'] || '';
    config.entity_type =
      schema.includes('campaignState') || schema.includes('recipientSource') ? 'campaign_state' : 'contacts';
    config.operation = (raw['@_operationType'] || 'update').toLowerCase();
    config.notes = label;
    config.field_updates_json = '[]';
  }

  if (type === 'change_dimension') {
    config.dimension = 'contacts';
    config.acc_recipient_link = raw['@_recipientLink'] || '';
  }

  if (type === 'scheduler') {
    const period = raw.period;
    const ptext = typeof period === 'string' ? period : getText(period);
    if (ptext) config.acc_schedule_period = ptext.slice(0, 2000);
  }

  if (type === 'deduplication') {
    const ge = raw.groupExpr;
    const expr = ge?.['@_expr'] || ge?.['@_label'] || 'email';
    config.keys = 'email';
    config.acc_dedupe_expr = expr;
  }

  return { skip: false, type, name: (label || type).slice(0, 120), config, accName };
}

/**
 * @param {string} mdataXml
 * @param {object} [meta]
 * @returns {{ nodes: object[], connections: object[], warnings: string[], activityCount: number, meta: object }}
 */
function importAccMdataToOrchestration(mdataXml, meta = {}) {
  const warnings = [];
  if (!mdataXml || typeof mdataXml !== 'string') {
    warnings.push('Empty mdata');
    return { nodes: [], connections: [], warnings, activityCount: 0, meta: { ...meta } };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    cdataPropName: '__cdata'
  });

  let parsed;
  try {
    parsed = parser.parse(mdataXml);
  } catch (e) {
    warnings.push(`XML parse error: ${e.message}`);
    return { nodes: [], connections: [], warnings, activityCount: 0, meta: { ...meta } };
  }

  const workflow = parsed.workflow || parsed['xtk:workflow'];
  if (!workflow) {
    warnings.push('No <workflow> root in mdata');
    return { nodes: [], connections: [], warnings, activityCount: 0, meta: { ...meta } };
  }

  const activities = workflow.activities;
  if (!activities || typeof activities !== 'object') {
    warnings.push('No <activities> in workflow');
    return { nodes: [], connections: [], warnings, activityCount: 0, meta: { ...meta } };
  }

  const flat = [];
  for (const [tagName, val] of Object.entries(activities)) {
    if (tagName.startsWith('@_') || tagName === '#text') continue;
    const items = Array.isArray(val) ? val : [val];
    let i = 0;
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const name = item['@_name'] || `${tagName}_${i}`;
      const label = item['@_label'] || name;
      flat.push({ tag: tagName, name, label, raw: item });
      i++;
    }
  }

  const nameToNodeId = new Map();
  const nodes = [];
  let connCounter = 1;
  const connections = [];

  const usedIds = new Set();
  function allocateId(accName) {
    const base = `acc-${slugId(accName)}`;
    let id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n++}`;
    }
    usedIds.add(id);
    return id;
  }

  let entryNodeId = null;
  let exitNodeId = null;
  let grid = 0;
  function nextPos() {
    const i = grid++;
    return { x: 80 + (i % 6) * 200, y: 80 + Math.floor(i / 6) * 120 };
  }

  for (const act of flat) {
    if (act.tag === 'start') {
      if (!entryNodeId) {
        entryNodeId = allocateId('entry');
        nodes.push({
          id: entryNodeId,
          type: 'entry',
          category: 'flow',
          name: act.label || 'Entry',
          icon: '',
          position: nextPos(),
          config: { acc_tag: 'start', acc_internal_name: act.name, import_source: 'acc_mdata' }
        });
      }
      nameToNodeId.set(act.name, entryNodeId);
      continue;
    }
    if (act.tag === 'end') {
      if (!exitNodeId) {
        exitNodeId = allocateId('exit');
        nodes.push({
          id: exitNodeId,
          type: 'exit',
          category: 'flow',
          name: 'End',
          icon: '',
          position: nextPos(),
          config: { import_source: 'acc_mdata', acc_tag: 'end' }
        });
      }
      nameToNodeId.set(act.name, exitNodeId);
      continue;
    }
  }

  const extractBranchMap = new Map();

  for (const act of flat) {
    if (act.tag === 'start' || act.tag === 'end') continue;

    const mapped = mapActivityToNode(act.tag, act.raw, warnings);
    if (mapped.skip) continue;

    const id = allocateId(act.name);
    nameToNodeId.set(act.name, id);

    let { type, name, config } = mapped;

    if (type === 'split' && act.tag === 'extract') {
      const built = buildSplitFromExtract(act.raw, act.name);
      if (built.transitions.length) {
        config.transitions = built.transitions;
        extractBranchMap.set(act.name, built.edges);
      } else {
        warnings.push(`extract "${act.name}" had no extractOutput branches — added placeholder`);
        config.transitions = [
          {
            id: `trans-${slugId(id)}-0`,
            label: 'A',
            segment_code: '',
            enable_limit: false,
            skip_empty: false
          }
        ];
      }
    }

    nodes.push({
      id,
      type,
      category: CATEGORY_BY_TYPE[type] || 'targeting',
      name,
      icon: '',
      position: nextPos(),
      config
    });
  }

  function wireConn(fromAccName, toAccName, label, transitionId) {
    const fromId = nameToNodeId.get(fromAccName);
    const toId = nameToNodeId.get(toAccName);
    if (!fromId || !toId) {
      if (toAccName && !nameToNodeId.has(toAccName)) {
        warnings.push(`Missing target activity "${toAccName}" (from "${fromAccName}")`);
      }
      return;
    }
    connections.push({
      id: `conn-${connCounter++}`,
      from: fromId,
      to: toId,
      label: label || '',
      transition_id: transitionId || null
    });
  }

  for (const act of flat) {
    const fromName = act.name;
    if (!nameToNodeId.has(fromName)) continue;

    if (act.tag === 'jstest') {
      const trans = act.raw.transitions || {};
      const test = Array.isArray(trans.test) ? trans.test[0] : trans.test;
      const def = Array.isArray(trans.default) ? trans.default[0] : trans.default;
      if (test?.['@_target']) wireConn(fromName, test['@_target'], 'True', 'true');
      if (def?.['@_target']) wireConn(fromName, def['@_target'], 'False', 'false');
      continue;
    }

    if (act.tag === 'extract') {
      const edges = extractBranchMap.get(fromName);
      const node = nodes.find((n) => n.id === nameToNodeId.get(fromName));
      const transList = node?.config?.transitions || [];
      if (edges && edges.length) {
        edges.forEach((e, idx) => {
          const tid = transList[idx]?.id;
          if (tid && e.target) wireConn(fromName, e.target, transList[idx].label, tid);
        });
      } else {
        const fallback = collectGenericTargets(act.raw.transitions, []);
        const seen = new Set();
        fallback.forEach((t, idx) => {
          const key = `${fromName}->${t.target}`;
          if (seen.has(key)) return;
          seen.add(key);
          const tid = transList[idx]?.id || null;
          wireConn(fromName, t.target, t.transitionName, tid);
        });
      }
      continue;
    }

    const targets = collectGenericTargets(act.raw.transitions, []);
    const seen = new Set();
    for (const t of targets) {
      const key = `${fromName}->${t.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let tid = null;
      if (act.tag === 'external_signal' && String(t.transitionName).toLowerCase() === 'timeout') {
        tid = 'timeout';
      }
      wireConn(fromName, t.target, t.transitionName, tid);
    }
  }

  if (!entryNodeId) {
    entryNodeId = allocateId('entry');
    nodes.unshift({
      id: entryNodeId,
      type: 'entry',
      category: 'flow',
      name: 'Entry',
      icon: '',
      position: { x: 80, y: 80 },
      config: { import_source: 'acc_mdata', synthetic: true }
    });
    warnings.push('No <start> in ACC export — added synthetic Entry');
  }

  if (!exitNodeId) {
    exitNodeId = allocateId('exit');
    nodes.push({
      id: exitNodeId,
      type: 'exit',
      category: 'flow',
      name: 'End',
      icon: '',
      position: nextPos(),
      config: { import_source: 'acc_mdata', synthetic: true }
    });
    warnings.push('No <end> in ACC export — added synthetic Exit');
  }

  return {
    nodes,
    connections,
    warnings,
    activityCount: flat.length,
    meta: {
      ...meta,
      imported_activities: flat.length,
      imported_nodes: nodes.length,
      imported_connections: connections.length
    }
  };
}

function importAccWorkflowJsonFileObject(json) {
  const mdata = json.mdata;
  const meta = {
    slabel: json.slabel,
    sinternalname: json.sinternalname,
    _customer: json._customer,
    iworkflowid: json.iworkflowid
  };
  const result = importAccMdataToOrchestration(mdata, meta);
  const wfName = json.slabel || json.sinternalname || 'ACC import';
  const wfDesc =
    json.sdesc ||
    `Imported from ACC (${meta._customer || 'unknown'}) internal=${meta.sinternalname || ''}`;
  return { ...result, workflowName: wfName, workflowDescription: wfDesc };
}

module.exports = {
  importAccMdataToOrchestration,
  importAccWorkflowJsonFileObject,
  ACC_TAG_TO_TYPE,
  CATEGORY_BY_TYPE
};
