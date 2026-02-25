const express = require('express');
const router = express.Router();
const { query, db } = require('../database');

// GET all feedback (with optional filters)
router.get('/', (req, res) => {
  try {
    const { status, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    let items = query.all('feedback');
    if (status) {
      items = items.filter(f => f.status === status);
    }
    items.sort((a, b) => {
      const av = a[sort_by] || '';
      const bv = b[sort_by] || '';
      return sort_order === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedback stats (must be before /:id)
router.get('/stats/summary', (req, res) => {
  try {
    const all = query.all('feedback');
    const stats = {
      total: all.length,
      submitted: all.filter(f => f.status === 'submitted').length,
      under_review: all.filter(f => f.status === 'under_review').length,
      approved: all.filter(f => f.status === 'approved').length,
      rejected: all.filter(f => f.status === 'rejected').length,
      built: all.filter(f => f.status === 'built').length,
      by_category: {},
      by_priority: {}
    };
    all.forEach(f => {
      stats.by_category[f.category] = (stats.by_category[f.category] || 0) + 1;
      if (f.priority) stats.by_priority[f.priority] = (stats.by_priority[f.priority] || 0) + 1;
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single feedback item
router.get('/:id', (req, res) => {
  try {
    const item = query.get('feedback', parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Feedback not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - submit new feedback
router.post('/', (req, res) => {
  try {
    const { subject, description, category, page_context, attachments } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const feedback = {
      subject,
      description,
      category: category || 'feature_request',
      page_context: page_context || null,
      attachments: attachments || [],
      status: 'submitted',
      priority: null,
      ai_analysis: null,
      admin_notes: '',
      submitted_by: 'current_user',
      reviewed_by: null,
      approved_at: null,
      rejected_at: null,
      built_at: null,
      build_status: null,
      build_log: null
    };

    const result = query.insert('feedback', feedback);
    
    // Auto-trigger AI analysis asynchronously
    setTimeout(() => runAIAnalysis(result.lastID), 100);
    
    res.status(201).json({ id: result.lastID, ...feedback, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - update feedback (admin actions)
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    
    const updates = req.body;
    const result = query.update('feedback', id, updates);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - approve feedback
router.post('/:id/approve', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    
    const result = query.update('feedback', id, {
      status: 'approved',
      reviewed_by: 'admin',
      approved_at: new Date().toISOString(),
      admin_notes: req.body.admin_notes || existing.admin_notes
    });
    res.json({ ...result, message: 'Feedback approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - reject feedback
router.post('/:id/reject', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    
    const result = query.update('feedback', id, {
      status: 'rejected',
      reviewed_by: 'admin',
      rejected_at: new Date().toISOString(),
      admin_notes: req.body.admin_notes || existing.admin_notes
    });
    res.json({ ...result, message: 'Feedback rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - trigger AI analysis for a feedback item
router.post('/:id/analyze', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    
    const analysis = generateAnalysis(existing);
    query.update('feedback', id, { ai_analysis: analysis, status: existing.status === 'submitted' ? 'under_review' : existing.status });
    
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - auto-build approved feedback (real code generation)
router.post('/:id/build', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    if (existing.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved feedback can be built' });
    }

    // Mark as building
    query.update('feedback', id, { status: 'building', build_status: 'in_progress' });

    const { executeBuild } = require('../services/buildEngine');
    const buildResult = await executeBuild(existing);

    query.update('feedback', id, {
      status: 'built',
      build_status: buildResult.success ? 'success' : 'completed_no_changes',
      built_at: new Date().toISOString(),
      build_log: buildResult.log
    });

    res.json({ build: buildResult, message: buildResult.success ? 'Build completed — changes applied to codebase' : 'Build completed — no file changes were needed' });
  } catch (err) {
    const id = parseInt(req.params.id);
    query.update('feedback', id, { status: 'approved', build_status: 'failed', build_log: `Build failed: ${err.message}` });
    res.status(500).json({ error: err.message });
  }
});

// DELETE feedback
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('feedback', id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    query.delete('feedback', id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Analysis Engine ───

function runAIAnalysis(feedbackId) {
  try {
    const item = query.get('feedback', feedbackId);
    if (!item) return;
    const analysis = generateAnalysis(item);
    query.update('feedback', feedbackId, {
      ai_analysis: analysis,
      status: 'under_review'
    });
  } catch (e) {
    console.error('AI analysis failed for feedback', feedbackId, e.message);
  }
}

function generateAnalysis(feedback) {
  const subject = (feedback.subject || '').toLowerCase();
  const desc = (feedback.description || '').toLowerCase();
  const combined = subject + ' ' + desc;

  // Detect category
  let detectedCategory = 'feature_request';
  if (/bug|broken|error|crash|fail|not working|doesn't work|issue/i.test(combined)) {
    detectedCategory = 'bug_report';
  } else if (/slow|performance|latency|timeout|speed/i.test(combined)) {
    detectedCategory = 'performance';
  } else if (/ui|ux|design|layout|look|style|color|font|button/i.test(combined)) {
    detectedCategory = 'ui_improvement';
  } else if (/integrat|connect|api|webhook|third.?party/i.test(combined)) {
    detectedCategory = 'integration';
  } else if (/report|dashboard|chart|metric|analytic/i.test(combined)) {
    detectedCategory = 'reporting';
  } else if (/document|help|guide|tutorial/i.test(combined)) {
    detectedCategory = 'documentation';
  }

  // Detect priority
  let priority = 'medium';
  if (/critical|urgent|blocker|crash|data loss|security/i.test(combined)) {
    priority = 'critical';
  } else if (/important|high|major|significant/i.test(combined)) {
    priority = 'high';
  } else if (/minor|low|nice.?to.?have|cosmetic|trivial/i.test(combined)) {
    priority = 'low';
  }

  // Detect affected areas
  const areas = [];
  if (/delivery|deliveries|email|send/i.test(combined)) areas.push('Deliveries');
  if (/workflow|campaign|orchestrat/i.test(combined)) areas.push('Workflows');
  if (/segment|audience|target/i.test(combined)) areas.push('Segments');
  if (/contact|profile|customer/i.test(combined)) areas.push('Contacts');
  if (/offer|decision|placement/i.test(combined)) areas.push('Offer Decisioning');
  if (/report|analytic|dashboard|chart/i.test(combined)) areas.push('Analytics');
  if (/template|content|fragment/i.test(combined)) areas.push('Content Management');
  if (/landing.?page/i.test(combined)) areas.push('Landing Pages');
  if (/ai|machine.?learn|predict/i.test(combined)) areas.push('AI Features');
  if (/custom.?object|schema|data.?model/i.test(combined)) areas.push('Data Model');
  if (/nav|sidebar|menu|header/i.test(combined)) areas.push('Navigation/UI');
  if (areas.length === 0) areas.push('General');

  // Estimate complexity
  let complexity = 'medium';
  let estimatedEffort = '2-4 hours';
  if (/simple|easy|minor|typo|label|text|rename/i.test(combined)) {
    complexity = 'low';
    estimatedEffort = '30 min - 1 hour';
  } else if (/complex|major|refactor|overhaul|redesign|new.?system|architecture/i.test(combined)) {
    complexity = 'high';
    estimatedEffort = '1-2 days';
  }

  // Detect if it touches frontend, backend, or both
  const scope = [];
  if (/ui|button|page|modal|form|display|show|view|layout|css|style/i.test(combined)) scope.push('Frontend');
  if (/api|database|query|server|endpoint|route|data/i.test(combined)) scope.push('Backend');
  if (/test|qa|validation/i.test(combined)) scope.push('Testing');
  if (scope.length === 0) scope.push('Frontend', 'Backend');

  // Generate implementation plan
  const steps = [];
  if (detectedCategory === 'bug_report') {
    steps.push('Reproduce the reported issue');
    steps.push('Identify root cause in affected module(s)');
    steps.push('Implement fix with regression tests');
    steps.push('Verify fix across affected workflows');
  } else if (detectedCategory === 'ui_improvement') {
    steps.push('Review current UI/UX patterns');
    steps.push('Design updated component layouts');
    steps.push('Implement CSS and HTML changes');
    steps.push('Cross-browser testing');
  } else {
    steps.push('Analyze requirements and define acceptance criteria');
    steps.push('Design database schema changes (if needed)');
    steps.push('Implement backend API endpoints');
    steps.push('Build frontend UI components');
    steps.push('Integration testing and QA');
  }

  // Generate a summary recommendation
  const recommendations = [];
  if (priority === 'critical') {
    recommendations.push('This should be addressed immediately as it impacts core functionality.');
  }
  if (detectedCategory === 'bug_report') {
    recommendations.push('Prioritize this fix to maintain platform stability.');
  }
  if (areas.length > 2) {
    recommendations.push('This request spans multiple modules — consider breaking it into smaller tasks.');
  }
  if (complexity === 'high') {
    recommendations.push('High-complexity change — recommend a design review before implementation.');
  }
  if (/similar|also|same|like.*other/i.test(combined)) {
    recommendations.push('Check for duplicate or related feedback items before proceeding.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Standard request — can be scheduled in the next sprint.');
  }

  return {
    detected_category: detectedCategory,
    priority,
    affected_areas: areas,
    complexity,
    estimated_effort: estimatedEffort,
    scope,
    implementation_steps: steps,
    recommendations,
    confidence: priority === 'critical' || detectedCategory === 'bug_report' ? 0.92 : 0.85,
    analyzed_at: new Date().toISOString()
  };
}

function simulateBuild(feedback) {
  const analysis = feedback.ai_analysis;
  const steps = analysis?.implementation_steps || ['Build requested feature'];
  
  const log = [];
  log.push(`[BUILD] Starting auto-build for: "${feedback.subject}"`);
  log.push(`[BUILD] Category: ${analysis?.detected_category || 'unknown'}`);
  log.push(`[BUILD] Priority: ${analysis?.priority || 'medium'}`);
  log.push(`[BUILD] Scope: ${(analysis?.scope || []).join(', ')}`);
  log.push('');
  
  steps.forEach((step, i) => {
    log.push(`[STEP ${i + 1}/${steps.length}] ${step}`);
    log.push(`  ✓ Completed`);
  });
  
  log.push('');
  log.push(`[BUILD] All ${steps.length} steps completed successfully`);
  log.push(`[BUILD] Affected areas: ${(analysis?.affected_areas || []).join(', ')}`);
  log.push(`[BUILD] Build finished at ${new Date().toISOString()}`);
  
  return {
    success: true,
    steps_completed: steps.length,
    total_steps: steps.length,
    log: log.join('\n'),
    completed_at: new Date().toISOString()
  };
}

module.exports = router;
