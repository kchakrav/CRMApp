const { query, initializeDatabase, saveDatabase } = require('./database');

console.log('🌱 Starting database seeding...\n');

// Initialize database first
initializeDatabase();

// Guard: skip seeding if data already exists (protects user-created records)
const existingContacts = query.all('contacts');
if (existingContacts.length > 0) {
  console.log(`⚠️  Database already has ${existingContacts.length} contacts. Skipping seed to protect existing data.`);
  console.log('   To force a full re-seed, delete data/database.json and run again.');
  process.exit(0);
}

console.log('📦 Empty database detected — seeding sample data...\n');

// Helper functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// B2C-focused sample data arrays
const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery', 'Sebastian', 'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe', 'Samuel', 'Victoria', 'David'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'];

// B2C Marketing Attributes
const statuses = ['active', 'active', 'active', 'active', 'inactive'];
const subscriptionStatuses = ['subscribed', 'subscribed', 'subscribed', 'unsubscribed', 'bounced'];
const genders = ['male', 'female', 'non-binary', 'prefer not to say'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Miami', 'Seattle', 'Boston', 'Denver', 'Portland'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'WA', 'MA', 'CO', 'OR'];
const countries = ['USA', 'USA', 'USA', 'Canada', 'UK', 'Australia'];

// B2C Interests
const allInterests = ['fashion', 'beauty', 'sports', 'fitness', 'technology', 'home', 'garden', 'food', 'travel', 'books', 'music', 'movies', 'gaming', 'pets', 'automotive'];
const categories = ['Electronics', 'Fashion', 'Beauty', 'Sports', 'Home & Garden', 'Books', 'Food & Beverage'];
const priceSensitivities = ['low', 'medium', 'high'];
const loyaltyTiers = ['bronze', 'silver', 'gold', 'platinum'];
const communicationFrequencies = ['daily', 'weekly', 'monthly'];
const preferredChannels = ['email', 'sms', 'push', 'whatsapp'];
const sources = ['organic', 'paid_search', 'social_media', 'referral', 'email_campaign', 'influencer'];

console.log('📝 Seeding contacts (B2C consumers)...');
for (let i = 1; i <= 1000; i++) {
  const firstName = randomChoice(firstNames);
  const lastName = randomChoice(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
  
  // Random interests (2-4 per contact)
  const contactInterests = [];
  const interestCount = randomNumber(2, 4);
  for (let j = 0; j < interestCount; j++) {
    const interest = randomChoice(allInterests);
    if (!contactInterests.includes(interest)) contactInterests.push(interest);
  }
  
  // Random favorite categories (1-3 per contact)
  const favoriteCategories = [];
  const catCount = randomNumber(1, 3);
  for (let j = 0; j < catCount; j++) {
    const cat = randomChoice(categories);
    if (!favoriteCategories.includes(cat)) favoriteCategories.push(cat);
  }
  
  // Engagement score based on activity
  const engagementScore = randomNumber(10, 100);
  const totalPurchases = randomNumber(0, 20);
  const lifetimeValue = totalPurchases > 0 ? totalPurchases * randomNumber(30, 200) : 0;
  
  // Determine loyalty tier based on LTV
  let loyaltyTier = 'bronze';
  if (lifetimeValue > 2000) loyaltyTier = 'platinum';
  else if (lifetimeValue > 1000) loyaltyTier = 'gold';
  else if (lifetimeValue > 500) loyaltyTier = 'silver';
  
  const birthYear = randomNumber(1960, 2005);
  const birthMonth = randomNumber(1, 12);
  const birthDay = randomNumber(1, 28);
  
  query.insert('contacts', {
    // Basic Info
    email,
    phone: `+1${randomNumber(2000000000, 9999999999)}`,
    first_name: firstName,
    last_name: lastName,
    status: randomChoice(statuses),
    
    // Demographics
    date_of_birth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    gender: randomChoice(genders),
    city: randomChoice(cities),
    state: randomChoice(states),
    country: randomChoice(countries),
    postal_code: String(randomNumber(10000, 99999)),
    timezone: randomChoice(['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Denver']),
    language: randomChoice(['en', 'es', 'fr']),
    
    // Preferences
    email_opt_in: Math.random() > 0.3,
    sms_opt_in: Math.random() > 0.6,
    push_opt_in: Math.random() > 0.5,
    whatsapp_opt_in: Math.random() > 0.7,
    communication_frequency: randomChoice(communicationFrequencies),
    preferred_channel: randomChoice(preferredChannels),
    
    // Interests & Behavior
    interests: contactInterests,
    product_preferences: {},
    favorite_categories: favoriteCategories,
    price_sensitivity: randomChoice(priceSensitivities),
    
    // Engagement & Scoring
    subscription_status: randomChoice(subscriptionStatuses),
    engagement_score: engagementScore,
    last_purchase_date: totalPurchases > 0 ? randomDate(new Date(2024, 0, 1), new Date()).toISOString() : null,
    total_purchases: totalPurchases,
    lifetime_value: lifetimeValue,
    average_order_value: totalPurchases > 0 ? lifetimeValue / totalPurchases : 0,
    
    // Loyalty & Rewards
    loyalty_tier: loyaltyTier,
    loyalty_points: randomNumber(0, 5000),
    referral_count: randomNumber(0, 5),
    
    // Marketing Attribution
    source: randomChoice(sources),
    campaign_source: Math.random() > 0.5 ? randomChoice(['spring_sale', 'black_friday', 'summer_promo', 'new_year']) : null,
    utm_source: Math.random() > 0.5 ? randomChoice(['google', 'facebook', 'instagram', 'email']) : null,
    utm_medium: Math.random() > 0.5 ? randomChoice(['cpc', 'email', 'social', 'referral']) : null,
    utm_campaign: Math.random() > 0.5 ? randomChoice(['spring2026', 'launch', 'sale']) : null,
    
    // Tags & Custom
    tags: [],
    custom_attributes: {},
    
    // Consent & Privacy
    marketing_consent: Math.random() > 0.2,
    gdpr_consent: Math.random() > 0.1,
    email_verified: Math.random() > 0.3,
    phone_verified: Math.random() > 0.6,
    
    notes: '',
    last_activity_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
  });
}
console.log('✅ Created 1000 contacts (B2C consumers)');

console.log('📝 Seeding products...');
const products = [
  { sku: 'PROD-001', name: 'Wireless Headphones', price: 89.99, category: 'Electronics' },
  { sku: 'PROD-002', name: 'Smart Watch', price: 249.99, category: 'Electronics' },
  { sku: 'PROD-003', name: 'Running Shoes', price: 79.99, category: 'Sports' },
  { sku: 'PROD-004', name: 'Yoga Mat', price: 29.99, category: 'Sports' },
  { sku: 'PROD-005', name: 'Coffee Maker', price: 129.99, category: 'Home & Garden' },
  { sku: 'PROD-006', name: 'Desk Lamp', price: 39.99, category: 'Home & Garden' },
  { sku: 'PROD-007', name: 'Denim Jacket', price: 79.99, category: 'Fashion' },
  { sku: 'PROD-008', name: 'Summer Dress', price: 59.99, category: 'Fashion' },
  { sku: 'PROD-009', name: 'Face Serum', price: 34.99, category: 'Beauty' },
  { sku: 'PROD-010', name: 'Shampoo & Conditioner Set', price: 24.99, category: 'Beauty' },
  { sku: 'PROD-011', name: 'Bluetooth Speaker', price: 49.99, category: 'Electronics' },
  { sku: 'PROD-012', name: 'Fitness Tracker', price: 99.99, category: 'Sports' },
  { sku: 'PROD-013', name: 'Skincare Bundle', price: 89.99, category: 'Beauty' },
  { sku: 'PROD-014', name: 'Winter Coat', price: 149.99, category: 'Fashion' },
  { sku: 'PROD-015', name: 'Home Diffuser', price: 39.99, category: 'Home & Garden' }
];

products.forEach(product => {
  query.insert('products', {
    ...product,
    inventory_count: randomNumber(50, 500),
    is_active: true
  });
});
console.log(`✅ Created ${products.length} products`);

console.log('📝 Seeding orders...');
const contacts = query.all('contacts');
for (let i = 1; i <= 500; i++) {
  const contact = randomChoice(contacts);
  const itemCount = randomNumber(1, 3);
  const orderItems = [];
  let subtotal = 0;
  
  for (let j = 0; j < itemCount; j++) {
    const product = randomChoice(products);
    const quantity = randomNumber(1, 2);
    const itemTotal = product.price * quantity;
    subtotal += itemTotal;
    
    orderItems.push({
      product_id: product.sku,
      product_name: product.name,
      quantity,
      price: product.price,
      total: itemTotal
    });
  }
  
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;
  
  query.insert('orders', {
    order_number: `ORD-2026-${String(i).padStart(5, '0')}`,
    contact_id: contact.id, // Changed from customer_id to contact_id
    status: randomChoice(['completed', 'completed', 'completed', 'pending']),
    subtotal,
    tax,
    shipping,
    total,
    order_items: orderItems,
    ordered_at: randomDate(new Date(2025, 0, 1), new Date()).toISOString()
  });
}
console.log('✅ Created 500 orders');

console.log('📝 Seeding contact events...');
const eventTypes = ['page_view', 'product_view', 'add_to_cart', 'purchase', 'email_open', 'email_click', 'wishlist_add', 'review_submit', 'social_share'];
for (let i = 0; i < 2000; i++) {
  const contact = randomChoice(contacts);
  query.insert('contact_events', { // Changed from customer_events to contact_events
    contact_id: contact.id, // Changed from customer_id to contact_id
    event_type: randomChoice(eventTypes),
    event_name: `${randomChoice(eventTypes)}_${i}`,
    event_properties: {},
    device_type: randomChoice(['desktop', 'mobile', 'tablet']),
    created_at: randomDate(new Date(2025, 0, 1), new Date()).toISOString()
  });
}
console.log('✅ Created 2000 contact events');

console.log('📝 Seeding unified workflows...');

// Broadcast workflows (formerly "campaigns")
const broadcastWorkflows = [
  { name: 'Summer Sale 2026', description: 'Major summer promotion', trigger_type: 'scheduled' },
  { name: 'Flash Sale', description: '24-hour flash sale alert', trigger_type: 'manual' },
  { name: 'New Arrivals', description: 'Showcase new product line', trigger_type: 'scheduled' },
  { name: 'VIP Exclusive', description: 'Exclusive offer for VIP members', trigger_type: 'manual' },
  { name: 'Black Friday', description: 'Black Friday mega sale', trigger_type: 'scheduled' },
  { name: 'Holiday Gift Guide', description: 'Curated gift ideas', trigger_type: 'scheduled' },
  { name: 'Spring Collection', description: 'Launch spring fashion line', trigger_type: 'manual' },
  { name: 'Birthday Celebration', description: 'Company anniversary sale', trigger_type: 'scheduled' }
];

broadcastWorkflows.forEach((wf, index) => {
  const status = randomChoice(['draft', 'active', 'completed', 'completed']);
  const createdAt = randomDate(new Date(2025, 0, 1), new Date()).toISOString();
  const channelType = randomChoice(['email', 'sms', 'push']);
  
  const result = query.insert('workflows', {
    name: wf.name,
    description: wf.description,
    workflow_type: 'broadcast',
    entry_trigger: {
      type: wf.trigger_type,
      config: wf.trigger_type === 'scheduled' ? {
        scheduled_at: randomDate(new Date(2026, 1, 1), new Date(2026, 11, 31)).toISOString()
      } : {}
    },
    orchestration: {
      nodes: [
        { id: 'entry', type: 'entry', name: 'Start', position: { x: 200, y: 100 } },
        { id: 'segment', type: 'segment', name: 'Target Audience', position: { x: 200, y: 220 }, config: {} },
        { id: channelType, type: channelType, name: `${channelType.toUpperCase()} Message`, position: { x: 200, y: 340 }, 
          config: { 
            subject: `${wf.name} - Limited Time!`,
            content: `Amazing deals from ${wf.name}. Don't miss out!`
          }
        },
        { id: 'exit', type: 'exit', name: 'End', position: { x: 200, y: 460 } }
      ],
      connections: [
        { id: 'conn1', from: 'entry', to: 'segment' },
        { id: 'conn2', from: 'segment', to: channelType },
        { id: 'conn3', from: channelType, to: 'exit' }
      ]
    },
    audience_config: {},
    status,
    entry_count: status !== 'draft' ? randomNumber(100, 1000) : 0,
    completion_count: status === 'completed' ? randomNumber(90, 150) : 0,
    last_run_at: status !== 'draft' ? createdAt : null
  });
  
  // Create metrics for non-draft workflows
  if (status !== 'draft') {
    const recipients = result.record.entry_count;
    const sent = recipients;
    const delivered = Math.floor(sent * randomNumber(95, 99) / 100);
    const opened = Math.floor(delivered * randomNumber(15, 35) / 100);
    const clicked = Math.floor(opened * randomNumber(10, 25) / 100);
    const converted = Math.floor(clicked * randomNumber(5, 15) / 100);
    const bounced = sent - delivered;
    const unsubscribed = Math.floor(delivered * randomNumber(0, 2) / 100);
    
    query.insert('workflow_metrics', {
      workflow_id: result.lastID,
      total_recipients: recipients,
      sent,
      delivered,
      bounced,
      opened,
      clicked,
      converted,
      unsubscribed,
      revenue: converted * randomNumber(30, 150)
    });
  }
});
console.log(`✅ Created ${broadcastWorkflows.length} broadcast workflows`);

// Automated workflows (event-triggered)
const automatedWorkflows = [
  { name: 'Welcome Email Series', description: 'Automated welcome emails for new subscribers', event: 'contact_created' },
  { name: 'Cart Abandonment Recovery', description: 'Recover abandoned shopping carts', event: 'cart_abandoned' },
  { name: 'Post-Purchase Follow-up', description: 'Thank you and review request after purchase', event: 'order_completed' },
  { name: 'Winback Inactive Contacts', description: 'Re-engage contacts who haven\'t visited in 60 days', event: 'inactivity_detected' },
  { name: 'Birthday Rewards', description: 'Send birthday discount to contacts', event: 'birthday' },
  { name: 'Loyalty Milestone Reached', description: 'Celebrate loyalty tier upgrades', event: 'loyalty_upgrade' },
  { name: 'Product Recommendation Engine', description: 'AI-powered product suggestions', event: 'browse_behavior' }
];

automatedWorkflows.forEach((wf, index) => {
  const status = randomChoice(['active', 'active', 'active', 'paused', 'draft']);
  const createdAt = randomDate(new Date(2024, 6, 1), new Date()).toISOString();
  
  const result = query.insert('workflows', {
    name: wf.name,
    description: wf.description,
    workflow_type: 'automated',
    entry_trigger: {
      type: 'event',
      config: {
        event_name: wf.event,
        conditions: {}
      }
    },
    orchestration: {
      nodes: [
        { id: 'entry', type: 'entry', name: 'Trigger Event', position: { x: 200, y: 100 } },
        { id: 'wait1', type: 'wait', name: 'Wait 1 Hour', position: { x: 200, y: 220 }, config: { wait_time: 1, wait_unit: 'hours' } },
        { id: 'condition', type: 'condition', name: 'Check Condition', position: { x: 200, y: 340 }, config: { condition_type: 'email_opened' } },
        { id: 'email', type: 'email', name: 'Follow-up Email', position: { x: 200, y: 460 }, config: { subject: wf.name } },
        { id: 'exit', type: 'exit', name: 'End', position: { x: 200, y: 580 } }
      ],
      connections: [
        { id: 'conn1', from: 'entry', to: 'wait1' },
        { id: 'conn2', from: 'wait1', to: 'condition' },
        { id: 'conn3', from: 'condition', to: 'email' },
        { id: 'conn4', from: 'email', to: 'exit' }
      ]
    },
    audience_config: {},
    status,
    entry_count: status === 'active' ? randomNumber(500, 3000) : randomNumber(0, 100),
    completion_count: status === 'active' ? randomNumber(400, 2800) : 0,
    active_count: status === 'active' ? randomNumber(10, 200) : 0,
    last_run_at: status === 'active' ? new Date().toISOString() : null
  });
  
  // Create metrics for active workflows
  if (status === 'active') {
    const entries = result.record.entry_count;
    const completed = result.record.completion_count;
    const avgConversion = randomNumber(8, 20);
    
    query.insert('workflow_metrics', {
      workflow_id: result.lastID,
      total_recipients: entries,
      sent: completed,
      delivered: Math.floor(completed * 0.98),
      bounced: Math.floor(completed * 0.02),
      opened: Math.floor(completed * randomNumber(25, 45) / 100),
      clicked: Math.floor(completed * randomNumber(12, 28) / 100),
      converted: Math.floor(completed * avgConversion / 100),
      unsubscribed: Math.floor(completed * 0.005),
      revenue: Math.floor(completed * avgConversion / 100) * randomNumber(40, 180)
    });
  }
});
console.log(`✅ Created ${automatedWorkflows.length} automated workflows`);

// Recurring workflows
const recurringWorkflows = [
  { name: 'Weekly Newsletter', description: 'Weekly content digest every Monday', frequency: 'weekly', day: 'monday' },
  { name: 'Monthly Product Roundup', description: 'Monthly best sellers and new arrivals', frequency: 'monthly', day: 1 },
  { name: 'Daily Flash Deals', description: 'Daily deals sent each morning', frequency: 'daily', time: '09:00' }
];

recurringWorkflows.forEach((wf, index) => {
  const status = randomChoice(['active', 'active', 'paused']);
  
  const result = query.insert('workflows', {
    name: wf.name,
    description: wf.description,
    workflow_type: 'recurring',
    entry_trigger: {
      type: 'scheduled',
      config: {
        frequency: wf.frequency,
        day: wf.day,
        time: wf.time || '10:00'
      }
    },
    orchestration: {
      nodes: [
        { id: 'entry', type: 'entry', name: 'Scheduled Start', position: { x: 200, y: 100 } },
        { id: 'segment', type: 'segment', name: 'Active Subscribers', position: { x: 200, y: 220 }, config: {} },
        { id: 'email', type: 'email', name: 'Newsletter Email', position: { x: 200, y: 340 }, config: { subject: wf.name } },
        { id: 'exit', type: 'exit', name: 'End', position: { x: 200, y: 460 } }
      ],
      connections: [
        { id: 'conn1', from: 'entry', to: 'segment' },
        { id: 'conn2', from: 'segment', to: 'email' },
        { id: 'conn3', from: 'email', to: 'exit' }
      ]
    },
    audience_config: {},
    status,
    entry_count: status === 'active' ? randomNumber(2000, 8000) : 0,
    completion_count: status === 'active' ? randomNumber(1800, 7500) : 0,
    last_run_at: status === 'active' ? randomDate(new Date(2026, 0, 1), new Date()).toISOString() : null,
    next_run_at: status === 'active' ? randomDate(new Date(), new Date(2026, 2, 1)).toISOString() : null
  });
  
  if (status === 'active') {
    const sent = result.record.completion_count;
    const delivered = Math.floor(sent * 0.97);
    
    query.insert('workflow_metrics', {
      workflow_id: result.lastID,
      total_recipients: result.record.entry_count,
      sent,
      delivered,
      bounced: sent - delivered,
      opened: Math.floor(delivered * randomNumber(20, 40) / 100),
      clicked: Math.floor(delivered * randomNumber(5, 15) / 100),
      converted: Math.floor(delivered * randomNumber(1, 5) / 100),
      unsubscribed: Math.floor(delivered * 0.01),
      revenue: Math.floor(delivered * randomNumber(1, 5) / 100) * randomNumber(25, 80)
    });
  }
});
console.log(`✅ Created ${recurringWorkflows.length} recurring workflows`);

const totalWorkflows = broadcastWorkflows.length + automatedWorkflows.length + recurringWorkflows.length;
console.log(`✅ Total unified workflows created: ${totalWorkflows}`);

console.log('📝 Seeding segments...');
const segments = [
  { name: 'VIP Shoppers', description: 'Platinum tier customers', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select', operator: 'equals', value: 'vip' }] }, status: 'active' },
  { name: 'Active Subscribers', description: 'Recently engaged contacts', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'status', label: 'Status', type: 'select', operator: 'equals', value: 'active' }] }, status: 'active' },
  { name: 'High Engagement', description: 'Engagement score > 70', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'lead_score', label: 'Lead Score', type: 'number', operator: 'greater_than', value: '70' }] }, status: 'active' },
  { name: 'Fashion Lovers', description: 'Interested in fashion', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select', operator: 'equals', value: 'customer' }] }, status: 'active' },
  { name: 'Beauty Enthusiasts', description: 'Interested in beauty', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select', operator: 'equals', value: 'customer' }] }, status: 'active' },
  { name: 'Tech Savvy', description: 'Technology interested', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'status', label: 'Status', type: 'select', operator: 'equals', value: 'active' }] }, status: 'draft' },
  { name: 'Fitness Fans', description: 'Sports & fitness lovers', conditions: { logic: 'AND', base_entity: 'customer', rules: [{ entity: 'customer', attribute: 'lead_score', label: 'Lead Score', type: 'number', operator: 'greater_than_or_equal', value: '50' }] }, status: 'active' }
];

