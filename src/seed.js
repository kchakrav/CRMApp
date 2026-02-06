const { query, initializeDatabase, saveDatabase } = require('./database');

console.log('🌱 Starting database seeding...\n');

// Initialize database first
initializeDatabase();

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
  { name: 'VIP Shoppers', description: 'Platinum tier customers', conditions: { loyalty_tier: 'platinum' }, status: 'active' },
  { name: 'Active Subscribers', description: 'Recently engaged contacts', conditions: { subscription_status: 'subscribed' }, status: 'active' },
  { name: 'High Engagement', description: 'Engagement score > 70', conditions: { min_engagement_score: 70 }, status: 'active' },
  { name: 'Fashion Lovers', description: 'Interested in fashion', conditions: { interest: 'fashion' }, status: 'active' },
  { name: 'Beauty Enthusiasts', description: 'Interested in beauty', conditions: { interest: 'beauty' }, status: 'active' },
  { name: 'Tech Savvy', description: 'Technology interested', conditions: { interest: 'technology' }, status: 'draft' },
  { name: 'Fitness Fans', description: 'Sports & fitness lovers', conditions: { interest: 'fitness' }, status: 'active' }
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
console.log('\n🚀 Ready to start the server with: npm start\n');
console.log('✨ Note: Campaigns and Workflows are now unified into a single Workflows system');
