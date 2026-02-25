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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
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
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
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

// Seed sample feedback items on startup if none exist
ensureSeedFeedback();

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
