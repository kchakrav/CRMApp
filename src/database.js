const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const jsonPath = path.join(__dirname, '../data/database.json');
const dbPath = path.join(__dirname, '../data/crm.db');

// All table names (array collections). custom_object_data is handled separately.
const TABLE_NAMES = [
  'contacts', 'contact_events', 'segments', 'audiences', 'workflows', 'workflow_metrics',
  'workflow_sends', 'workflow_orchestrations', 'campaign_orchestrations', 'workflow_executions', 'deliveries',
  'delivery_logs', 'delivery_stats', 'transactional_messages', 'transactional_sends',
  'event_triggers', 'events', 'event_history', 'content_templates', 'landing_pages',
  'fragments', 'brands', 'assets', 'subscription_services', 'subscriptions',
  'unsubscribe_requests', 'predefined_filters', 'feedback', 'templates', 'forms',
  'form_submissions', 'products', 'orders', 'abandoned_carts', 'loyalty_programs',
  'loyalty_points', 'loyalty_transactions', 'ai_predictions', 'enumerations',
  'custom_objects', 'ui_builder_versions', 'offers', 'offer_representations',
  'placements', 'collection_qualifiers', 'offer_tags', 'collections', 'decision_rules',
  'offer_constraints', 'ranking_formulas', 'ranking_ai_models', 'selection_strategies',
  'decisions', 'offer_propositions', 'offer_events', 'catalog_schema', 'context_schema',
  'experiments', 'folders', 'email_themes'
];

const CUSTOM_OBJECT_DATA_TABLE = '_custom_object_data';

let sqlite = null;
// In-memory cache so existing code (query route, etc.) can use db[table] as arrays.
const db = {
  _counters: {},
  custom_object_data: {}
};

function getSqlite() {
  if (sqlite) return sqlite;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  return sqlite;
}

function ensureTables() {
  const s = getSqlite();
  for (const name of TABLE_NAMES) {
    s.exec(`CREATE TABLE IF NOT EXISTS "${name}" (id INTEGER PRIMARY KEY, data TEXT NOT NULL)`);
  }
  s.exec(`CREATE TABLE IF NOT EXISTS "${CUSTOM_OBJECT_DATA_TABLE}" (k TEXT PRIMARY KEY, data TEXT NOT NULL)`);
}

function ensureTable(name) {
  if (TABLE_NAMES.includes(name)) return;
  const s = getSqlite();
  s.exec(`CREATE TABLE IF NOT EXISTS "${name}" (id INTEGER PRIMARY KEY, data TEXT NOT NULL)`);
  TABLE_NAMES.push(name);
  db[name] = [];
  loadTableIntoMemory(name);
}

function isSqliteEmpty() {
  const s = getSqlite();
  for (const name of TABLE_NAMES) {
    const row = s.prepare(`SELECT 1 FROM "${name}" LIMIT 1`).get();
    if (row) return false;
  }
  return true;
}

function migrateFromJson() {
  if (!fs.existsSync(jsonPath)) return;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const saved = JSON.parse(raw);
    const s = getSqlite();
    const insertStmt = {};
    for (const table of TABLE_NAMES) {
      const rows = saved[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const ins = s.prepare(`INSERT OR REPLACE INTO "${table}" (id, data) VALUES (?, ?)`);
      for (const record of rows) {
        if (record == null || typeof record !== 'object') continue;
        const id = record.id != null ? record.id : 0;
        ins.run(id, JSON.stringify(record));
      }
    }
    const obj = saved.custom_object_data;
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const ins = s.prepare(`INSERT OR REPLACE INTO "${CUSTOM_OBJECT_DATA_TABLE}" (k, data) VALUES (?, ?)`);
      for (const [k, v] of Object.entries(obj)) {
        ins.run(k, JSON.stringify(v));
      }
    }
    console.log('📦 Migrated data from database.json to SQLite');
  } catch (err) {
    console.error('Migration from JSON failed:', err.message);
  }
}

function loadTableIntoMemory(table) {
  const s = getSqlite();
  const rows = s.prepare(`SELECT id, data FROM "${table}" ORDER BY id`).all();
  db[table] = rows.map(r => {
    const parsed = JSON.parse(r.data);
    return { ...parsed, id: r.id };
  });
}

