const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.json');

// In-memory database
let db = {
  contacts: [], // Renamed from customers - B2C consumer profiles
  contact_events: [], // Renamed from customer_events
  segments: [],
  audiences: [], // Campaign-specific audience definitions
  workflows: [], // UNIFIED: Previously separate campaigns + workflows
  workflow_metrics: [], // Renamed from campaign_metrics
  workflow_sends: [], // Renamed from campaign_sends
  workflow_orchestrations: [], // Orchestration canvas data
  workflow_executions: [], // Execution history for automated workflows
  
  // Deliveries Management
  deliveries: [], // Email/SMS/Push delivery management
  delivery_logs: [], // Delivery execution logs
  delivery_stats: [], // Delivery performance statistics
  
  // Triggered/Transactional Messages
  transactional_messages: [], // Event messages (linked to events)
  transactional_sends: [], // Individual transactional message sends
  event_triggers: [], // Event templates (blueprints)
  events: [], // Events (created from templates, publishable)
  
  // Event History
  event_history: [], // All system events log
  
  // Content Management
  content_templates: [], // Reusable content templates
  landing_pages: [], // Landing page definitions
  fragments: [], // Content fragments/blocks
  brands: [], // Brand configurations
  assets: [], // Asset library (images/files)
  
  // Subscription Management
  subscription_services: [], // Subscription list definitions
  subscriptions: [], // Individual subscriptions
  unsubscribe_requests: [], // Unsubscribe tracking
  
  // Filters & Views
  predefined_filters: [], // Saved filter configurations
  
  // Existing entities
  templates: [],
  forms: [],
  form_submissions: [],
  products: [],
  orders: [],
  abandoned_carts: [],
  loyalty_programs: [],
  loyalty_points: [],
  loyalty_transactions: [],
  ai_predictions: [],
  enumerations: [],
  custom_objects: [],
  custom_object_data: {},
  ui_builder_versions: [],

  // ── Offer Decisioning ──
  offers: [],                    // Personalized & fallback offers
  offer_representations: [],     // Content per placement per offer
  placements: [],                // Where offers appear (email banner, web hero, etc.)
  collection_qualifiers: [],     // Tags to categorize offers
  offer_tags: [],                // Junction: offer <-> qualifier
  collections: [],               // Static or dynamic groups of offers
  decision_rules: [],            // Eligibility rules (reuse segment-builder format)
  offer_constraints: [],         // Capping & frequency rules per offer
  ranking_formulas: [],          // Custom ranking expressions
  ranking_ai_models: [],         // AI-based ranking models
  selection_strategies: [],      // Collection + eligibility + ranking method
  decisions: [],                 // Decision policies (placements + strategies + fallbacks)
  offer_propositions: [],        // Proposition log (what was proposed to whom)
  offer_events: [],              // Impression / click / conversion tracking

  _counters: {}
};

// Load database from file
function loadDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      const saved = JSON.parse(data);
      // Merge saved data into default schema so new tables are always present
      for (const key in db) {
        if (saved[key] !== undefined) db[key] = saved[key];
      }
      // Also pull in any extra keys from saved data
      for (const key in saved) {
        if (db[key] === undefined) db[key] = saved[key];
      }
      console.log('📦 Database loaded from file');
    } else {
      console.log('📦 Creating new database');
    }
  } catch (error) {
    console.error('Error loading database:', error.message);
  }
}

// Save database to file
function saveDatabase() {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error.message);
  }
}

// Get next ID for a table
function getNextId(table) {
  if (!db._counters[table]) {
    db._counters[table] = db[table].length > 0 
      ? Math.max(...db[table].map(r => r.id || 0)) + 1 
      : 1;
  } else {
    db._counters[table]++;
  }
  return db._counters[table];
}

// Initialize database
function initializeDatabase() {
  console.log('✅ Database initialized successfully!');
  return db;
}

// Database query helpers
const query = {
  // Get all records matching condition
  all: (table, condition = null) => {
    if (!db[table]) return [];
    if (!condition) return [...db[table]];
    return db[table].filter(condition);
  },
  
  // Get first record matching condition
  get: (table, condition) => {
    if (!db[table]) return null;
    if (typeof condition === 'number') {
      return db[table].find(r => r.id === condition) || null;
    }
    return db[table].find(condition) || null;
  },
  
  // Insert record
  insert: (table, data) => {
    if (!db[table]) db[table] = [];
    const id = getNextId(table);
    const now = new Date().toISOString();
    const record = { id, ...data, created_at: data.created_at || now, updated_at: data.updated_at || now };
    db[table].push(record);
    saveDatabase();
    return { lastID: id, record };
  },
  
  // Update record
  update: (table, id, data) => {
    if (!db[table]) return false;
    const index = db[table].findIndex(r => r.id === id);
    if (index === -1) return false;
    db[table][index] = { ...db[table][index], ...data, updated_at: new Date().toISOString() };
    saveDatabase();
    return true;
  },
  
  // Delete record
  delete: (table, id) => {
    if (!db[table]) return false;
    const index = db[table].findIndex(r => r.id === id);
    if (index === -1) return false;
    db[table].splice(index, 1);
    saveDatabase();
    return true;
  },
  
  // Count records
  count: (table, condition = null) => {
    if (!db[table]) return 0;
    if (!condition) return db[table].length;
    return db[table].filter(condition).length;
  }
};

// Initialize on module load
loadDatabase();

// Save on process exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit();
});

module.exports = { db, initializeDatabase, saveDatabase, query };
