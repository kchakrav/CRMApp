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

// Seed campaign_orchestrations from workflow orchestration data
console.log('📝 Seeding campaign orchestrations...');
const typeToCategoryMap = {
  entry: 'flow', exit: 'flow', stop: 'flow',
  query: 'targeting', build_audience: 'targeting', segment: 'targeting',
  filter: 'targeting', exclude: 'targeting', combine: 'targeting',
  deduplication: 'targeting', enrichment: 'targeting', incremental_query: 'targeting',
  reconciliation: 'targeting', save_audience: 'targeting', split: 'targeting',
  change_dimension: 'targeting', change_data_source: 'targeting',
  scheduler: 'flow_control', wait: 'flow_control', condition: 'flow_control',
  random: 'flow_control', fork: 'flow_control', jump: 'flow_control',
  external_signal: 'flow_control', alert: 'flow_control',
  offer_decision: 'intelligence',
  email: 'channels', sms: 'channels', push: 'channels',
  direct_mail: 'channels', in_app: 'channels'
};
const wfListForOrch = query.all('workflows');
wfListForOrch.forEach(wf => {
  const orch = wf.orchestration;
  if (!orch || !orch.nodes || orch.nodes.length === 0) return;
  const enrichedNodes = orch.nodes.map(n => ({
    ...n,
    category: n.category || typeToCategoryMap[n.type] || 'flow',
    icon: n.icon || ''
  }));
  query.insert('campaign_orchestrations', {
    campaign_id: wf.id,
    nodes: enrichedNodes,
    connections: orch.connections || [],
    canvas_state: { zoom: 1, pan: { x: 0, y: 0 } }
  });
});
console.log(`✅ Created ${wfListForOrch.length} campaign orchestrations`);

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

// ── Item Catalog Schema (custom attributes) ──
console.log('📝 Seeding catalog schema...');
const catalogSchemaData = [
  { name: 'product_category', label: 'Product Category', type: 'string', required: false, default_value: null, description: 'Category of the product being offered', sort_order: 0 },
  { name: 'discount_value', label: 'Discount Value', type: 'integer', required: false, default_value: '0', description: 'Discount amount or percentage', sort_order: 1 },
  { name: 'is_seasonal', label: 'Seasonal Offer', type: 'boolean', required: false, default_value: 'false', description: 'Whether this offer is tied to a season', sort_order: 2 },
  { name: 'target_region', label: 'Target Region', type: 'string', required: false, default_value: null, description: 'Geographic region targeting', sort_order: 3 },
  { name: 'campaign_theme', label: 'Campaign Theme', type: 'string', required: false, default_value: null, description: 'Associated marketing campaign theme', sort_order: 4 }
];
catalogSchemaData.forEach(a => query.insert('catalog_schema', a));
console.log(`✅ Created ${catalogSchemaData.length} catalog schema attributes`);

// ── Context Data Schema ──
console.log('📝 Seeding context schema...');
const contextSchemaData = [
  { name: 'page_type', label: 'Page Type', type: 'string', description: 'Current page the visitor is viewing', example_value: 'homepage', sort_order: 0 },
  { name: 'device_type', label: 'Device Type', type: 'string', description: 'Device used by the visitor', example_value: 'mobile', sort_order: 1 },
  { name: 'cart_value', label: 'Cart Value', type: 'number', description: 'Current shopping cart total', example_value: '89.99', sort_order: 2 },
  { name: 'time_of_day', label: 'Time of Day', type: 'string', description: 'Time bucket (morning, afternoon, evening)', example_value: 'afternoon', sort_order: 3 },
  { name: 'referral_source', label: 'Referral Source', type: 'string', description: 'Where the visitor came from', example_value: 'google', sort_order: 4 }
];
contextSchemaData.forEach(a => query.insert('context_schema', a));
console.log(`✅ Created ${contextSchemaData.length} context schema attributes`);