segments.forEach(segment => {
  query.insert('segments', {
    name: segment.name,
    description: segment.description,
    segment_type: 'dynamic',
    conditions: segment.conditions,
    contact_count: randomNumber(50, 300), // Changed from customer_count to contact_count
    status: segment.status,
    is_active: segment.status === 'active'
  });
});
console.log(`✅ Created ${segments.length} segments`);

// ══════════════════════════════════════════════════════
// OFFER DECISIONING SEED DATA
// ══════════════════════════════════════════════════════

console.log('\n📝 Seeding Offer Decisioning system...');

// ── Collection Qualifiers (Tags) ──
console.log('📝 Seeding collection qualifiers...');
const qualifiers = [
  { name: 'Summer', description: 'Summer seasonal offers', color: '#FF6B35' },
  { name: 'Loyalty', description: 'Loyalty program offers', color: '#9B59B6' },
  { name: 'Electronics', description: 'Electronics category', color: '#3498DB' },
  { name: 'Fashion', description: 'Fashion category', color: '#E91E63' },
  { name: 'Beauty', description: 'Beauty & wellness', color: '#00BCD4' },
  { name: 'Sports', description: 'Sports & fitness', color: '#4CAF50' },
  { name: 'Welcome', description: 'New customer welcome', color: '#FF9800' },
  { name: 'Re-engagement', description: 'Win-back offers', color: '#F44336' },
  { name: 'Flash Sale', description: 'Time-limited flash deals', color: '#FFEB3B' },
  { name: 'Premium', description: 'Premium/VIP exclusive', color: '#FFD700' },
  { name: 'Home & Garden', description: 'Home & garden category', color: '#8BC34A' },
  { name: 'Holiday', description: 'Holiday & seasonal specials', color: '#D32F2F' }
];
qualifiers.forEach(q => query.insert('collection_qualifiers', q));
console.log(`✅ Created ${qualifiers.length} collection qualifiers`);