function loadCustomObjectDataIntoMemory() {
  const s = getSqlite();
  const rows = s.prepare(`SELECT k, data FROM "${CUSTOM_OBJECT_DATA_TABLE}"`).all();
  db.custom_object_data = {};
  for (const r of rows) {
    try {
      db.custom_object_data[r.k] = JSON.parse(r.data);
    } catch (_) {
      db.custom_object_data[r.k] = r.data;
    }
  }
}

function loadDatabase() {
  getSqlite();
  ensureTables();
  if (isSqliteEmpty()) migrateFromJson();
  for (const table of TABLE_NAMES) {
    db[table] = [];
    loadTableIntoMemory(table);
  }
  loadCustomObjectDataIntoMemory();
  console.log('📦 Database loaded from SQLite');
}

function saveDatabase() {
  const s = getSqlite();
  const del = s.prepare(`DELETE FROM "${CUSTOM_OBJECT_DATA_TABLE}"`);
  const ins = s.prepare(`INSERT INTO "${CUSTOM_OBJECT_DATA_TABLE}" (k, data) VALUES (?, ?)`);
  del.run();
  for (const [k, v] of Object.entries(db.custom_object_data || {})) {
    ins.run(k, JSON.stringify(v));
  }
}

function getNextId(table) {
  if (!TABLE_NAMES.includes(table)) return 1;
  const s = getSqlite();
  const row = s.prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS next FROM "${table}"`).get();
  return row ? row.next : 1;
}

function initializeDatabase() {
  loadDatabase();
  console.log('✅ Database initialized successfully!');
  return db;
}

function sortByLatest(arr) {
  return arr.sort((a, b) => {
    const ta = a.updated_at || a.created_at || '';
    const tb = b.updated_at || b.created_at || '';
    return tb < ta ? -1 : tb > ta ? 1 : b.id - a.id;
  });
}

const query = {
  all: (table, condition = null) => {
    if (!db[table]) return [];
    if (!condition) return sortByLatest([...db[table]]);
    return sortByLatest(db[table].filter(condition));
  },

  get: (table, condition) => {
    if (!db[table]) return null;
    if (typeof condition === 'number' && !Number.isNaN(condition)) {
      return db[table].find(r => r.id === condition) || null;
    }
    if (typeof condition === 'string' && /^\d+$/.test(condition)) {
      const id = parseInt(condition, 10);
      return db[table].find(r => r.id === id) || null;
    }
    if (typeof condition === 'function') {
      return db[table].find(condition) || null;
    }
    return null;
  },

  insert: (table, data) => {
    if (!db[table]) ensureTable(table);
    if (!db[table]) db[table] = [];
    const id = getNextId(table);
    const now = new Date().toISOString();
    const record = { id, ...data, created_at: data.created_at || now, updated_at: data.updated_at || now };
    const s = getSqlite();
    s.prepare(`INSERT INTO "${table}" (id, data) VALUES (?, ?)`).run(id, JSON.stringify(record));
    db[table].push(record);
    return { lastID: id, record };
  },

  update: (table, id, data) => {
    if (!db[table]) return false;
    const numId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id;
    const index = db[table].findIndex(r => r.id === numId);
    if (index === -1) return false;
    const updated = { ...db[table][index], ...data, updated_at: new Date().toISOString() };
    const s = getSqlite();
    s.prepare(`UPDATE "${table}" SET data = ? WHERE id = ?`).run(JSON.stringify(updated), numId);
    db[table][index] = updated;
    return true;
  },

  delete: (table, id) => {
    if (!db[table]) return false;
    const index = db[table].findIndex(r => r.id === id);
    if (index === -1) return false;
    const s = getSqlite();
    s.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(id);
    db[table].splice(index, 1);
    return true;
  },

  count: (table, condition = null) => {
    if (!db[table]) return 0;
    if (!condition) return db[table].length;
    return db[table].filter(condition).length;
  }
};

// Initialize on module load
loadDatabase();

process.on('exit', () => {
  saveDatabase();
  if (sqlite) sqlite.close();
});
process.on('SIGINT', () => {
  saveDatabase();
  if (sqlite) sqlite.close();
  process.exit();
});

module.exports = { db, initializeDatabase, saveDatabase, query };