// ── AI Ranking Models ──
console.log('📝 Seeding AI models...');
const aiModelsData = [
  { name: 'Click Optimizer', description: 'Maximizes click-through rates using Thompson sampling', type: 'auto_optimization', optimization_goal: 'clicks', status: 'active', training_status: 'trained', last_trained_at: new Date().toISOString(), metrics: { lift: 12.5, confidence: 92.3, offers_evaluated: 12, propositions_analyzed: 0, min_impressions: 100, training_duration_seconds: 45 }, features: ['placement_id', 'offer_priority', 'offer_age', 'user_segment'] },
  { name: 'Conversion Maximizer', description: 'Supervised ML model for conversion optimization', type: 'personalized', optimization_goal: 'conversions', status: 'active', training_status: 'trained', last_trained_at: new Date().toISOString(), metrics: { lift: 18.7, confidence: 88.1, offers_evaluated: 12, propositions_analyzed: 0, min_impressions: 250, training_duration_seconds: 92 }, features: ['placement_id', 'offer_priority', 'user_engagement', 'user_ltv', 'device_type'] }
];
aiModelsData.forEach(m => query.insert('ranking_ai_models', m));
console.log(`✅ Created ${aiModelsData.length} AI ranking models`);

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

// ══════════════════════════════════════════════════════
// DELIVERIES  (Sample email / SMS / push deliveries)
// ══════════════════════════════════════════════════════

console.log('\n📝 Seeding deliveries...');