// ── Placements ──
console.log('📝 Seeding placements...');
const placementsData = [
  { name: 'Email Hero Banner', description: 'Main hero image/banner in email campaigns', channel: 'email', content_type: 'html', max_items: 1, status: 'active' },
  { name: 'Email Sidebar Offer', description: 'Side panel offer in email layouts', channel: 'email', content_type: 'html', max_items: 2, status: 'active' },
  { name: 'Web Homepage Banner', description: 'Homepage hero banner on website', channel: 'web', content_type: 'json', max_items: 1, status: 'active' },
  { name: 'Web Product Page Upsell', description: 'Upsell offers on product detail pages', channel: 'web', content_type: 'json', max_items: 3, status: 'active' },
  { name: 'Mobile Push Offer', description: 'Personalized push notification offer', channel: 'push', content_type: 'text', max_items: 1, status: 'active' },
  { name: 'SMS Promo', description: 'SMS promotional message', channel: 'sms', content_type: 'text', max_items: 1, status: 'active' },
  { name: 'Mobile In-App Banner', description: 'In-app banner for mobile app users', channel: 'mobile', content_type: 'json', max_items: 1, status: 'active' },
  { name: 'Email Footer Recommendation', description: 'Personalized recommendation in email footer', channel: 'email', content_type: 'html', max_items: 3, status: 'active' }
];
placementsData.forEach(p => query.insert('placements', p));
console.log(`✅ Created ${placementsData.length} placements`);

