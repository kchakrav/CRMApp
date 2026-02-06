require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

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
const assetsRouter = require('./routes/assets');
const fragmentsRouter = require('./routes/fragments');
const landingPagesRouter = require('./routes/landingPages');
const customObjectsRouter = require('./routes/customObjects');
const audiencesRouter = require('./routes/audiences');
const queryRouter = require('./routes/query');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

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
app.use('/api/ai', aiRouter);
app.use('/api/orchestration', orchestrationRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/predefined-filters', predefinedFiltersRouter);
app.use('/api/email-templates', emailTemplatesRouter);
app.use('/api/assets', assetsRouter);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api/fragments', fragmentsRouter);
app.use('/api/landing-pages', landingPagesRouter);
app.use('/api/custom-objects', customObjectsRouter);
app.use('/api/audiences', audiencesRouter);
app.use('/api/query', queryRouter);

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
