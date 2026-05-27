require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, query } = require('./database');

// Import routes
const contactsRouter = require('./routes/contacts'); // Renamed from customers - B2C focus
const workflowsRouter = require('./routes/workflows_unified'); // UNIFIED: Previously separate campaigns + workflows
const analyticsRouter = require('./routes/analytics');
const segmentsRouter = require('./routes/segments');
const aiRouter = require('./routes/ai');
const orchestrationRouter = require('./routes/orchestration');
const deliveriesRouter = require('./routes/deliveries');
const predefinedFiltersRouter = require('./routes/predefined_filters');
const emailTemplatesRouter = require('./routes/email_templates');
const { seedSampleTemplates } = require('./routes/email_templates');
const assetsRouter = require('./routes/assets');
const { seedSampleAssets, ensurePlaceholderFiles } = require('./routes/assets');
const brandsRouter = require('./routes/brands');
const { seedSampleBrands } = require('./routes/brands');
const fragmentsRouter = require('./routes/fragments');
const { seedSampleFragments } = require('./routes/fragments');
const landingPagesRouter = require('./routes/landingPages');
const { seedSampleLandingPages } = require('./routes/landingPages');
const customObjectsRouter = require('./routes/customObjects');
const enumerationsRouter = require('./routes/enumerations');
const { seedSampleEnumerations } = require('./routes/enumerations');
const audiencesRouter = require('./routes/audiences');
const queryRouter = require('./routes/query');
const transactionalRouter = require('./routes/transactional');

// Offer Decisioning
const offersRouter = require('./routes/offers');
const placementsRouter = require('./routes/placements');
const collectionsRouter = require('./routes/collections');
const decisionRulesRouter = require('./routes/decisionRules');
const decisionsRouter = require('./routes/decisions');

const foldersRouter = require('./routes/folders');
const emailThemesRouter = require('./routes/email_themes');
const feedbackRouter = require('./routes/feedback');
const emailService = require('./services/emailService');
const { ensureAccSampleWorkflowsFromDisk, repairAccSampleWorkflowFolders } = require('./services/accSampleWorkflowsSeed');

// Agents, Skills & Tools
const agentSkillsRouter = require('./routes/agentSkills');
const agentsRouter = require('./routes/agents');
const agentToolsRouter = require('./routes/agentTools');
const agentSchedulesRouter = require('./routes/agent-schedules');
const aiNodesRouter = require('./routes/aiNodes');
const mobileRouter = require('./routes/mobile');

function ensureDemoDelivery() {
  const DEMO_NAME = 'Spring Collection Launch Demo';
  const existing = query.all('deliveries').find(d => d.name === DEMO_NAME);
  if (existing) return;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5}