// ── Decision Rules ──
console.log('📝 Seeding decision rules...');
const rulesData = [
  {
    name: 'Gold & Platinum Loyalty',
    description: 'Target Gold and Platinum tier customers',
    conditions: [{ entity: 'contact', attribute: 'loyalty_tier', operator: 'in', value: ['gold', 'platinum'] }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'High Engagement Score',
    description: 'Contacts with engagement score above 70',
    conditions: [{ entity: 'contact', attribute: 'engagement_score', operator: 'greater_than', value: 70 }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'Recent Purchasers',
    description: 'Contacts who purchased in the last 30 days',
    conditions: [{ entity: 'contact', attribute: 'total_purchases', operator: 'greater_than', value: 0 }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'Email Opted-In',
    description: 'Contacts who opted in for email',
    conditions: [{ entity: 'contact', attribute: 'email_opt_in', operator: 'is_true', value: true }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'High-Value Customers',
    description: 'Lifetime value over $1000',
    conditions: [{ entity: 'contact', attribute: 'lifetime_value', operator: 'greater_than', value: 1000 }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'New Customers',
    description: 'Contacts with fewer than 2 purchases',
    conditions: [{ entity: 'contact', attribute: 'total_purchases', operator: 'less_than', value: 2 }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'Fashion Interest',
    description: 'Contacts interested in fashion',
    conditions: [{ entity: 'contact', attribute: 'favorite_categories', operator: 'contains', value: 'Fashion' }],
    logic: 'AND', status: 'active'
  },
  {
    name: 'Electronics Interest',
    description: 'Contacts interested in electronics',
    conditions: [{ entity: 'contact', attribute: 'favorite_categories', operator: 'contains', value: 'Electronics' }],
    logic: 'AND', status: 'active'
  }
];
rulesData.forEach(r => query.insert('decision_rules', r));
console.log(`✅ Created ${rulesData.length} decision rules`);

// ── Ranking Formulas ──
console.log('📝 Seeding ranking formulas...');
const formulasData = [
  { name: 'Priority + Engagement', description: 'Weight: 70% offer priority, 30% contact engagement', expression: 'offer.priority * 0.7 + profile.engagement_score * 0.3', status: 'active' },
  { name: 'Priority + LTV', description: 'Boost priority by lifetime value', expression: 'offer.priority + profile.lifetime_value * 0.01', status: 'active' },
  { name: 'Pure Priority', description: 'Simple priority-based ranking', expression: 'offer.priority', status: 'active' }
];
formulasData.forEach(f => query.insert('ranking_formulas', f));
console.log(`✅ Created ${formulasData.length} ranking formulas`);

// ── Personalized Offers ──
console.log('📝 Seeding offers...');
const offersData = [
  { name: '20% Off Summer Collection', description: 'Exclusive 20% discount on all summer fashion items', type: 'personalized', priority: 80, start_date: '2026-01-01', end_date: '2026-08-31', tags: [1, 4], eligibility_rule_id: null, image_url: '', attributes: { discount_pct: 20, category: 'fashion' } },
  { name: 'Free Shipping on Electronics', description: 'Free shipping on all electronics orders over $50', type: 'personalized', priority: 70, start_date: '2026-01-01', end_date: '2026-12-31', tags: [3], eligibility_rule_id: 4, image_url: '', attributes: { discount_type: 'free_shipping', min_order: 50 } },
  { name: 'VIP Double Points Weekend', description: 'Earn double loyalty points this weekend', type: 'personalized', priority: 90, start_date: '2026-02-01', end_date: '2026-03-31', tags: [2, 10], eligibility_rule_id: 1, image_url: '', attributes: { points_multiplier: 2 } },
  { name: 'Welcome 15% Off First Order', description: 'New customer welcome discount', type: 'personalized', priority: 85, start_date: '2026-01-01', end_date: '2026-12-31', tags: [7], eligibility_rule_id: 6, image_url: '', attributes: { discount_pct: 15 } },
  { name: 'Buy 2 Get 1 Free Beauty', description: 'Buy 2 beauty items, get the 3rd free', type: 'personalized', priority: 75, start_date: '2026-01-15', end_date: '2026-06-30', tags: [5], eligibility_rule_id: null, image_url: '', attributes: { deal_type: 'b2g1', category: 'beauty' } },
  { name: 'Flash Deal: Smart Watch 40% Off', description: '24-hour flash sale on smart watches', type: 'personalized', priority: 95, start_date: '2026-02-01', end_date: '2026-04-30', tags: [3, 9], eligibility_rule_id: 2, image_url: '', attributes: { discount_pct: 40, product: 'Smart Watch' } },
  { name: 'Spring Fitness Bundle', description: 'Get fit this spring - bundle deal on sports gear', type: 'personalized', priority: 65, start_date: '2026-03-01', end_date: '2026-05-31', tags: [6], eligibility_rule_id: null, image_url: '', attributes: { bundle_discount: 25 } },
  { name: '$50 Off $200+ Orders', description: 'Spend $200 and save $50', type: 'personalized', priority: 72, start_date: '2026-01-01', end_date: '2026-12-31', tags: [2], eligibility_rule_id: 5, image_url: '', attributes: { discount_amount: 50, min_order: 200 } },
  { name: 'Win-Back: 30% Off Return Purchase', description: 'We miss you! 30% off your next order', type: 'personalized', priority: 88, start_date: '2026-01-01', end_date: '2026-12-31', tags: [8], eligibility_rule_id: null, image_url: '', attributes: { discount_pct: 30 } },
  { name: 'Exclusive Home Decor Preview', description: 'Early access to new home & garden collection', type: 'personalized', priority: 60, start_date: '2026-02-15', end_date: '2026-07-31', tags: [11], eligibility_rule_id: 3, image_url: '', attributes: { access_type: 'early_access' } },
  { name: 'Holiday Gift Card Bonus', description: 'Buy a $100 gift card, get $20 bonus', type: 'personalized', priority: 78, start_date: '2026-01-01', end_date: '2026-12-25', tags: [12], eligibility_rule_id: null, image_url: '', attributes: { bonus_amount: 20 } },
  { name: 'Premium Member: Free Express Shipping', description: 'Free express shipping for premium members', type: 'personalized', priority: 92, start_date: '2026-01-01', end_date: '2026-12-31', tags: [10, 2], eligibility_rule_id: 1, image_url: '', attributes: { shipping_type: 'express' } },
];

// Fallback offers
const fallbackOffersData = [
  { name: '10% Off Your Next Order', description: 'Default offer: 10% discount for everyone', type: 'fallback', priority: 10, start_date: '2026-01-01', end_date: '2026-12-31', tags: [], image_url: '', attributes: { discount_pct: 10 } },
  { name: 'Free Shipping Over $75', description: 'Default: Free shipping on orders over $75', type: 'fallback', priority: 5, start_date: '2026-01-01', end_date: '2026-12-31', tags: [], image_url: '', attributes: { min_order: 75 } },
  { name: 'Join Our Loyalty Program', description: 'Default CTA: Sign up for rewards', type: 'fallback', priority: 3, start_date: '2026-01-01', end_date: '2026-12-31', tags: [], image_url: '', attributes: { cta_type: 'loyalty_signup' } }
];

offersData.forEach(o => {
  const tags = o.tags || [];
  delete o.tags;
  const result = query.insert('offers', { ...o, status: randomChoice(['live', 'live', 'live', 'approved', 'draft']) });
  tags.forEach(tagId => query.insert('offer_tags', { offer_id: result.lastID, qualifier_id: tagId }));
});
fallbackOffersData.forEach(o => {
  const tags = o.tags || [];
  delete o.tags;
  const result = query.insert('offers', { ...o, status: 'live' });
});
console.log(`✅ Created ${offersData.length} personalized offers + ${fallbackOffersData.length} fallback offers`);

// ── Offer Representations ──
console.log('📝 Seeding offer representations...');
const allOffers = query.all('offers');
const allPlacements = query.all('placements');

allOffers.forEach(offer => {
  // Each offer gets 1-3 representations across placements
  const repCount = randomNumber(1, 3);
  const usedPlacements = new Set();

  for (let i = 0; i < repCount; i++) {
    let placement;
    do {
      placement = randomChoice(allPlacements);
    } while (usedPlacements.has(placement.id) && usedPlacements.size < allPlacements.length);

    if (usedPlacements.has(placement.id)) break;
    usedPlacements.add(placement.id);

    const contentMap = {
      html: `<div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:24px;border-radius:12px;text-align:center"><h2 style="margin:0 0 8px">${offer.name}</h2><p style="margin:0 0 16px;opacity:.9">${offer.description}</p><a href="#" style="background:#fff;color:#764ba2;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">Shop Now</a></div>`,
      text: `${offer.name}: ${offer.description}. Use code SAVE${offer.attributes?.discount_pct || 10} at checkout.`,
      json: JSON.stringify({ title: offer.name, description: offer.description, cta: 'Shop Now', cta_url: '#', attributes: offer.attributes }),
      image: ''
    };

    query.insert('offer_representations', {
      offer_id: offer.id,
      placement_id: placement.id,
      content_type: placement.content_type,
      content: contentMap[placement.content_type] || contentMap.text,
      image_url: '',
      link_url: '#',
      alt_text: offer.name
    });
  }
});
console.log(`✅ Created offer representations`);

// ── Offer Constraints ──
console.log('📝 Seeding offer constraints...');
allOffers.filter(o => o.type === 'personalized').forEach(offer => {
  if (Math.random() > 0.4) { // 60% of offers have constraints
    query.insert('offer_constraints', {
      offer_id: offer.id,
      per_user_cap: randomChoice([1, 2, 3, 5]),
      frequency_period: randomChoice(['daily', 'weekly', 'monthly', 'lifetime']),
      total_cap: randomChoice([0, 500, 1000, 5000, 0]),
      per_placement_caps: {}
    });
  }
});
console.log(`✅ Created offer constraints`);

// ── Collections ──
console.log('📝 Seeding collections...');
const liveOfferIds = query.all('offers', o => o.status === 'live' && o.type === 'personalized').map(o => o.id);

const collectionsData = [
  { name: 'Summer Promotions', description: 'All summer seasonal offers', type: 'dynamic', qualifier_ids: [1], offer_ids: [] },
  { name: 'Loyalty Rewards', description: 'Loyalty program exclusive offers', type: 'dynamic', qualifier_ids: [2, 10], offer_ids: [] },
  { name: 'Electronics Deals', description: 'Electronics category offers', type: 'dynamic', qualifier_ids: [3], offer_ids: [] },
  { name: 'Fashion Collection', description: 'Fashion category offers', type: 'dynamic', qualifier_ids: [4], offer_ids: [] },
  { name: 'Flash Sales', description: 'Time-limited flash deals', type: 'dynamic', qualifier_ids: [9], offer_ids: [] },
  { name: 'Welcome Offers', description: 'New customer welcome package', type: 'dynamic', qualifier_ids: [7], offer_ids: [] },
  { name: 'Top Picks', description: 'Hand-picked top offers', type: 'static', qualifier_ids: [], offer_ids: liveOfferIds.slice(0, 5) },
  { name: 'Premium Exclusives', description: 'VIP and premium member offers', type: 'dynamic', qualifier_ids: [10], offer_ids: [] },
  { name: 'Win-Back Offers', description: 'Re-engagement offers for inactive customers', type: 'dynamic', qualifier_ids: [8], offer_ids: [] }
];
collectionsData.forEach(c => query.insert('collections', { ...c, status: 'active' }));
console.log(`✅ Created ${collectionsData.length} collections`);

// ── Selection Strategies ──
console.log('📝 Seeding selection strategies...');
const strategiesData = [
  { name: 'Best by Priority', description: 'Select top offer by priority', collection_id: 7, eligibility_rule_id: null, ranking_method: 'priority', ranking_formula_id: null },
  { name: 'Loyalty + Engagement', description: 'Loyalty offers ranked by engagement', collection_id: 2, eligibility_rule_id: 1, ranking_method: 'formula', ranking_formula_id: 1 },
  { name: 'Electronics for Engaged', description: 'Electronics deals for high-engagement contacts', collection_id: 3, eligibility_rule_id: 2, ranking_method: 'priority', ranking_formula_id: null },
  { name: 'Welcome for New', description: 'Welcome offers for new customers', collection_id: 6, eligibility_rule_id: 6, ranking_method: 'priority', ranking_formula_id: null },
  { name: 'Premium VIP Strategy', description: 'Premium offers for high-value customers', collection_id: 8, eligibility_rule_id: 5, ranking_method: 'formula', ranking_formula_id: 2 },
  { name: 'AI Optimized Selection', description: 'Auto-optimized based on conversion data', collection_id: 7, eligibility_rule_id: null, ranking_method: 'ai', ranking_formula_id: null },
  { name: 'Flash Sale Priority', description: 'Flash sales ranked by pure priority', collection_id: 5, eligibility_rule_id: 4, ranking_method: 'priority', ranking_formula_id: null },
  { name: 'Fashion Personalized', description: 'Fashion offers ranked by LTV', collection_id: 4, eligibility_rule_id: 7, ranking_method: 'formula', ranking_formula_id: 2 }
];
strategiesData.forEach(s => query.insert('selection_strategies', { ...s, status: 'active' }));
console.log(`✅ Created ${strategiesData.length} selection strategies`);

// ── Decisions ──
console.log('📝 Seeding decisions...');
const allFallbacks = query.all('offers', o => o.type === 'fallback');
const fallback1 = allFallbacks[0] ? allFallbacks[0].id : null;
const fallback2 = allFallbacks[1] ? allFallbacks[1].id : null;

const decisionsData = [
  {
    name: 'Email Campaign Offer',
    description: 'Primary decisioning for email campaigns - hero banner and sidebar',
    status: 'live',
    placement_configs: [
      { placement_id: 1, selection_strategy_id: 1, fallback_offer_id: fallback1 },
      { placement_id: 2, selection_strategy_id: 2, fallback_offer_id: fallback2 }
    ]
  },
  {
    name: 'Web Personalization',
    description: 'Homepage and product page offer personalization',
    status: 'live',
    placement_configs: [
      { placement_id: 3, selection_strategy_id: 5, fallback_offer_id: fallback1 },
      { placement_id: 4, selection_strategy_id: 6, fallback_offer_id: fallback2 }
    ]
  },
  {
    name: 'Mobile Push Offers',
    description: 'Personalized push notification offers',
    status: 'live',
    placement_configs: [
      { placement_id: 5, selection_strategy_id: 7, fallback_offer_id: fallback1 }
    ]
  },
  {
    name: 'Welcome Journey Offers',
    description: 'Offers for new customer welcome journey',
    status: 'live',
    placement_configs: [
      { placement_id: 1, selection_strategy_id: 4, fallback_offer_id: fallback1 },
      { placement_id: 5, selection_strategy_id: 4, fallback_offer_id: fallback1 }
    ]
  },
  {
    name: 'VIP Exclusive Experience',
    description: 'Premium offers across all channels for VIP members',
    status: 'live',
    placement_configs: [
      { placement_id: 1, selection_strategy_id: 5, fallback_offer_id: fallback1 },
      { placement_id: 3, selection_strategy_id: 5, fallback_offer_id: fallback2 },
      { placement_id: 7, selection_strategy_id: 5, fallback_offer_id: fallback1 }
    ]
  },
  {
    name: 'Flash Sale Blitz',
    description: 'Flash sale offers across email and push',
    status: 'draft',
    placement_configs: [
      { placement_id: 1, selection_strategy_id: 7, fallback_offer_id: fallback1 },
      { placement_id: 5, selection_strategy_id: 7, fallback_offer_id: fallback1 },
      { placement_id: 6, selection_strategy_id: 7, fallback_offer_id: fallback2 }
    ]
  }
];
decisionsData.forEach(d => query.insert('decisions', d));
console.log(`✅ Created ${decisionsData.length} decisions`);

// ── Generate Offer Propositions (historical data) ──
console.log('📝 Generating offer proposition history...');
const liveDecisions = query.all('decisions', d => d.status === 'live');
const allContacts = query.all('contacts');
const livePersonalizedOffers = query.all('offers', o => o.status === 'live' && o.type === 'personalized');

let propCount = 0;
for (let i = 0; i < 500; i++) {
  const contact = randomChoice(allContacts);
  const decision = randomChoice(liveDecisions);
  const offer = randomChoice([...livePersonalizedOffers, ...allFallbacks]);
  const placementConfig = randomChoice(decision.placement_configs || [{ placement_id: 1 }]);
  const placement = query.get('placements', placementConfig.placement_id);

  const propResult = query.insert('offer_propositions', {
    offer_id: offer.id,
    contact_id: contact.id,
    decision_id: decision.id,
    placement_id: placementConfig.placement_id,
    channel: placement ? placement.channel : 'email',
    status: randomChoice(['proposed', 'viewed', 'clicked', 'converted', 'dismissed']),
    is_fallback: offer.type === 'fallback',
    context_data: {},
    timestamp: randomDate(new Date(2026, 0, 1), new Date()).toISOString()
  });
  propCount++;

  // Generate events for some propositions
  if (Math.random() > 0.3) {
    query.insert('offer_events', {
      proposition_id: propResult.lastID,
      event_type: 'impression',
      timestamp: randomDate(new Date(2026, 0, 1), new Date()).toISOString(),
      metadata: {}
    });
    if (Math.random() > 0.5) {
      query.insert('offer_events', {
        proposition_id: propResult.lastID,
        event_type: 'click',
        timestamp: randomDate(new Date(2026, 0, 1), new Date()).toISOString(),
        metadata: {}
      });
      if (Math.random() > 0.6) {
        query.insert('offer_events', {
          proposition_id: propResult.lastID,
          event_type: 'conversion',
          timestamp: randomDate(new Date(2026, 0, 1), new Date()).toISOString(),
          metadata: {}
        });
      }
    }
  }
}
console.log(`✅ Created ${propCount} offer propositions with events`);

// Save database
saveDatabase();

console.log('\n✨ Database seeding completed successfully!\n');
console.log('📊 Summary:');
console.log(`   - ${query.count('contacts')} contacts (B2C consumers)`);
console.log(`   - ${query.count('products')} products`);
console.log(`   - ${query.count('orders')} orders`);
console.log(`   - ${query.count('contact_events')} contact events`);
console.log(`   - ${query.count('workflows')} workflows (unified: broadcast + automated + recurring)`);
console.log(`   - ${query.count('segments')} segments`);
console.log(`   - ${query.count('offers')} offers (${query.count('offers', o => o.type === 'personalized')} personalized + ${query.count('offers', o => o.type === 'fallback')} fallback)`);
console.log(`   - ${query.count('placements')} placements`);
console.log(`   - ${query.count('collections')} collections`);
console.log(`   - ${query.count('collection_qualifiers')} collection qualifiers`);
console.log(`   - ${query.count('decision_rules')} decision rules`);
console.log(`   - ${query.count('selection_strategies')} selection strategies`);
console.log(`   - ${query.count('decisions')} decisions`);
console.log(`   - ${query.count('offer_propositions')} offer propositions`);
console.log('\n🚀 Ready to start the server with: npm start\n');