// ── DEMO delivery with full HTML content and impressive metrics ──
const demoDeliveryHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5}
.wrapper{max-width:640px;margin:0 auto;background:#fff}
.header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center}
.header img{width:140px;margin-bottom:16px}.header h1{color:#fff;font-size:28px;margin:0 0 4px}.header p{color:rgba(255,255,255,0.8);font-size:14px;margin:0}
.hero{position:relative;overflow:hidden}.hero img{width:100%;display:block}
.hero-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:40px 32px 24px;color:#fff}
.hero-overlay h2{font-size:32px;margin:0 0 8px;font-weight:800}.hero-overlay p{font-size:16px;margin:0 0 16px;opacity:0.9}
.cta-btn{display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:700;font-size:16px}
.cta-btn:hover{background:#d63851}
.section{padding:32px 40px}.section h3{font-size:20px;color:#1a1a2e;margin:0 0 16px;font-weight:700}
.products{display:flex;gap:16px}.product-card{flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;text-align:center}
.product-card img{width:100%;height:180px;object-fit:cover}.product-card .info{padding:12px}
.product-card h4{margin:0 0 4px;font-size:14px;color:#1a1a2e}.product-card .price{color:#e94560;font-weight:700;font-size:18px}
.product-card .old-price{color:#94a3b8;text-decoration:line-through;font-size:13px;margin-left:6px}
.product-card .shop-btn{display:inline-block;margin:8px 0;padding:8px 20px;background:#1a1a2e;color:#fff;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600}
.benefits{display:flex;gap:16px;margin-top:16px}.benefit{flex:1;text-align:center;padding:16px;background:#f8fafc;border-radius:8px}
.benefit .icon{font-size:24px;margin-bottom:6px}.benefit h4{margin:0 0 4px;font-size:13px;color:#1a1a2e}.benefit p{margin:0;font-size:11px;color:#64748b}
.countdown{text-align:center;padding:24px 40px;background:linear-gradient(135deg,#e94560,#ff6b6b)}.countdown h3{color:#fff;margin:0 0 12px;font-size:18px}
.timer{display:flex;justify-content:center;gap:12px}.timer-block{background:rgba(255,255,255,0.2);border-radius:6px;padding:10px 16px;color:#fff;text-align:center}
.timer-block .num{font-size:28px;font-weight:800;line-height:1}.timer-block .label{font-size:10px;text-transform:uppercase;opacity:0.8}
.secondary-cta{text-align:center;padding:32px 40px;background:#f8fafc}
.secondary-cta .btn{display:inline-block;padding:12px 32px;border:2px solid #1a1a2e;color:#1a1a2e;text-decoration:none;border-radius:6px;font-weight:600}
.social{text-align:center;padding:24px}.social a{display:inline-block;margin:0 6px;width:36px;height:36px;background:#e5e7eb;border-radius:50%;line-height:36px;text-decoration:none;color:#475569}
.footer{background:#1a1a2e;color:rgba(255,255,255,0.6);padding:24px 40px;text-align:center;font-size:11px}
.footer a{color:#e94560;text-decoration:none}.footer p{margin:4px 0}
</style></head><body>
<div class="wrapper">
<div class="header"><h1>LUXE BRANDS</h1><p>Exclusive Member Offer</p></div>
<div class="hero"><div style="background:linear-gradient(135deg,#667eea,#764ba2);height:320px;display:flex;align-items:center;justify-content:center">
<div style="text-align:center;color:#fff"><p style="font-size:14px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px;opacity:0.8">Limited Time Only</p>
<h2 style="font-size:42px;margin:0 0 8px;font-weight:900">SPRING COLLECTION</h2>
<p style="font-size:22px;margin:0 0 20px">Up to <strong>50% OFF</strong> Everything</p>
<a href="#" class="cta-btn">SHOP THE SALE</a></div></div></div>
<div class="section"><h3>Trending This Season</h3>
<div class="products">
<div class="product-card"><div style="background:linear-gradient(135deg,#f093fb,#f5576c);height:180px"></div><div class="info"><h4>Designer Handbag</h4><p><span class="price">$149</span><span class="old-price">$299</span></p><a href="#" class="shop-btn">Shop Now</a></div></div>
<div class="product-card"><div style="background:linear-gradient(135deg,#4facfe,#00f2fe);height:180px"></div><div class="info"><h4>Premium Watch</h4><p><span class="price">$199</span><span class="old-price">$399</span></p><a href="#" class="shop-btn">Shop Now</a></div></div>
<div class="product-card"><div style="background:linear-gradient(135deg,#43e97b,#38f9d7);height:180px"></div><div class="info"><h4>Silk Scarf</h4><p><span class="price">$59</span><span class="old-price">$120</span></p><a href="#" class="shop-btn">Shop Now</a></div></div>
</div>
<div class="benefits"><div class="benefit"><div class="icon">🚚</div><h4>Free Shipping</h4><p>On orders over $75</p></div>
<div class="benefit"><div class="icon">↩️</div><h4>Easy Returns</h4><p>30-day guarantee</p></div>
<div class="benefit"><div class="icon">🔒</div><h4>Secure Payment</h4><p>256-bit encryption</p></div>
<div class="benefit"><div class="icon">💎</div><h4>VIP Rewards</h4><p>Earn 2x points today</p></div></div></div>
<div class="countdown"><h3>Sale Ends In</h3>
<div class="timer"><div class="timer-block"><div class="num">02</div><div class="label">Days</div></div>
<div class="timer-block"><div class="num">14</div><div class="label">Hours</div></div>
<div class="timer-block"><div class="num">37</div><div class="label">Minutes</div></div></div></div>
<div class="secondary-cta"><p style="font-size:16px;color:#475569;margin:0 0 12px">Can't decide? Browse our full catalog</p>
<a href="#" class="btn">View All Products</a></div>
<div class="social"><p style="font-size:12px;color:#94a3b8;margin:0 0 8px">Follow us</p>
<a href="#">FB</a><a href="#">TW</a><a href="#">IG</a><a href="#">PIN</a></div>
<div class="footer"><p>&copy; 2026 Luxe Brands Inc. All rights reserved.</p>
<p>123 Fashion Ave, New York, NY 10001</p>
<p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a> · <a href="#">View in browser</a></p></div>
</div></body></html>`;

const demoInsert = query.insert('deliveries', {
  name: 'Spring Collection Launch Demo',
  channel: 'Email',
  channel_key: 'email',
  status: 'completed',
  subject: '🌸 Spring Collection — Up to 50% OFF Everything!',
  preheader: 'Exclusive member offer: Free shipping + 2x VIP points. Sale ends in 2 days!',
  content: demoDeliveryHtml,
  html_output: demoDeliveryHtml,
  content_blocks: [
    { type: 'header', data: { logo: 'LUXE BRANDS', tagline: 'Exclusive Member Offer' } },
    { type: 'hero', data: { headline: 'SPRING COLLECTION', subtext: 'Up to 50% OFF Everything', cta: 'SHOP THE SALE' } },
    { type: 'products', data: { items: ['Designer Handbag', 'Premium Watch', 'Silk Scarf'] } },
    { type: 'countdown', data: { label: 'Sale Ends In' } },
    { type: 'cta', data: { text: 'View All Products' } },
    { type: 'footer', data: { unsubscribe: true, social: true } }
  ],
  scheduled_at: null,
  audience_id: null,
  segment_id: 1,
  approval_required: true,
  document_title: 'Spring Collection Launch',
  document_language: 'en',
  wizard_step: 5,
  last_saved_step: 5,
  draft_state: {},
  proof_emails: ['marketing@luxebrands.com', 'qa@luxebrands.com'],
  ab_test_enabled: true,
  ab_split_pct: 30,
  ab_winner_rule: 'click_rate',
  ab_weighted_metrics: ['open_rate', 'click_rate', 'revenue'],
  ab_guardrails: [],
  sto_enabled: true,
  sto_model: 'engagement_history',
  sto_window_hours: 24,
  wave_enabled: true,
  wave_count: 4,
  wave_interval_minutes: 45,
  wave_start_pct: 10,
  wave_ramp_type: 'exponential',
  wave_custom_pcts: null,
  wave_timing_mode: 'interval',
  wave_custom_times: null,
  approved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  sent_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
  sent: 48500,
  delivered: 47200,
  opens: 21800,
  clicks: 6540,
  folder_id: null,
  created_by: 'Marketing Team',
  updated_by: 'Marketing Team',
  created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  updated_at: '2099-01-01T00:00:00.000Z'
});
if (demoInsert && demoInsert.record) {
  demoInsert.record.updated_at = '2099-01-01T00:00:00.000Z';
}
console.log(`✅ Created demo delivery (id: ${demoInsert.lastID}): "Spring Collection Launch Demo"`);

const deliverySamples = [
  { name: 'Summer Sale Announcement', channel: 'Email', status: 'completed', subject: 'Summer Sale - Up to 50% Off!', preheader: 'Don\'t miss our biggest sale of the year', sent: 12450, delivered: 12100, opens: 4800, clicks: 1200 },
  { name: 'Welcome Series - Day 1', channel: 'Email', status: 'active', subject: 'Welcome to our family!', preheader: 'Here\'s what you need to know', sent: 3200, delivered: 3150, opens: 2100, clicks: 890 },
  { name: 'Welcome Series - Day 3', channel: 'Email', status: 'active', subject: 'Explore our top picks for you', preheader: 'Curated just for you', sent: 2800, delivered: 2750, opens: 1400, clicks: 620 },
  { name: 'Flash Sale SMS Blast', channel: 'SMS', status: 'completed', subject: '', preheader: '', sent: 8500, delivered: 8200, opens: 0, clicks: 2100 },
  { name: 'Cart Abandonment Reminder', channel: 'Email', status: 'active', subject: 'You left something behind...', preheader: 'Complete your purchase and get 10% off', sent: 5600, delivered: 5400, opens: 3200, clicks: 1800 },
  { name: 'Product Launch Push', channel: 'Push', status: 'completed', subject: 'New arrivals are here!', preheader: '', sent: 15000, delivered: 14200, opens: 9800, clicks: 4500 },
  { name: 'Monthly Newsletter - January', channel: 'Email', status: 'completed', subject: 'Your January Newsletter', preheader: 'New year, new deals', sent: 20000, delivered: 19500, opens: 7800, clicks: 2400 },
  { name: 'Monthly Newsletter - February', channel: 'Email', status: 'draft', subject: 'Your February Newsletter', preheader: 'Love is in the air', sent: 0, delivered: 0, opens: 0, clicks: 0 },
  { name: 'VIP Exclusive Offer', channel: 'Email', status: 'completed', subject: 'Exclusive: Early access for VIPs', preheader: 'You\'re invited to shop first', sent: 1200, delivered: 1180, opens: 950, clicks: 620 },
  { name: 'Re-engagement Campaign', channel: 'Email', status: 'scheduled', subject: 'We miss you!', preheader: 'Come back and save 20%', scheduled_at: '2026-03-01T10:00:00Z', sent: 0, delivered: 0, opens: 0, clicks: 0 },
  { name: 'Order Confirmation SMS', channel: 'SMS', status: 'active', subject: '', preheader: '', sent: 9200, delivered: 9100, opens: 0, clicks: 0 },
  { name: 'Black Friday Preview', channel: 'Email', status: 'draft', subject: 'Black Friday is coming...', preheader: 'Get ready for massive savings', sent: 0, delivered: 0, opens: 0, clicks: 0 },
  { name: 'Loyalty Points Reminder', channel: 'Push', status: 'active', subject: 'Your points are expiring soon!', preheader: '', sent: 4500, delivered: 4300, opens: 3100, clicks: 1500 },
  { name: 'Birthday Special', channel: 'Email', status: 'active', subject: 'Happy Birthday! Here\'s a gift for you', preheader: 'Enjoy your special day with a special offer', sent: 800, delivered: 790, opens: 650, clicks: 420 },
  { name: 'Survey Invitation', channel: 'Email', status: 'completed', subject: 'We value your feedback', preheader: 'Take 2 minutes to help us improve', sent: 6000, delivered: 5800, opens: 2400, clicks: 960 },
];

const channelNormalize = (ch) => {
  const map = { 'Email': { label: 'Email', key: 'email' }, 'SMS': { label: 'SMS', key: 'sms' }, 'Push': { label: 'Push', key: 'push' } };
  return map[ch] || { label: ch, key: ch.toLowerCase() };
};

for (const d of deliverySamples) {
  const norm = channelNormalize(d.channel);
  query.insert('deliveries', {
    name: d.name,
    channel: norm.label,
    channel_key: norm.key,
    status: d.status,
    subject: d.subject || '',
    preheader: d.preheader || '',
    content: '',
    html_output: '',
    content_blocks: [],
    scheduled_at: d.scheduled_at || null,
    audience_id: null,
    segment_id: null,
    approval_required: false,
    document_title: '',
    document_language: '',
    wizard_step: 5,
    last_saved_step: 5,
    draft_state: {},
    proof_emails: [],
    ab_test_enabled: false,
    ab_split_pct: 50,
    ab_winner_rule: 'open_rate',
    approved_at: d.status === 'completed' ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : null,
    sent_at: d.sent > 0 ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : null,
    sent: d.sent,
    delivered: d.delivered,
    opens: d.opens,
    clicks: d.clicks,
    folder_id: null,
    created_by: 'System',
    updated_by: 'System'
  });
}
console.log(`✅ Created ${deliverySamples.length} deliveries`);

// ── Delivery logs: opens and clicks per delivery (persisted for STO and reports) ──
const contactIds = query.all('contacts').map(c => c.id);
const allDeliveries = query.all('deliveries');
// Weighted slots for STO: peak hours 9–11, 14–16, 19–21; best days Tue–Thu
const hourWeights = Array.from({ length: 24 }, (_, h) => {
  if (h >= 9 && h <= 11) return 2.2;
  if (h >= 14 && h <= 16) return 1.9;
  if (h >= 19 && h <= 21) return 1.7;
  if (h < 6 || h > 22) return 0.25;
  return 1;
});
const dayWeights = [0.6, 1.3, 1.3, 1.2, 1, 0.7, 0.5]; // Sun–Sat
function weightedRandomTime(baseTime, daysWindow = 7) {
  const totalDw = dayWeights.reduce((a, b) => a + b, 0);
  const totalHw = hourWeights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalDw;
  let dow = 0;
  for (; dow < 7; dow++) {
    r -= dayWeights[dow];
    if (r <= 0) break;
  }
  r = Math.random() * totalHw;
  let h = 0;
  for (; h < 24; h++) {
    r -= hourWeights[h];
    if (r <= 0) break;
  }
  const ms = baseTime.getTime() + dow * 86400000 + h * 3600000 + Math.floor(Math.random() * 3600000);
  return new Date(Math.min(ms, baseTime.getTime() + daysWindow * 86400000));
}
let logsCreated = 0;
for (const d of allDeliveries) {
  const opens = d.opens || 0;
  const clicks = d.clicks || 0;
  const baseTime = d.sent_at ? new Date(d.sent_at) : new Date(Date.now() - 14 * 86400000);
  for (let i = 0; i < opens; i++) {
    const t = weightedRandomTime(baseTime);
    const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
    query.insert('delivery_logs', {
      delivery_id: d.id,
      contact_id: contactId,
      event_type: 'open',
      occurred_at: t.toISOString(),
      created_at: new Date().toISOString()
    });
    logsCreated++;
  }
  for (let i = 0; i < clicks; i++) {
    const t = weightedRandomTime(baseTime);
    const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
    query.insert('delivery_logs', {
      delivery_id: d.id,
      contact_id: contactId,
      event_type: 'click',
      occurred_at: t.toISOString(),
      link_url: '/cta',
      created_at: new Date().toISOString()
    });
    logsCreated++;
  }
}
console.log(`✅ Created ${logsCreated} delivery log events (opens + clicks) for STO and reports`);

// ══════════════════════════════════════════════════════
// FOLDER HIERARCHY  (Adobe Campaign Explorer style)
// ══════════════════════════════════════════════════════

console.log('\n📝 Seeding folder hierarchy...');

// Helper to create a folder and return its id
function mkFolder(name, parentId, entityType, icon, description) {
  const siblings = query.all('folders', f => f.parent_id === (parentId || null));
  const r = query.insert('folders', {
    name,
    parent_id: parentId || null,
    entity_type: entityType || null,
    icon: icon || 'folder',
    description: description || '',
    sort_order: siblings.length
  });
  return r.lastID;
}

// ── Root-level organisational folders ──
const rootProfiles = mkFolder('Profiles & Targets', null, null, 'users', 'Contact management and audiences');
const rootCampaigns = mkFolder('Campaign Management', null, null, 'send', 'Workflows and deliveries');
const rootContent = mkFolder('Content Management', null, null, 'file-text', 'Templates, fragments, and assets');
const rootOffers = mkFolder('Offer Decisioning', null, null, 'gift', 'Offer management and decisioning');
const rootData = mkFolder('Data & Segments', null, null, 'database', 'Segments and data configuration');

// ── Profiles & Targets ──
const fldContacts = mkFolder('All Contacts', rootProfiles, 'contacts', 'users', 'All contact profiles');
const fldVipContacts = mkFolder('VIP Contacts', rootProfiles, 'contacts', 'star', 'High-value contacts');
const fldNewContacts = mkFolder('New Contacts', rootProfiles, 'contacts', 'user-plus', 'Recently acquired contacts');
const fldAudiences = mkFolder('Audiences', rootProfiles, 'audiences', 'users', 'Audience definitions');
const fldSubscriptions = mkFolder('Subscriptions', rootProfiles, 'subscription_services', 'mail', 'Subscription services');

// ── Campaign Management ──
const fldWorkflows = mkFolder('Workflows', rootCampaigns, 'workflows', 'git-branch', 'All campaign workflows');
const fldWfBroadcast = mkFolder('Broadcast', fldWorkflows, 'workflows', 'radio', 'Broadcast / one-shot workflows');
const fldWfAutomated = mkFolder('Automated', fldWorkflows, 'workflows', 'zap', 'Event-triggered automated workflows');
const fldWfRecurring = mkFolder('Recurring', fldWorkflows, 'workflows', 'clock', 'Recurring scheduled workflows');
const fldDeliveries = mkFolder('Deliveries', rootCampaigns, 'deliveries', 'send', 'All deliveries');
const fldDelEmail = mkFolder('Email Deliveries', fldDeliveries, 'deliveries', 'mail', 'Email deliveries');
const fldDelSms = mkFolder('SMS Deliveries', fldDeliveries, 'deliveries', 'message-square', 'SMS deliveries');
const fldDelPush = mkFolder('Push Deliveries', fldDeliveries, 'deliveries', 'bell', 'Push notifications');

// ── Content Management ──
const fldTemplates = mkFolder('Templates', rootContent, 'content_templates', 'file-text', 'Email & content templates');
const fldFragments = mkFolder('Fragments', rootContent, 'fragments', 'layers', 'Reusable content fragments');
const fldAssets = mkFolder('Asset Library', rootContent, 'assets', 'image', 'Images and files');
const fldAssetsImages = mkFolder('Images', fldAssets, 'assets', 'image', 'Image assets');
const fldAssetsDocuments = mkFolder('Documents', fldAssets, 'assets', 'file', 'Document assets');
const fldLandingPages = mkFolder('Landing Pages', rootContent, 'landing_pages', 'globe', 'Web landing pages');
const fldBrands = mkFolder('Brands', rootContent, 'brands', 'tag', 'Brand configurations');

// ── Offer Decisioning ──
const fldOffers = mkFolder('Offers', rootOffers, 'offers', 'gift', 'All offers');
const fldOffersPersonalized = mkFolder('Personalized', fldOffers, 'offers', 'user', 'Personalized offers');
const fldOffersFallback = mkFolder('Fallback', fldOffers, 'offers', 'shield', 'Fallback offers');
const fldPlacements = mkFolder('Placements', rootOffers, 'placements', 'layout', 'Offer placements');
const fldCollections = mkFolder('Collections', rootOffers, 'collections', 'layers', 'Offer collections');
const fldRules = mkFolder('Decision Rules', rootOffers, 'decision_rules', 'filter', 'Eligibility rules');
const fldStrategies = mkFolder('Strategies', rootOffers, 'selection_strategies', 'bar-chart', 'Selection strategies');
const fldDecisions = mkFolder('Decisions', rootOffers, 'decisions', 'globe', 'Decision policies');

// ── Data & Segments ──
const fldSegments = mkFolder('Segments', rootData, 'segments', 'target', 'Audience segments');
const fldSegActive = mkFolder('Active Segments', fldSegments, 'segments', 'check-circle', 'Published segments');
const fldSegDraft = mkFolder('Draft Segments', fldSegments, 'segments', 'edit', 'Segments in development');

console.log(`✅ Created ${query.count('folders')} folders`);

// ── Assign existing entities to folders ──
console.log('📝 Assigning items to folders...');

// Assign workflows by type
const allWorkflows = query.all('workflows');
allWorkflows.forEach(wf => {
  let fid = fldWorkflows;
  if (wf.workflow_type === 'broadcast') fid = fldWfBroadcast;
  else if (wf.workflow_type === 'automated') fid = fldWfAutomated;
  else if (wf.workflow_type === 'recurring') fid = fldWfRecurring;
  query.update('workflows', wf.id, { folder_id: fid });
});

// Assign segments by status
const allSegments = query.all('segments');
allSegments.forEach(seg => {
  const fid = seg.status === 'active' ? fldSegActive : fldSegDraft;
  query.update('segments', seg.id, { folder_id: fid });
});

// Assign offers by type
const allOffersForFolders = query.all('offers');
allOffersForFolders.forEach(o => {
  const fid = o.type === 'fallback' ? fldOffersFallback : fldOffersPersonalized;
  query.update('offers', o.id, { folder_id: fid });
});

// Assign placements, collections, rules, strategies, decisions
query.all('placements').forEach(p => query.update('placements', p.id, { folder_id: fldPlacements }));
query.all('collections').forEach(c => query.update('collections', c.id, { folder_id: fldCollections }));
query.all('decision_rules').forEach(r => query.update('decision_rules', r.id, { folder_id: fldRules }));
query.all('selection_strategies').forEach(s => query.update('selection_strategies', s.id, { folder_id: fldStrategies }));
query.all('decisions').forEach(d => query.update('decisions', d.id, { folder_id: fldDecisions }));

// Assign deliveries by channel
query.all('deliveries').forEach(d => {
  let fid = fldDeliveries;
  if (d.channel_key === 'email' || d.channel === 'Email') fid = fldDelEmail;
  else if (d.channel_key === 'sms' || d.channel === 'SMS') fid = fldDelSms;
  else if (d.channel_key === 'push' || d.channel === 'Push') fid = fldDelPush;
  query.update('deliveries', d.id, { folder_id: fid });
});

// Assign contacts: first 20 as VIP, next 20 as New, rest as All Contacts
const sortedContacts = query.all('contacts').sort((a, b) => b.lifetime_value - a.lifetime_value);
sortedContacts.forEach((c, idx) => {
  let fid = fldContacts;
  if (idx < 20) fid = fldVipContacts;
  else if (idx >= sortedContacts.length - 20) fid = fldNewContacts;
  query.update('contacts', c.id, { folder_id: fid });
});

console.log('✅ Assigned items to folders');

// Save database
saveDatabase();

console.log('\n✨ Database seeding completed successfully!\n');
console.log('📊 Summary:');
console.log(`   - ${query.count('contacts')} contacts (B2C consumers)`);
console.log(`   - ${query.count('products')} products`);
console.log(`   - ${query.count('orders')} orders`);
console.log(`   - ${query.count('contact_events')} contact events`);
console.log(`   - ${query.count('deliveries')} deliveries (email + SMS + push)`);
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
console.log(`   - ${query.count('catalog_schema')} catalog schema attributes`);
console.log(`   - ${query.count('context_schema')} context data attributes`);
console.log(`   - ${query.count('ranking_ai_models')} AI ranking models`);
console.log(`   - ${query.count('folders')} folders (Adobe Campaign-style hierarchy)`);
console.log('\n🚀 Ready to start the server with: npm start\n');