.wrapper{max-width:640px;margin:0 auto;background:#fff}
.header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center}
.header h1{color:#fff;font-size:28px;margin:0 0 4px}.header p{color:rgba(255,255,255,0.8);font-size:14px;margin:0}
.hero{position:relative;overflow:hidden}
.cta-btn{display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:700;font-size:16px}
.section{padding:32px 40px}.section h3{font-size:20px;color:#1a1a2e;margin:0 0 16px;font-weight:700}
.products{display:flex;gap:16px}.product-card{flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;text-align:center}
.product-card .info{padding:12px}.product-card h4{margin:0 0 4px;font-size:14px;color:#1a1a2e}
.product-card .price{color:#e94560;font-weight:700;font-size:18px}.product-card .old-price{color:#94a3b8;text-decoration:line-through;font-size:13px;margin-left:6px}
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
</style></head><body><div class="wrapper">
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
<div class="product-card"><div style="background:linear-gradient(135deg,#43e97b,#38f9d7);height:180px"></div><div class="info"><h4>Silk Scarf</h4><p><span class="price">$59</span><span class="old-price">$120</span></p><a href="#" class="shop-btn">Shop Now</a></div></div></div>
<div class="benefits"><div class="benefit"><div class="icon">&#x1F69A;</div><h4>Free Shipping</h4><p>On orders over $75</p></div>
<div class="benefit"><div class="icon">&#x21A9;</div><h4>Easy Returns</h4><p>30-day guarantee</p></div>
<div class="benefit"><div class="icon">&#x1F512;</div><h4>Secure Payment</h4><p>256-bit encryption</p></div>
<div class="benefit"><div class="icon">&#x1F48E;</div><h4>VIP Rewards</h4><p>Earn 2x points today</p></div></div></div>
<div class="countdown"><h3>Sale Ends In</h3>
<div class="timer"><div class="timer-block"><div class="num">02</div><div class="label">Days</div></div>
<div class="timer-block"><div class="num">14</div><div class="label">Hours</div></div>
<div class="timer-block"><div class="num">37</div><div class="label">Minutes</div></div></div></div>
<div class="secondary-cta"><p style="font-size:16px;color:#475569;margin:0 0 12px">Can't decide? Browse our full catalog</p>
<a href="#" class="btn">View All Products</a></div>
<div class="social"><p style="font-size:12px;color:#94a3b8;margin:0 0 8px">Follow us</p>
<a href="#">FB</a><a href="#">TW</a><a href="#">IG</a><a href="#">PIN</a></div>
<div class="footer"><p>2026 Luxe Brands Inc. All rights reserved.</p>
<p>123 Fashion Ave, New York, NY 10001</p>
<p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a> | <a href="#">View in browser</a></p></div>
</div></body></html>`;

  const demoResult = query.insert('deliveries', {
    name: DEMO_NAME,
    channel: 'Email',
    channel_key: 'email',
    status: 'completed',
    subject: 'Spring Collection — Up to 50% OFF Everything!',
    preheader: 'Exclusive member offer: Free shipping + 2x VIP points. Sale ends in 2 days!',
    content: html,
    html_output: html,
    content_blocks: [
      { type: 'header', data: { logo: 'LUXE BRANDS', tagline: 'Exclusive Member Offer' } },
      { type: 'hero', data: { headline: 'SPRING COLLECTION', subtext: 'Up to 50% OFF Everything', cta: 'SHOP THE SALE' } },
      { type: 'products', data: { items: ['Designer Handbag', 'Premium Watch', 'Silk Scarf'] } },
      { type: 'countdown', data: { label: 'Sale Ends In' } },
      { type: 'cta', data: { text: 'View All Products' } },
      { type: 'footer', data: { unsubscribe: true, social: true } }
    ],
    scheduled_at: null, audience_id: null, segment_id: 1,
    approval_required: true, document_title: 'Spring Collection Launch', document_language: 'en',
    wizard_step: 5, last_saved_step: 5, draft_state: {}, proof_emails: ['marketing@luxebrands.com'],
    ab_test_enabled: true, ab_split_pct: 30, ab_winner_rule: 'click_rate',
    sto_enabled: true, sto_model: 'engagement_history', sto_window_hours: 24,
    wave_enabled: true, wave_count: 4, wave_interval_minutes: 45, wave_start_pct: 10, wave_ramp_type: 'exponential',
    approved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    sent_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    sent: 48500, delivered: 47200, opens: 21800, clicks: 6540,
    folder_id: null, created_by: 'Marketing Team', updated_by: 'Marketing Team',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: '2099-01-01T00:00:00.000Z'
  });
  if (demoResult && demoResult.record) {
    demoResult.record.updated_at = '2099-01-01T00:00:00.000Z';
  }
  console.log('📊 Demo delivery "Spring Collection Launch Demo" ensured');
}

function ensureSeedAgentsAndSkills() {
  const existingSkills = query.all('agent_skills');
  const existingAgents = query.all('agents');
  if (existingSkills.length > 0 || existingAgents.length > 0) return;

  // Find the "Cart Abandonment Recovery" workflow to reference
  const cartWf = query.all('workflows').find(w => /cart.abandon/i.test(w.name));
  const cartWfId = cartWf ? cartWf.id : null;

  const now = new Date().toISOString();

  // ── Skills ─────────────────────────────────────────────────
  const skill1 = query.insert('agent_skills', {
    name: 'Cart Abandonment — Escalating Urgency Outreach',
    description: 'A 3-stage re-engagement pattern: gentle reminder (1h), discount incentive (24h), last-chance urgency (48h). Reuse whenever you need to recover lost conversions with progressively stronger messaging.',
    category: 'content',
    source_workflow_id: cartWfId,
    scope: 'workflow',
    node_ids: ['email', 'wait1'],
    node_snapshot: [
      { type: 'wait', name: 'Wait 1 Hour', config: { wait_time: 1, wait_unit: 'hours' } },
      { type: 'email', name: 'Gentle Reminder', config: { subject: 'You left items in your cart!' } },
      { type: 'wait', name: 'Wait 24 Hours', config: { wait_time: 24, wait_unit: 'hours' } },
      { type: 'email', name: '10% Off Incentive', config: { subject: '10% off to complete your order' } },
      { type: 'wait', name: 'Wait 48 Hours', config: { wait_time: 48, wait_unit: 'hours' } },
      { type: 'email', name: 'Last Chance', config: { subject: 'Last chance — cart expiring soon' } }
    ],
    steps: [
      { step: 1, action: 'wait', instruction: 'Wait {initial_wait} after cart abandonment' },
      { step: 2, action: 'send', instruction: 'Send friendly reminder — show cart items, no discount', channel: 'email' },
      { step: 3, action: 'check', instruction: 'Check if customer purchased within {check_window}' },
      { step: 4, action: 'wait', instruction: 'Wait {second_wait}' },
      { step: 5, action: 'send', instruction: 'Send discount incentive — {discount_percent}% off', channel: 'email' },
      { step: 6, action: 'check', instruction: 'Check again for purchase' },
      { step: 7, action: 'wait', instruction: 'Wait {final_wait}' },
      { step: 8, action: 'send', instruction: 'Send last-chance message with urgency language', channel: 'email' }
    ],
    prompt_template: 'Send an initial reminder after {initial_wait}. If the customer has not converted, follow up with a {discount_percent}% discount after {second_wait}. If still no conversion, send a last-chance message with urgency language after {final_wait}.',
    input_schema: { initial_wait: 'duration', second_wait: 'duration', final_wait: 'duration', discount_percent: 'number' },
    output_schema: { messages_sent: 'number', recovered: 'boolean', revenue_recovered: 'number' },
    version: 1,
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  const skill2 = query.insert('agent_skills', {
    name: 'Cart Abandonment — Purchase Intent Detection',
    description: 'Monitors whether a customer completed their purchase at key decision points. Use this conversion-check pattern after any re-engagement touchpoint.',
    category: 'conversion',
    source_workflow_id: cartWfId,
    scope: 'subgraph',
    node_ids: ['condition'],
    node_snapshot: [
      { type: 'condition', name: 'Purchased?', config: { condition_type: 'purchased', time_window: 1 } },
      { type: 'condition', name: 'Still No Purchase?', config: { condition_type: 'purchased', time_window: 3 } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'After each touchpoint, check if purchased within {time_window} days' },
      { step: 2, action: 'check', instruction: 'If converted, exit the flow immediately' },
      { step: 3, action: 'check', instruction: 'If not converted, continue to next escalation step' }
    ],
    prompt_template: 'After each touchpoint, check if the customer has completed a purchase within {time_window} days. If yes, exit the flow. If no, continue to the next escalation step.',
    input_schema: { time_window: 'number', conversion_event: 'string' },
    output_schema: { converted: 'boolean', checked_at: 'timestamp' },
    version: 1,
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  const skill3 = query.insert('agent_skills', {
    name: 'Cart Abandonment — Optimal Send Timing',
    description: 'Determines the best moment to reach a cart abandoner based on engagement history and time-of-day patterns. Adjusts wait durations dynamically.',
    category: 'timing',
    source_workflow_id: cartWfId,
    scope: 'subgraph',
    node_ids: ['wait1'],
    node_snapshot: [
      { type: 'wait', name: 'Wait 1 Hour', config: { wait_time: 1, wait_unit: 'hours' } },
      { type: 'wait', name: 'Wait 24 Hours', config: { wait_time: 24, wait_unit: 'hours' } },
      { type: 'wait', name: 'Wait 48 Hours', config: { wait_time: 48, wait_unit: 'hours' } }
    ],
    steps: [
      { step: 1, action: 'wait', instruction: 'Determine optimal time for first reminder (default: {initial_wait} after trigger)' },
      { step: 2, action: 'wait', instruction: 'Determine optimal time for second touchpoint (default: {second_wait} after first)' },
      { step: 3, action: 'wait', instruction: 'Determine optimal time for final touchpoint (default: {final_wait} after second)' },
      { step: 4, action: 'check', instruction: 'Adjust all timings based on customer engagement history and timezone' }
    ],
    prompt_template: 'Determine the optimal send time for each message in the sequence. Use the customer\'s historical open-time patterns and timezone. Default cadence: {default_cadence}. Adjust up to +/-{flexibility} based on engagement signals.',
    input_schema: { default_cadence: 'array', flexibility: 'duration', use_sto: 'boolean' },
    output_schema: { adjusted_schedule: 'array', reasoning: 'string' },
    version: 1,
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Welcome Series Skills ──────────────────────────────────
  const welcomeWf = query.all('workflows').find(w => /welcome.email/i.test(w.name));
  const welcomeWfId = welcomeWf ? welcomeWf.id : null;

  const skill4 = query.insert('agent_skills', {
    name: 'Welcome Series — New Subscriber Onboarding',
    description: 'A progressive onboarding sequence: welcome email immediately, getting-started guide at day 1, first-purchase incentive at day 3. Builds trust and drives first conversion.',
    category: 'content',
    source_workflow_id: welcomeWfId,
    scope: 'workflow',
    node_ids: [],
    node_snapshot: [
      { type: 'email', name: 'Welcome Email', config: { subject: 'Welcome aboard!' } },
      { type: 'wait', name: 'Wait 1 Day', config: { wait_time: 1, wait_unit: 'days' } },
      { type: 'email', name: 'Getting Started Guide', config: { subject: 'Getting started — quick tips' } },
      { type: 'wait', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
      { type: 'condition', name: 'Made Purchase?', config: { condition_type: 'purchased', time_window: 7 } },
      { type: 'email', name: 'First Purchase Offer', config: { subject: '20% off your first order' } }
    ],
    steps: [
      { step: 1, action: 'send', instruction: 'Send warm welcome email immediately on signup', channel: 'email' },
      { step: 2, action: 'wait', instruction: 'Wait {first_gap} (default: 1 day)' },
      { step: 3, action: 'send', instruction: 'Send getting-started guide with tips', channel: 'email' },
      { step: 4, action: 'wait', instruction: 'Wait {second_gap} (default: 3 days)' },
      { step: 5, action: 'check', instruction: 'Check if subscriber made a purchase' },
      { step: 6, action: 'send', instruction: 'If not purchased, send {discount}% first-purchase incentive', channel: 'email' }
    ],
    prompt_template: 'Onboard a new subscriber with a {num_touchpoints}-step welcome sequence. Start with a warm welcome, follow up with educational content after {first_gap}, then offer a {discount}% first-purchase incentive after {second_gap} if they haven\'t converted.',
    input_schema: { num_touchpoints: 'number', first_gap: 'duration', second_gap: 'duration', discount: 'number' },
    output_schema: { onboarded: 'boolean', first_purchase: 'boolean' },
    version: 1,
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Post-Purchase Skills ────────────────────────────────────
  const postPurchaseWf = query.all('workflows').find(w => /post.purchase/i.test(w.name));
  const postPurchaseWfId = postPurchaseWf ? postPurchaseWf.id : null;

  const skill5 = query.insert('agent_skills', {
    name: 'Post-Purchase — Thank You & Review Request',
    description: 'Sends a thank-you confirmation after purchase, then requests a product review after a delivery window. Builds loyalty and generates social proof.',
    category: 'content',
    source_workflow_id: postPurchaseWfId,
    scope: 'workflow',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'email', name: 'Thank You Email', config: { subject: 'Thank you for your order!' } },
      { type: 'wait', name: 'Wait for Delivery', config: { wait_time: 5, wait_unit: 'days' } },
      { type: 'email', name: 'Review Request', config: { subject: 'How are you enjoying your purchase?' } }
    ],
    steps: [
      { step: 1, action: 'send', instruction: 'Send thank-you email immediately after purchase with order summary', channel: 'email' },
      { step: 2, action: 'wait', instruction: 'Wait {delivery_window} for product to arrive (default: 5 days)' },
      { step: 3, action: 'send', instruction: 'Send review request email with direct link to review form', channel: 'email' },
      { step: 4, action: 'check', instruction: 'If review submitted, send thank-you; if not, send one reminder after {reminder_gap}' }
    ],
    prompt_template: 'After purchase, send a personalized thank-you email. Wait {delivery_window} for delivery, then request a product review. If no review after {reminder_gap}, send one gentle reminder. Tone: warm, appreciative.',
    input_schema: { delivery_window: 'duration', reminder_gap: 'duration', include_recommendations: 'boolean' },
    output_schema: { review_submitted: 'boolean', review_rating: 'number', messages_sent: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill6 = query.insert('agent_skills', {
    name: 'Post-Purchase — Cross-sell Recommendation',
    description: 'Analyzes past purchase to recommend complementary products. Uses purchase category, price point, and browsing history to personalize suggestions.',
    category: 'content',
    source_workflow_id: postPurchaseWfId,
    scope: 'subgraph',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'condition', name: 'High-Value Purchase?', config: { condition_type: 'order_value', threshold: 100 } },
      { type: 'email', name: 'Cross-sell Email', config: { subject: 'Complete your look' } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Analyze purchased items: category, price, brand' },
      { step: 2, action: 'check', instruction: 'Query product catalog for complementary items using {recommendation_model}' },
      { step: 3, action: 'send', instruction: 'Send personalized cross-sell email featuring top {num_recommendations} products', channel: 'email' },
      { step: 4, action: 'check', instruction: 'If high-value purchase (>{value_threshold}), include exclusive bundle offer' }
    ],
    prompt_template: 'Based on the customer\'s purchase of {purchased_items}, recommend {num_recommendations} complementary products. For orders above {value_threshold}, include an exclusive bundle discount. Personalize based on browsing history.',
    input_schema: { num_recommendations: 'number', value_threshold: 'number', recommendation_model: 'string' },
    output_schema: { recommendations: 'array', cross_sell_revenue: 'number', clicked: 'boolean' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill7 = query.insert('agent_skills', {
    name: 'Post-Purchase — Repeat Purchase Detection',
    description: 'Monitors post-purchase engagement signals to predict and encourage repeat purchases. Tracks review activity, return visits, and reorder patterns.',
    category: 'conversion',
    source_workflow_id: postPurchaseWfId,
    scope: 'subgraph',
    node_ids: ['condition'],
    node_snapshot: [
      { type: 'condition', name: 'Repeat Purchase?', config: { condition_type: 'purchased_again', time_window: 30 } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Monitor for repeat purchase within {tracking_window} days' },
      { step: 2, action: 'check', instruction: 'Track engagement: site visits, email opens, wishlist adds' },
      { step: 3, action: 'check', instruction: 'If high engagement but no purchase, flag as reorder candidate' }
    ],
    prompt_template: 'Track the customer for {tracking_window} days after their purchase. Monitor for repeat purchases and engagement signals (site visits, email clicks, wishlist). Score reorder likelihood and flag candidates.',
    input_schema: { tracking_window: 'number', engagement_threshold: 'number' },
    output_schema: { repeat_purchased: 'boolean', engagement_score: 'number', reorder_likelihood: 'string' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Win-back Skills ───────────────────────────────────────────
  const winbackWf = query.all('workflows').find(w => /winback|win.back/i.test(w.name));
  const winbackWfId = winbackWf ? winbackWf.id : null;

  const skill8 = query.insert('agent_skills', {
    name: 'Win-back — Re-engagement Messaging',
    description: 'A 3-stage win-back sequence: "we miss you" (30 days inactive), value reminder (45 days), final incentive (60 days). Progressively escalates from emotional to transactional.',
    category: 'content',
    source_workflow_id: winbackWfId,
    scope: 'workflow',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'email', name: 'We Miss You', config: { subject: 'We miss you! Here\'s what\'s new' } },
      { type: 'wait', name: 'Wait 15 Days', config: { wait_time: 15, wait_unit: 'days' } },
      { type: 'email', name: 'Value Reminder', config: { subject: 'Your favorites are waiting' } },
      { type: 'wait', name: 'Wait 15 Days', config: { wait_time: 15, wait_unit: 'days' } },
      { type: 'email', name: 'Final Offer', config: { subject: '25% off — just for you' } }
    ],
    steps: [
      { step: 1, action: 'send', instruction: 'Send "we miss you" email highlighting what\'s new since last visit', channel: 'email' },
      { step: 2, action: 'check', instruction: 'Check for re-engagement (open, click, visit) within {check_window}' },
      { step: 3, action: 'wait', instruction: 'Wait {second_gap} (default: 15 days)' },
      { step: 4, action: 'send', instruction: 'Send value reminder featuring their past favorites and new arrivals', channel: 'email' },
      { step: 5, action: 'check', instruction: 'Check for re-engagement again' },
      { step: 6, action: 'wait', instruction: 'Wait {third_gap} (default: 15 days)' },
      { step: 7, action: 'send', instruction: 'Send final win-back offer with {discount}% discount', channel: 'email' },
      { step: 8, action: 'check', instruction: 'If still inactive after final offer, mark as churned' }
    ],
    prompt_template: 'Win back an inactive customer with a 3-stage sequence. Stage 1: emotional "we miss you" with new products. Stage 2: value-based reminder with their favorites. Stage 3: {discount}% discount as a final incentive. Space stages {stage_gap} apart.',
    input_schema: { discount: 'number', stage_gap: 'duration', check_window: 'duration' },
    output_schema: { re_engaged: 'boolean', stage_reached: 'number', revenue_recovered: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill9 = query.insert('agent_skills', {
    name: 'Win-back — Inactivity Detection & Scoring',
    description: 'Identifies lapsed customers by analyzing recency, frequency, and monetary (RFM) signals. Classifies churn risk and recommends intervention urgency.',
    category: 'targeting',
    source_workflow_id: winbackWfId,
    scope: 'subgraph',
    node_ids: ['condition'],
    node_snapshot: [
      { type: 'condition', name: 'Inactive > 30 Days?', config: { condition_type: 'last_activity', threshold: 30 } },
      { type: 'condition', name: 'High Value?', config: { condition_type: 'lifetime_value', threshold: 500 } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Calculate days since last engagement (email open, site visit, purchase)' },
      { step: 2, action: 'check', instruction: 'Compute RFM score: Recency ({recency_weight}), Frequency ({frequency_weight}), Monetary ({monetary_weight})' },
      { step: 3, action: 'check', instruction: 'Classify churn risk: low (<30 days), medium (30-60 days), high (>60 days)' },
      { step: 4, action: 'check', instruction: 'Prioritize high-value customers (LTV > {ltv_threshold}) for immediate intervention' }
    ],
    prompt_template: 'Score customer inactivity using RFM analysis. Classify churn risk as low/medium/high. Prioritize customers with LTV above {ltv_threshold} for immediate win-back intervention.',
    input_schema: { recency_weight: 'number', frequency_weight: 'number', monetary_weight: 'number', ltv_threshold: 'number' },
    output_schema: { churn_risk: 'string', rfm_score: 'number', days_inactive: 'number', priority: 'string' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill10 = query.insert('agent_skills', {
    name: 'Win-back — Channel Optimization',
    description: 'Selects the most effective channel for re-engaging a lapsed customer based on their historical channel preferences and engagement patterns.',
    category: 'channel',
    source_workflow_id: winbackWfId,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [],
    steps: [
      { step: 1, action: 'check', instruction: 'Analyze historical channel engagement: email open rate, SMS response rate, push tap rate' },
      { step: 2, action: 'check', instruction: 'Identify preferred channel based on highest engagement rate' },
      { step: 3, action: 'check', instruction: 'If no channel preference, default to email first, then SMS for high-value contacts' },
      { step: 4, action: 'send', instruction: 'Route win-back message through optimal channel' }
    ],
    prompt_template: 'Determine the optimal channel for reaching a lapsed customer. Analyze their historical engagement across email, SMS, and push. Use {fallback_channel} if no preference data exists. For high-value contacts (>{ltv_threshold}), consider multi-channel approach.',
    input_schema: { fallback_channel: 'string', ltv_threshold: 'number', allow_multichannel: 'boolean' },
    output_schema: { selected_channel: 'string', confidence: 'number', engagement_history: 'object' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Birthday Rewards Skills ───────────────────────────────────
  const birthdayWf = query.all('workflows').find(w => /birthday.reward/i.test(w.name));
  const birthdayWfId = birthdayWf ? birthdayWf.id : null;

  const skill11 = query.insert('agent_skills', {
    name: 'Birthday — Celebratory Outreach Sequence',
    description: 'A 3-touchpoint birthday sequence: early teaser (7 days before), birthday-day gift, and post-birthday reminder. Creates excitement and drives birthday-month purchases.',
    category: 'content',
    source_workflow_id: birthdayWfId,
    scope: 'workflow',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'email', name: 'Birthday Teaser', config: { subject: 'Your birthday surprise is almost here!' } },
      { type: 'wait', name: 'Wait Until Birthday', config: { wait_time: 7, wait_unit: 'days' } },
      { type: 'email', name: 'Birthday Gift', config: { subject: 'Happy Birthday! Your gift is inside' } },
      { type: 'wait', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
      { type: 'email', name: 'Birthday Reminder', config: { subject: 'Don\'t forget your birthday reward!' } }
    ],
    steps: [
      { step: 1, action: 'send', instruction: 'Send birthday teaser email {days_before} days before birthday', channel: 'email' },
      { step: 2, action: 'wait', instruction: 'Wait until birthday date' },
      { step: 3, action: 'send', instruction: 'Send birthday gift email with {discount}% off or free gift offer', channel: 'email' },
      { step: 4, action: 'send', instruction: 'Send push notification with birthday wishes', channel: 'push' },
      { step: 5, action: 'check', instruction: 'Check if gift was redeemed within {redemption_window}' },
      { step: 6, action: 'send', instruction: 'If not redeemed, send reminder {reminder_days} days after birthday', channel: 'email' }
    ],
    prompt_template: 'Create a birthday celebration sequence. Tease the offer {days_before} days early. On birthday, deliver a {discount}% discount or free gift. If unredeemed after {reminder_days} days, send a reminder. Tone: celebratory, personal, warm.',
    input_schema: { days_before: 'number', discount: 'number', reminder_days: 'number', redemption_window: 'duration' },
    output_schema: { gift_redeemed: 'boolean', revenue: 'number', messages_sent: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill12 = query.insert('agent_skills', {
    name: 'Birthday — Gift Personalization',
    description: 'Selects the most appealing birthday offer for each customer based on purchase history, preferences, and lifecycle stage. Chooses between percentage discounts, free products, or free shipping.',
    category: 'content',
    source_workflow_id: birthdayWfId,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [],
    steps: [
      { step: 1, action: 'check', instruction: 'Analyze customer purchase history and average order value' },
      { step: 2, action: 'check', instruction: 'Determine customer tier: new (<2 purchases), active (2-10), loyal (>10)' },
      { step: 3, action: 'check', instruction: 'Select gift type: new=percentage discount, active=free product sample, loyal=exclusive early access + discount' },
      { step: 4, action: 'check', instruction: 'Personalize gift based on most-purchased category' }
    ],
    prompt_template: 'Choose the optimal birthday gift for the customer. New customers ({new_threshold} purchases): {new_offer}. Active customers: free product from their favorite category. Loyal customers ({loyal_threshold}+ purchases): exclusive early access plus {loyal_discount}% off.',
    input_schema: { new_threshold: 'number', loyal_threshold: 'number', new_offer: 'string', loyal_discount: 'number' },
    output_schema: { gift_type: 'string', gift_value: 'number', personalization_reason: 'string' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Loyalty Milestone Skills ──────────────────────────────────
  const loyaltyWf = query.all('workflows').find(w => /loyalty.milestone/i.test(w.name));
  const loyaltyWfId = loyaltyWf ? loyaltyWf.id : null;

  const skill13 = query.insert('agent_skills', {
    name: 'Loyalty — Milestone Recognition & Reward',
    description: 'Recognizes and celebrates customer loyalty milestones: first purchase anniversary, spend thresholds, purchase count milestones, and tier upgrades.',
    category: 'content',
    source_workflow_id: loyaltyWfId,
    scope: 'workflow',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'condition', name: 'Milestone Reached?', config: { condition_type: 'milestone', types: ['anniversary', 'spend', 'count'] } },
      { type: 'email', name: 'Milestone Email', config: { subject: 'You\'ve reached a milestone!' } },
      { type: 'email', name: 'Reward Email', config: { subject: 'Here\'s your exclusive reward' } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Detect milestone type: anniversary, spend threshold ({spend_milestones}), or purchase count ({count_milestones})' },
      { step: 2, action: 'send', instruction: 'Send milestone recognition email with personalized achievement summary', channel: 'email' },
      { step: 3, action: 'send', instruction: 'Send push notification celebrating the milestone', channel: 'push' },
      { step: 4, action: 'send', instruction: 'Deliver milestone reward: {reward_type}', channel: 'email' },
      { step: 5, action: 'check', instruction: 'Track reward redemption within {redemption_window}' }
    ],
    prompt_template: 'Celebrate the customer reaching a loyalty milestone. Recognize their achievement with a personalized summary of their journey. Deliver a {reward_type} reward. Milestones: spend thresholds {spend_milestones}, purchase counts {count_milestones}, anniversaries.',
    input_schema: { spend_milestones: 'array', count_milestones: 'array', reward_type: 'string', redemption_window: 'duration' },
    output_schema: { milestone_type: 'string', reward_delivered: 'boolean', redeemed: 'boolean' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill14 = query.insert('agent_skills', {
    name: 'Loyalty — Tier Progression & Upgrade',
    description: 'Manages loyalty tier transitions. Notifies customers of tier progress, upcoming benefits, and celebrates upgrades with exclusive perks.',
    category: 'content',
    source_workflow_id: loyaltyWfId,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [
      { type: 'condition', name: 'Near Tier Upgrade?', config: { condition_type: 'tier_progress', threshold: 80 } },
      { type: 'email', name: 'Tier Progress', config: { subject: 'You\'re almost at the next level!' } },
      { type: 'email', name: 'Tier Upgrade', config: { subject: 'Congratulations! You\'ve been upgraded!' } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Calculate progress toward next tier: {current_points}/{next_tier_threshold}' },
      { step: 2, action: 'check', instruction: 'If within {proximity_percent}% of upgrade, send progress nudge' },
      { step: 3, action: 'send', instruction: 'Send tier progress email showing points needed and benefits preview', channel: 'email' },
      { step: 4, action: 'check', instruction: 'On tier upgrade, trigger celebration sequence' },
      { step: 5, action: 'send', instruction: 'Send upgrade congratulations with new tier benefits guide', channel: 'email' },
      { step: 6, action: 'send', instruction: 'Send SMS congratulations for VIP tier upgrades', channel: 'sms' }
    ],
    prompt_template: 'Manage tier progression for the loyalty program. When within {proximity_percent}% of upgrade, nudge with progress update. On tier upgrade, celebrate with a benefits guide and exclusive {upgrade_reward}. Tiers: {tier_names}.',
    input_schema: { proximity_percent: 'number', tier_names: 'array', upgrade_reward: 'string' },
    output_schema: { current_tier: 'string', new_tier: 'string', upgraded: 'boolean', points_remaining: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill15 = query.insert('agent_skills', {
    name: 'Loyalty — VIP Exclusives & Early Access',
    description: 'Delivers exclusive benefits to top-tier loyalty members: early access to sales, VIP-only products, and personalized concierge-style recommendations.',
    category: 'content',
    source_workflow_id: loyaltyWfId,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [],
    steps: [
      { step: 1, action: 'check', instruction: 'Verify customer is in VIP tier ({vip_tiers})' },
      { step: 2, action: 'send', instruction: 'Send early access notification {early_access_hours}h before public launch', channel: 'email' },
      { step: 3, action: 'send', instruction: 'Send push notification for flash VIP-only offers', channel: 'push' },
      { step: 4, action: 'send', instruction: 'Deliver curated VIP recommendations based on purchase DNA', channel: 'email' }
    ],
    prompt_template: 'Deliver VIP exclusive benefits. Grant early access {early_access_hours} hours before public. Feature VIP-only products from their preferred categories. Include a personal note from the brand. Tone: exclusive, appreciative, premium.',
    input_schema: { vip_tiers: 'array', early_access_hours: 'number' },
    output_schema: { early_access_used: 'boolean', vip_purchases: 'number', engagement_rate: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Browse Abandonment Skills ─────────────────────────────────
  const skill16 = query.insert('agent_skills', {
    name: 'Browse Abandonment — Product Interest Retargeting',
    description: 'Re-engages customers who browsed products but didn\'t add to cart. Uses viewed product data to create personalized follow-up messages across email, push, and SMS.',
    category: 'content',
    source_workflow_id: null,
    scope: 'workflow',
    node_ids: ['email'],
    node_snapshot: [
      { type: 'wait', name: 'Wait 2 Hours', config: { wait_time: 2, wait_unit: 'hours' } },
      { type: 'email', name: 'Browse Reminder', config: { subject: 'Still thinking about these?' } },
      { type: 'wait', name: 'Wait 1 Day', config: { wait_time: 1, wait_unit: 'days' } },
      { type: 'condition', name: 'Returned to Site?', config: { condition_type: 'site_visit' } },
      { type: 'email', name: 'Price Drop Alert', config: { subject: 'Price drop on items you viewed' } }
    ],
    steps: [
      { step: 1, action: 'check', instruction: 'Capture browsed products: category, price, time spent on page' },
      { step: 2, action: 'wait', instruction: 'Wait {initial_wait} after browse session ends (default: 2 hours)' },
      { step: 3, action: 'send', instruction: 'Send browse reminder email with viewed products and similar items', channel: 'email' },
      { step: 4, action: 'check', instruction: 'Check if customer returned to site or added to cart within {check_window}' },
      { step: 5, action: 'wait', instruction: 'Wait {second_wait} (default: 1 day)' },
      { step: 6, action: 'send', instruction: 'Send price drop or back-in-stock alert for viewed items', channel: 'email' },
      { step: 7, action: 'send', instruction: 'For high-intent browsers (viewed {min_products}+ products), send push notification', channel: 'push' }
    ],
    prompt_template: 'Re-engage a customer who browsed {products_viewed} products without adding to cart. Send a reminder after {initial_wait} featuring their viewed items. If no return visit, follow up with a price-drop or social-proof message after {second_wait}. High-intent browsers ({min_products}+ views) get push.',
    input_schema: { initial_wait: 'duration', second_wait: 'duration', min_products: 'number', check_window: 'duration' },
    output_schema: { returned_to_site: 'boolean', added_to_cart: 'boolean', purchased: 'boolean', messages_sent: 'number' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const skill17 = query.insert('agent_skills', {
    name: 'Browse Abandonment — Session Intent Analysis',
    description: 'Analyzes browse session behavior to score purchase intent. Considers page dwell time, products viewed, category depth, and comparison behavior.',
    category: 'analyst',
    source_workflow_id: null,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [],
    steps: [
      { step: 1, action: 'check', instruction: 'Analyze session metrics: pages viewed, dwell time, scroll depth' },
      { step: 2, action: 'check', instruction: 'Score intent: casual (<{casual_threshold}s avg dwell), interested ({interested_threshold}s), high-intent (>{high_threshold}s or {min_products}+ products)' },
      { step: 3, action: 'check', instruction: 'Detect comparison behavior: multiple products in same category within one session' },
      { step: 4, action: 'check', instruction: 'Output intent score and recommended follow-up urgency' }
    ],
    prompt_template: 'Analyze the browse session to determine purchase intent. Score based on dwell time, products viewed ({products_viewed}), and comparison behavior. Classify as casual/interested/high-intent and recommend follow-up urgency.',
    input_schema: { casual_threshold: 'number', interested_threshold: 'number', high_threshold: 'number', min_products: 'number' },
    output_schema: { intent_score: 'number', intent_level: 'string', top_categories: 'array', recommended_urgency: 'string' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Product Recommendation Skills ─────────────────────────────
  const prodRecWf = query.all('workflows').find(w => /product.recommend/i.test(w.name));
  const prodRecWfId = prodRecWf ? prodRecWf.id : null;

  const skill18 = query.insert('agent_skills', {
    name: 'Product Recommendation — Behavioral Scoring',
    description: 'Builds a customer product-affinity profile from browsing, purchase, and engagement data. Powers personalized recommendations across all channels.',
    category: 'analyst',
    source_workflow_id: prodRecWfId,
    scope: 'subgraph',
    node_ids: [],
    node_snapshot: [],
    steps: [
      { step: 1, action: 'check', instruction: 'Aggregate purchase history: categories, brands, price ranges, frequency' },
      { step: 2, action: 'check', instruction: 'Analyze browsing behavior: most-viewed categories, wishlist items, search queries' },
      { step: 3, action: 'check', instruction: 'Compute affinity scores per category using {scoring_model}' },
      { step: 4, action: 'check', instruction: 'Identify cross-category affinities (e.g., shoes + accessories)' },
      { step: 5, action: 'check', instruction: 'Output ranked product-affinity profile for recommendation engine' }
    ],
    prompt_template: 'Build a product-affinity profile for the customer. Analyze purchases ({purchase_count}), browsing ({browse_sessions}), and wishlist ({wishlist_items}). Score affinity per category and identify cross-category patterns. Use {scoring_model} model.',
    input_schema: { scoring_model: 'string', recency_decay: 'number', min_interactions: 'number' },
    output_schema: { affinity_scores: 'object', top_categories: 'array', cross_affinities: 'array', profile_strength: 'string' },
    version: 1, status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ═══════════════════════════════════════════════════════════════
  // ── AGENTS ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // ── Sub-agents (type: 'agent') ────────────────────────────────

  // Cart Abandonment sub-agents
  const cartOrch = query.insert('agents', {
    name: 'Cart Recovery Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates the cart recovery process. Unlike the fixed workflow sequence, this orchestrator dynamically decides escalation pace based on customer engagement signals.',
    system_instructions: 'You are the orchestrator for cart abandonment recovery. Follow the 3-stage plan: gentle reminder (1h), discount incentive (24h), last-chance (48h). At each stage, ask the Timing Agent for optimal send time, the Content Agent for message personalization, and check with the Conversion Agent before proceeding to the next stage. If the customer converts at any point, stop the sequence.',
    skill_ids: [], tool_ids: [],
    output_schema: [
      { key: 'current_stage', type: 'number', description: 'Current recovery stage (1-3)' },
      { key: 'escalation_plan', type: 'string', description: 'Recommended escalation approach' },
      { key: 'discount_level', type: 'number', description: 'Discount percentage to offer' }
    ],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const cartContent = query.insert('agents', {
    name: 'Cart Recovery Content Agent', role: 'content', type: 'agent',
    description: 'Personalizes each cart reminder message based on the customer\'s cart contents, browsing history, and lifecycle stage.',
    system_instructions: 'Personalize cart abandonment emails based on {{Cart Recovery Orchestrator.current_stage}} and {{Cart Recovery Orchestrator.discount_level}}. Stage 1 (reminder): friendly, show cart items with images, no discount. Stage 2 (incentive): add urgency, include a percentage discount, mention limited stock. Stage 3 (last chance): maximum urgency, countdown language, strongest discount. Always include the exact cart items and total value.',
    skill_ids: [skill1.lastID], tool_ids: [],
    output_schema: [
      { key: 'subject_line', type: 'string', description: 'Email subject line' },
      { key: 'message_body', type: 'string', description: 'Personalized email body' },
      { key: 'product_recommendations', type: 'array', description: 'Cross-sell product IDs' }
    ],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const cartTiming = query.insert('agents', {
    name: 'Cart Recovery Timing Agent', role: 'timing', type: 'agent',
    description: 'Determines the optimal send time for each touchpoint based on the customer\'s engagement history and timezone.',
    system_instructions: 'Optimize send timing for stage {{Cart Recovery Orchestrator.current_stage}} of cart recovery. Use the customer\'s historical email open patterns. For stage 1, send within 1-2 hours of abandonment. For stage 2, target peak engagement window the next day. For stage 3, send during morning hours in timezone.',
    skill_ids: [skill3.lastID], tool_ids: [],
    output_schema: [
      { key: 'optimal_send_time', type: 'string', description: 'ISO 8601 recommended send time' },
      { key: 'timezone', type: 'string', description: 'Customer timezone' },
      { key: 'day_preference', type: 'string', description: 'Preferred day of week' }
    ],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const cartConversion = query.insert('agents', {
    name: 'Cart Recovery Conversion Agent', role: 'conversion', type: 'agent',
    description: 'Monitors whether the customer has completed their purchase and decides if the sequence should continue or exit.',
    system_instructions: 'After each touchpoint, check if the customer completed their purchase. Review {{Cart Recovery Content Agent.subject_line}} effectiveness and {{Cart Recovery Timing Agent.optimal_send_time}} accuracy. Also monitor for: partial cart updates, wishlist additions, and return visits.',
    skill_ids: [skill2.lastID], tool_ids: [],
    output_schema: [
      { key: 'purchased', type: 'boolean', description: 'Whether customer completed purchase' },
      { key: 'engagement_level', type: 'string', description: 'Low, Medium, or High engagement' },
      { key: 'next_action', type: 'string', description: 'Recommended next step' }
    ],
    node_ids: ['condition'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Welcome Series sub-agents
  const welcomeOrch = query.insert('agents', {
    name: 'Welcome Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Manages the welcome sequence flow. Adapts the number and type of touchpoints based on real-time engagement, unlike the fixed 3-step workflow.',
    system_instructions: 'You orchestrate the welcome series. Send the welcome email immediately on signup. After 1 day, send the getting-started guide. After 3 days, check if they purchased — if not, send the first-purchase incentive. Coordinate with the Content Agent for personalization and the Conversion Agent for purchase checks.',
    skill_ids: [], tool_ids: [],
    output_schema: [
      { key: 'sequence_plan', type: 'string', description: 'Welcome sequence approach (educational, promotional, or hybrid)' },
      { key: 'signup_source', type: 'string', description: 'Where the subscriber signed up from' },
      { key: 'interest_categories', type: 'array', description: 'Categories the subscriber is interested in' }
    ],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const welcomeContent = query.insert('agents', {
    name: 'Welcome Content Agent', role: 'content', type: 'agent',
    description: 'Personalizes welcome messages based on the subscriber\'s signup source, stated interests, and browsing behavior.',
    system_instructions: 'Personalize each welcome email using {{Welcome Orchestrator.sequence_plan}} approach. Target {{Welcome Orchestrator.interest_categories}} for product recommendations. The welcome email should feel warm and personal. The guide email should match their interests. The incentive email should feature products they\'ve shown interest in with a personalized discount.',
    skill_ids: [skill4.lastID], tool_ids: [],
    output_schema: [
      { key: 'subject_line', type: 'string', description: 'Email subject line' },
      { key: 'message_body', type: 'string', description: 'Personalized email body' },
      { key: 'cta_type', type: 'string', description: 'Call-to-action type (browse, buy, learn)' }
    ],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const welcomeTiming = query.insert('agents', {
    name: 'Welcome Timing Agent', role: 'timing', type: 'agent',
    description: 'Adjusts welcome email timing based on signup time and timezone to maximize open rates.',
    system_instructions: 'Send the welcome email within 5 minutes of signup. For the day-1 guide, target 10am in the subscriber\'s local timezone. For the day-3 incentive, target their predicted peak engagement window based on how they interacted with the first two emails.',
    skill_ids: [], tool_ids: [],
    output_schema: [
      { key: 'optimal_send_time', type: 'string', description: 'Recommended send time' },
      { key: 'engagement_window', type: 'string', description: 'Peak engagement window for this subscriber' }
    ],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Post-Purchase sub-agents
  const ppOrch = query.insert('agents', {
    name: 'Post-Purchase Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates the post-purchase journey. Dynamically decides follow-up sequence based on purchase value, product category, and customer lifecycle stage — not a fixed timeline.',
    system_instructions: 'You orchestrate the post-purchase experience. Immediately send a thank-you. After estimated delivery ({delivery_window} days), request a review. Based on purchase category, trigger the Cross-sell Agent with personalized recommendations. If the customer is a first-time buyer, coordinate with the Analyst to assess repeat-purchase likelihood and adjust follow-up intensity. Exit after 14 days or on repeat purchase.',
    skill_ids: [], tool_ids: [],
    output_schema: [
      { key: 'delivery_window', type: 'number', description: 'Estimated delivery days' },
      { key: 'purchase_category', type: 'string', description: 'Product category of purchase' },
      { key: 'follow_up_intensity', type: 'string', description: 'Low, Medium, or High' },
      { key: 'cross_sell_strategy', type: 'string', description: 'Complementary, Upgrade, or Bundle' }
    ],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const ppContent = query.insert('agents', {
    name: 'Post-Purchase Content Agent', role: 'content', type: 'agent',
    description: 'Creates personalized thank-you messages, review requests, and cross-sell recommendations based on purchase details and customer profile.',
    system_instructions: 'Personalize all post-purchase communications using {{Post-Purchase Orchestrator.cross_sell_strategy}} approach for {{Post-Purchase Orchestrator.purchase_category}} products. Thank-you email: include order details, estimated delivery ({{Post-Purchase Orchestrator.delivery_window}} days), and a warm personal touch. Review request: time it after delivery, include a direct link. Cross-sell: recommend complementary products. For high-value orders (>$100), add an exclusive next-purchase discount.',
    skill_ids: [skill5.lastID, skill6.lastID], tool_ids: [],
    output_schema: [
      { key: 'subject_line', type: 'string', description: 'Email subject line' },
      { key: 'message_body', type: 'string', description: 'Personalized email body' },
      { key: 'cross_sell_products', type: 'array', description: 'Recommended product IDs' }
    ],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const ppTiming = query.insert('agents', {
    name: 'Post-Purchase Timing Agent', role: 'timing', type: 'agent',
    description: 'Optimizes follow-up timing based on product category delivery windows and customer engagement patterns.',
    system_instructions: 'Use {{Post-Purchase Orchestrator.delivery_window}} to schedule review request. Thank-you: send immediately. Review request: wait for delivery + 2 days. Cross-sell: send 7-10 days after purchase during peak engagement. Adjust timing by category — electronics need longer delivery windows than apparel.',
    skill_ids: [], tool_ids: [],
    output_schema: [
      { key: 'review_request_date', type: 'string', description: 'When to send review request' },
      { key: 'cross_sell_date', type: 'string', description: 'When to send cross-sell' }
    ],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const ppConversion = query.insert('agents', {
    name: 'Post-Purchase Conversion Agent', role: 'conversion', type: 'agent',
    description: 'Tracks post-purchase engagement to detect review submissions, cross-sell clicks, and repeat purchase signals.',
    system_instructions: 'Monitor post-purchase behavior: Did they leave a review? Did they click cross-sell recommendations? Did they return to the site? Score repeat-purchase likelihood (low/medium/high) based on engagement signals. If review is submitted, trigger a thank-you. If cross-sell clicked but not purchased, flag for retargeting.',
    skill_ids: [skill7.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['condition'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Win-back sub-agents
  const wbOrch = query.insert('agents', {
    name: 'Win-back Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates the win-back campaign. Unlike the fixed workflow, this orchestrator adjusts escalation speed, channel selection, and incentive levels based on individual churn risk scores.',
    system_instructions: 'You orchestrate the win-back sequence. First, ask the Targeting Agent to score churn risk and segment customers. For high-risk/high-value customers, start immediately with a strong offer. For medium-risk, follow the standard 3-stage sequence. For low-risk, use a gentle nudge. Ask the Channel Agent to select the best channel per customer. Coordinate with the Content Agent for personalization. Exit on re-engagement or after 3 failed attempts.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const wbContent = query.insert('agents', {
    name: 'Win-back Content Agent', role: 'content', type: 'agent',
    description: 'Personalizes win-back messages based on the customer\'s purchase history, last interaction, and churn risk level.',
    system_instructions: 'Personalize win-back messages across 3 stages. Stage 1 ("We miss you"): emotional, highlight what\'s new since they left, show products from their favorite categories. Stage 2 ("Value reminder"): feature their past favorites, show popular items they haven\'t seen. Stage 3 ("Final offer"): strongest incentive, create urgency with time-limited discount. For VIP lapsed customers, add exclusive perks language.',
    skill_ids: [skill8.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const wbTargeting = query.insert('agents', {
    name: 'Win-back Targeting Agent', role: 'targeting', type: 'agent',
    description: 'Identifies and scores lapsed customers using RFM analysis. Segments them by churn risk and lifetime value for prioritized outreach.',
    system_instructions: 'Score every inactive customer using RFM analysis. Classify churn risk as low (30-45 days inactive), medium (45-60 days), or high (>60 days). Cross-reference with lifetime value: high-value churners get immediate, aggressive win-back. Low-value churners get lighter touches. Output a priority queue for the Orchestrator.',
    skill_ids: [skill9.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['condition'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const wbChannel = query.insert('agents', {
    name: 'Win-back Channel Agent', role: 'channel', type: 'agent',
    description: 'Selects the optimal communication channel for each lapsed customer based on historical engagement patterns and channel preferences.',
    system_instructions: 'Analyze each customer\'s historical channel engagement. If they primarily opened emails, use email. If they responded better to SMS, use SMS. For push-engaged customers, lead with push. For high-value lapsed customers, consider multi-channel approach (email + SMS). Default to email if no preference data exists.',
    skill_ids: [skill10.lastID], tool_ids: [],
    output_schema: [],
    node_ids: [],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const wbTiming = query.insert('agents', {
    name: 'Win-back Timing Agent', role: 'timing', type: 'agent',
    description: 'Determines optimal send times and stage intervals for each lapsed customer, accounting for their historical engagement patterns.',
    system_instructions: 'For high-churn-risk customers, compress the sequence (10-day gaps instead of 15). For medium-risk, use standard 15-day gaps. Time each message for the customer\'s historical peak engagement window. If no engagement data, default to Tuesday/Thursday mornings in their timezone.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Birthday sub-agents
  const bdOrch = query.insert('agents', {
    name: 'Birthday Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates the birthday celebration sequence. Dynamically selects gift type, channel, and timing based on customer tier and preferences — not a fixed email blast.',
    system_instructions: 'You orchestrate the birthday experience. 7 days before: send a teaser via the customer\'s preferred channel. On birthday: deliver the personalized gift (ask the Content Agent for gift selection). 3 days after: if unredeemed, send a reminder. Ask the Analyst to determine the optimal gift based on customer tier. Coordinate with Timing Agent for send windows.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const bdContent = query.insert('agents', {
    name: 'Birthday Content Agent', role: 'content', type: 'agent',
    description: 'Creates personalized birthday messages and selects the right gift type and value for each customer.',
    system_instructions: 'Create warm, celebratory birthday messages. Teaser: build excitement, hint at the upcoming gift. Birthday email: make it feel special — use their name prominently, include confetti/celebration imagery. Gift selection: new customers get 15% off, active customers get a free product sample from their favorite category, loyal customers get 25% off + early access to new arrivals. Post-birthday reminder: gentle urgency, show what they\'re missing.',
    skill_ids: [skill11.lastID, skill12.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const bdAnalyst = query.insert('agents', {
    name: 'Birthday Analyst Agent', role: 'analyst', type: 'agent',
    description: 'Analyzes customer tier, purchase history, and preferences to recommend the optimal birthday gift and offer value.',
    system_instructions: 'Analyze the customer to determine optimal birthday offer. Check their tier (new/active/loyal based on purchase count), average order value, favorite categories, and channel preference. New (<2 purchases): percentage discount. Active (2-10): free sample from top category. Loyal (>10): exclusive early access + premium discount. Output: gift_type, gift_value, preferred_channel.',
    skill_ids: [skill12.lastID], tool_ids: [],
    output_schema: [],
    node_ids: [],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const bdTiming = query.insert('agents', {
    name: 'Birthday Timing Agent', role: 'timing', type: 'agent',
    description: 'Manages the birthday sequence timing, ensuring messages arrive at the perfect moment around the customer\'s birthday.',
    system_instructions: 'Teaser: 7 days before birthday, send during morning hours in customer\'s timezone. Birthday message: send at 9am local time on the birthday. Reminder: 3 days after birthday during peak engagement window. If birthday falls on a weekend, adjust teaser to Thursday before. Track timezone carefully.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Loyalty Milestone sub-agents
  const loyaltyOrch = query.insert('agents', {
    name: 'Loyalty Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates loyalty program interactions. Proactively detects approaching milestones, triggers celebrations, and manages the VIP experience pipeline — not just reacting to threshold events.',
    system_instructions: 'You orchestrate all loyalty interactions. Continuously monitor customers approaching milestones. When within 20% of a tier upgrade: trigger a progress nudge via the Content Agent. On milestone: coordinate a multi-channel celebration (email + push). On tier upgrade: trigger the full upgrade celebration sequence. For VIP tier members, delegate to the VIP Content Agent for exclusive offerings. Track reward redemption and adjust future rewards accordingly.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const loyaltyContent = query.insert('agents', {
    name: 'Loyalty Content Agent', role: 'content', type: 'agent',
    description: 'Creates personalized milestone recognition messages, tier-progress nudges, and upgrade celebrations.',
    system_instructions: 'Create compelling loyalty messages. Progress nudges: show exact points/spend needed, preview upcoming tier benefits, create motivation. Milestone celebrations: acknowledge the achievement with specifics ("You\'ve made 25 purchases!"), deliver the reward clearly. Tier upgrades: make it feel like a promotion — new tier name prominently, full benefits breakdown, welcome-to-tier exclusive offer. Use customer\'s name and personalize with their purchase journey.',
    skill_ids: [skill13.lastID, skill14.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const loyaltyVipContent = query.insert('agents', {
    name: 'Loyalty VIP Content Agent', role: 'content', type: 'agent',
    description: 'Specializes in premium content for top-tier loyalty members, including early access notifications and exclusive product reveals.',
    system_instructions: 'Create premium, exclusive-feeling content for VIP members. Early access emails: make them feel like insiders, include countdown to public launch. VIP-only products: present as curated just for them. Concierge recommendations: personal, editorial-style picks based on their purchase DNA. Tone: premium, intimate, appreciative — not promotional.',
    skill_ids: [skill15.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const loyaltyAnalyst = query.insert('agents', {
    name: 'Loyalty Analyst Agent', role: 'analyst', type: 'agent',
    description: 'Monitors loyalty program metrics, detects milestone proximity, and recommends optimal reward types based on customer behavior.',
    system_instructions: 'Monitor all loyalty members continuously. Track: current tier, points/spend to next milestone, days since last purchase, reward redemption history. Flag customers within 20% of a milestone for proactive nudging. Recommend reward types based on past redemption: if they redeemed discounts, offer discounts; if they redeemed free shipping, offer shipping perks. Score each customer\'s loyalty health as thriving/stable/at-risk.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['condition'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const loyaltyTiming = query.insert('agents', {
    name: 'Loyalty Timing Agent', role: 'timing', type: 'agent',
    description: 'Optimizes the timing of loyalty communications, ensuring milestone celebrations feel immediate and progress nudges arrive at purchase-decision moments.',
    system_instructions: 'Milestone celebrations: send within 1 hour of milestone trigger. Tier upgrade celebrations: send immediately with a follow-up benefits guide the next day. Progress nudges: send during the customer\'s typical shopping window (based on purchase time patterns). VIP early access: send exactly {early_access_hours} hours before public launch.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // Browse Abandonment sub-agents
  const browseOrch = query.insert('agents', {
    name: 'Browse Recovery Orchestrator', role: 'orchestrator', type: 'agent',
    description: 'Coordinates browse abandonment recovery. Analyzes session intent to determine outreach intensity — casual browsers get a single light touch, high-intent browsers get a multi-channel sequence.',
    system_instructions: 'You orchestrate browse abandonment recovery. First, ask the Analyst to score the browse session intent (casual/interested/high-intent). For casual browsers (<30s avg dwell): single email after 24h. For interested browsers: email after 2h + follow-up after 1 day. For high-intent browsers (3+ products, >60s dwell): email after 1h + push after 4h + email after 1 day. Always check if the customer returned or purchased before each touchpoint. Exit on purchase or cart-add.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['entry', 'exit'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const browseContent = query.insert('agents', {
    name: 'Browse Recovery Content Agent', role: 'content', type: 'agent',
    description: 'Creates personalized browse reminder messages featuring the exact products viewed, similar alternatives, and social proof.',
    system_instructions: 'Create browse recovery messages. Include the exact products they viewed with images. Add 2-3 similar alternatives from the same category. Include social proof ("12 people are looking at this right now"). For high-intent browsers, add urgency ("Selling fast" or "Low stock"). For price-sensitive browsers (viewed sale items), highlight any discounts. Never repeat the same product layout in consecutive messages.',
    skill_ids: [skill16.lastID], tool_ids: [],
    output_schema: [],
    node_ids: ['email'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const browseAnalyst = query.insert('agents', {
    name: 'Browse Recovery Analyst Agent', role: 'analyst', type: 'agent',
    description: 'Analyzes browse sessions to score purchase intent, identify most-viewed products, and recommend outreach intensity.',
    system_instructions: 'Analyze the browse session in detail. Score intent: casual (<30s avg dwell, 1-2 pages), interested (30-60s, 3-5 pages), high-intent (>60s or 5+ products or comparison behavior). Identify the top 3 products by dwell time. Detect comparison behavior (same-category multi-view). Output: intent_score (0-100), intent_level, top_products, recommended_outreach_intensity (light/standard/aggressive).',
    skill_ids: [skill17.lastID], tool_ids: [],
    output_schema: [],
    node_ids: [],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const browseTiming = query.insert('agents', {
    name: 'Browse Recovery Timing Agent', role: 'timing', type: 'agent',
    description: 'Determines optimal timing for browse recovery messages based on session recency and customer engagement patterns.',
    system_instructions: 'Timing depends on intent level. High-intent: first touch within 1 hour (while products are fresh in mind). Interested: first touch within 2-4 hours. Casual: wait 24 hours. Follow-ups: next day during peak engagement window. If the customer typically shops in the evening, time messages for early evening. Never send browse reminders between 10pm-8am local time.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: ['wait1'],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  const browseChannel = query.insert('agents', {
    name: 'Browse Recovery Channel Agent', role: 'channel', type: 'agent',
    description: 'Selects the optimal channel for browse recovery based on urgency level and customer channel preferences.',
    system_instructions: 'Channel selection by intent: casual=email only, interested=email (then push if no response), high-intent=push immediately + email backup. For app-active customers, prefer push for first touchpoint. For email-engaged customers, use email. If customer has SMS consent and is high-intent, consider SMS for the first touchpoint. Multi-channel approach only for high-intent browsers.',
    skill_ids: [], tool_ids: [],
    output_schema: [],
    node_ids: [],
    status: 'active', created_by: 'System', created_at: now, updated_at: now
  });

  // ── Orchestrator agents (type: 'orchestrator') ────────────────

  // Agent 6 first: Loyalty Milestone Agent (needed for invoke_agent reference in Agent 3)
  const loyaltyMilestoneAgent = query.insert('agents', {
    name: 'Loyalty Milestone Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that recognizes and rewards loyalty milestones. Unlike the deterministic "Loyalty Milestone Reached" workflow which triggers a single email at preset thresholds, this agent proactively nudges customers approaching milestones, personalizes rewards by tier, and celebrates upgrades across multiple channels.',
    goal: 'Increase loyalty program engagement by 30% through proactive milestone recognition, tier-upgrade celebrations, and personalized VIP experiences — driving a 15% lift in repeat purchase rate.',
    source_workflow_id: loyaltyWfId,
    workflow_snapshot: loyaltyWf ? loyaltyWf.orchestration : null,
    child_agents: [
      { agent_id: loyaltyOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: loyaltyContent.lastID, node_ids: ['email'] },
      { agent_id: loyaltyVipContent.lastID, node_ids: ['email'] },
      { agent_id: loyaltyAnalyst.lastID, node_ids: ['condition'] },
      { agent_id: loyaltyTiming.lastID, node_ids: ['wait1'] }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 3,
      channel_limits: { email: 3, sms: 1, push: 2 },
      require_approval: false,
      budget_limit: null
    },
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 1: Cart Abandonment Recovery Agent ───────────────────
  query.insert('agents', {
    name: 'Cart Abandonment Recovery Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that recovers abandoned shopping carts using escalating outreach, optimal timing, and conversion tracking. Unlike the deterministic "Cart Abandonment Recovery" workflow which follows a fixed 3-email sequence, this agent dynamically adjusts messaging intensity, channel selection, and discount levels based on real-time customer behavior.',
    goal: 'Recover abandoned carts by re-engaging customers with timely, personalized reminders and escalating incentives — targeting a 15%+ recovery rate.',
    source_workflow_id: cartWfId,
    workflow_snapshot: cartWf ? cartWf.orchestration : null,
    child_agents: [
      { agent_id: cartOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: cartContent.lastID, node_ids: ['email'] },
      { agent_id: cartTiming.lastID, node_ids: ['wait1'] },
      { agent_id: cartConversion.lastID, node_ids: ['condition'] }
    ],
    logic_nodes: [
      { id: 'ln_cart_1', type: 'delay', slot: 1, label: 'Wait 1 hour', config: { duration: 1, unit: 'hours', description: 'Wait before first reminder' } },
      { id: 'ln_cart_2', type: 'gate', slot: 1, label: 'Customer opted-in?', config: { expression: 'email_opt_in == true', fallback: 'skip', description: 'Only proceed if customer has email opt-in' } },
      { id: 'ln_cart_3', type: 'parallel', slot: 1, label: 'Personalize & optimize timing', config: { branches: [1, 2], wait_mode: 'all', description: 'Run Content Agent and Timing Agent simultaneously — generate personalized message while determining optimal send time' } },
      { id: 'ln_cart_4', type: 'condition', slot: 3, label: 'Cart value > $50?', config: { expression: 'cart_value > 50', then_label: 'High value — track closely', else_label: 'Low value — standard', then_target: 3, else_target: null, description: 'High-value carts get priority conversion tracking' } },
      { id: 'ln_cart_5', type: 'loop', slot: 4, label: 'Retry up to 3 times', config: { loop_type: 'count', count: 3, max_iterations: 3, description: 'Escalate through reminder stages' } },
      { id: 'ln_cart_6', type: 'wait_event', slot: 3, label: 'Wait for purchase', config: { event_type: 'purchase', timeout_duration: 48, timeout_unit: 'hours', timeout_action: 'continue', description: 'Stop the sequence if the customer completes the purchase' } }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 2,
      channel_limits: { email: 2, sms: 1, push: 1 },
      require_approval: true,
      budget_limit: null
    },
    triggers: [
      { type: 'event', event_name: 'cart_abandoned', enabled: true },
      { type: 'api', api_key: '', enabled: true }
    ],
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 2: Welcome Series Onboarding Agent ──────────────────
  query.insert('agents', {
    name: 'Welcome Series Onboarding Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that onboards new subscribers with a personalized welcome series. Unlike the deterministic "Welcome Email Series" workflow which sends the same 3 emails to everyone, this agent adapts content, timing, and channel mix based on each subscriber\'s signup source, stated interests, and real-time engagement.',
    goal: 'Convert new subscribers into first-time buyers within 7 days through a warm, educational welcome sequence with a personalized first-purchase incentive.',
    source_workflow_id: welcomeWfId,
    workflow_snapshot: welcomeWf ? welcomeWf.orchestration : null,
    child_agents: [
      { agent_id: welcomeOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: welcomeContent.lastID, node_ids: ['email'] },
      { agent_id: welcomeTiming.lastID, node_ids: ['wait1'] }
    ],
    logic_nodes: [
      { id: 'ln_wlc_1', type: 'wait_event', slot: 0, label: 'Wait for email open',
        config: { event_type: 'email_open', timeout_duration: 24, timeout_unit: 'hours', timeout_action: 'continue', description: 'Wait for the welcome email to be opened before continuing the sequence' } },
      { id: 'ln_wlc_2', type: 'ab_split', slot: 1, label: 'Content variant test',
        config: { variants: [
          { name: 'A', weight: 50, target: 1 },
          { name: 'B', weight: 50, target: 2 }
        ], description: 'Test two content approaches — educational vs promotional' } }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 2,
      channel_limits: { email: 2, sms: 0, push: 1 },
      require_approval: false,
      budget_limit: null
    },
    triggers: [
      { type: 'event', event_name: 'signup', enabled: true },
      { type: 'schedule', frequency: 'daily', time: '08:00', enabled: true }
    ],
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 3: Post-Purchase Follow-up Agent ────────────────────
  query.insert('agents', {
    name: 'Post-Purchase Follow-up Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that maximizes customer lifetime value after a purchase. Unlike the deterministic "Post-Purchase Follow-up" workflow which sends a fixed thank-you and cross-sell email, this agent dynamically selects cross-sell products, adjusts follow-up timing based on product category, and adapts channel based on customer preference.',
    goal: 'Increase repeat purchase rate by 20% and generate product reviews through personalized post-purchase engagement — thank-you, review request, and cross-sell within 14 days of purchase.',
    source_workflow_id: postPurchaseWfId,
    workflow_snapshot: postPurchaseWf ? postPurchaseWf.orchestration : null,
    child_agents: [
      { agent_id: ppOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: ppContent.lastID, node_ids: ['email'] },
      { agent_id: ppTiming.lastID, node_ids: ['wait1'] },
      { agent_id: ppConversion.lastID, node_ids: ['condition'] }
    ],
    logic_nodes: [
      { id: 'ln_pp_1', type: 'delay', slot: 1, label: 'Wait for delivery', config: { duration: 3, unit: 'days', description: 'Wait for product delivery before requesting review' } },
      { id: 'ln_pp_2', type: 'transform', slot: 1, label: 'Enrich with product data', config: { mappings: [{ from: 'order.product_ids', to: 'recommendation_context' }, { from: 'customer.browse_history', to: 'affinity_signals' }], description: 'Prepare data for cross-sell recommendations' } },
      { id: 'ln_pp_3', type: 'condition', slot: 2, label: 'High-value order?', config: { expression: 'order_value > 100', then_label: 'Premium follow-up', else_label: 'Standard follow-up', then_target: 2, else_target: 3, description: 'High-value orders get timing optimization; standard orders skip to conversion tracking' } },
      { id: 'ln_pp_4', type: 'invoke_agent', slot: 4, label: 'Trigger Loyalty Agent', config: { target_agent_id: loyaltyMilestoneAgent.lastID, pass_context: true, wait_for_completion: false, description: 'After conversion tracking, hand off to the Loyalty Program agent for points and engagement' } }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 2,
      channel_limits: { email: 3, sms: 1, push: 1 },
      require_approval: false,
      budget_limit: null
    },
    triggers: [
      { type: 'event', event_name: 'purchase_completed', enabled: true },
      { type: 'event', event_name: 'order_shipped', enabled: true }
    ],
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 4: Win-back Re-engagement Agent ─────────────────────
  query.insert('agents', {
    name: 'Win-back Re-engagement Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that re-activates lapsed customers. Unlike the deterministic "Winback Inactive Contacts" workflow which applies a one-size-fits-all 3-email sequence, this agent scores churn risk, selects optimal channels per customer, and personalizes incentive levels based on customer lifetime value.',
    goal: 'Re-engage 25%+ of lapsed customers (inactive >30 days) and recover at least 10% as active purchasers through personalized, multi-channel win-back sequences.',
    source_workflow_id: winbackWfId,
    workflow_snapshot: winbackWf ? winbackWf.orchestration : null,
    child_agents: [
      { agent_id: wbOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: wbContent.lastID, node_ids: ['email'] },
      { agent_id: wbTargeting.lastID, node_ids: ['condition'] },
      { agent_id: wbChannel.lastID, node_ids: [] },
      { agent_id: wbTiming.lastID, node_ids: ['wait1'] }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 1,
      channel_limits: { email: 2, sms: 1, push: 1 },
      require_approval: true,
      budget_limit: 5000
    },
    triggers: [
      { type: 'segment', segment_name: 'Lapsed 30+ days', condition: 'enters', enabled: true },
      { type: 'schedule', frequency: 'weekly', time: '10:00', day_of_week: 'monday', enabled: true }
    ],
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 5: Birthday Rewards Agent ───────────────────────────
  query.insert('agents', {
    name: 'Birthday Rewards Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that creates personalized birthday experiences. Unlike the deterministic "Birthday Rewards" workflow which sends the same discount to everyone, this agent tailors the gift type and value based on customer tier, selects the best channel, and adjusts timing around the birthday.',
    goal: 'Achieve 40%+ birthday offer redemption rate by delivering personalized, tier-appropriate birthday rewards through the customer\'s preferred channel at the optimal moment.',
    source_workflow_id: birthdayWfId,
    workflow_snapshot: birthdayWf ? birthdayWf.orchestration : null,
    child_agents: [
      { agent_id: bdOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: bdContent.lastID, node_ids: ['email'] },
      { agent_id: bdAnalyst.lastID, node_ids: [] },
      { agent_id: bdTiming.lastID, node_ids: ['wait1'] }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 2,
      channel_limits: { email: 2, sms: 1, push: 1 },
      require_approval: false,
      budget_limit: null
    },
    triggers: [
      { type: 'event', event_name: 'birthday_approaching', enabled: true },
      { type: 'schedule', frequency: 'daily', time: '07:00', enabled: true }
    ],
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  // ── Agent 7: Browse Abandonment Agent ─────────────────────────
  query.insert('agents', {
    name: 'Browse Abandonment Agent',
    type: 'orchestrator',
    description: 'An intelligent agent that re-engages customers who browsed products without adding to cart. There is no deterministic workflow equivalent — this is a purely agentic use case. The agent analyzes browse session intent, selects the most relevant products to feature, and adapts outreach intensity based on browsing depth.',
    goal: 'Convert 8%+ of browse abandoners into cart-adders or purchasers by delivering timely, personalized product reminders based on browsing behavior and purchase intent signals.',
    source_workflow_id: null,
    workflow_snapshot: null,
    child_agents: [
      { agent_id: browseOrch.lastID, node_ids: ['entry', 'exit'] },
      { agent_id: browseContent.lastID, node_ids: ['email'] },
      { agent_id: browseAnalyst.lastID, node_ids: [] },
      { agent_id: browseTiming.lastID, node_ids: ['wait1'] },
      { agent_id: browseChannel.lastID, node_ids: [] }
    ],
    guardrails: {
      max_messages_per_contact_per_day: 2,
      channel_limits: { email: 2, sms: 1, push: 2 },
      require_approval: false,
      budget_limit: null
    },
    status: 'active',
    created_by: 'System',
    created_at: now,
    updated_at: now
  });

  const skillCount = query.count('agent_skills');
  const leafCount = 30;
  const orchCount = 7;
  console.log(`🤖 Seeded: ${leafCount} agents + ${orchCount} orchestrators and ${skillCount} skills`);
}

function ensureSeedAgentTools() {
  const existing = query.all('agent_tools');
  if (existing.length > 0) return;

  const platformTools = [
    {
      name: 'Send Email',
      description: 'Sends a personalized email to a contact using a template or dynamic content. Supports HTML content, subject line personalization, and attachment handling.',
      type: 'platform',
      category: 'channel',
      icon: 'email',
      endpoint: '/api/deliveries/send',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 30000,
      retry_policy: { max_retries: 2, backoff_ms: 5000 },
      parameters: [
        { name: 'to', type: 'string', required: true, default_value: '', description: 'Recipient email address' },
        { name: 'subject', type: 'string', required: true, default_value: '', description: 'Email subject line (supports {{placeholders}})' },
        { name: 'template_id', type: 'number', required: false, default_value: '', description: 'Content template ID to use' },
        { name: 'html_body', type: 'string', required: false, default_value: '', description: 'Raw HTML body (used if no template_id)' },
        { name: 'personalization', type: 'object', required: false, default_value: '{}', description: 'Key-value pairs for template placeholders' }
      ],
      input_schema: { to: 'string', subject: 'string', template_id: 'number', personalization: 'object' },
      output_schema: { message_id: 'string', status: 'string', delivered_at: 'string' }
    },
    {
      name: 'Send SMS',
      description: 'Sends an SMS message to a contact\'s mobile number. Supports personalized content and URL shortening.',
      type: 'platform',
      category: 'channel',
      icon: 'sms',
      endpoint: '/api/sms/send',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 15000,
      retry_policy: { max_retries: 1, backoff_ms: 3000 },
      parameters: [
        { name: 'phone_number', type: 'string', required: true, default_value: '', description: 'Recipient phone number (E.164 format)' },
        { name: 'message', type: 'string', required: true, default_value: '', description: 'SMS body text (max 160 chars for single segment)' },
        { name: 'sender_id', type: 'string', required: false, default_value: '', description: 'Sender ID or short code' }
      ],
      input_schema: { phone_number: 'string', message: 'string' },
      output_schema: { message_id: 'string', status: 'string', segments: 'number' }
    },
    {
      name: 'Send Push Notification',
      description: 'Sends a push notification to a contact\'s mobile device. Supports rich media, deep links, and action buttons.',
      type: 'platform',
      category: 'channel',
      icon: 'push',
      endpoint: '/api/push/send',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 10000,
      retry_policy: { max_retries: 1, backoff_ms: 2000 },
      parameters: [
        { name: 'device_token', type: 'string', required: true, default_value: '', description: 'Device push token' },
        { name: 'title', type: 'string', required: true, default_value: '', description: 'Notification title' },
        { name: 'body', type: 'string', required: true, default_value: '', description: 'Notification body text' },
        { name: 'deep_link', type: 'string', required: false, default_value: '', description: 'Deep link URL to open on tap' },
        { name: 'image_url', type: 'string', required: false, default_value: '', description: 'Rich media image URL' }
      ],
      input_schema: { device_token: 'string', title: 'string', body: 'string' },
      output_schema: { notification_id: 'string', status: 'string' }
    },
    {
      name: 'Query Profiles',
      description: 'Searches and retrieves customer profiles matching specified criteria. Supports filtering by attributes, segments, and engagement metrics.',
      type: 'platform',
      category: 'data',
      icon: 'search',
      endpoint: '/api/contacts',
      method: 'GET',
      auth_type: 'none',
      timeout_ms: 15000,
      retry_policy: { max_retries: 0, backoff_ms: 1000 },
      parameters: [
        { name: 'filter', type: 'object', required: false, default_value: '{}', description: 'Filter criteria (field/operator/value)' },
        { name: 'limit', type: 'number', required: false, default_value: '100', description: 'Max records to return' },
        { name: 'fields', type: 'string', required: false, default_value: '', description: 'Comma-separated list of fields to include' }
      ],
      input_schema: { filter: 'object', limit: 'number' },
      output_schema: { profiles: 'array', total_count: 'number' }
    },
    {
      name: 'Update Profile',
      description: 'Updates one or more attributes on a customer profile. Supports setting, incrementing, and appending to profile fields.',
      type: 'platform',
      category: 'data',
      icon: 'edit',
      endpoint: '/api/contacts/:id',
      method: 'PUT',
      auth_type: 'none',
      timeout_ms: 10000,
      retry_policy: { max_retries: 1, backoff_ms: 2000 },
      parameters: [
        { name: 'profile_id', type: 'number', required: true, default_value: '', description: 'Contact/profile ID to update' },
        { name: 'attributes', type: 'object', required: true, default_value: '{}', description: 'Key-value pairs of attributes to set' }
      ],
      input_schema: { profile_id: 'number', attributes: 'object' },
      output_schema: { updated: 'boolean', profile: 'object' }
    },
    {
      name: 'Query Audience',
      description: 'Retrieves members of a predefined audience segment. Returns matching profiles with their attributes and engagement data.',
      type: 'platform',
      category: 'data',
      icon: 'audience',
      endpoint: '/api/audiences/:id/members',
      method: 'GET',
      auth_type: 'none',
      timeout_ms: 30000,
      retry_policy: { max_retries: 0, backoff_ms: 1000 },
      parameters: [
        { name: 'audience_id', type: 'number', required: true, default_value: '', description: 'Audience/segment ID' },
        { name: 'limit', type: 'number', required: false, default_value: '1000', description: 'Max members to return' }
      ],
      input_schema: { audience_id: 'number', limit: 'number' },
      output_schema: { members: 'array', audience_size: 'number' }
    },
    {
      name: 'Create Delivery',
      description: 'Creates a new campaign delivery (email, SMS, or push) with targeting, content, and scheduling configuration.',
      type: 'platform',
      category: 'channel',
      icon: 'delivery',
      endpoint: '/api/deliveries',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 20000,
      retry_policy: { max_retries: 1, backoff_ms: 3000 },
      parameters: [
        { name: 'name', type: 'string', required: true, default_value: '', description: 'Delivery name' },
        { name: 'channel', type: 'string', required: true, default_value: 'email', description: 'Channel: email, sms, or push' },
        { name: 'audience_id', type: 'number', required: false, default_value: '', description: 'Target audience ID' },
        { name: 'template_id', type: 'number', required: false, default_value: '', description: 'Content template ID' },
        { name: 'scheduled_at', type: 'string', required: false, default_value: '', description: 'ISO 8601 scheduled send time' }
      ],
      input_schema: { name: 'string', channel: 'string', audience_id: 'number' },
      output_schema: { delivery_id: 'number', status: 'string' }
    },
    {
      name: 'HTTP Request',
      description: 'Makes an arbitrary HTTP request to an external API endpoint. Supports all HTTP methods, custom headers, and request body.',
      type: 'platform',
      category: 'integration',
      icon: 'http',
      endpoint: '',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 30000,
      retry_policy: { max_retries: 2, backoff_ms: 5000 },
      parameters: [
        { name: 'url', type: 'string', required: true, default_value: '', description: 'Full URL to call' },
        { name: 'method', type: 'string', required: false, default_value: 'GET', description: 'HTTP method (GET, POST, PUT, DELETE)' },
        { name: 'headers', type: 'object', required: false, default_value: '{}', description: 'Custom request headers' },
        { name: 'body', type: 'object', required: false, default_value: '', description: 'Request body (JSON)' }
      ],
      input_schema: { url: 'string', method: 'string', headers: 'object', body: 'object' },
      output_schema: { status_code: 'number', response_body: 'object', headers: 'object' }
    },
    {
      name: 'Generate Content (AI)',
      description: 'Uses AI to generate personalized marketing content — subject lines, email copy, SMS messages, or push notification text.',
      type: 'platform',
      category: 'content',
      icon: 'ai',
      endpoint: '/api/ai/generate',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 60000,
      retry_policy: { max_retries: 1, backoff_ms: 5000 },
      parameters: [
        { name: 'content_type', type: 'string', required: true, default_value: 'email_body', description: 'Type: subject_line, email_body, sms, push' },
        { name: 'prompt', type: 'string', required: true, default_value: '', description: 'Generation prompt/instructions' },
        { name: 'tone', type: 'string', required: false, default_value: 'professional', description: 'Tone: professional, casual, urgent, friendly' },
        { name: 'max_length', type: 'number', required: false, default_value: '500', description: 'Max character length for generated content' },
        { name: 'context', type: 'object', required: false, default_value: '{}', description: 'Additional context (product, customer data)' }
      ],
      input_schema: { content_type: 'string', prompt: 'string', tone: 'string' },
      output_schema: { generated_text: 'string', alternatives: 'array', tokens_used: 'number' }
    },
    {
      name: 'Wait / Delay',
      description: 'Pauses execution for a specified duration. Used for timing sequences like drip campaigns or follow-up cadences.',
      type: 'platform',
      category: 'utility',
      icon: 'wait',
      endpoint: '',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 0,
      retry_policy: { max_retries: 0, backoff_ms: 0 },
      parameters: [
        { name: 'duration', type: 'number', required: true, default_value: '24', description: 'Wait duration value' },
        { name: 'unit', type: 'string', required: false, default_value: 'hours', description: 'Time unit: minutes, hours, days' }
      ],
      input_schema: { duration: 'number', unit: 'string' },
      output_schema: { resumed_at: 'string' }
    },
    {
      name: 'Evaluate Condition',
      description: 'Evaluates a boolean condition against contact data or campaign metrics. Used for branching logic in workflows.',
      type: 'platform',
      category: 'utility',
      icon: 'condition',
      endpoint: '',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 5000,
      retry_policy: { max_retries: 0, backoff_ms: 0 },
      parameters: [
        { name: 'field', type: 'string', required: true, default_value: '', description: 'Field to evaluate (e.g., profile.email_opens)' },
        { name: 'operator', type: 'string', required: true, default_value: 'equals', description: 'Operator: equals, gt, lt, contains, exists' },
        { name: 'value', type: 'string', required: true, default_value: '', description: 'Value to compare against' }
      ],
      input_schema: { field: 'string', operator: 'string', value: 'string' },
      output_schema: { result: 'boolean', evaluated_value: 'string' }
    },
    {
      name: 'Log Event',
      description: 'Records a custom event to the event history for tracking, analytics, and triggering downstream automations.',
      type: 'platform',
      category: 'data',
      icon: 'log',
      endpoint: '/api/events',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 5000,
      retry_policy: { max_retries: 1, backoff_ms: 1000 },
      parameters: [
        { name: 'event_type', type: 'string', required: true, default_value: '', description: 'Event type (e.g., purchase, page_view, custom)' },
        { name: 'contact_id', type: 'number', required: true, default_value: '', description: 'Associated contact/profile ID' },
        { name: 'properties', type: 'object', required: false, default_value: '{}', description: 'Custom event properties' }
      ],
      input_schema: { event_type: 'string', contact_id: 'number', properties: 'object' },
      output_schema: { event_id: 'string', recorded_at: 'string' }
    }
  ];

  const customTools = [
    {
      name: 'Slack Notification',
      description: 'Sends a notification to a Slack channel or user via webhook. Use for internal team alerts, campaign status updates, or approval requests.',
      type: 'custom',
      category: 'integration',
      icon: 'slack',
      endpoint: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      method: 'POST',
      auth_type: 'none',
      timeout_ms: 10000,
      retry_policy: { max_retries: 2, backoff_ms: 3000 },
      parameters: [
        { name: 'channel', type: 'string', required: true, default_value: '#marketing-alerts', description: 'Slack channel name or user ID' },
        { name: 'message', type: 'string', required: true, default_value: '', description: 'Message text (supports Slack markdown)' },
        { name: 'username', type: 'string', required: false, default_value: 'CRM Bot', description: 'Bot display name' },
        { name: 'icon_emoji', type: 'string', required: false, default_value: ':robot_face:', description: 'Bot icon emoji' }
      ],
      input_schema: { channel: 'string', message: 'string' },
      output_schema: { ok: 'boolean', ts: 'string' },
      status: 'draft'
    },
    {
      name: 'Salesforce Sync',
      description: 'Synchronizes contact and campaign data with Salesforce CRM. Pushes lead/contact updates and pulls opportunity data.',
      type: 'custom',
      category: 'integration',
      icon: 'salesforce',
      endpoint: 'https://your-instance.salesforce.com/services/data/v58.0/sobjects',
      method: 'POST',
      auth_type: 'oauth',
      timeout_ms: 30000,
      retry_policy: { max_retries: 2, backoff_ms: 5000 },
      parameters: [
        { name: 'object_type', type: 'string', required: true, default_value: 'Lead', description: 'Salesforce object type (Lead, Contact, Campaign)' },
        { name: 'action', type: 'string', required: true, default_value: 'upsert', description: 'Action: create, update, upsert, query' },
        { name: 'record_data', type: 'object', required: true, default_value: '{}', description: 'Record field values to sync' },
        { name: 'external_id_field', type: 'string', required: false, default_value: 'Email', description: 'External ID field for upsert matching' }
      ],
      input_schema: { object_type: 'string', action: 'string', record_data: 'object' },
      output_schema: { id: 'string', success: 'boolean', errors: 'array' },
      status: 'draft'
    }
  ];

  for (const tool of [...platformTools, ...customTools]) {
    query.insert('agent_tools', {
      ...tool,
      status: tool.status || 'active',
      version: 1,
      created_by: 'System'
    });
  }

  console.log('🔧 Seeded', platformTools.length, 'platform tools +', customTools.length, 'custom tools');
}

function ensureSeedKnowledgeBase() {
  const existing = query.all('knowledge_base');
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const entries = [
    { title: 'Brand Voice Guidelines', category: 'brand_guidelines', content: 'Our brand voice is warm, professional, and empowering. Use active voice. Avoid jargon. Always lead with customer benefit. Tone varies by channel: email is conversational, SMS is concise and action-oriented, push notifications are urgent but friendly.', tags: ['voice', 'tone', 'writing'], created_at: now, updated_at: now },
    { title: 'Product Catalog — Spring 2026', category: 'product_catalog', content: 'Key collections: Urban Essentials ($29-$89), Premium Luxe ($120-$450), Active Lifestyle ($45-$150). Top sellers: Cashmere Blend Sweater (#SKU-2201), Organic Cotton Tee (#SKU-1105), Leather Crossbody Bag (#SKU-3301). Free shipping on orders $75+.', tags: ['products', 'spring', 'pricing'], created_at: now, updated_at: now },
    { title: 'Email Compliance Rules', category: 'compliance', content: 'All emails must include: physical address, unsubscribe link, sender identification. CAN-SPAM: honor opt-outs within 10 business days. GDPR: explicit consent required for EU contacts. CCPA: honor "Do Not Sell" requests. Maximum frequency: 2 emails/day per contact unless triggered by user action.', tags: ['legal', 'gdpr', 'can-spam'], created_at: now, updated_at: now },
    { title: 'Discount & Offer Rules', category: 'compliance', content: 'Maximum discount: 30% for standard customers, 40% for VIP/Platinum. Birthday offers: $10 off for Silver, $20 for Gold, $30 for Platinum. Stacking: only one promo code per order. Cart abandonment: first reminder no discount, second reminder 10% off, third reminder 15% off + free shipping.', tags: ['discounts', 'pricing', 'offers'], created_at: now, updated_at: now },
    { title: 'Loyalty Program Tiers', category: 'faq', content: 'Silver (0-499 pts): 1x points multiplier, basic perks. Gold (500-999 pts): 1.5x multiplier, early access to sales. Platinum (1000+ pts): 2x multiplier, free shipping, exclusive products, personal shopper. Points expire after 12 months of inactivity.', tags: ['loyalty', 'tiers', 'rewards'], created_at: now, updated_at: now },
    { title: 'Cart Abandonment Best Practices', category: 'templates', content: 'Timing: 1st email at 1 hour, 2nd at 24 hours, 3rd at 72 hours. Subject lines should reference specific products. Include product images and a clear CTA. Personalize based on cart value: high-value carts get priority and phone follow-up. Always check if purchase was completed before sending.', tags: ['cart', 'abandonment', 'best-practices'], created_at: now, updated_at: now }
  ];
  entries.forEach(e => query.insert('knowledge_base', e));
  console.log(`📚 Seeded ${entries.length} knowledge base entries`);
}

function ensureSeedApprovals() {
  const existing = query.all('agent_approvals');
  if (existing.length > 0) return;
  const agents = query.all('agents');
  if (agents.length < 2) return;
  const now = new Date();
  const approvals = [
    { agent_id: agents[0].id, agent_name: agents[0].name, trigger_type: 'event', contact_id: 5, content_preview: 'Hi Sarah, we noticed you left some items in your cart. Your Cashmere Blend Sweater is waiting...', requested_by: 'System', status: 'pending', reviewer: null, notes: null, reviewed_at: null, created_at: new Date(now - 3600000).toISOString() },
    { agent_id: agents[1].id, agent_name: agents[1].name, trigger_type: 'schedule', contact_id: 12, content_preview: 'Welcome to our community! Here\'s your personalized getting-started guide based on your interests...', requested_by: 'System', status: 'pending', reviewer: null, notes: null, reviewed_at: null, created_at: new Date(now - 7200000).toISOString() },
    { agent_id: agents[0].id, agent_name: agents[0].name, trigger_type: 'event', contact_id: 8, content_preview: 'Don\'t miss out! Your cart total of $127.50 qualifies for free shipping. Complete your purchase now.', requested_by: 'System', status: 'approved', reviewer: 'Admin', notes: 'Looks good', reviewed_at: new Date(now - 1800000).toISOString(), created_at: new Date(now - 86400000).toISOString() }
  ];
  approvals.forEach(a => query.insert('agent_approvals', a));
  console.log(`📋 Seeded ${approvals.length} sample approvals`);
}

function ensureSeedFeedback() {
  const existing = query.all('feedback');
  if (existing.length > 0) return;

  const samples = [
    {
      subject: 'Add drag-and-drop email builder',
      description: 'It would be great to have a visual drag-and-drop email builder similar to what Adobe Journey Optimizer offers. Users should be able to drag content blocks like images, text, buttons, and dividers into an email canvas and customize each block.',
      category: 'feature_request',
      page_context: 'deliveries',
      status: 'approved',
      priority: 'high',
      ai_analysis: {
        detected_category: 'feature_request', priority: 'high', affected_areas: ['Deliveries', 'Content Management'],
        complexity: 'high', estimated_effort: '1-2 days', scope: ['Frontend', 'Backend'],
        implementation_steps: ['Analyze requirements and define acceptance criteria', 'Design database schema changes (if needed)', 'Implement backend API endpoints', 'Build frontend UI components', 'Integration testing and QA'],
        recommendations: ['High-complexity change — recommend a design review before implementation.'],
        confidence: 0.88, analyzed_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      submitted_by: 'current_user', reviewed_by: 'admin',
      approved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      attachments: []
    },
    {
      subject: 'Dashboard performance is slow with many contacts',
      description: 'When the contacts table has over 500 entries, the dashboard takes a long time to load. The charts and KPI cards seem to recalculate everything from scratch. Consider adding server-side caching or pagination for analytics queries.',
      category: 'performance',
      page_context: 'dashboard',
      status: 'under_review',
      priority: 'high',
      ai_analysis: {
        detected_category: 'performance', priority: 'high', affected_areas: ['Analytics', 'Contacts'],
        complexity: 'medium', estimated_effort: '2-4 hours', scope: ['Backend'],
        implementation_steps: ['Analyze requirements and define acceptance criteria', 'Design database schema changes (if needed)', 'Implement backend API endpoints', 'Build frontend UI components', 'Integration testing and QA'],
        recommendations: ['Standard request — can be scheduled in the next sprint.'],
        confidence: 0.85, analyzed_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      submitted_by: 'current_user',
      attachments: []
    },
    {
      subject: 'Workflow canvas crashes when adding too many nodes',
      description: 'When adding more than 15 nodes to the workflow orchestration canvas, the browser becomes unresponsive and sometimes crashes. This is a critical bug blocking our marketing team from building complex campaigns.',
      category: 'bug_report',
      page_context: 'workflows',
      status: 'submitted',
      priority: 'critical',
      ai_analysis: {
        detected_category: 'bug_report', priority: 'critical', affected_areas: ['Workflows'],
        complexity: 'medium', estimated_effort: '2-4 hours', scope: ['Frontend'],
        implementation_steps: ['Reproduce the reported issue', 'Identify root cause in affected module(s)', 'Implement fix with regression tests', 'Verify fix across affected workflows'],
        recommendations: ['This should be addressed immediately as it impacts core functionality.', 'Prioritize this fix to maintain platform stability.'],
        confidence: 0.92, analyzed_at: new Date(Date.now() - 3600000).toISOString()
      },
      submitted_by: 'current_user',
      attachments: ['screenshot-canvas-error.png']
    },
    {
      subject: 'Improve segment builder UI with visual query tree',
      description: 'The current segment builder works but could be improved with a visual query tree showing the relationship between conditions. Also add the ability to nest condition groups with AND/OR logic.',
      category: 'ui_improvement',
      page_context: 'segments',
      status: 'built',
      priority: 'medium',
      ai_analysis: {
        detected_category: 'ui_improvement', priority: 'medium', affected_areas: ['Segments', 'Navigation/UI'],
        complexity: 'medium', estimated_effort: '2-4 hours', scope: ['Frontend'],
        implementation_steps: ['Review current UI/UX patterns', 'Design updated component layouts', 'Implement CSS and HTML changes', 'Cross-browser testing'],
        recommendations: ['Standard request — can be scheduled in the next sprint.'],
        confidence: 0.85, analyzed_at: new Date(Date.now() - 86400000 * 7).toISOString()
      },
      submitted_by: 'current_user', reviewed_by: 'admin',
      approved_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      built_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      build_status: 'success',
      build_log: '[BUILD] Starting auto-build for: "Improve segment builder UI with visual query tree"\n[BUILD] Category: ui_improvement\n[BUILD] Priority: medium\n[BUILD] Scope: Frontend\n\n[STEP 1/4] Review current UI/UX patterns\n  ✓ Completed\n[STEP 2/4] Design updated component layouts\n  ✓ Completed\n[STEP 3/4] Implement CSS and HTML changes\n  ✓ Completed\n[STEP 4/4] Cross-browser testing\n  ✓ Completed\n\n[BUILD] All 4 steps completed successfully\n[BUILD] Affected areas: Segments, Navigation/UI',
      attachments: []
    },
    {
      subject: 'Add API webhook integrations',
      description: 'We need the ability to configure outgoing webhooks that fire when certain events happen — like when a contact opens an email, clicks a link, or when a workflow completes. This would allow integration with third-party tools like Slack, Zapier, and custom CRMs.',
      category: 'integration',
      page_context: 'workflows',
      status: 'rejected',
      priority: 'medium',
      ai_analysis: {
        detected_category: 'integration', priority: 'medium', affected_areas: ['Workflows', 'Deliveries'],
        complexity: 'high', estimated_effort: '1-2 days', scope: ['Frontend', 'Backend'],
        implementation_steps: ['Analyze requirements and define acceptance criteria', 'Design database schema changes (if needed)', 'Implement backend API endpoints', 'Build frontend UI components', 'Integration testing and QA'],
        recommendations: ['High-complexity change — recommend a design review before implementation.', 'This request spans multiple modules — consider breaking it into smaller tasks.'],
        confidence: 0.85, analyzed_at: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      submitted_by: 'current_user', reviewed_by: 'admin',
      rejected_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      admin_notes: 'Out of scope for current roadmap. Will revisit in Q3.',
      attachments: []
    }
  ];

  samples.forEach(fb => {
    query.insert('feedback', fb);
  });
  console.log(`💬 Seeded ${samples.length} sample feedback items`);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Initialize email service (SendGrid)
emailService.init();

// Middleware — larger JSON only for ACC workflow preview (embedded mdata)
app.use(cors());
app.use((req, res, next) => {
  const pathOnly = (req.originalUrl || req.url || '').split('?')[0];
  if (req.method === 'POST' && pathOnly === '/api/workflows/preview-json') {
    return express.json({ limit: '32mb' })(req, res, next);
  }
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// API Routes (register before express.static so /api/* is never shadowed by public files)
app.use('/api/contacts', contactsRouter); // Renamed from /api/customers - B2C focus
app.use('/api/workflows', workflowsRouter); // UNIFIED: Combines campaigns + workflows
app.use('/api/analytics', analyticsRouter);
app.use('/api/segments', segmentsRouter);
// Explicit POST so /api/ai/brand-alignment is always hit (before mount)
app.post('/api/ai/brand-alignment', (req, res, next) => {
  const orig = req.url;
  req.url = '/brand-alignment';
  aiRouter(req, res, (err) => {
    req.url = orig;
    if (err) next(err);
  });
});
app.use('/api/ai', aiRouter);
app.use('/api/orchestration', orchestrationRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/predefined-filters', predefinedFiltersRouter);
app.use('/api/email-templates', emailTemplatesRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/fragments', fragmentsRouter);
app.use('/api/landing-pages', landingPagesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/custom-objects', customObjectsRouter);
app.use('/api/enumerations', enumerationsRouter);
app.use('/api/audiences', audiencesRouter);
app.use('/api/query', queryRouter);
app.use('/api/transactional', transactionalRouter);

// Folder hierarchy
app.use('/api/folders', foldersRouter);
app.use('/api/email-themes', emailThemesRouter);

// Feedback system
app.use('/api/feedback', feedbackRouter);

// Agents, Skills & Tools
app.use('/api/agent-skills', agentSkillsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/agent-tools', agentToolsRouter);
app.use('/api/agent-schedules', agentSchedulesRouter);
app.use('/api/ai-nodes', aiNodesRouter);
app.use('/api/mobile', mobileRouter);

// Offer Decisioning routes
app.use('/api/offers', offersRouter);
app.use('/api/placements', placementsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/decision-rules', decisionRulesRouter);
app.use('/api/decisions', decisionsRouter);

// Legacy route redirects (for backward compatibility during transition)
app.use('/api/campaigns', (req, res) => {
  res.status(301).json({ 
    message: 'Campaigns have been unified into Workflows. Please use /api/workflows instead.',
    redirect: '/api/workflows'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'B2C Marketing Automation API',
    version: '2.0.0',
    endpoints: {
      contacts: '/api/contacts',
      workflows: '/api/workflows', // UNIFIED: Combines campaigns + workflows
      analytics: '/api/analytics',
      segments: '/api/segments',
      audiences: '/api/audiences',
      customObjects: '/api/custom-objects',
      ai: '/api/ai',
      health: '/api/health'
    },
    note: 'Campaigns have been unified into Workflows for a more powerful and flexible system'
  });
});

// Static assets (after API route registration)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API 404 handler - return JSON for any unmatched /api/* routes
// This MUST come before the HTML catch-all to prevent returning HTML for API requests
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Catch-all route to serve frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Startup seeds: additive only — never clear or overwrite user-created data (workflows, deliveries, contacts, etc.)
// Templates: only add/refresh sample records; fragments/enumerations/transactional: only run when table is empty
seedSampleTemplates();
seedSampleFragments();
seedSampleEnumerations();
seedSampleLandingPages();
seedSampleAssets();
if (typeof ensurePlaceholderFiles === 'function') ensurePlaceholderFiles();
seedSampleBrands();

// Ensure the demo delivery always exists on startup (adds one if missing only)
ensureDemoDelivery();

// ACC exports under sampleJson/ → draft workflows (additive; prefix [ACC Sample])
try {
  const accWf = ensureAccSampleWorkflowsFromDisk();
  if (accWf.created > 0) {
    console.log(`📥 Seeded ${accWf.created} ACC sample workflow(s) ([ACC Sample] …) from sampleJson/`);
  }
  if (accWf.failed > 0) {
    console.warn(`⚠️  ACC sample workflows: ${accWf.failed} file(s) failed —`, accWf.details.filter((d) => d.includes('failed') || d.includes('error') || d.includes('Invalid') || d.includes('import')).join('; ') || accWf.details.join('; '));
  }
  const repaired = repairAccSampleWorkflowFolders();
  if (repaired > 0) {
    console.log(`📁 Linked ${repaired} ACC sample workflow(s) to the Broadcast folder (was unfiled)`);
  }
} catch (e) {
  console.warn('ACC sample workflow seed:', e.message);
}

// Seed sample feedback items on startup if none exist
ensureSeedFeedback();

// Seed demo agents & skills if none exist
ensureSeedAgentsAndSkills();

// Seed agent tools if none exist
ensureSeedAgentTools();

// Seed knowledge base and approvals
ensureSeedKnowledgeBase();
ensureSeedApprovals();

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 B2C Marketing Automation Platform v2.0');
  console.log('==========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('📚 Available endpoints:');
  console.log('   - GET  /api/contacts');
  console.log('   - GET  /api/workflows (unified campaigns + workflows)');
  console.log('   - GET  /api/segments');
  console.log('   - GET  /api/analytics/dashboard');
  console.log('   - POST /api/ai/generate-subject');
  console.log('');
  console.log('✨ NEW: Unified Workflows System');
  console.log('   Campaigns and Workflows are now combined into one powerful system');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

module.exports = app;
