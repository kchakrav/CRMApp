// Orchestration Canvas JavaScript
console.log('🚀 ORCHESTRATION.JS LOADED!');
const API_BASE = '/api';

// Icon helper function for inline SVG icons
const _ico = (p) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

// State
let campaignId = null;
let isWorkflowContext = false;
let isOrchestrationPreview = false;
let nodes = [];
let connections = [];
let selectedNode = null;
let canvasState = { zoom: 1, pan: { x: 0, y: 0 } };
let isDraggingNode = false;
let isConnecting = false;
let connectionStart = null;
let draggedNode = null;
let nodeIdCounter = 1;
let connectionsRenderQueued = false;
let nodeResizeObserver = null;
let nodeResizeObserverDebounceTimer = null;
let insertConnectionId = null;
let selectedConnectionId = null;
let pendingConnectionMeta = null;
let boundsUpdateQueued = false;
let jumpTargetSelectMode = null;
const DEFAULT_NODE_SIZE = { width: 220, height: 120 };
const NODE_PADDING = 24;
let executionState = {
  running: false,
  intervalId: null,
  order: [],
  currentIndex: -1,
  waitingNodeId: null,
  realNodeResults: null  // when set from execute API, connector labels show real counts
};
let runtimeByNode = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 DOM Content Loaded - Starting initialization');

  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === '1') {
    isOrchestrationPreview = true;
    await initOrchestrationPreview();
    initActivityPaletteCollapseState();
    hideLoading();
    return;
  }

  // Get campaign/workflow ID from URL (support both parameter names)
  const workflowId = params.get('workflowId');
  isWorkflowContext = !!workflowId;
  campaignId = parseInt(params.get('campaignId') || workflowId);
  
  console.log('🆔 Workflow ID from URL:', campaignId);
  
  if (!campaignId) {
    console.error('❌ No workflow ID in URL parameters');
    showToast('No workflow ID specified', 'error');
    initActivityPaletteCollapseState();
    hideLoading();
    return;
  }
  
  console.log('⏳ Rendering activity palette...');
  renderActivityPalette();

  console.log('⏳ Loading campaign info...');
  // Load campaign info
  await loadCampaignInfo();
  
  console.log('⏳ Loading reference data...');
  // Load reference data (segments, etc.)
  await loadReferenceData();
  
  console.log('⏳ Loading orchestration...');
  // Load orchestration (always clear overlay even if this throws — belt + suspenders below)
  await loadOrchestration().catch((e) => console.error('loadOrchestration', e));
  hideLoading();

  console.log('⏳ Setting up event listeners...');
  // Setup event listeners
  setupEventListeners();
  updatePropertiesPanelVisibility();
  
  console.log('⏳ Setting up drag and drop...');
  // Setup drag and drop - with a slight delay to ensure DOM is ready
  setTimeout(() => {
    setupDragAndDrop();
  }, 100);
  
  console.log('✅ Initialization complete');
  initActivityPaletteCollapseState();
  hideLoading();
});

const activityDefinitions = [
  {
    category: 'Entry & Exit',
    icon: _ico('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'),
    items: [
      { type: 'entry', category: 'flow', name: 'Entry Point', desc: 'Start of workflow', icon: _ico('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>') },
      { type: 'exit', category: 'flow', name: 'End', desc: 'End of workflow', icon: _ico('<rect width="14" height="14" x="5" y="5" rx="2"/>') },
      { type: 'stop', category: 'flow', name: 'Stop', desc: 'Stop execution', icon: _ico('<rect width="14" height="14" x="5" y="5" rx="2"/>') }
    ]
  },
  {
    category: 'Targeting',
    icon: _ico('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    items: [
      { type: 'query', category: 'targeting', name: 'Query', desc: 'Build target query', icon: _ico('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>') },
      { type: 'build_audience', category: 'targeting', name: 'Build Audience', desc: 'Use audience or query', icon: _ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { type: 'segment', category: 'targeting', name: 'Segment', desc: 'Filter by segment', icon: _ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { type: 'filter', category: 'targeting', name: 'Filter', desc: 'Custom conditions', icon: _ico('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>') },
      { type: 'exclude', category: 'targeting', name: 'Exclude', desc: 'Exclude contacts', icon: _ico('<circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>') },
      { type: 'combine', category: 'targeting', name: 'Combine', desc: 'Union/intersection/exclusion', icon: _ico('<circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M14 12H10"/>') },
      { type: 'deduplication', category: 'targeting', name: 'Deduplication', desc: 'Remove duplicates', icon: _ico('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/>') },
      { type: 'enrichment', category: 'targeting', name: 'Enrichment', desc: 'Add data fields', icon: _ico('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>') },
      { type: 'incremental_query', category: 'targeting', name: 'Incremental Query', desc: 'New records only', icon: _ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
      { type: 'reconciliation', category: 'targeting', name: 'Reconciliation', desc: 'Match external data', icon: _ico('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>') },
      { type: 'save_audience', category: 'targeting', name: 'Save Audience', desc: 'Save results', icon: _ico('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>') },
      { type: 'split', category: 'targeting', name: 'Split', desc: 'Segment population', icon: _ico('<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>') },
      { type: 'change_dimension', category: 'targeting', name: 'Change Dimension', desc: 'Change targeting dimension', icon: _ico('<circle cx="12" cy="12" r="10"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>') },
      { type: 'change_data_source', category: 'targeting', name: 'Change Data Source', desc: 'Switch data source', icon: _ico('<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>') }
    ]
  },
  {
    category: 'Flow Control',
    icon: _ico('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    items: [
      { type: 'scheduler', category: 'flow_control', name: 'Scheduler', desc: 'Run on schedule', icon: _ico('<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>') },
      { type: 'wait', category: 'flow_control', name: 'Wait', desc: 'Delay execution', icon: _ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
      { type: 'condition', category: 'flow_control', name: 'Condition', desc: 'If/else branching', icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>') },
      { type: 'random', category: 'flow_control', name: 'Random Split', desc: 'Random routing', icon: _ico('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>') },
      { type: 'fork', category: 'flow_control', name: 'Fork', desc: 'Parallel branches', icon: _ico('<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>') },
      { type: 'jump', category: 'flow_control', name: 'Jump', desc: 'Redirect to activity', icon: _ico('<polyline points="17 11 21 7 17 3"/><path d="M21 7H9a4 4 0 0 0-4 4v10"/>') },
      { type: 'external_signal', category: 'flow_control', name: 'External Signal', desc: 'Wait for signal', icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') },
      { type: 'alert', category: 'flow_control', name: 'Alert', desc: 'Send notification', icon: _ico('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>') }
    ]
  },
  {
    category: 'Intelligence',
    icon: _ico('<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>'),
    items: [
      { type: 'offer_decision', category: 'intelligence', name: 'Offer Decision', desc: 'Resolve best offer per contact', icon: _ico('<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>') },
      { type: 'ab_test', category: 'intelligence', name: 'A/B Test', desc: 'Split test offers', icon: _ico('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/>') }
    ]
  },
  {
    category: 'AI',
    icon: _ico('<path d="M12 2a5 5 0 1 1-4.546 2.914"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="1"/>'),
    items: [
      // AI Agents
      { type: 'ai_agent', category: 'ai', name: 'Call Agent', desc: 'Invoke a configured agent inline', icon: _ico('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>') },
      { type: 'ai_skill', category: 'ai', name: 'Apply Skill', desc: 'Execute a skill from the library', icon: _ico('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M10 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M14 2v6h6"/>') },
      // AI Decisions
      { type: 'ai_branch', category: 'ai', name: 'AI Branch', desc: 'LLM-powered conditional routing', icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M8 12h8"/>') },
      { type: 'ai_classifier', category: 'ai', name: 'AI Classifier', desc: 'Classify contact and route to N branches', icon: _ico('<path d="M2 20h20"/><path d="M5 20V10l7-7 7 7v10"/><path d="M9 20v-5h6v5"/>') },
      { type: 'ai_scorer', category: 'ai', name: 'AI Scorer', desc: 'Score contact on a dimension', icon: _ico('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>') },
      { type: 'ai_next_best_action', category: 'ai', name: 'Next Best Action', desc: 'AI recommends next step', icon: _ico('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>') },
      { type: 'ai_wait', category: 'ai', name: 'Adaptive Wait', desc: 'AI picks optimal send time per contact', icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>') },
      // AI Content
      { type: 'ai_personalize', category: 'ai', name: 'AI Personalize', desc: 'Generate personalized content per contact', icon: _ico('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>') },
      { type: 'ai_translate', category: 'ai', name: 'AI Translate', desc: 'Translate content to preferred language', icon: _ico('<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>') },
      { type: 'ai_content_eval', category: 'ai', name: 'Content Evaluator', desc: 'Score AI content quality before delivery', icon: _ico('<path d="M20 6 9 17l-5-5"/>') },
      // AI Data
      { type: 'ai_enrich', category: 'ai', name: 'AI Enrich', desc: 'Infer missing profile attributes', icon: _ico('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>') },
      { type: 'ai_sentiment', category: 'ai', name: 'Sentiment Analyzer', desc: 'Classify last interaction sentiment', icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>') },
      // AI Governance
      { type: 'ai_hitl', category: 'ai', name: 'Human in the Loop', desc: 'Pause for human review with AI recommendation', icon: _ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { type: 'ai_guardrail', category: 'ai', name: 'AI Guardrail', desc: 'Validate AI outputs before proceeding', icon: _ico('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>') },
      { type: 'confidence_gate', category: 'ai', name: 'Confidence Gate', desc: 'Fallback path if AI confidence below threshold', icon: _ico('<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>') },
      { type: 'prompt_shield', category: 'ai', name: 'Prompt Shield', desc: 'Sanitize contact data before AI nodes', icon: _ico('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>') },
      // AI Memory
      { type: 'context_store', category: 'ai', name: 'Context Store', desc: 'Persist AI-generated context across runs', icon: _ico('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>') },
      { type: 'context_recall', category: 'ai', name: 'Context Recall', desc: 'Retrieve stored AI context for this contact', icon: _ico('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
      // Feedback
      { type: 'outcome_tracker', category: 'ai', name: 'Outcome Tracker', desc: 'Capture results for AI learning', icon: _ico('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>') },
      { type: 'ab_shadow', category: 'ai', name: 'AB Shadow', desc: 'Run AI in parallel without affecting delivery', icon: _ico('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>') }
    ]
  },
  {
    category: 'Channels',
    icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
    items: [
      { type: 'email', category: 'channels', name: 'Email', desc: 'Send email', icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') },
      { type: 'sms', category: 'channels', name: 'SMS', desc: 'Send SMS', icon: _ico('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
      { type: 'push', category: 'channels', name: 'Push', desc: 'Push notification', icon: _ico('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>') },
      { type: 'direct_mail', category: 'channels', name: 'Direct Mail', desc: 'Physical delivery', icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') },
      { type: 'webhook', category: 'channels', name: 'Webhook', desc: 'HTTP callback', icon: _ico('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>') },
      { type: 'recurring_delivery', category: 'channels', name: 'Recurring delivery', desc: 'ACC deliveryRecurring — scheduled send linked to a delivery', icon: _ico('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="1"/>') }
    ]
  },
  {
    category: 'Campaign Classic parity',
    icon: _ico('<path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>'),
    items: [
      { type: 'read_group', category: 'targeting', name: 'Read static list', desc: 'ACC readGroup — load audience from a static list (audience)', icon: _ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
      { type: 'data_writer', category: 'actions', name: 'Data writer', desc: 'ACC writer — update records / campaign state (stub execution)', icon: _ico('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 15h8"/>') },
      { type: 'script_condition', category: 'flow_control', name: 'Script condition', desc: 'ACC jstest — true/false branch (expression stored; server uses execution branch stub)', icon: _ico('<circle cx="12" cy="12" r="10"/><path d="M9 12h6"/><path d="M12 9v6"/>') }
    ]
  }
];

function renderActivityPalette() {
  const container = document.getElementById('activity-categories');
  if (!container) return;
  container.innerHTML = activityDefinitions.map(group => `
    <div class="activity-category">
      <div class="category-header" onclick="toggleCategory(this)">
        <span class="category-icon">${group.icon}</span>
        <span class="category-title">${group.category}</span>
        <span class="category-toggle">▼</span>
      </div>
      <div class="category-content">
        ${group.items.map(item => `
          <div class="activity-item" draggable="true" data-type="${item.type}" data-category="${item.category}" title="${item.desc}">
            <span class="activity-icon">${item.icon}</span>
            <div class="activity-info">
              <div class="activity-name">${item.name}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Load reference data for dropdowns
let referenceData = {
  segments: [],
  audiences: [],
  deliveries: []
};

async function loadReferenceData() {
  try {
    // Load segments (cache-bust when refetching after execute so dropdown shows updated contact_count)
    const segmentsResponse = await fetch(`${API_BASE}/segments?t=${Date.now()}`);
    const segmentsData = await segmentsResponse.json();
    referenceData.segments = segmentsData.segments || segmentsData || [];
    
    // Load audiences
    const audiencesResponse = await fetch(`${API_BASE}/audiences`);
    const audiencesData = await audiencesResponse.json();
    referenceData.audiences = audiencesData.audiences || audiencesData || [];
    
    // Load deliveries
    const deliveriesResponse = await fetch(`${API_BASE}/deliveries`);
    const deliveriesData = await deliveriesResponse.json();
    const rawDeliveries = deliveriesData.deliveries || deliveriesData || [];
    referenceData.deliveries = rawDeliveries.map(d => ({
      ...d,
      channel_key: d.channel_key || String(d.channel || '').toLowerCase()
    }));

    // Load offer decisions for orchestration
    try {
      const decisionsResponse = await fetch(`${API_BASE}/decisions`);
      const decisionsData = await decisionsResponse.json();
      referenceData.decisions = decisionsData.decisions || [];
    } catch (e) { referenceData.decisions = []; }
  } catch (error) {
    console.error('Error loading reference data:', error);
  }
}

// Load campaign information
let currentWorkflowData = null; // Stores loaded workflow metadata (name, description, etc.)

async function loadCampaignInfo() {
  try {
    const url = isWorkflowContext
      ? `${API_BASE}/workflows/${campaignId}`
      : `${API_BASE}/campaigns/${campaignId}`;
    const response = await fetch(url);
    const campaign = await response.json();
    currentWorkflowData = campaign || null;
    const name = campaign?.name || 'Orchestration';
    document.getElementById('campaign-name').textContent = `${name} - Orchestration`;
  } catch (error) {
    console.error('Error loading campaign:', error);
  }
}

// Load orchestration from server
async function loadOrchestration() {
  try {
    showLoading();
    let data;
    if (isWorkflowContext) {
      const response = await fetch(`${API_BASE}/workflows/${campaignId}/orchestration`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const payload = await response.json();
      const orch = payload.orchestration || {};
      if (!Array.isArray(orch.nodes)) {
        console.error('Invalid orchestration payload: nodes must be an array', campaignId, typeof orch.nodes);
      }
      data = {
        nodes: Array.isArray(orch.nodes) ? orch.nodes : [],
        connections: Array.isArray(orch.connections) ? orch.connections : [],
        canvas_state: orch.canvas_state,
        last_run_results: orch.last_run_results
      };
    } else {
      const response = await fetch(`${API_BASE}/orchestration/${campaignId}`);
      data = await response.json();
    }

    nodes = (data.nodes || []).map(n => ({
      ...n,
      config: n.config || {},
      category: n.category || _resolveCategory(n.type),
      icon: (n.icon && n.icon.includes('<svg')) ? n.icon : _getActivityIcon(n.type)
    }));
    connections = data.connections || [];
    canvasState = data.canvas_state || { zoom: 1, pan: { x: 0, y: 0 } };
    syncNodeIdCounter();

    // Restore last run results so segment dropdown and Results panel show the same count
    if (data.last_run_results && Object.keys(data.last_run_results).length > 0) {
      executionState.realNodeResults = data.last_run_results;
      Object.keys(data.last_run_results).forEach(nodeId => {
        const r = data.last_run_results[nodeId];
        if (!runtimeByNode[nodeId]) runtimeByNode[nodeId] = {};
        runtimeByNode[nodeId].count = r?.count ?? 0;
        runtimeByNode[nodeId].seconds = r?.seconds ?? 1;
        if (r?.status) runtimeByNode[nodeId].status = r.status;
      });
    } else {
      executionState.realNodeResults = null;
    }

    if (nodes.length === 0) {
      // Always start with an Entry activity on empty canvas
      addNode('entry', 'flow', 'Entry Point', _ico('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'), 80, 120);
      showToast('Added Entry activity to start the flow', 'info');
    } else {
      const preserve = new URLSearchParams(window.location.search).get('preserveLayout') === '1';
      if (preserve) {
        renderCanvas();
      } else {
        applyPresentationLayoutOnLoad();
      }
    }

    applyPendingWorkflowSegmentSelection();
    applyPendingWorkflowAudienceSelection();
    applyPendingWorkflowDeliverySelection();
  } catch (error) {
    showToast('Error loading orchestration', 'error');
    console.error(error);
  } finally {
    hideLoading();
  }
}

async function initOrchestrationPreview() {
  renderActivityPalette();

  let payload;
  try {
    const raw = sessionStorage.getItem('orchestrationPreviewPayload');
    if (!raw) throw new Error('empty');
    payload = JSON.parse(raw);
  } catch (e) {
    document.getElementById('campaign-name').textContent = 'Orchestration preview';
    showToast('No preview data. Use Workflow JSON preview to upload a file first.', 'error');
    try {
      await loadReferenceData();
    } catch (err) {
      console.warn(err);
    }
    setupEventListeners();
    updatePropertiesPanelVisibility();
    setTimeout(() => setupDragAndDrop(), 100);
    return;
  }

  campaignId = -1;
  isWorkflowContext = true;

  try {
    await loadReferenceData();
  } catch (e) {
    console.warn(e);
  }

  currentWorkflowData = { name: payload.title };
  document.getElementById('campaign-name').textContent = `${payload.title} — Preview`;

  const data = payload.orchestration || {};
  nodes = (data.nodes || []).map((n) => ({
    ...n,
    config: n.config || {},
    category: n.category || _resolveCategory(n.type),
    icon: n.icon && n.icon.includes('<svg') ? n.icon : _getActivityIcon(n.type)
  }));
  connections = data.connections || [];
  canvasState = data.canvas_state || { zoom: 1, pan: { x: 0, y: 0 } };
  executionState.realNodeResults = null;
  syncNodeIdCounter();

  if (nodes.length === 0) {
    showToast('This JSON produced an empty graph.', 'warning');
  } else {
    applyPresentationLayoutOnLoad();
  }

  setupOrchestrationPreviewChrome(payload);
  setupEventListeners();
  updatePropertiesPanelVisibility();
  setTimeout(() => setupDragAndDrop(), 100);

  const w = payload.warnings;
  if (w && w.length) {
    console.warn('Import warnings (' + w.length + '):', w);
    showToast(`Import completed with ${w.length} note(s) — open the console (F12) for details.`, 'info');
  }

  console.log('✅ Preview initialization complete');
}

function setupOrchestrationPreviewChrome(payload) {
  const banner = document.getElementById('preview-mode-banner');
  if (banner) {
    banner.classList.remove('hidden');
    const w =
      payload.warnings && payload.warnings.length
        ? ` (${payload.warnings.length} import notes — see browser console)`
        : '';
    banner.innerHTML = `Read-only preview from JSON.${w} <a href="/workflow-json-viewer.html">Load a different file</a> · <a href="/?view=workflows">Workflows</a>`;
  }
  document.querySelectorAll('.orchestration-header .btn-primary, .orchestration-header .btn-success').forEach((el) => {
    el.style.display = 'none';
  });
}

function syncNodeIdCounter() {
  const maxId = nodes.reduce((max, node) => {
    const match = String(node.id || '').match(/node-(\d+)/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 0);
  nodeIdCounter = Math.max(nodeIdCounter, maxId + 1);
}

// Save orchestration to server
async function saveOrchestration(options = {}) {
  const { showToastMessage = true, skipLoading = false } = options;
  if (isOrchestrationPreview) {
    if (showToastMessage) {
      showToast('Preview mode — save is disabled. Create a workflow from Workflows or use Import ACC CLI.', 'info');
    }
    return false;
  }
  let showedLoading = false;
  try {
    if (!skipLoading) {
      showLoading();
      showedLoading = true;
    }
    const body = {
      nodes,
      connections,
      canvas_state: canvasState
    };
    const response = isWorkflowContext
      ? await fetch(`${API_BASE}/workflows/${campaignId}/orchestration`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      : await fetch(`${API_BASE}/orchestration/${campaignId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

    const result = await response.json();
    if (!response.ok) {
      if (showToastMessage) {
        showToast(result.error || 'Error saving orchestration', 'error');
      }
      return false;
    }
    if (showToastMessage) {
      showToast('Orchestration saved successfully', 'success');
    }
    await loadCampaignInfo();
    return true;
  } catch (error) {
    if (showToastMessage) {
      showToast('Error saving orchestration', 'error');
    }
    console.error(error);
    return false;
  } finally {
    if (showedLoading) hideLoading();
  }
}

// Execute orchestration
async function executeOrchestration() {
  if (isOrchestrationPreview) {
    showToast('Preview mode — execution is disabled. Open a saved workflow to run.', 'warning');
    return;
  }
  if (nodes.length === 0) {
    showToast('Add nodes to canvas before executing', 'warning');
    return;
  }
  
  const hasEntry = nodes.some(n => n.type === 'entry');
  if (!hasEntry) {
    showToast('Orchestration must have an Entry node', 'error');
    return;
  }
  
  if (!confirm('Execute this campaign orchestration? This will send messages to customers.')) {
    return;
  }
  
  executionState.realNodeResults = null;
  try {
    const response = await fetch(`${API_BASE}/orchestration/${campaignId}/execute`, {
      method: 'POST'
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.error || 'Error executing orchestration', 'error');
      return;
    }
    showToast(`Campaign executed! Sent to ${result.sent_count} customers`, 'success');
    if (result.node_results && Object.keys(result.node_results).length > 0) {
      executionState.realNodeResults = result.node_results;
    }
    if (executionState.running) {
      clearInterval(executionState.intervalId);
      executionState.intervalId = null;
      executionState.running = false;
    }
    await loadReferenceData();
    startWorkflow();
    if (selectedNode) showNodeProperties(selectedNode);
  } catch (error) {
    showToast('Error executing orchestration', 'error');
    console.error(error);
  }
}

// Setup event listeners
function setupEventListeners() {
  const canvas = document.getElementById('canvas');
  const content = document.getElementById('canvas-content');
  if (!canvas || !content) {
    console.error('Orchestration: #canvas or #canvas-content missing — interaction listeners not attached');
    return;
  }

  // Canvas panning
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', (e) => {
    const svg = document.getElementById('connections-svg');
    const isInteractive = e.target.closest('.canvas-node') ||
      e.target.closest('.connection-line') ||
      e.target.closest('.connection-insert-handle');
    const isEmptySurface = !isInteractive && (e.target === canvas || e.target === content || e.target === svg);
    if (isEmptySurface && e.button === 0) {
      isPanning = true;
      panStart = { x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y };
      canvas.classList.add('panning');
    }
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
      canvasState.pan.x = e.clientX - panStart.x;
      canvasState.pan.y = e.clientY - panStart.y;
      applyCanvasTransform();
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.classList.remove('panning');
  });
  
  window.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    canvas.classList.remove('panning');
  });
  
  canvas.addEventListener('click', (e) => {
    const isInteractive = e.target.closest('.canvas-node') ||
      e.target.closest('.connection-line') ||
      e.target.closest('.connection-insert-handle');
    if (!isInteractive) {
      selectedNode = null;
      selectedConnectionId = null;
      insertConnectionId = null;
      renderConnections();
      updatePropertiesPanelVisibility();
    }
  });
  
  // No scrollbars: panning is handled via transforms
  
  window.addEventListener('resize', () => {
    scheduleRenderConnections();
  });
  
  // Activity search
  const activitySearch = document.getElementById('activity-search');
  if (activitySearch) {
    activitySearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const items = document.querySelectorAll('.activity-item');

      items.forEach((item) => {
        const name = item.querySelector('.activity-name').textContent.toLowerCase();
        const desc = (item.getAttribute('title') || '').toLowerCase();
        const matches = name.includes(searchTerm) || desc.includes(searchTerm);
        item.style.display = matches ? 'inline-flex' : 'none';
      });
    });
  }
}

// Setup drag and drop
function setupDragAndDrop() {
  const activityItems = document.querySelectorAll('.activity-item');
  const canvas = document.getElementById('canvas');

  console.log('🔧 Setting up drag and drop for', activityItems.length, 'activities');
  console.log('🎯 Canvas element:', canvas);

  if (!canvas) {
    console.error('❌ Canvas element not found!');
    return;
  }

  if (activityItems.length === 0) {
    console.error('❌ No activity items found!');
    return;
  }

  activityItems.forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      const type = item.dataset.type;
      const category = item.dataset.category;
      const name = item.querySelector('.activity-name').textContent;
      const icon = item.querySelector('.activity-icon').innerHTML;

      console.log('✅ Drag started:', { type, category, name, icon });

      e.dataTransfer.setData('application/json', JSON.stringify({
        type, category, name, icon
      }));

      // Add visual feedback
      item.style.opacity = '0.5';
      canvas.classList.add('drag-active');
    });

    item.addEventListener('dragend', (e) => {
      console.log('🔚 Drag ended');
      item.style.opacity = '1';
      canvas.classList.remove('drag-active');
    });
  });
  
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    console.log('✅ Drop event fired at', e.clientX, e.clientY);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      console.log('📦 Dropped data:', data);
      
      const canvasRect = canvas.getBoundingClientRect();
      console.log('📐 Canvas rect:', canvasRect);
      console.log('🔍 Pan state:', canvasState.pan);
      console.log('🔍 Zoom state:', canvasState.zoom);
      
      // Calculate position relative to canvas, accounting for pan/zoom
      const x = (e.clientX - canvasRect.left - canvasState.pan.x) / canvasState.zoom;
      const y = (e.clientY - canvasRect.top - canvasState.pan.y) / canvasState.zoom;
      
      console.log('📍 Calculated position:', { x, y });
      console.log('📐 Zoom state:', canvasState.zoom);
      
      // If we explicitly chose a connection to insert into
      if (insertConnectionId) {
        const conn = connections.find(c => c.id === insertConnectionId);
        insertConnectionId = null;
        if (conn) {
          const newNodeId = addNode(data.type, data.category, data.name, data.icon, x, y, true);
          insertNodeBetweenConnection(conn, newNodeId);
          canvas.classList.remove('drag-active');
          return;
        }
      }
      
      // If dropped on an existing connection line, insert the node in-between
      const target = e.target;
      if (target && target.classList && target.classList.contains('connection-line')) {
        const connId = target.dataset.connectionId;
        const conn = connections.find(c => c.id === connId);
        if (conn) {
          const newNodeId = addNode(data.type, data.category, data.name, data.icon, x, y, true);
          insertNodeBetweenConnection(conn, newNodeId);
          canvas.classList.remove('drag-active');
          return;
        }
      }
      
      addNode(data.type, data.category, data.name, data.icon, x, y);
      canvas.classList.remove('drag-active');
    } catch (error) {
      console.error('❌ Drop error:', error);
      showToast('Error adding activity', 'error');
    }
  });
  
  console.log('✅ Drag and drop setup complete');
}

// Lookup icon from activity definitions by type
function _getActivityIcon(type) {
  for (const group of activityDefinitions) {
    for (const item of group.items) {
      if (item.type === type) return item.icon;
    }
  }
  return _ico('<rect width="14" height="14" x="5" y="5" rx="2"/>');
}

function _resolveCategory(type) {
  for (const group of activityDefinitions) {
    for (const item of group.items) {
      if (item.type === type) return item.category;
    }
  }
  return 'flow';
}

// Add node to canvas
function addNode(type, category, name, icon, x, y, returnIdOnly = false) {
  // Resolve icon: if empty/whitespace, look it up from definitions
  if (!icon || !icon.trim() || !icon.includes('<svg')) {
    icon = _getActivityIcon(type);
  }
  const position = findAvailablePosition(x, y);
  const node = {
    id: `node-${nodeIdCounter++}`,
    type,
    category,
    name,
    icon,
    position: { x: position.x, y: position.y },
    config: {}
  };
  if (type === 'split') {
    node.config.transitions = [
      {
        id: `trans-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: 'Subset',
        segment_code: '',
        enable_limit: false,
        skip_empty: false
      }
    ];
  }
  if (type === 'jump') {
    node.config.target_node_id = '';
  }
  if (type === 'external_signal') {
    node.config.signal_key = '';
    node.config.duplicate_behavior = 'ignore';
  }
  if (type === 'read_group') {
    node.config.audience_id = '';
    node.config.external_list_label = '';
  }
  if (type === 'data_writer') {
    node.config.entity_type = 'contacts';
    node.config.operation = 'update';
    node.config.notes = '';
    node.config.field_updates_json = '[]';
  }
  if (type === 'script_condition') {
    node.config.expression = 'activity.variables.recCount > 0';
    node.config.execution_branch = 'true';
    node.config.acc_label = '';
  }
  if (type === 'recurring_delivery') {
    node.config.channel = 'email';
    node.config.delivery_id = '';
    node.config.cadence_summary = '';
  }
  // AI node default configs
  if (type === 'ai_branch') {
    node.config.prompt = '';
    node.config.model = 'gpt-4o-mini';
    node.config.confidence_threshold = 0.7;
    node.config.output_variable = '';
    node.config.fallback_on_error = true;
  }
  if (type === 'ai_classifier') {
    node.config.classes = 'high_value,medium_value,low_value';
    node.config.model = 'gpt-4o-mini';
    node.config.confidence_threshold = 0.6;
    node.config.output_variable = '';
  }
  if (type === 'ai_scorer') {
    node.config.dimension = '';
    node.config.threshold = 0.6;
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_personalize') {
    node.config.template = '';
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_agent') {
    node.config.agent_id = '';
    node.config.timeout_seconds = 30;
    node.config.fallback_on_error = true;
    node.config.output_variable = '';
  }
  if (type === 'ai_skill') {
    node.config.skill_id = '';
    node.config.output_variable = '';
  }
  if (type === 'ai_hitl') {
    node.config.question = '';
    node.config.options = 'approve,reject,defer';
    node.config.timeout_hours = 24;
    node.config.ai_recommendation = true;
  }
  if (type === 'ai_guardrail') {
    node.config.rules = '';
    node.config.action_on_fail = 'fallback';
  }
  if (type === 'confidence_gate') {
    node.config.source_node_variable = '';
    node.config.threshold = 0.7;
  }
  if (type === 'ai_enrich') {
    node.config.fields = '';
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_sentiment') {
    node.config.source_field = 'last_interaction';
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_next_best_action') {
    node.config.actions = '';
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_content_eval') {
    node.config.rubric = '';
    node.config.min_score = 7;
    node.config.model = 'gpt-4o-mini';
  }
  if (type === 'context_store') {
    node.config.key = '';
    node.config.value_expression = '';
  }
  if (type === 'context_recall') {
    node.config.key = '';
    node.config.output_variable = '';
  }
  if (type === 'ai_translate') {
    node.config.target_language = '';
    node.config.model = 'gpt-4o-mini';
    node.config.output_variable = '';
  }
  if (type === 'ai_wait') {
    node.config.model = 'gpt-4o-mini';
    node.config.max_wait_hours = 48;
    node.config.output_variable = '';
  }
  if (type === 'outcome_tracker') {
    node.config.metric_name = '';
    node.config.success_condition = '';
  }
  if (type === 'ab_shadow') {
    node.config.shadow_node_id = '';
    node.config.log_comparison = true;
  }
  if (type === 'prompt_shield') {
    node.config.fields_to_sanitize = 'name,email,phone';
    node.config.block_injections = true;
  }

  pushUndoState();
  nodes.push(node);

  renderCanvas();
  showToast(`Added ${name} node`, 'success');
  
  if (returnIdOnly) {
    return node.id;
  }
}

function _escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCanvasNodeEl(nodeId) {
  const id = String(nodeId);
  const content = document.getElementById('canvas-content');
  if (!content) return null;
  return Array.from(content.querySelectorAll('.canvas-node')).find((el) => el.dataset.nodeId === id) || null;
}

function getNodeDimensions(node) {
  const el = getCanvasNodeEl(node.id);
  if (el) {
    return { width: el.offsetWidth || DEFAULT_NODE_SIZE.width, height: el.offsetHeight || DEFAULT_NODE_SIZE.height };
  }
  return { ...DEFAULT_NODE_SIZE };
}

function rectsOverlap(a, b, padding = NODE_PADDING) {
  return !(
    a.x + a.width + padding < b.x ||
    a.x > b.x + b.width + padding ||
    a.y + a.height + padding < b.y ||
    a.y > b.y + b.height + padding
  );
}

function findAvailablePosition(x, y) {
  const base = { x, y, width: DEFAULT_NODE_SIZE.width, height: DEFAULT_NODE_SIZE.height };
  const step = 60;
  const maxAttempts = 60;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const ring = Math.floor(attempt / 8);
    const offset = ring * step;
    const slot = attempt % 8;
    const candidate = { x, y };
    if (attempt === 0) {
      candidate.x = x;
      candidate.y = y;
    } else {
      const dx = slot === 0 ? offset : slot === 1 ? offset : slot === 2 ? 0 : slot === 3 ? -offset : slot === 4 ? -offset : slot === 5 ? -offset : slot === 6 ? 0 : offset;
      const dy = slot === 0 ? 0 : slot === 1 ? offset : slot === 2 ? offset : slot === 3 ? offset : slot === 4 ? 0 : slot === 5 ? -offset : slot === 6 ? -offset : -offset;
      candidate.x = x + dx;
      candidate.y = y + dy;
    }
    const candidateRect = { ...base, x: candidate.x, y: candidate.y };
    const hasOverlap = nodes.some(existing => {
      const dims = getNodeDimensions(existing);
      const existingRect = { x: existing.position.x, y: existing.position.y, width: dims.width, height: dims.height };
      return rectsOverlap(candidateRect, existingRect);
    });
    if (!hasOverlap) {
      return candidate;
    }
  }
  return { x, y };
}

// Render canvas
function renderCanvas() {
  const canvas = document.getElementById('canvas');
  const content = document.getElementById('canvas-content');

  if (!canvas || !content) return;

  // Clear existing nodes (keep only canvas content)
  const existingNodes = content.querySelectorAll('.canvas-node');
  existingNodes.forEach((node) => node.remove());

  // Render nodes
  nodes.forEach((node) => {
    const nodeEl = createNodeElement(node);
    content.appendChild(nodeEl);
  });

  updateCanvasBounds();
  applyCanvasTransform();
  
  // Render connections
  renderConnections();
  updatePropertiesPanelVisibility();
}

function updatePropertiesPanelVisibility() {
  const sidebar = document.querySelector('.right-sidebar');
  const propertiesPanel = document.getElementById('properties-panel');
  const hasSelection = !!selectedNode || !!selectedConnectionId;
  if (propertiesPanel) {
    propertiesPanel.classList.toggle('hidden', !hasSelection);
  }
  if (sidebar) {
    sidebar.classList.toggle('properties-hidden', !hasSelection);
  }
}

function fitToView(options = {}) {
  const silent = !!options.silent;
  const canvas = document.getElementById('canvas');
  if (!canvas || nodes.length === 0) {
    if (!silent) showToast('Add activities to fit the view', 'info');
    return;
  }
  const padding = 120;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  const boundsWidth = Math.max(maxX - minX + padding * 2, 1);
  const boundsHeight = Math.max(maxY - minY + padding * 2, 1);
  // Use the canvas viewport only — .canvas-wrapper height includes the toolbar and would skew pan/zoom
  const viewWidth = canvas.clientWidth || 1;
  const viewHeight = canvas.clientHeight || 1;
  let scale = Math.min(viewWidth / boundsWidth, viewHeight / boundsHeight, 1);
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
  canvasState.zoom = scale;
  const centerX = ((minX + maxX) / 2) * scale;
  const centerY = ((minY + maxY) / 2) * scale;
  canvasState.pan.x = viewWidth / 2 - centerX;
  canvasState.pan.y = viewHeight / 2 - centerY;
  applyCanvasTransform();
  if (!silent) showToast('Fit to view applied', 'success');
}

// Create node element
function createNodeElement(node) {
  const nodeEl = document.createElement('div');
  nodeEl.className = 'canvas-node';
  nodeEl.dataset.nodeId = node.id;
  nodeEl.dataset.category = node.category;
  nodeEl.dataset.type = node.type;
  nodeEl.style.left = `${node.position.x}px`;
  nodeEl.style.top = `${node.position.y}px`;
  
  const runtime = runtimeByNode[node.id] || {};
  if (runtime.status) {
    nodeEl.classList.add(`status-${runtime.status}`);
  }
  if (node.disabled) nodeEl.classList.add('node-disabled');
  if (node.paused) nodeEl.classList.add('node-paused');
  
  // Build config display
  let configHtml = '';
  if (node.type === 'jump') {
    const targetName = getJumpTargetLabel(node);
    const isMissing = targetName.startsWith('Missing');
    configHtml = `
      <div class="node-config ${isMissing ? 'node-config-error' : ''}">
        <div><strong>Jump to:</strong> ${_escapeHtml(targetName)}</div>
        ${!isMissing && node.config?.target_node_id ? `<button class="btn btn-sm btn-ghost" type="button" onclick="focusNode(${JSON.stringify(node.config.target_node_id)})">Go to target</button>` : ''}
      </div>
    `;
  } else if (node.type === 'external_signal') {
    const signalName = node.config?.signal_key || node.config?.signal || '';
    const runtime = runtimeByNode[node.id] || {};
    const status = runtime.status;
    const badge = status === 'waiting'
      ? '<span class="node-status waiting">waiting</span>'
      : status === 'received'
        ? '<span class="node-status received">received</span>'
        : status === 'timed_out'
          ? '<span class="node-status timed_out">timed out</span>'
          : '';
    configHtml = `
      <div class="node-config">
        <div><strong>Waiting for:</strong> ${_escapeHtml(signalName || 'Unset')}</div>
        ${badge}
      </div>
    `;
  } else if (node.type === 'read_group') {
    const listName = (referenceData.audiences || []).find(a => String(a.id) === String(node.config?.audience_id))?.name;
    configHtml = `
      <div class="node-config">
        <div><strong>Audience:</strong> ${_escapeHtml(listName || String(node.config?.audience_id || '—'))}</div>
        ${node.config?.external_list_label ? `<div><strong>ACC label:</strong> ${_escapeHtml(node.config.external_list_label)}</div>` : ''}
      </div>
    `;
  } else if (node.type === 'script_condition') {
    const ex = (node.config?.expression || '').slice(0, 80);
    configHtml = `
      <div class="node-config">
        <div><strong>Branch (run):</strong> ${node.config?.execution_branch === 'false' ? 'false' : 'true'}</div>
        <div><strong>Expr:</strong> ${_escapeHtml(ex || '—')}${(node.config?.expression || '').length > 80 ? '…' : ''}</div>
      </div>
    `;
  } else if (node.type === 'recurring_delivery') {
    configHtml = `
      <div class="node-config">
        <div><strong>Channel:</strong> ${node.config?.channel || 'email'}</div>
        <div><strong>Delivery:</strong> ${node.config?.delivery_id || '—'}</div>
      </div>
    `;
  } else if (node.type === 'data_writer') {
    configHtml = `
      <div class="node-config">
        <div><strong>Entity:</strong> ${node.config?.entity_type || 'contacts'}</div>
        <div><strong>Op:</strong> ${node.config?.operation || 'update'}</div>
      </div>
    `;
  } else if (Object.keys(node.config).length > 0) {
    configHtml = '<div class="node-config">';
    for (const [key, value] of Object.entries(node.config)) {
      let valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (valStr.length > 320) valStr = valStr.slice(0, 320) + '…';
      configHtml += `<div><strong>${_escapeHtml(key)}:</strong> ${_escapeHtml(valStr)}</div>`;
    }
    configHtml += '</div>';
  }
  
  const transitions = node.type === 'split' ? (node.config.transitions || []) : [];
  const scriptConditionOutputs = node.type === 'script_condition'
    ? [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]
    : [];
  const branchTransitions = node.type === 'script_condition' ? scriptConditionOutputs : transitions;
  const splitOutputs = branchTransitions.length
    ? branchTransitions.map((t, idx) => {
        const position = branchTransitions.length > 1 ? 30 + (40 * idx) / (branchTransitions.length - 1) : 50;
        return `<div class="connection-point output split-output" data-transition-id="${_escapeHtml(t.id)}" style="top:${position}%"></div>`;
      }).join('')
    : '';

  const description = getNodeDescription(node);
  const descHtml = description ? _escapeHtml(description) : '';
  const nameSafe = _escapeHtml(node.name);
  const stateBadge = node.disabled
    ? '<span class="node-status node-status-disabled">disabled</span>'
    : node.paused
      ? '<span class="node-status node-status-paused">paused</span>'
      : (runtime.status ? `<span class="node-status ${runtime.status}">${runtime.status}</span>` : '');

  nodeEl.innerHTML = `
    ${node.category === 'ai' ? '<div class="ai-node-badge">AI</div>' : ''}
    <div class="node-header">
      <span class="node-icon">${node.icon}</span>
      <span class="node-title" title="${nameSafe}">${nameSafe}</span>
      ${stateBadge}
      <button class="node-menu" onclick="selectNodeById(${JSON.stringify(node.id)})" title="Properties">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
    ${descHtml ? `<div class="node-body">${descHtml}</div>` : ''}
    ${configHtml}
    <div class="connection-point input" data-node-id="${_escapeHtml(node.id)}" data-type="input"></div>
    ${node.type === 'split' || node.type === 'script_condition' ? `<div class="split-output-points">${splitOutputs}</div>` : `<div class="connection-point output" data-node-id="${_escapeHtml(node.id)}" data-type="output"></div>`}
  `;
  
  // Make draggable
  makeNodeDraggable(nodeEl, node);
  
  // Observe size changes to keep connections aligned (debounced — many nodes + layout thrash can otherwise freeze the UI)
  if (!nodeResizeObserver && window.ResizeObserver) {
    nodeResizeObserver = new ResizeObserver(() => {
      if (nodeResizeObserverDebounceTimer !== null) clearTimeout(nodeResizeObserverDebounceTimer);
      nodeResizeObserverDebounceTimer = setTimeout(() => {
        nodeResizeObserverDebounceTimer = null;
        scheduleRenderConnections();
      }, 100);
    });
  }
  if (nodeResizeObserver) {
    nodeResizeObserver.observe(nodeEl);
  }
  
  // Node selection
  nodeEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('node-menu')) return;
    selectNode(node);
  });
  
  // Connection points
  const outputPoints = nodeEl.querySelectorAll('.connection-point.output');
  outputPoints.forEach(point => {
    point.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const transitionId = point.dataset.transitionId;
      if (node.type === 'split' && transitionId) {
        startSplitTransitionConnection(node.id, transitionId);
        return;
      }
      if (node.type === 'script_condition' && transitionId) {
        startBranchConnection(node.id, transitionId);
        return;
      }
      startConnection(node.id);
    });
  });
  
  const inputPoint = nodeEl.querySelector('.connection-point.input');
  inputPoint.addEventListener('mouseup', (e) => {
    e.stopPropagation();
    completeConnection(node.id);
  });
  
  return nodeEl;
}

// Get node description
function getNodeDescription(node) {
  const descriptions = {
    entry: 'Campaign starts here',
    exit: 'Campaign ends here',
    stop: 'Stops execution',
    query: 'Build target query',
    build_audience: 'Build audience',
    segment: 'Filter by segment',
    filter: 'Apply custom filters',
    exclude: 'Exclude customers',
    wait: 'Delay execution',
    split: 'Split population',
    condition: 'Conditional branching',
    random: 'Random routing',
    scheduler: 'Schedule execution',
    fork: 'Parallel branches',
    jump: 'Redirect to another activity',
    external_signal: 'Wait for external signal',
    alert: 'Send alert notification',
    email: 'Send email message',
    sms: 'Send SMS message',
    push: 'Send push notification',
    direct_mail: 'Send direct mail',
    webhook: 'HTTP callback',
    update_tag: 'Add/remove tags',
    update_field: 'Modify customer data',
    add_to_segment: 'Add to segment',
    score: 'Update lead score',
    track_event: 'Log custom event',
    goal: 'Track conversion goal',
    combine: 'Combine populations',
    deduplication: 'Remove duplicates',
    enrichment: 'Add data fields',
    incremental_query: 'Incremental query',
    reconciliation: 'Match external data',
    save_audience: 'Save audience',
    change_dimension: 'Change dimension',
    change_data_source: 'Change data source',
    update_aggregate: 'Update aggregate',
    load_file: 'Load external data',
    extract_file: 'Extract data',
    transfer_file: 'Transfer file',
    javascript: 'Run script',
    ai_agent: 'Invoke a configured AI agent',
    ai_skill: 'Execute a skill from the library',
    ai_branch: 'LLM-powered conditional routing',
    ai_classifier: 'Classify contact and route',
    ai_scorer: 'Score contact on a dimension',
    ai_next_best_action: 'AI recommends next best action',
    ai_wait: 'Adaptive send-time optimization',
    ai_personalize: 'Generate personalized content',
    ai_translate: 'Translate to preferred language',
    ai_content_eval: 'Evaluate content quality',
    ai_enrich: 'Infer missing profile attributes',
    ai_sentiment: 'Analyze interaction sentiment',
    ai_hitl: 'Pause for human review',
    ai_guardrail: 'Validate AI outputs before proceeding',
    confidence_gate: 'Branch on AI confidence threshold',
    prompt_shield: 'Sanitize data before AI nodes',
    context_store: 'Persist AI context for this contact',
    context_recall: 'Retrieve stored AI context',
    outcome_tracker: 'Capture outcome for AI learning',
    ab_shadow: 'Run AI in shadow mode (no effect)',
    read_group: 'Read audience from static list (ACC readGroup)',
    data_writer: 'Update records / state (ACC writer)',
    script_condition: 'Script true/false branch (ACC jstest)',
    recurring_delivery: 'Scheduled recurring send (ACC deliveryRecurring)'
  };
  
  if (node.type === 'jump') {
    return `Jump to: ${getJumpTargetLabel(node)}`;
  }
  if (node.type === 'external_signal') {
    const signalName = node.config?.signal_key || node.config?.signal || 'Unset';
    return `Waiting for: ${signalName}`;
  }
  if (node.type === 'read_group') {
    const listName = (referenceData.audiences || []).find(a => String(a.id) === String(node.config?.audience_id))?.name;
    return listName ? `List: ${listName}` : 'Select static list audience';
  }
  if (node.type === 'script_condition') {
    const br = node.config?.execution_branch === 'false' ? 'false' : 'true';
    return `Run branch: ${br}`;
  }
  if (node.type === 'recurring_delivery') {
    return `${node.config?.channel || 'email'} · recurring`;
  }
  if (node.type === 'data_writer') {
    return `${node.config?.operation || 'update'} ${node.config?.entity_type || 'contacts'}`;
  }
  return descriptions[node.type] || 'Custom activity';
}

// Make node draggable
function makeNodeDraggable(nodeEl, node) {
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let undoPushed = false;
  
  nodeEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('connection-point') || e.target.classList.contains('node-menu')) {
      return;
    }
    
    isDragging = true;
    undoPushed = false;
    nodeEl.classList.add('dragging');
    
    const rect = nodeEl.getBoundingClientRect();
    dragOffset.x = (e.clientX - rect.left) / canvasState.zoom;
    dragOffset.y = (e.clientY - rect.top) / canvasState.zoom;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Push undo state once when the drag actually starts moving
    if (!undoPushed) {
      pushUndoState();
      undoPushed = true;
    }
    
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    node.position.x = (e.clientX - canvasRect.left - canvasState.pan.x) / canvasState.zoom - dragOffset.x;
    node.position.y = (e.clientY - canvasRect.top - canvasState.pan.y) / canvasState.zoom - dragOffset.y;
    
    nodeEl.style.left = `${node.position.x}px`;
    nodeEl.style.top = `${node.position.y}px`;
    
    scheduleCanvasBoundsUpdate();
    scheduleRenderConnections();
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      undoPushed = false;
      nodeEl.classList.remove('dragging');
    }
  });
}

// Start connection
function startConnection(nodeId) {
  isConnecting = true;
  connectionStart = nodeId;
}

// Complete connection
function completeConnection(nodeId) {
  if (!isConnecting || !connectionStart || connectionStart === nodeId) {
    isConnecting = false;
    connectionStart = null;
    pendingConnectionMeta = null;
    return;
  }
  
  // Check if connection already exists
  const exists = connections.some(c => c.from === connectionStart && c.to === nodeId);
  if (exists) {
    showToast('Connection already exists', 'warning');
    isConnecting = false;
    connectionStart = null;
    pendingConnectionMeta = null;
    return;
  }
  
  pushUndoState();
  connections.push({
    id: `conn-${Date.now()}`,
    from: connectionStart,
    to: nodeId,
    label: pendingConnectionMeta?.label || 'Result',
    transition_id: pendingConnectionMeta?.transitionId || null,
    is_fallback: pendingConnectionMeta?.isFallback || false
  });
  
  renderConnections();
  showToast('Nodes connected', 'success');
  
  isConnecting = false;
  connectionStart = null;
  pendingConnectionMeta = null;
}

// Render connections
function renderConnections() {
  const svg = document.getElementById('connections-svg');
  const canvas = document.getElementById('canvas');
  const content = document.getElementById('canvas-content');
  
  if (!svg || !canvas || !content) return;
  
  // Clear SVG
  svg.innerHTML = '';
  
  // SVG should match canvas size and position
  const contentWidth = content.offsetWidth || 0;
  const contentHeight = content.offsetHeight || 0;
  svg.style.width = `${contentWidth}px`;
  svg.style.height = `${contentHeight}px`;
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.pointerEvents = 'auto';
  
  svg.setAttribute('width', contentWidth);
  svg.setAttribute('height', contentHeight);
  svg.setAttribute('viewBox', `0 0 ${contentWidth} ${contentHeight}`);

  // Large graphs: skip per-edge geometry work that blocks the main thread for seconds
  const CONN_FAST_PATH_THRESHOLD = 120;
  const useConnFastPath = connections.length > CONN_FAST_PATH_THRESHOLD;
  
  // Add arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
    </marker>
    <marker id="arrowhead-jump" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
    </marker>
    <marker id="arrowhead-fallback" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
    </marker>
  `;
  svg.appendChild(defs);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const elById = new Map();
  content.querySelectorAll('.canvas-node').forEach((el) => {
    const id = el.dataset.nodeId;
    if (id) elById.set(id, el);
  });

  connections.forEach((conn) => {
    const fromNode = nodeById.get(conn.from);
    const toNode = nodeById.get(conn.to);

    if (!fromNode || !toNode) return;

    const fromEl = elById.get(conn.from);
    const toEl = elById.get(conn.to);

    if (!fromEl || !toEl) return;
    
    const fromWidth = fromEl.offsetWidth;
    const fromHeight = fromEl.offsetHeight;
    const toWidth = toEl.offsetWidth;
    const toHeight = toEl.offsetHeight;
    
    // Connection points are at:
    // - Output: right edge of node (node.x + width), vertically centered (node.y + height/2)
    // - Input: left edge of node (node.x), vertically centered (node.y + height/2)
    let y1 = fromNode.position.y + (fromHeight / 2);
    if ((fromNode.type === 'split' || fromNode.type === 'script_condition') && conn.transition_id) {
      const transitionEl = fromEl.querySelector(`.split-output[data-transition-id="${conn.transition_id}"]`);
      if (transitionEl) {
        y1 = fromNode.position.y + transitionEl.offsetTop + transitionEl.offsetHeight / 2;
      }
    }
    const x1 = fromNode.position.x + fromWidth;
    
    const x2 = toNode.position.x;
    const y2 = toNode.position.y + (toHeight / 2);
    
    // Create Bezier curve path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const controlOffset = Math.min(Math.abs(x2 - x1) / 2, 100);
    const curve = `M ${x1},${y1} C ${x1 + controlOffset},${y1} ${x2 - controlOffset},${y2} ${x2},${y2}`;
    
    const isFallbackEdge = !!conn.is_fallback;
    path.setAttribute('d', curve);
    path.setAttribute('stroke', isFallbackEdge ? '#f59e0b' : '#6366f1');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    if (isFallbackEdge) path.setAttribute('stroke-dasharray', '6 3');
    path.setAttribute('marker-end', isFallbackEdge ? 'url(#arrowhead-fallback)' : 'url(#arrowhead)');
    path.setAttribute('class', `connection-line${isFallbackEdge ? ' fallback-edge' : ''}${selectedConnectionId === conn.id ? ' selected' : ''}`);
    path.dataset.connectionId = conn.id;
    
    // Click to select
    path.style.cursor = 'pointer';
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      selectConnection(conn.id);
    });
    
    svg.appendChild(path);

    let mid;
    if (useConnFastPath) {
      mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    } else {
      // Insert handle (+) at midpoint of the connection
      const handleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      handleGroup.setAttribute('class', `connection-insert-handle${insertConnectionId === conn.id ? ' active' : ''}`);
      handleGroup.dataset.connectionId = conn.id;
      handleGroup.style.cursor = 'pointer';
      handleGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        setInsertConnection(conn.id);
      });

      const length = path.getTotalLength();
      mid = path.getPointAtLength(length / 2);
      handleGroup.setAttribute('transform', `translate(${mid.x}, ${mid.y})`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '9');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('class', 'connection-insert-circle');

      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '-4');
      hLine.setAttribute('y1', '0');
      hLine.setAttribute('x2', '4');
      hLine.setAttribute('y2', '0');
      hLine.setAttribute('class', 'connection-insert-plus');

      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', '0');
      vLine.setAttribute('y1', '-4');
      vLine.setAttribute('x2', '0');
      vLine.setAttribute('y2', '4');
      vLine.setAttribute('class', 'connection-insert-plus');

      handleGroup.appendChild(circle);
      handleGroup.appendChild(hLine);
      handleGroup.appendChild(vLine);
      svg.appendChild(handleGroup);
    }
    
    // Label on connection (skip runtime stats for Start → first node; they have no significance there)
    const fromRuntime = runtimeByNode[conn.from];
    const connLabel = conn.label || 'Result';
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('class', 'connection-result-label');
    const showRuntime = fromRuntime && fromRuntime.count !== undefined && fromRuntime.seconds !== undefined && fromNode.type !== 'entry';
    const text = showRuntime
      ? `${fromRuntime.count.toLocaleString()} • ${fromRuntime.seconds.toFixed(1)}s – ${connLabel}`
      : connLabel;
    
    const labelX = mid.x + 8;
    const labelY = mid.y - 12;
    const paddingX = 6;
    const paddingY = 4;
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', labelX + paddingX);
    textEl.setAttribute('y', labelY);
    textEl.textContent = text;
    
    const textWidth = text.length * 7.2; // approx
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', labelX);
    rect.setAttribute('y', labelY - 12);
    rect.setAttribute('rx', '6');
    rect.setAttribute('ry', '6');
    rect.setAttribute('width', textWidth + paddingX * 2);
    rect.setAttribute('height', 20);
    
    labelGroup.appendChild(rect);
    labelGroup.appendChild(textEl);
    svg.appendChild(labelGroup);
  });

  // Render jump links (dashed)
  nodes.filter((n) => n.type === 'jump' && n.config?.target_node_id).forEach((node) => {
    const target = nodeById.get(node.config.target_node_id);
    if (!target) return;
    const fromEl = elById.get(node.id);
    const toEl = elById.get(target.id);
    if (!fromEl || !toEl) return;
    const fromWidth = fromEl.offsetWidth;
    const fromHeight = fromEl.offsetHeight;
    const toWidth = toEl.offsetWidth;
    const toHeight = toEl.offsetHeight;
    const x1 = node.position.x + fromWidth;
    const y1 = node.position.y + (fromHeight / 2);
    const x2 = target.position.x;
    const y2 = target.position.y + (toHeight / 2);
    const controlOffset = Math.min(Math.abs(x2 - x1) / 2, 120);
    const curve = `M ${x1},${y1} C ${x1 + controlOffset},${y1} ${x2 - controlOffset},${y2} ${x2},${y2}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', curve);
    path.setAttribute('stroke', '#9ca3af');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead-jump)');
    path.setAttribute('class', 'connection-line jump-connection');
    svg.appendChild(path);
  });
}

// Insert a node between an existing connection
function insertNodeBetweenConnection(connection, newNodeId) {
  connections = connections.filter(c => c.id !== connection.id);
  
  connections.push({
    id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: connection.from,
    to: newNodeId,
    label: connection.label || 'Result'
  });
  
  connections.push({
    id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: newNodeId,
    to: connection.to,
    label: connection.label || 'Result'
  });
  
  renderConnections();
  showToast('Inserted activity between nodes', 'success');
}

function setInsertConnection(connectionId) {
  insertConnectionId = connectionId;
  selectedConnectionId = connectionId;
  renderConnections();
  showToast('Drop an activity on the canvas to insert here', 'info');
}

// Schedule connection rendering for smooth updates
function scheduleRenderConnections() {
  if (connectionsRenderQueued) return;
  connectionsRenderQueued = true;
  requestAnimationFrame(() => {
    connectionsRenderQueued = false;
    renderConnections();
  });
}

function scheduleCanvasBoundsUpdate() {
  if (boundsUpdateQueued) return;
  boundsUpdateQueued = true;
  requestAnimationFrame(() => {
    boundsUpdateQueued = false;
    updateCanvasBounds();
  });
}

function updateCanvasBounds() {
  const canvas = document.getElementById('canvas');
  const content = document.getElementById('canvas-content');
  if (!canvas || !content) return;
  
  const baseWidth = 800;
  const baseHeight = 600;
  const padding = 220;
  let maxX = 0;
  let maxY = 0;
  
  nodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  
  const nextWidth = Math.max(baseWidth, maxX + padding);
  const nextHeight = Math.max(baseHeight, maxY + padding);
  
  content.style.width = `${nextWidth}px`;
  content.style.height = `${nextHeight}px`;
}

function getIncomingNodes(nodeId) {
  const incomingIds = connections.filter(c => c.to === nodeId).map(c => c.from);
  return incomingIds.map(id => nodes.find(n => n.id === id)?.name || id);
}

function getNodeById(nodeId) {
  return nodes.find(n => n.id === nodeId) || null;
}

function getJumpTargetLabel(node) {
  const targetId = node?.config?.target_node_id;
  if (!targetId) return 'Select target';
  const target = getNodeById(targetId);
  if (!target) return 'Missing target';
  return target.name || target.type;
}

function focusNode(nodeOrId) {
  const node =
    typeof nodeOrId === 'object' && nodeOrId && nodeOrId.id != null
      ? nodeOrId
      : getNodeById(String(nodeOrId));
  if (!node) return;
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const { width, height } = getNodeDimensions(node);
  const centerX = node.position.x + width / 2;
  const centerY = node.position.y + height / 2;
  const viewWidth = canvas.clientWidth || 1;
  const viewHeight = canvas.clientHeight || 1;
  canvasState.pan.x = viewWidth / 2 - centerX * canvasState.zoom;
  canvasState.pan.y = viewHeight / 2 - centerY * canvasState.zoom;
  applyCanvasTransform();
  renderConnections();
}

function addSplitTransition(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  if (!node.config.transitions) node.config.transitions = [];
  const transition = {
    id: `trans-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    label: 'Subset',
    segment_code: '',
    enable_limit: false,
    skip_empty: false
  };
  node.config.transitions.push(transition);
  renderCanvas();
  showNodeProperties(node);
}

function removeSplitTransition(nodeId, transitionId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.config?.transitions) return;
  node.config.transitions = node.config.transitions.filter(t => t.id !== transitionId);
  connections = connections.filter(c => c.transition_id !== transitionId);
  renderConnections();
  renderCanvas();
  showNodeProperties(node);
}

function moveSplitTransition(nodeId, transitionId, direction) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.config?.transitions) return;
  const idx = node.config.transitions.findIndex(t => t.id === transitionId);
  const next = idx + direction;
  if (idx < 0 || next < 0 || next >= node.config.transitions.length) return;
  const temp = node.config.transitions[idx];
  node.config.transitions[idx] = node.config.transitions[next];
  node.config.transitions[next] = temp;
  renderCanvas();
  showNodeProperties(node);
}

function updateSplitTransitionLabel(nodeId, transitionId, value) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.config?.transitions) return;
  const transition = node.config.transitions.find(t => t.id === transitionId);
  if (!transition) return;
  transition.label = value;
  connections.forEach(conn => {
    if (conn.transition_id === transitionId) {
      conn.label = value || 'Result';
    }
  });
  renderConnections();
}

function updateSplitTransitionConfig(nodeId, transitionId, key, value) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.config?.transitions) return;
  const transition = node.config.transitions.find(t => t.id === transitionId);
  if (!transition) return;
  transition[key] = value;
}

function startSplitTransitionConnection(nodeId, transitionId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.config?.transitions) return;
  const transition = node.config.transitions.find(t => t.id === transitionId);
  if (!transition) return;
  pendingConnectionMeta = { label: transition.label || 'Result', transitionId };
  startConnection(nodeId);
  showToast('Click another node to connect this transition', 'info');
}

function startBranchConnection(nodeId, transitionId) {
  const label = transitionId === 'true' ? 'True' : transitionId === 'false' ? 'False' : String(transitionId);
  pendingConnectionMeta = { label, transitionId };
  startConnection(nodeId);
  showToast('Click another node to connect this branch', 'info');
}

// Select node
function selectNode(node) {
  if (jumpTargetSelectMode && node.id !== jumpTargetSelectMode) {
    const jumpNode = getNodeById(jumpTargetSelectMode);
    if (jumpNode) {
      jumpNode.config.target_node_id = node.id;
      showToast(`Jump target set to "${node.name}"`, 'success');
      showNodeProperties(jumpNode);
      renderCanvas();
    }
    jumpTargetSelectMode = null;
    return;
  }
  selectedNode = node;
  selectedConnectionId = null;
  
  // Update UI
  document.querySelectorAll('.canvas-node').forEach(el => {
    el.classList.remove('selected');
  });
  
  const nodeEl = getCanvasNodeEl(node.id);
  if (nodeEl) {
    nodeEl.classList.add('selected');
  }
  
  // Show properties
  showNodeProperties(node);
  updatePropertiesPanelVisibility();
}

function enableJumpTargetSelect(jumpNodeId) {
  jumpTargetSelectMode = jumpNodeId;
  showToast('Select a target node on the canvas', 'info');
}

function startTimeoutConnection(nodeId) {
  pendingConnectionMeta = { label: 'Timeout', transitionId: 'timeout' };
  startConnection(nodeId);
  showToast('Click a node to connect the timeout path', 'info');
}

function simulateExternalSignal(nodeId) {
  const runtime = runtimeByNode[nodeId] || {};
  runtime.status = 'received';
  runtimeByNode[nodeId] = runtime;
  if (executionState.waitingNodeId === nodeId) {
    executionState.waitingNodeId = null;
    executionState.running = true;
    executionState.intervalId = setInterval(() => {
      advanceExecution();
    }, 1200);
  }
  renderCanvas();
  showToast('Signal received (simulated)', 'success');
}

function simulateExternalTimeout(nodeId) {
  const runtime = runtimeByNode[nodeId] || {};
  runtime.status = 'timed_out';
  runtimeByNode[nodeId] = runtime;
  if (executionState.waitingNodeId === nodeId) {
    executionState.waitingNodeId = null;
    executionState.running = true;
    executionState.intervalId = setInterval(() => {
      advanceExecution();
    }, 1200);
  }
  renderCanvas();
  showToast('Timeout triggered (simulated)', 'warning');
}

function selectNodeById(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (node) {
    selectNode(node);
    showToast('Node selected. Use toolbar delete to remove.', 'info');
  }
}

function selectConnection(connectionId) {
  selectedConnectionId = connectionId;
  selectedNode = null;
  if (insertConnectionId && insertConnectionId !== connectionId) {
    insertConnectionId = null;
  }
  renderConnections();
  showConnectionProperties(connectionId);
  updatePropertiesPanelVisibility();
  showToast('Connection selected. Use toolbar delete to remove.', 'info');
}

function deleteConnection(connectionId) {
  pushUndoState();
  connections = connections.filter(c => c.id !== connectionId);
  selectedConnectionId = null;
  insertConnectionId = null;
  renderCanvas();
  updatePropertiesPanelVisibility();
  showToast('Connection deleted', 'success');
}

// Start workflow with simulated numbers (toolbar "Start" button)
function startWorkflowDemo() {
  executionState.realNodeResults = null;
  startWorkflow();
}

// Workflow execution controls (visual simulation)
function startWorkflow() {
  if (executionState.running) {
    showToast('Workflow already running', 'info');
    return;
  }
  if (nodes.length === 0) {
    showToast('Add nodes to start workflow', 'warning');
    return;
  }
  
  resetExecutionState();
  executionState.order = getExecutionOrder();
  if (executionState.order.length === 0) {
    showToast('No runnable nodes found', 'warning');
    return;
  }
  if (executionState.realNodeResults && Object.keys(executionState.realNodeResults).length > 0) {
    executionState.order.forEach(id => {
      if (!runtimeByNode[id]) runtimeByNode[id] = { status: 'pending' };
      const r = executionState.realNodeResults[id];
      runtimeByNode[id].count = r?.count ?? 0;
      runtimeByNode[id].seconds = 1;
      if (r?.status) runtimeByNode[id].status = r.status;
    });
  } else {
    assignRuntimeCounts(executionState.order);
    executionState.order.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node && node.category === 'channels' && node.config?.delivery_id && isDraftDeliveryNode(node)) {
        runtimeByNode[id].status = 'paused';
      }
    });
  }
  executionState.currentIndex = 0;
  setNodeStatus(executionState.order[0], 'executing');
  executionState.running = true;
  renderCanvas();
  
  executionState.intervalId = setInterval(() => {
    advanceExecution();
  }, 1200);
  
  showToast('Workflow started', 'success');
}

function stopWorkflow() {
  if (!executionState.running) {
    showToast('Workflow is not running', 'info');
    return;
  }
  clearInterval(executionState.intervalId);
  executionState.intervalId = null;
  executionState.running = false;
  
  const currentId = executionState.order[executionState.currentIndex];
  if (currentId && runtimeByNode[currentId]) {
    runtimeByNode[currentId].status = 'paused';
  }
  renderCanvas();
  showToast('Workflow stopped', 'warning');
}

function restartWorkflow() {
  if (executionState.running) {
    stopWorkflow();
  }
  resetExecutionState();
  startWorkflow();
}

function advanceExecution() {
  const currentId = executionState.order[executionState.currentIndex];
  if (currentId && runtimeByNode[currentId]) {
    const currentNode = nodes.find(n => n.id === currentId);

    // Skip disabled nodes immediately
    if (currentNode?.disabled) {
      runtimeByNode[currentId].status = 'skipped';
      executionState.currentIndex += 1;
      if (executionState.currentIndex >= executionState.order.length) {
        clearInterval(executionState.intervalId);
        executionState.intervalId = null;
        executionState.running = false;
        renderCanvas();
        showToast('Workflow completed', 'success');
        return;
      }
      const nextId = executionState.order[executionState.currentIndex];
      setNodeStatus(nextId, 'executing');
      renderCanvas();
      return;
    }

    // Pause execution at paused nodes
    if (currentNode?.paused && runtimeByNode[currentId].status === 'executing') {
      runtimeByNode[currentId].status = 'paused';
      clearInterval(executionState.intervalId);
      executionState.intervalId = null;
      executionState.running = false;
      renderCanvas();
      showToast(`Execution paused at ${currentNode.name}`, 'warning');
      return;
    }

    // Pause at channel nodes with draft delivery (wait/paused status)
    if (currentNode && (runtimeByNode[currentId].status === 'paused' || isDraftDeliveryNode(currentNode))) {
      runtimeByNode[currentId].status = 'paused';
      clearInterval(executionState.intervalId);
      executionState.intervalId = null;
      executionState.running = false;
      renderCanvas();
      showToast(`Execution paused at ${currentNode.name} – delivery is draft`, 'warning');
      return;
    }

    if (currentNode?.type === 'external_signal') {
      runtimeByNode[currentId].status = 'waiting';
      executionState.waitingNodeId = currentId;
      clearInterval(executionState.intervalId);
      executionState.intervalId = null;
      executionState.running = false;
      renderCanvas();
      showToast('Workflow waiting for external signal', 'info');
      return;
    }
    runtimeByNode[currentId].status = 'completed';
  }
  
  // Handle jump redirect
  if (currentId) {
    const jumpNode = nodes.find(n => n.id === currentId && n.type === 'jump');
    const targetId = jumpNode?.config?.target_node_id;
    if (targetId) {
      const targetIndex = executionState.order.indexOf(targetId);
      if (targetIndex !== -1) {
        executionState.currentIndex = targetIndex;
        setNodeStatus(targetId, 'executing');
        renderCanvas();
        return;
      }
    }
  }

  executionState.currentIndex += 1;
  if (executionState.currentIndex >= executionState.order.length) {
    clearInterval(executionState.intervalId);
    executionState.intervalId = null;
    executionState.running = false;
    renderCanvas();
    showToast('Workflow completed', 'success');
    return;
  }
  
  const nextId = executionState.order[executionState.currentIndex];
  setNodeStatus(nextId, 'executing');
  renderCanvas();
}

function resetExecutionState() {
  executionState.order = [];
  executionState.currentIndex = -1;
  executionState.waitingNodeId = null;
  runtimeByNode = {};
  nodes.forEach(node => {
    runtimeByNode[node.id] = { status: 'pending' };
  });
}

function setNodeStatus(nodeId, status) {
  if (!runtimeByNode[nodeId]) runtimeByNode[nodeId] = {};
  runtimeByNode[nodeId].status = status;
}

function isDraftDeliveryNode(node) {
  if (node.category !== 'channels' || !node.config?.delivery_id) return false;
  const deliveryId = node.config.delivery_id;
  const d = (referenceData.deliveries || []).find(
    del => del.id === deliveryId || del.id === parseInt(deliveryId, 10)
  );
  return d && String(d.status || '').toLowerCase() === 'draft';
}

function assignRuntimeCounts(order) {
  let base = 1200 + Math.floor(Math.random() * 800);
  order.forEach((id, idx) => {
    const decay = Math.max(0.3, Math.pow(0.72, idx));
    const jitter = 0.9 + Math.random() * 0.2;
    const count = Math.max(0, Math.round(base * decay * jitter));
    const seconds = Math.max(0.4, (0.6 + Math.random() * 2.4));
    if (!runtimeByNode[id]) runtimeByNode[id] = {};
    runtimeByNode[id].count = count;
    runtimeByNode[id].seconds = seconds;
  });
}

function getExecutionOrder() {
  if (nodes.length === 0) return [];
  const adjacency = new Map();
  nodes.forEach(n => adjacency.set(n.id, []));
  connections.forEach(c => {
    if (adjacency.has(c.from)) {
      adjacency.get(c.from).push(c.to);
    }
  });
  nodes.filter(n => n.type === 'jump' && n.config?.target_node_id).forEach(n => {
    if (adjacency.has(n.id)) {
      adjacency.get(n.id).push(n.config.target_node_id);
    }
  });
  
  const entryNodes = nodes.filter(n => n.type === 'entry');
  const startIds = entryNodes.length > 0 ? entryNodes.map(n => n.id) : [nodes[0].id];
  const visited = new Set();
  const order = [];
  const queue = [...startIds];
  
  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    order.push(id);
    const nexts = adjacency.get(id) || [];
    nexts.forEach(nid => {
      if (!visited.has(nid)) queue.push(nid);
    });
  }
  
  // Append any disconnected nodes
  nodes.forEach(n => {
    if (!visited.has(n.id)) order.push(n.id);
  });
  
  return order;
}

// Show node properties
function showNodeProperties(node) {
  const propertiesContent = document.getElementById('properties-content');
  
  const typeLabel = node.type.replace(/_/g, ' ');
  const isDisabled = !!node.disabled;
  const isPaused   = !!node.paused;
  let html = `
    <div class="properties-node-header">
      <span class="properties-node-icon">${node.icon}</span>
      <div class="properties-node-info">
        <span class="properties-node-name">${node.name}</span>
        <span class="properties-node-type">${typeLabel}</span>
      </div>
    </div>
    <div class="prop-action-bar">
      <button class="prop-action-btn prop-action-delete" title="Delete" onclick="propActionDelete('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
      <button class="prop-action-btn ${isDisabled ? 'active' : ''}" title="${isDisabled ? 'Enable' : 'Disable'}" onclick="propActionDisable('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
      </button>
      <button class="prop-action-btn ${isPaused ? 'active' : ''}" title="${isPaused ? 'Resume' : 'Pause'}" onclick="propActionPause('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
      </button>
      <button class="prop-action-btn" title="Duplicate" onclick="propActionCopy('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      </button>
      <button class="prop-action-btn" title="Logs" onclick="propActionLogs('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
      </button>
      <button class="prop-action-btn" title="Tasks" onclick="propActionTasks('${node.id}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
      </button>
    </div>
    <div class="properties-form">
      <div class="properties-section-title">Configuration</div>
      <div class="form-group">
        <label class="form-label">Node Name</label>
        <input type="text" class="form-input" value="${node.name}" onchange="updateNodeProperty('name', this.value)">
      </div>
  `;
  
  // Add type-specific properties
  if (node.type === 'query' || node.type === 'build_audience') {
    html += `
      <div class="form-group">
        <label class="form-label">Source Type</label>
        <select class="form-input" onchange="updateNodeConfig('source_type', this.value)">
          <option value="segment" ${node.config.source_type === 'segment' ? 'selected' : ''}>Segment</option>
          <option value="audience" ${node.config.source_type === 'audience' ? 'selected' : ''}>Audience</option>
          <option value="custom" ${node.config.source_type === 'custom' ? 'selected' : ''}>Custom Query</option>
        </select>
      </div>
    `;
    if (node.config.source_type === 'audience') {
      html += `
        <div class="form-group">
          <label class="form-label">Select Audience</label>
          <select class="form-input" onchange="updateNodeConfig('audience_id', this.value)">
            <option value="">Choose an audience...</option>
            ${referenceData.audiences.map(aud => `
              <option value="${aud.id}" ${node.config.audience_id == aud.id ? 'selected' : ''}>
                ${aud.name}
              </option>
            `).join('')}
          </select>
          <div class="form-inline-actions">
            <button class="btn btn-sm btn-primary" onclick="createAudienceFromNode('${node.id}')">+ Create Audience</button>
          </div>
        </div>
      `;
    } else if (node.config.source_type === 'custom') {
      const baseEntity = node.config.base_entity || 'contacts';
      html += `
        <div class="form-group">
          <label class="form-label">Base Entity</label>
          <select class="form-input" onchange="updateNodeConfig('base_entity', this.value)">
            <option value="contacts" ${baseEntity === 'contacts' ? 'selected' : ''}>Contacts</option>
            <option value="orders" ${baseEntity === 'orders' ? 'selected' : ''}>Orders</option>
            <option value="events" ${baseEntity === 'events' ? 'selected' : ''}>Activity</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Custom Conditions (JSON)</label>
          <textarea class="form-input" rows="4" onchange="updateNodeConfig('query_json', this.value)">${node.config.query_json || ''}</textarea>
        </div>
      `;
    } else {
      const segmentCountFor = (seg) => {
        const runCount = executionState.realNodeResults && node.config.segment_id == seg.id
          ? executionState.realNodeResults[node.id]?.count
          : null;
        return runCount != null ? runCount : (seg.contact_count ?? 0);
      };
      html += `
        <div class="form-group">
          <label class="form-label">Select Segment</label>
          <select class="form-input" onchange="updateNodeConfig('segment_id', this.value)">
            <option value="">Choose a segment...</option>
            ${referenceData.segments.map(seg => `
              <option value="${seg.id}" ${node.config.segment_id == seg.id ? 'selected' : ''}>
                ${seg.name} (${segmentCountFor(seg).toLocaleString()} contacts)
              </option>
            `).join('')}
          </select>
          <div class="form-inline-actions">
            <button class="btn btn-sm btn-primary" onclick="createSegmentFromNode('${node.id}')">+ Create Segment</button>
          </div>
        </div>
      `;
    }
  } else if (node.type === 'segment') {
    const segmentCountFor = (seg) => {
      const runCount = executionState.realNodeResults && node.config.segment_id == seg.id
        ? executionState.realNodeResults[node.id]?.count
        : null;
      return runCount != null ? runCount : (seg.contact_count ?? 0);
    };
    html += `
      <div class="form-group">
        <label class="form-label">Select Segment</label>
        <select class="form-input" onchange="updateNodeConfig('segment_id', this.value)">
          <option value="">Choose a segment...</option>
          ${referenceData.segments.map(seg => `
            <option value="${seg.id}" ${node.config.segment_id == seg.id ? 'selected' : ''}>
              ${seg.name} (${segmentCountFor(seg).toLocaleString()} contacts)
            </option>
          `).join('')}
        </select>
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-primary" onclick="createSegmentFromNode('${node.id}')">+ Create Segment</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Action</label>
        <select class="form-input" onchange="updateNodeConfig('action', this.value)">
          <option value="include" ${node.config.action === 'include' ? 'selected' : ''}>Include in segment</option>
          <option value="exclude" ${node.config.action === 'exclude' ? 'selected' : ''}>Exclude from segment</option>
        </select>
      </div>
    `;
  } else if (node.type === 'filter') {
    html += `
      <div class="form-group">
        <label class="form-label">Filter By</label>
        <select class="form-input" onchange="updateNodeConfig('filter_field', this.value)">
          <option value="">Select field...</option>
          <option value="engagement_score" ${node.config.filter_field === 'engagement_score' ? 'selected' : ''}>Engagement Score</option>
          <option value="loyalty_tier" ${node.config.filter_field === 'loyalty_tier' ? 'selected' : ''}>Loyalty Tier</option>
          <option value="subscription_status" ${node.config.filter_field === 'subscription_status' ? 'selected' : ''}>Subscription Status</option>
          <option value="total_purchases" ${node.config.filter_field === 'total_purchases' ? 'selected' : ''}>Total Purchases</option>
          <option value="lifetime_value" ${node.config.filter_field === 'lifetime_value' ? 'selected' : ''}>Lifetime Value</option>
          <option value="last_purchase_date" ${node.config.filter_field === 'last_purchase_date' ? 'selected' : ''}>Last Purchase Date</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Operator</label>
        <select class="form-input" onchange="updateNodeConfig('operator', this.value)">
          <option value="equals" ${node.config.operator === 'equals' ? 'selected' : ''}>Equals</option>
          <option value="not_equals" ${node.config.operator === 'not_equals' ? 'selected' : ''}>Not Equals</option>
          <option value="greater_than" ${node.config.operator === 'greater_than' ? 'selected' : ''}>Greater Than</option>
          <option value="less_than" ${node.config.operator === 'less_than' ? 'selected' : ''}>Less Than</option>
          <option value="contains" ${node.config.operator === 'contains' ? 'selected' : ''}>Contains</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Value</label>
        <input type="text" class="form-input" value="${node.config.filter_value || ''}" onchange="updateNodeConfig('filter_value', this.value)">
        <div class="form-help">Enter the value to filter by</div>
      </div>
    `;
  } else if (node.type === 'condition') {
    html += `
      <div class="form-group">
        <label class="form-label">Condition Type</label>
        <select class="form-input" onchange="updateNodeConfig('condition_type', this.value)">
          <option value="email_opened" ${node.config.condition_type === 'email_opened' ? 'selected' : ''}>Email Opened</option>
          <option value="email_clicked" ${node.config.condition_type === 'email_clicked' ? 'selected' : ''}>Email Clicked</option>
          <option value="purchased" ${node.config.condition_type === 'purchased' ? 'selected' : ''}>Made Purchase</option>
          <option value="visited_page" ${node.config.condition_type === 'visited_page' ? 'selected' : ''}>Visited Page</option>
          <option value="abandoned_cart" ${node.config.condition_type === 'abandoned_cart' ? 'selected' : ''}>Abandoned Cart</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Time Window (days)</label>
        <input type="number" class="form-input" value="${node.config.time_window || 7}" min="1" max="30" onchange="updateNodeConfig('time_window', this.value)">
        <div class="form-help">Check if condition met within this many days</div>
      </div>
    `;
  } else if (node.type === 'exclude') {
    html += `
      <div class="form-group">
        <label class="form-label">Exclude Segment</label>
        <select class="form-input" onchange="updateNodeConfig('exclude_segment_id', this.value)">
          <option value="">Choose a segment...</option>
          ${referenceData.segments.map(seg => `
            <option value="${seg.id}" ${node.config.exclude_segment_id == seg.id ? 'selected' : ''}>
              ${seg.name}
            </option>
          `).join('')}
        </select>
        <div class="form-help">Remove contacts in this segment</div>
      </div>
    `;
  } else if (node.type === 'wait') {
    html += `
      <div class="form-group">
        <label class="form-label">Wait Time</label>
        <input type="number" class="form-input" value="${node.config.wait_time || 5}" min="1" onchange="updateNodeConfig('wait_time', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-input" onchange="updateNodeConfig('wait_unit', this.value)">
          <option value="minutes" ${node.config.wait_unit === 'minutes' ? 'selected' : ''}>Minutes</option>
          <option value="hours" ${node.config.wait_unit === 'hours' ? 'selected' : ''}>Hours</option>
          <option value="days" ${node.config.wait_unit === 'days' ? 'selected' : ''}>Days</option>
        </select>
      </div>
    `;
  } else if (node.type === 'split') {
    const transitions = node.config.transitions || [];
    const transitionsHtml = transitions.map(t => `
      <div class="split-transition">
        <div class="split-transition-header">
          <span>${t.label || 'Subset'}</span>
          <div class="split-transition-actions">
            <button class="btn btn-sm btn-ghost" title="Move up" onclick="moveSplitTransition('${node.id}', '${t.id}', -1)">↑</button>
            <button class="btn btn-sm btn-ghost" title="Move down" onclick="moveSplitTransition('${node.id}', '${t.id}', 1)">↓</button>
            <button class="btn btn-sm btn-ghost" title="Delete" onclick="removeSplitTransition('${node.id}', '${t.id}')">${_ico('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>')}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Transition label</label>
          <input type="text" class="form-input" value="${t.label || ''}" onchange="updateSplitTransitionLabel('${node.id}', '${t.id}', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Segment code</label>
          <input type="text" class="form-input" value="${t.segment_code || ''}" onchange="updateSplitTransitionConfig('${node.id}', '${t.id}', 'segment_code', this.value)">
        </div>
        <div class="split-filter-row">
          <button class="btn btn-sm btn-secondary" type="button">${_ico('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>')} Create filter</button>
        </div>
        <div class="split-toggle-row">
          <label class="form-label">Enable limit</label>
          <label class="toggle">
            <input type="checkbox" ${t.enable_limit ? 'checked' : ''} onchange="updateSplitTransitionConfig('${node.id}', '${t.id}', 'enable_limit', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="split-toggle-row">
          <label class="form-label">Skip empty transition</label>
          <label class="toggle">
            <input type="checkbox" ${t.skip_empty ? 'checked' : ''} onchange="updateSplitTransitionConfig('${node.id}', '${t.id}', 'skip_empty', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `).join('');
    html += `
      <div class="split-segment-header">
        <div class="split-segment-title">Segment</div>
        <button class="btn btn-sm btn-primary" type="button" onclick="addSplitTransition('${node.id}')">+ Add segment</button>
      </div>
      ${transitionsHtml || '<div class="form-help">No segments added yet.</div>'}
    `;
  } else if (node.type === 'combine') {
    const incoming = getIncomingNodes(node.id);
    const sourcesHtml = incoming.length
      ? `<div class="source-pill-row">${incoming.map(name => `<span class="source-pill">${name}</span>`).join('')}</div>`
      : `<div class="form-help">No connected sources yet</div>`;
    html += `
      <div class="form-group">
        <label class="form-label">Operation</label>
        <select class="form-input" onchange="updateNodeConfig('operation', this.value)">
          <option value="union" ${node.config.operation === 'union' ? 'selected' : ''}>Union</option>
          <option value="intersection" ${node.config.operation === 'intersection' ? 'selected' : ''}>Intersection</option>
          <option value="exclude" ${node.config.operation === 'exclude' ? 'selected' : ''}>Exclude</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Connected Sources</label>
        ${sourcesHtml}
      </div>
    `;
  } else if (node.type === 'deduplication') {
    html += `
      <div class="form-group">
        <label class="form-label">Deduplication Keys</label>
        <input type="text" class="form-input" value="${node.config.keys || 'email'}" onchange="updateNodeConfig('keys', this.value)">
        <div class="form-help">Comma-separated fields (e.g., email, phone)</div>
      </div>
    `;
  } else if (node.type === 'enrichment') {
    html += `
      <div class="form-group">
        <label class="form-label">Fields to Enrich</label>
        <input type="text" class="form-input" value="${node.config.fields || ''}" onchange="updateNodeConfig('fields', this.value)">
        <div class="form-help">Comma-separated fields to add</div>
      </div>
    `;
  } else if (node.type === 'incremental_query') {
    html += `
      <div class="form-group">
        <label class="form-label">Lookback (days)</label>
        <input type="number" class="form-input" value="${node.config.days || 7}" min="1" onchange="updateNodeConfig('days', this.value)">
      </div>
    `;
  } else if (node.type === 'reconciliation') {
    html += `
      <div class="form-group">
        <label class="form-label">Reconciliation Key</label>
        <input type="text" class="form-input" value="${node.config.key || 'email'}" onchange="updateNodeConfig('key', this.value)">
      </div>
    `;
  } else if (node.type === 'save_audience') {
    html += `
      <div class="form-group">
        <label class="form-label">Audience Name</label>
        <input type="text" class="form-input" value="${node.config.name || ''}" onchange="updateNodeConfig('name', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Mode</label>
        <select class="form-input" onchange="updateNodeConfig('mode', this.value)">
          <option value="create" ${node.config.mode === 'create' ? 'selected' : ''}>Create</option>
          <option value="update" ${node.config.mode === 'update' ? 'selected' : ''}>Update</option>
        </select>
      </div>
    `;
  } else if (node.type === 'change_dimension') {
    html += `
      <div class="form-group">
        <label class="form-label">Dimension</label>
        <select class="form-input" onchange="updateNodeConfig('dimension', this.value)">
          <option value="contacts" ${node.config.dimension === 'contacts' ? 'selected' : ''}>Contacts</option>
          <option value="orders" ${node.config.dimension === 'orders' ? 'selected' : ''}>Orders</option>
          <option value="custom" ${node.config.dimension === 'custom' ? 'selected' : ''}>Custom</option>
        </select>
      </div>
    `;
  } else if (node.type === 'change_data_source') {
    html += `
      <div class="form-group">
        <label class="form-label">Data Source</label>
        <select class="form-input" onchange="updateNodeConfig('source', this.value)">
          <option value="local" ${node.config.source === 'local' ? 'selected' : ''}>Local</option>
          <option value="external" ${node.config.source === 'external' ? 'selected' : ''}>External</option>
        </select>
      </div>
    `;
  } else if (node.type === 'scheduler') {
    html += `
      <div class="form-group">
        <label class="form-label">Frequency</label>
        <select class="form-input" onchange="updateNodeConfig('frequency', this.value)">
          <option value="once" ${node.config.frequency === 'once' ? 'selected' : ''}>Once</option>
          <option value="daily" ${node.config.frequency === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${node.config.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Time</label>
        <input type="time" class="form-input" value="${node.config.time || '09:00'}" onchange="updateNodeConfig('time', this.value)">
      </div>
    `;
  } else if (node.type === 'fork') {
    html += `
      <div class="form-group">
        <label class="form-label">Branches</label>
        <input type="number" class="form-input" value="${node.config.branches || 2}" min="2" max="5" onchange="updateNodeConfig('branches', this.value)">
      </div>
    `;
  } else if (node.type === 'jump') {
    const targetId = node.config.target_node_id || '';
    const targetOptions = nodes
      .filter(n => n.id !== node.id && !['entry', 'exit', 'stop'].includes(n.type))
      .map(n => `<option value="${n.id}" ${targetId === n.id ? 'selected' : ''}>${n.name} (${n.type})</option>`)
      .join('');
    const targetMissing = targetId && !getNodeById(targetId);
    html += `
      <div class="form-group">
        <label class="form-label">Target Activity</label>
        <select class="form-input" onchange="updateNodeConfig('target_node_id', this.value)">
          <option value="">Select target...</option>
          ${targetOptions}
        </select>
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="enableJumpTargetSelect('${node.id}')">${_ico('<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>')} Select on canvas</button>
          ${targetId ? `<button class="btn btn-sm btn-ghost" type="button" onclick="focusNode('${targetId}')">Go to target</button>` : ''}
        </div>
        ${targetMissing ? `<div class="form-help text-danger">Target missing or deleted. Re-select target.</div>` : ''}
      </div>
      <div class="form-group">
        <label class="form-label">Label/Description</label>
        <input type="text" class="form-input" value="${node.config.label || ''}" onchange="updateNodeConfig('label', this.value)">
      </div>
    `;
  } else if (node.type === 'external_signal') {
    const timeoutEnabled = !!node.config.timeout_enabled;
    const timeoutConnection = connections.find(c => c.from === node.id && c.transition_id === 'timeout');
    html += `
      <div class="form-group">
        <label class="form-label">Signal Name/Key</label>
        <input type="text" class="form-input" value="${node.config.signal_key || node.config.signal || ''}" onchange="updateNodeConfig('signal_key', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Correlation Key Mapping</label>
        <input type="text" class="form-input" value="${node.config.correlation_key || ''}" placeholder="person_id | run_id | external_ref" onchange="updateNodeConfig('correlation_key', this.value)">
        <div class="form-help">Optional mapping for identifying workflow instances.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Require correlation key</label>
        <label class="toggle">
          <input type="checkbox" ${node.config.require_correlation ? 'checked' : ''} onchange="updateNodeConfig('require_correlation', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Payload Schema (JSON)</label>
        <textarea class="form-input" rows="3" onchange="updateNodeConfig('payload_schema', this.value)">${node.config.payload_schema || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Duplicate Signal Handling</label>
        <select class="form-input" onchange="updateNodeConfig('duplicate_behavior', this.value)">
          <option value="ignore" ${node.config.duplicate_behavior === 'ignore' ? 'selected' : ''}>Ignore duplicates</option>
          <option value="idempotent" ${node.config.duplicate_behavior === 'idempotent' ? 'selected' : ''}>Idempotent update</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Timeout</label>
        <label class="toggle">
          <input type="checkbox" ${timeoutEnabled ? 'checked' : ''} onchange="updateNodeConfig('timeout_enabled', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      ${timeoutEnabled ? `
        <div class="form-group">
          <label class="form-label">Timeout Duration</label>
          <div class="form-inline-actions">
            <input type="number" class="form-input" min="1" value="${node.config.timeout_value || 60}" onchange="updateNodeConfig('timeout_value', this.value)">
            <select class="form-input" onchange="updateNodeConfig('timeout_unit', this.value)">
              <option value="minutes" ${node.config.timeout_unit === 'minutes' ? 'selected' : ''}>Minutes</option>
              <option value="hours" ${node.config.timeout_unit === 'hours' ? 'selected' : ''}>Hours</option>
              <option value="days" ${node.config.timeout_unit === 'days' ? 'selected' : ''}>Days</option>
            </select>
          </div>
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="startTimeoutConnection('${node.id}')">${_ico('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')} Connect timeout path</button>
          ${timeoutConnection ? `<button class="btn btn-sm btn-ghost" type="button" onclick="selectConnection('${timeoutConnection.id}')">View timeout path</button>` : ''}
        </div>
      ` : ''}
      <div class="form-inline-actions">
        <button class="btn btn-sm btn-primary" type="button" onclick="simulateExternalSignal('${node.id}')">${_ico('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>')} Send test signal</button>
        ${timeoutEnabled ? `<button class="btn btn-sm btn-ghost" type="button" onclick="simulateExternalTimeout('${node.id}')">Simulate timeout</button>` : ''}
      </div>
    `;
  } else if (node.type === 'alert') {
    html += `
      <div class="form-group">
        <label class="form-label">Message</label>
        <textarea class="form-input" rows="3" onchange="updateNodeConfig('message', this.value)">${node.config.message || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Recipients</label>
        <input type="text" class="form-input" value="${node.config.recipients || ''}" onchange="updateNodeConfig('recipients', this.value)">
      </div>
    `;
  } else if (node.type === 'load_file') {
    html += `
      <div class="form-group">
        <label class="form-label">File Path</label>
        <input type="text" class="form-input" value="${node.config.path || ''}" onchange="updateNodeConfig('path', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Format</label>
        <select class="form-input" onchange="updateNodeConfig('format', this.value)">
          <option value="csv" ${node.config.format === 'csv' ? 'selected' : ''}>CSV</option>
          <option value="json" ${node.config.format === 'json' ? 'selected' : ''}>JSON</option>
        </select>
      </div>
    `;
  } else if (node.type === 'extract_file') {
    html += `
      <div class="form-group">
        <label class="form-label">File Name</label>
        <input type="text" class="form-input" value="${node.config.filename || ''}" onchange="updateNodeConfig('filename', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Format</label>
        <select class="form-input" onchange="updateNodeConfig('format', this.value)">
          <option value="csv" ${node.config.format === 'csv' ? 'selected' : ''}>CSV</option>
          <option value="json" ${node.config.format === 'json' ? 'selected' : ''}>JSON</option>
        </select>
      </div>
    `;
  } else if (node.type === 'transfer_file') {
    html += `
      <div class="form-group">
        <label class="form-label">Protocol</label>
        <select class="form-input" onchange="updateNodeConfig('protocol', this.value)">
          <option value="ftp" ${node.config.protocol === 'ftp' ? 'selected' : ''}>FTP</option>
          <option value="sftp" ${node.config.protocol === 'sftp' ? 'selected' : ''}>SFTP</option>
          <option value="http" ${node.config.protocol === 'http' ? 'selected' : ''}>HTTP</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Host</label>
        <input type="text" class="form-input" value="${node.config.host || ''}" onchange="updateNodeConfig('host', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Path</label>
        <input type="text" class="form-input" value="${node.config.path || ''}" onchange="updateNodeConfig('path', this.value)">
      </div>
    `;
  } else if (node.type === 'javascript') {
    html += `
      <div class="form-group">
        <label class="form-label">Script</label>
        <textarea class="form-input" rows="5" onchange="updateNodeConfig('script', this.value)">${node.config.script || ''}</textarea>
      </div>
    `;
  } else if (node.type === 'update_tag') {
    html += `
      <div class="form-group">
        <label class="form-label">Tag</label>
        <input type="text" class="form-input" value="${node.config.tag || ''}" onchange="updateNodeConfig('tag', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Action</label>
        <select class="form-input" onchange="updateNodeConfig('action', this.value)">
          <option value="add" ${node.config.action === 'add' ? 'selected' : ''}>Add</option>
          <option value="remove" ${node.config.action === 'remove' ? 'selected' : ''}>Remove</option>
        </select>
      </div>
    `;
  } else if (node.type === 'update_field') {
    html += `
      <div class="form-group">
        <label class="form-label">Field</label>
        <input type="text" class="form-input" value="${node.config.field || ''}" onchange="updateNodeConfig('field', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Value</label>
        <input type="text" class="form-input" value="${node.config.value || ''}" onchange="updateNodeConfig('value', this.value)">
      </div>
    `;
  } else if (node.type === 'add_to_segment') {
    html += `
      <div class="form-group">
        <label class="form-label">Target Segment</label>
        <select class="form-input" onchange="updateNodeConfig('segment_id', this.value)">
          <option value="">Choose a segment...</option>
          ${referenceData.segments.map(seg => `
            <option value="${seg.id}" ${node.config.segment_id == seg.id ? 'selected' : ''}>
              ${seg.name}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  } else if (node.type === 'score') {
    html += `
      <div class="form-group">
        <label class="form-label">Score Change</label>
        <input type="number" class="form-input" value="${node.config.delta || 10}" onchange="updateNodeConfig('delta', this.value)">
      </div>
    `;
  } else if (node.type === 'track_event') {
    html += `
      <div class="form-group">
        <label class="form-label">Event Name</label>
        <input type="text" class="form-input" value="${node.config.event_name || ''}" onchange="updateNodeConfig('event_name', this.value)">
      </div>
    `;
  } else if (node.type === 'goal') {
    html += `
      <div class="form-group">
        <label class="form-label">Goal Name</label>
        <input type="text" class="form-input" value="${node.config.goal_name || ''}" onchange="updateNodeConfig('goal_name', this.value)">
      </div>
    `;
  } else if (node.type === 'update_aggregate') {
    html += `
      <div class="form-group">
        <label class="form-label">Metric</label>
        <input type="text" class="form-input" value="${node.config.metric || ''}" onchange="updateNodeConfig('metric', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Operation</label>
        <select class="form-input" onchange="updateNodeConfig('operation', this.value)">
          <option value="increment" ${node.config.operation === 'increment' ? 'selected' : ''}>Increment</option>
          <option value="set" ${node.config.operation === 'set' ? 'selected' : ''}>Set</option>
        </select>
      </div>
    `;
  } else if (node.type === 'read_group') {
    html += `
      <div class="form-group">
        <label class="form-label">Static list (Audience)</label>
        <select class="form-input" onchange="updateNodeConfig('audience_id', this.value)">
          <option value="">Choose audience...</option>
          ${(referenceData.audiences || []).map(aud => `
            <option value="${aud.id}" ${String(node.config.audience_id) === String(aud.id) ? 'selected' : ''}>
              ${aud.name} (${aud.contact_count ?? aud.estimated_size ?? 0} contacts)
            </option>
          `).join('')}
        </select>
        <div class="form-help">Maps to Adobe Campaign <strong>readGroup</strong> — precomputed recipient list.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Original ACC list label (optional)</label>
        <input type="text" class="form-input" value="${(node.config.external_list_label || '').replace(/"/g, '&quot;')}" onchange="updateNodeConfig('external_list_label', this.value)" placeholder="e.g. LST5185">
      </div>
    `;
  } else if (node.type === 'script_condition') {
    html += `
      <div class="form-group">
        <label class="form-label">Expression (ACC / JavaScript)</label>
        <textarea class="form-input" rows="4" onchange="updateNodeConfig('expression', this.value)">${(node.config.expression || '').replace(/</g, '&lt;')}</textarea>
        <div class="form-help">Stored for documentation and future evaluators. Server execution uses <strong>Run branch</strong> below (stub).</div>
      </div>
      <div class="form-group">
        <label class="form-label">Run branch (server stub)</label>
        <select class="form-input" onchange="updateNodeConfig('execution_branch', this.value)">
          <option value="true" ${node.config.execution_branch !== 'false' ? 'selected' : ''}>true</option>
          <option value="false" ${node.config.execution_branch === 'false' ? 'selected' : ''}>false</option>
        </select>
        <div class="form-help">Connect <strong>True</strong> and <strong>False</strong> outputs on the canvas. Execution follows this branch until real expression evaluation is wired.</div>
      </div>
      <div class="form-group">
        <label class="form-label">ACC activity label (optional)</label>
        <input type="text" class="form-input" value="${(node.config.acc_label || '').replace(/"/g, '&quot;')}" onchange="updateNodeConfig('acc_label', this.value)">
      </div>
    `;
  } else if (node.type === 'recurring_delivery') {
    const ch = (node.config.channel || 'email').toLowerCase();
    const deliveries = referenceData.deliveries.filter(d => (d.channel_key || String(d.channel || '').toLowerCase()) === ch);
    const deliveryOptions = deliveries.map(d => `
      <option value="${d.id}" ${node.config.delivery_id == d.id ? 'selected' : ''}>
        ${d.name} (${d.status || 'draft'})
      </option>
    `).join('');
    html += `
      <div class="form-group">
        <label class="form-label">Channel</label>
        <select class="form-input" onchange="updateNodeConfig('channel', this.value)">
          <option value="email" ${ch === 'email' ? 'selected' : ''}>Email</option>
          <option value="sms" ${ch === 'sms' ? 'selected' : ''}>SMS</option>
          <option value="push" ${ch === 'push' ? 'selected' : ''}>Push</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Delivery</label>
        <select class="form-input" onchange="updateNodeConfig('delivery_id', this.value)">
          <option value="">Select delivery...</option>
          ${deliveryOptions}
        </select>
        <div class="form-help">Maps to Adobe Campaign <strong>deliveryRecurring</strong>.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Cadence / schedule notes</label>
        <input type="text" class="form-input" value="${(node.config.cadence_summary || '').replace(/"/g, '&quot;')}" onchange="updateNodeConfig('cadence_summary', this.value)" placeholder="e.g. Daily 8am ET">
      </div>
    `;
  } else if (node.type === 'data_writer') {
    html += `
      <div class="form-group">
        <label class="form-label">Entity</label>
        <select class="form-input" onchange="updateNodeConfig('entity_type', this.value)">
          <option value="contacts" ${(node.config.entity_type || 'contacts') === 'contacts' ? 'selected' : ''}>Contacts</option>
          <option value="campaign_state" ${node.config.entity_type === 'campaign_state' ? 'selected' : ''}>Campaign state (custom)</option>
          <option value="other" ${node.config.entity_type === 'other' ? 'selected' : ''}>Other / extension schema</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Operation</label>
        <select class="form-input" onchange="updateNodeConfig('operation', this.value)">
          <option value="update" ${(node.config.operation || 'update') === 'update' ? 'selected' : ''}>Update</option>
          <option value="insert" ${node.config.operation === 'insert' ? 'selected' : ''}>Insert</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Field updates (JSON array)</label>
        <textarea class="form-input" rows="4" onchange="updateNodeConfig('field_updates_json', this.value)">${(node.config.field_updates_json || '[]').replace(/</g, '&lt;')}</textarea>
        <div class="form-help">Maps to Adobe Campaign <strong>writer</strong>. Execution is stubbed until persistence rules are defined.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-input" rows="2" onchange="updateNodeConfig('notes', this.value)">${(node.config.notes || '').replace(/</g, '&lt;')}</textarea>
      </div>
    `;
  } else if (node.type === 'email' || node.type === 'sms' || node.type === 'push' || node.type === 'direct_mail') {
    const channel = node.type;
    const deliveries = referenceData.deliveries.filter(d => (d.channel_key || '').toLowerCase() === channel);
    const deliveryOptions = deliveries.map(d => `
      <option value="${d.id}" ${node.config.delivery_id == d.id ? 'selected' : ''}>
        ${d.name} (${d.status || 'draft'})
      </option>
    `).join('');
    
    html += `
      <div class="form-group">
        <label class="form-label">Delivery</label>
        <select class="form-input" onchange="updateNodeConfig('delivery_id', this.value)">
          <option value="">Select ${channel.toUpperCase()} delivery...</option>
          ${deliveryOptions}
        </select>
        <div class="form-help">Pick an existing delivery or create a new one</div>
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-primary" onclick="createDeliveryFromNode('${node.id}', '${channel}')">+ Create ${channel.toUpperCase()} Delivery</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Message Subject/Title</label>
        <input type="text" class="form-input" value="${node.config.subject || ''}" onchange="updateNodeConfig('subject', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Message Content</label>
        <textarea class="form-input" rows="4" onchange="updateNodeConfig('content', this.value)">${node.config.content || ''}</textarea>
      </div>
    `;
  } else if (node.type === 'offer_decision') {
    const decisionOptions = (referenceData.decisions || []).map(d => `
      <option value="${d.id}" ${node.config.decision_id == d.id ? 'selected' : ''}>
        ${d.name} (${d.status || 'draft'})
      </option>
    `).join('');

    html += `
      <div class="form-group">
        <label class="form-label">Decision Policy</label>
        <select class="form-input" onchange="updateNodeConfig('decision_id', this.value)">
          <option value="">Select a decision...</option>
          ${decisionOptions}
        </select>
        <div class="form-help">Choose which offer decision to resolve for each contact</div>
      </div>
      <div class="form-group">
        <label class="form-label">Context Data (JSON)</label>
        <textarea class="form-input" rows="3" placeholder='{"channel":"email","campaign":"summer_sale"}' onchange="updateNodeConfig('context_data', this.value)">${node.config.context_data || ''}</textarea>
        <div class="form-help">Optional real-time context passed to the decision engine</div>
      </div>
      <div class="form-group">
        <label class="form-label">Branch on Offer</label>
        <select class="form-input" onchange="updateNodeConfig('branch_mode', this.value)">
          <option value="none" ${node.config.branch_mode === 'none' || !node.config.branch_mode ? 'selected' : ''}>No branching (continue)</option>
          <option value="offer" ${node.config.branch_mode === 'offer' ? 'selected' : ''}>Branch by offer received</option>
          <option value="fallback" ${node.config.branch_mode === 'fallback' ? 'selected' : ''}>Branch: personalized vs fallback</option>
        </select>
        <div class="form-help">Route contacts based on the offer they receive</div>
      </div>
    `;
  } else if (node.type === 'ab_test') {
    html += `
      <div class="form-group">
        <label class="form-label">Split Percentage</label>
        <input type="number" class="form-input" min="1" max="99" value="${node.config.split_pct || 50}" onchange="updateNodeConfig('split_pct', this.value)">
        <div class="form-help">% of contacts that go to variant A</div>
      </div>
      <div class="form-group">
        <label class="form-label">Winner Metric</label>
        <select class="form-input" onchange="updateNodeConfig('winner_metric', this.value)">
          <option value="click_rate" ${node.config.winner_metric === 'click_rate' ? 'selected' : ''}>Click Rate</option>
          <option value="conversion_rate" ${node.config.winner_metric === 'conversion_rate' ? 'selected' : ''}>Conversion Rate</option>
          <option value="open_rate" ${node.config.winner_metric === 'open_rate' ? 'selected' : ''}>Open Rate</option>
        </select>
      </div>
    `;
  } else if (node.category === 'ai') {
    html += buildAINodePropertiesHtml(node);
  }

  propertiesContent.innerHTML = html + '</div>' + getResultsPanelHtml(node.id, 'node');
}

function showConnectionProperties(connectionId) {
  const propertiesContent = document.getElementById('properties-content');
  const conn = connections.find(c => c.id === connectionId);
  if (!conn) {
    propertiesContent.innerHTML = '<p class="empty-state">Select a connection to see results</p>';
    return;
  }
  
  const fromNode = nodes.find(n => n.id === conn.from);
  const toNode = nodes.find(n => n.id === conn.to);
  
  const html = `
    <div class="properties-form">
      <div class="properties-section-title">Connection</div>
      <div class="form-group">
        <label class="form-label">Transition</label>
        <input type="text" class="form-input" value="${conn.label || 'Result'}" onchange="updateConnectionLabel('${conn.id}', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">From</label>
        <input type="text" class="form-input" value="${fromNode ? fromNode.name : 'Unknown'}" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">To</label>
        <input type="text" class="form-input" value="${toNode ? toNode.name : 'Unknown'}" readonly>
      </div>
    </div>
  `;
  
  propertiesContent.innerHTML = html + getResultsPanelHtml(conn.from, 'connection');
}

function updateConnectionLabel(connectionId, value) {
  const conn = connections.find(c => c.id === connectionId);
  if (!conn) return;
  conn.label = value || 'Result';
  renderConnections();
  showToast('Transition label updated', 'success');
}

function getResultsPanelHtml(sourceNodeId, sourceType) {
  const runtime = runtimeByNode[sourceNodeId] || {};
  const show = executionState.running || runtime.status || runtime.count !== undefined;
  if (!show) return '';
  
  const countText = runtime.count !== undefined ? runtime.count.toLocaleString() : '—';
  const timeText = runtime.seconds !== undefined ? `${runtime.seconds.toFixed(1)}s` : '—';
  
  return `
    <div class="results-panel">
      <div class="results-title">Results</div>
      <div class="results-metrics">
        <div><strong>Count:</strong> ${countText}</div>
        <div><strong>Time:</strong> ${timeText}</div>
      </div>
      <div class="results-actions">
        <button class="btn btn-sm btn-secondary" onclick="previewSchema('${sourceType}', '${sourceNodeId}')">Preview schema</button>
        <button class="btn btn-sm btn-secondary" onclick="previewResults('${sourceType}', '${sourceNodeId}')">Preview results</button>
      </div>
    </div>
  `;
}

async function previewSchema(sourceType, sourceId) {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/orchestration/${campaignId}/preview/schema?nodeId=${encodeURIComponent(sourceId)}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    const title = `Preview schema - ${data.node?.name || sourceType}`;
    const body = renderSchemaTable(data.schema || []);
    openPreviewModal(title, body);
  } catch (error) {
    showToast(`Failed to load schema: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

async function previewResults(sourceType, sourceId) {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/orchestration/${campaignId}/preview/results?nodeId=${encodeURIComponent(sourceId)}&limit=20`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    const title = `Preview results - ${data.node?.name || sourceType}`;
    const body = `
      <div class="preview-meta">Total: ${data.total || 0} • Showing: ${data.results?.length || 0}</div>
      ${renderResultsTable(data.schema || [], data.results || [])}
    `;
    openPreviewModal(title, body);
  } catch (error) {
    showToast(`Failed to load results: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}

function openPreviewModal(title, bodyHtml) {
  const modal = document.getElementById('preview-modal');
  const modalTitle = document.getElementById('preview-modal-title');
  const modalBody = document.getElementById('preview-modal-body');
  if (!modal || !modalTitle || !modalBody) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.classList.remove('hidden');
}

function closePreviewModal(event) {
  if (event && event.target) {
    const isBackdrop = event.target.classList.contains('preview-modal');
    const isCloseBtn = event.target.closest('.preview-modal-close');
    if (!isBackdrop && !isCloseBtn) return;
  }
  const modal = document.getElementById('preview-modal');
  if (modal) modal.classList.add('hidden');
}

function renderSchemaTable(schema) {
  if (!schema.length) {
    return '<div class="preview-meta">No schema available</div>';
  }
  const rows = schema.map(col => `
    <tr>
      <td>${col.name}</td>
      <td>${col.type}</td>
    </tr>
  `).join('');
  
  return `
    <table class="preview-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderResultsTable(schema, results) {
  if (!results.length) {
    return '<div class="preview-meta">No results</div>';
  }
  const columns = schema.length ? schema.map(s => s.name) : Object.keys(results[0] || {});
  const header = columns.map(col => `<th>${col}</th>`).join('');
  const rows = results.map(row => `
    <tr>
      ${columns.map(col => `<td>${formatPreviewCell(row[col])}</td>`).join('')}
    </tr>
  `).join('');
  
  return `
    <table class="preview-table">
      <thead><tr>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatPreviewCell(value) {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toggleAIAssistant() {
  const panel = document.getElementById('ai-assistant-panel');
  const btn = document.getElementById('ai-assistant-toggle');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  if (btn) btn.classList.toggle('active', isHidden);
}

// Update node property
function updateNodeProperty(property, value) {
  if (selectedNode) {
    selectedNode[property] = value;
    renderCanvas();
  }
}

// Update node config
function updateNodeConfig(key, value) {
  if (selectedNode) {
    selectedNode.config[key] = value;
    renderCanvas();
    showNodeProperties(selectedNode); // Refresh properties display
  }
}

async function createDeliveryFromNode(nodeId, channel) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  const saved = await saveOrchestration({ showToastMessage: false });
  if (!saved) {
    showToast('Save workflow first, then try again.', 'error');
    return;
  }
  const defaultName = (node.name || `${channel} message`).trim() || `${channel} message`;
  const params = new URLSearchParams();
  params.set('view', 'deliveries');
  params.set('createFromWorkflow', '1');
  params.set('workflowId', String(campaignId));
  params.set('nodeId', nodeId);
  params.set('defaultName', defaultName);
  params.set('channel', channel.toLowerCase() === 'sms' ? 'SMS' : channel.toLowerCase() === 'push' ? 'Push' : 'Email');
  const base = window.location.pathname.replace(/\/orchestration\.html$/, '') || '';
  window.location.href = `${base}/index.html?${params.toString()}`;
}

async function createAudienceFromNode(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  const saved = await saveOrchestration({ showToastMessage: false });
  if (!saved) {
    showToast('Save failed. Please try again.', 'error');
    return;
  }
  const defaultName = (node.name || 'Audience').trim();
  const params = new URLSearchParams();
  params.set('view', 'audiences');
  params.set('page', 'create');
  params.set('createFromWorkflow', '1');
  params.set('workflowId', String(campaignId));
  params.set('nodeId', nodeId);
  params.set('defaultName', defaultName);
  const base = window.location.pathname.replace(/\/orchestration\.html$/, '') || '';
  window.location.href = `${base}/index.html?${params.toString()}`;
}

async function createSegmentFromNode(nodeId) {
  const saved = await saveOrchestration({ showToastMessage: false });
  if (!saved) {
    showToast('Save failed. Please try again.', 'error');
    return;
  }
  const workflowId = campaignId;
  const params = new URLSearchParams();
  params.set('return', 'workflow');
  params.set('workflowId', workflowId);
  params.set('nodeId', nodeId);
  window.location.href = `/segment-builder.html?${params.toString()}`;
}

function applyPendingWorkflowSegmentSelection() {
  const raw = localStorage.getItem('workflowSegmentSelection');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data || String(data.workflowId) !== String(campaignId)) return;
    const node = nodes.find(n => n.id === data.nodeId);
    if (!node || !data.segmentId) return;
    node.config = node.config || {};
    node.config.source_type = 'segment';
    node.config.segment_id = data.segmentId;
    if (data.segmentName) node.name = data.segmentName;
    renderCanvas();
    selectNode(node);
    requestAnimationFrame(() => focusNode(node));
    localStorage.removeItem('workflowSegmentSelection');
    void saveOrchestration({ showToastMessage: false, skipLoading: true });
    showToast('Segment linked to node', 'success');
  } catch (error) {
    console.error('Error applying pending segment selection:', error);
  }
}

function applyPendingWorkflowAudienceSelection() {
  const raw = localStorage.getItem('workflowAudienceSelection');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data || String(data.workflowId) !== String(campaignId)) return;
    const node = nodes.find(n => n.id === data.nodeId);
    if (!node || !data.audienceId) return;
    node.config = node.config || {};
    node.config.source_type = 'audience';
    node.config.audience_id = data.audienceId;
    if (data.audienceName) node.name = data.audienceName;
    if (referenceData.audiences && !referenceData.audiences.some(a => a.id === data.audienceId)) {
      referenceData.audiences.push({ id: data.audienceId, name: data.audienceName || '', status: 'draft' });
    }
    renderCanvas();
    selectNode(node);
    showNodeProperties(node);
    requestAnimationFrame(() => focusNode(node));
    localStorage.removeItem('workflowAudienceSelection');
    void saveOrchestration({ showToastMessage: false, skipLoading: true });
    showToast('Audience linked to node', 'success');
  } catch (error) {
    console.error('Error applying pending audience selection:', error);
  }
}

function applyPendingWorkflowDeliverySelection() {
  const raw = localStorage.getItem('workflowDeliverySelection');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data || String(data.workflowId) !== String(campaignId)) return;
    const node = nodes.find(n => n.id === data.nodeId);
    if (!node || !data.deliveryId) return;
    node.config = node.config || {};
    node.config.delivery_id = data.deliveryId;
    if (data.deliveryName) node.name = data.deliveryName;
    if (referenceData.deliveries && !referenceData.deliveries.some(d => d.id === data.deliveryId)) {
      referenceData.deliveries.push({ id: data.deliveryId, name: data.deliveryName || '', status: 'draft' });
    }
    renderCanvas();
    selectNode(node);
    showNodeProperties(node);
    requestAnimationFrame(() => focusNode(node));
    localStorage.removeItem('workflowDeliverySelection');
    void saveOrchestration({ showToastMessage: false, skipLoading: true });
    showToast('Delivery linked to node', 'success');
  } catch (error) {
    console.error('Error applying pending delivery selection:', error);
  }
}

// Delete node
function deleteNode(nodeId) {
  pushUndoState();
  const incoming = connections.filter(c => c.to === nodeId);
  const outgoing = connections.filter(c => c.from === nodeId);
  
  nodes = nodes.filter(n => n.id !== nodeId);
  connections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
  
  // Auto-reconnect if there is exactly one incoming and one outgoing connection
  if (incoming.length === 1 && outgoing.length === 1) {
    const fromId = incoming[0].from;
    const toId = outgoing[0].to;
    const exists = connections.some(c => c.from === fromId && c.to === toId);
    if (fromId !== toId && !exists) {
      connections.push({
        id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        from: fromId,
        to: toId,
        label: 'Result'
      });
    }
  }
  
  if (selectedNode && selectedNode.id === nodeId) {
    selectedNode = null;
    document.getElementById('properties-content').innerHTML = '<p class="empty-state">Select a node to edit properties</p>';
  }
  selectedConnectionId = null;
  insertConnectionId = null;
  
  renderCanvas();
  updatePropertiesPanelVisibility();
  showToast('Node deleted', 'success');
}

// Delete selected
function deleteSelected() {
  if (selectedNode) {
    if (!confirm('Delete this node?')) return;
    deleteNode(selectedNode.id);
    return;
  }
  
  if (selectedConnectionId) {
    if (!confirm('Delete this connection?')) return;
    deleteConnection(selectedConnectionId);
    return;
  }
  
  showToast('Select a node or connection to delete', 'info');
}

// Duplicate selected
function duplicateSelected() {
  if (selectedNode) {
    pushUndoState();
    const newNode = {
      ...selectedNode,
      id: `node-${nodeIdCounter++}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50
      }
    };
    nodes.push(newNode);
    renderCanvas();
    showToast('Node duplicated', 'success');
  }
}

// ── Property-panel action bar handlers ──

function propActionDelete(nodeId) {
  if (!confirm('Delete this node and its connections?')) return;
  deleteNode(nodeId);
}

function propActionDisable(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  node.disabled = !node.disabled;
  if (node.disabled) node.paused = false; // can't be paused AND disabled
  renderCanvas();
  if (selectedNode && selectedNode.id === nodeId) showNodeProperties(node);
  showToast(node.disabled ? `${node.name} disabled` : `${node.name} enabled`, 'info');
}

function propActionPause(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  node.paused = !node.paused;
  if (node.paused) node.disabled = false; // can't be disabled AND paused
  renderCanvas();
  if (selectedNode && selectedNode.id === nodeId) showNodeProperties(node);
  showToast(node.paused ? `${node.name} paused` : `${node.name} resumed`, 'info');
}

function propActionCopy(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  pushUndoState();
  const newNode = {
    ...JSON.parse(JSON.stringify(node)),
    id: `node-${nodeIdCounter++}`,
    name: node.name + ' (copy)',
    position: {
      x: node.position.x + 60,
      y: node.position.y + 60
    }
  };
  delete newNode.disabled;
  delete newNode.paused;
  nodes.push(newNode);
  renderCanvas();
  showToast('Node duplicated', 'success');
}

function propActionLogs(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  const runtime = runtimeByNode[nodeId] || {};
  const status = runtime.status || 'idle';
  const count  = runtime.count != null ? runtime.count : '—';

  const overlay = document.createElement('div');
  overlay.className = 'prop-logs-overlay';
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="prop-logs-modal">
      <div class="prop-logs-header">
        <span>Logs — ${node.name}</span>
        <button onclick="this.closest('.prop-logs-overlay').remove()">&times;</button>
      </div>
      <div class="prop-logs-body">
        <table class="prop-logs-table">
          <thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead>
          <tbody>
            <tr><td>${new Date().toLocaleTimeString()}</td><td>Status</td><td>${status}</td></tr>
            <tr><td>${new Date().toLocaleTimeString()}</td><td>Records processed</td><td>${count}</td></tr>
            ${runtime.seconds ? `<tr><td>${new Date().toLocaleTimeString()}</td><td>Duration</td><td>${runtime.seconds.toFixed(1)}s</td></tr>` : ''}
            ${node.disabled ? `<tr><td>—</td><td>Node disabled</td><td>This node will be skipped during execution</td></tr>` : ''}
            ${node.paused ? `<tr><td>—</td><td>Node paused</td><td>Execution will halt at this node until resumed</td></tr>` : ''}
          </tbody>
        </table>
        ${status === 'idle' ? '<p class="prop-logs-empty">No execution logs yet. Run the workflow to generate logs.</p>' : ''}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function propActionTasks(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  const runtime = runtimeByNode[nodeId] || {};
  const status  = runtime.status || 'idle';

  const overlay = document.createElement('div');
  overlay.className = 'prop-logs-overlay';
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="prop-logs-modal">
      <div class="prop-logs-header">
        <span>Tasks — ${node.name}</span>
        <button onclick="this.closest('.prop-logs-overlay').remove()">&times;</button>
      </div>
      <div class="prop-logs-body">
        <table class="prop-logs-table">
          <thead><tr><th>#</th><th>Task</th><th>Status</th><th>Started</th></tr></thead>
          <tbody>
            ${status !== 'idle' ? `
              <tr><td>1</td><td>Initialize ${node.type.replace(/_/g,' ')}</td><td><span class="task-badge task-done">Done</span></td><td>${new Date().toLocaleTimeString()}</td></tr>
              <tr><td>2</td><td>Process records</td><td><span class="task-badge task-${status === 'completed' ? 'done' : status === 'executing' ? 'running' : 'pending'}">${status === 'completed' ? 'Done' : status === 'executing' ? 'Running' : 'Pending'}</span></td><td>${new Date().toLocaleTimeString()}</td></tr>
              <tr><td>3</td><td>Write output transition</td><td><span class="task-badge task-${status === 'completed' ? 'done' : 'pending'}">${status === 'completed' ? 'Done' : 'Pending'}</span></td><td>—</td></tr>
            ` : '<tr><td colspan="4" style="text-align:center;color:#888;padding:24px;">No tasks yet. Run the workflow to generate tasks.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Canvas controls
function zoomIn() {
  canvasState.zoom = Math.min(canvasState.zoom + 0.1, 2);
  applyCanvasTransform();
}

function zoomOut() {
  canvasState.zoom = Math.max(canvasState.zoom - 0.1, 0.5);
  applyCanvasTransform();
}

function resetView() {
  canvasState.zoom = 1;
  canvasState.pan = { x: 0, y: 0 };
  applyCanvasTransform();
}

function applyCanvasTransform() {
  const content = document.getElementById('canvas-content');
  const canvas = document.getElementById('canvas');
  if (!content) return;
  let z = Number(canvasState.zoom);
  if (!Number.isFinite(z) || z <= 0) z = 1;
  z = Math.min(Math.max(z, 0.05), 4);
  canvasState.zoom = z;
  let px = Number(canvasState.pan.x);
  let py = Number(canvasState.pan.y);
  if (!Number.isFinite(px)) px = 0;
  if (!Number.isFinite(py)) py = 0;
  canvasState.pan = { x: px, y: py };
  content.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
  if (canvas) {
    canvas.style.backgroundPosition = `${px}px ${py}px`;
    canvas.style.backgroundSize = `${20 * z}px ${20 * z}px`;
  }
  scheduleRenderConnections();
}

/**
 * Left-to-right layered layout: X = hop distance from workflow roots, Y = order within a column.
 * ACC imports often wire <start> with only a self-loop, so entry does not reach the graph —
 * we then seed layer 0 with every non-terminal node that has no incoming edges (scheduler, signal, …).
 * Layering uses shortest path (min depth) along edges; self-loops are ignored. Bounded relax rounds.
 * @param {object} preset - columnGap, rowGap, startX, startY (optional)
 */
function applyGraphAutoLayoutPositions(preset = {}) {
  if (nodes.length === 0) return;

  const columnGap = preset.columnGap ?? 120;
  const rowGap = preset.rowGap ?? 72;
  const startX = preset.startX ?? 140;
  const startY = preset.startY ?? 80;

  const TERMINAL_TYPES = new Set(['exit', 'stop']);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const incoming = new Map();
  const outgoing = new Map();
  nodes.forEach(n => {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  });
  connections.forEach(c => {
    if (nodeMap.has(c.from) && nodeMap.has(c.to)) {
      outgoing.get(c.from).push(c.to);
      incoming.get(c.to).push(c.from);
    }
  });

  const entryNodes = nodes.filter(n => n.type === 'entry');

  const depth = new Map();
  function seedLayerZero(id) {
    const n = nodeMap.get(id);
    if (!n || TERMINAL_TYPES.has(n.type)) return;
    depth.set(id, 0);
  }

  entryNodes.forEach((n) => seedLayerZero(n.id));

  const entryReachesReal = entryNodes.some((en) =>
    (outgoing.get(en.id) || []).some((tid) => tid !== en.id)
  );

  if (!entryReachesReal) {
    nodes.forEach((n) => {
      if (TERMINAL_TYPES.has(n.type) || n.type === 'entry') return;
      if ((incoming.get(n.id) || []).length === 0) seedLayerZero(n.id);
    });
  }

  if (depth.size === 0) {
    nodes.forEach((n) => {
      if (TERMINAL_TYPES.has(n.type)) return;
      if ((incoming.get(n.id) || []).length === 0) seedLayerZero(n.id);
    });
  }
  if (depth.size === 0 && nodes[0]) seedLayerZero(nodes[0].id);

  // Shortest-path layering from all seeds (min depth). Skip self-edges. ≤ |V| rounds → finite on cycles.
  for (let round = 0; round < nodes.length; round++) {
    let changed = false;
    connections.forEach((c) => {
      if (!nodeMap.has(c.from) || !nodeMap.has(c.to)) return;
      if (c.from === c.to) return;
      const fromD = depth.get(c.from);
      if (fromD === undefined) return;
      const nextD = fromD + 1;
      const prev = depth.get(c.to);
      if (prev === undefined || nextD < prev) {
        depth.set(c.to, nextD);
        changed = true;
      }
    });
    if (!changed) break;
  }

  let maxReachableNonTerm = 0;
  nodes.forEach(n => {
    if (TERMINAL_TYPES.has(n.type)) return;
    if (depth.has(n.id)) maxReachableNonTerm = Math.max(maxReachableNonTerm, depth.get(n.id));
  });
  nodes.forEach(n => {
    if (TERMINAL_TYPES.has(n.type)) return;
    if (!depth.has(n.id)) depth.set(n.id, maxReachableNonTerm);
  });

  entryNodes.forEach(n => depth.set(n.id, 0));

  let maxNonTerminalDepth = 0;
  nodes.forEach(n => {
    if (TERMINAL_TYPES.has(n.type)) return;
    maxNonTerminalDepth = Math.max(maxNonTerminalDepth, depth.get(n.id) ?? 0);
  });
  nodes.forEach(n => {
    if (TERMINAL_TYPES.has(n.type)) depth.set(n.id, maxNonTerminalDepth + 1);
  });

  const columns = new Map();
  nodes.forEach(n => {
    const d = depth.get(n.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(n);
  });

  const depthOrder = Array.from(columns.keys()).sort((a, b) => a - b);

  function sortInDepthBand(a, b) {
    if (a.type === 'entry' && b.type !== 'entry') return -1;
    if (b.type === 'entry' && a.type !== 'entry') return 1;
    if (TERMINAL_TYPES.has(a.type) && TERMINAL_TYPES.has(b.type)) {
      if (a.type !== b.type) return a.type === 'exit' ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  }

  function medianRank(vals) {
    if (!vals.length) return 0;
    const s = vals.slice().sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function orderColumnNodes(columnNodes, prevColumnOrdered) {
    const base = columnNodes.slice().sort(sortInDepthBand);
    if (!prevColumnOrdered || prevColumnOrdered.length === 0) return base;
    if (columnNodes.length > 400) return base;
    const indexInPrev = new Map(prevColumnOrdered.map((n, i) => [n.id, i]));
    return base.slice().sort((a, b) => {
      const incA = (incoming.get(a.id) || []).filter((pid) => indexInPrev.has(pid));
      const incB = (incoming.get(b.id) || []).filter((pid) => indexInPrev.has(pid));
      const ma = incA.length ? medianRank(incA.map((pid) => indexInPrev.get(pid))) : -1;
      const mb = incB.length ? medianRank(incB.map((pid) => indexInPrev.get(pid))) : -1;
      if (ma !== mb) return ma - mb;
      return sortInDepthBand(a, b);
    });
  }

  const columnWidths = new Map();
  depthOrder.forEach((d) => {
    const col = columns.get(d) || [];
    const maxW = Math.max(
      DEFAULT_NODE_SIZE.width,
      ...col.map((n) => getNodeDimensions(n).width)
    );
    columnWidths.set(d, maxW);
  });

  let currentX = startX;
  let prevColumnOrdered = null;
  depthOrder.forEach((d) => {
    let columnNodes = orderColumnNodes(columns.get(d) || [], prevColumnOrdered);
    if (columnNodes.length === 0) return;
    if (d === 0) {
      const entries = columnNodes.filter((n) => n.type === 'entry');
      const rest = columnNodes.filter((n) => n.type !== 'entry');
      columnNodes = [...entries, ...rest];
    }
    let currentY = startY;
    columnNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node);
      node.position = { x: currentX, y: currentY };
      currentY += height + rowGap;
    });
    prevColumnOrdered = columnNodes;
    currentX += (columnWidths.get(d) || DEFAULT_NODE_SIZE.width) + columnGap;
  });
}

/** On open: horizontal swimlane layout + real-height pass + fit (overrides messy import coordinates). */
function applyPresentationLayoutOnLoad() {
  if (nodes.length === 0) return;
  try {
    const roomy = { columnGap: 220, rowGap: 96, startX: 160, startY: 100 };
    applyGraphAutoLayoutPositions(roomy);
    renderCanvas();
    applyGraphAutoLayoutPositions(roomy);
    renderCanvas();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          fitToView({ silent: true });
        } catch (e) {
          console.error('fitToView on load', e);
          canvasState = { zoom: 1, pan: { x: 0, y: 0 } };
          applyCanvasTransform();
        }
      });
    });
  } catch (e) {
    console.error('applyPresentationLayoutOnLoad', e);
    try {
      renderCanvas();
    } catch (_) { /* ignore */ }
    canvasState = { zoom: 1, pan: { x: 0, y: 0 } };
    applyCanvasTransform();
  }
}

function autoLayout() {
  if (nodes.length === 0) return;
  pushLayoutUndoState();
  applyGraphAutoLayoutPositions();
  renderCanvas();
  showToast('Layout applied', 'success');
}

// ── Undo/Redo ─────────────────────────────────────────────────
let _undoStack = [];   // past states
let _redoStack = [];   // future states (after undo)
const MAX_HISTORY = 50;

// Take a snapshot of the current canvas state
function _snapshotState() {
  return JSON.stringify({ nodes, connections, nodeIdCounter });
}

/** Compact snapshot for auto-layout only — avoids multi‑second JSON.stringify on huge graphs */
function _snapshotLayoutPositions() {
  return JSON.stringify({
    kind: 'layout',
    positions: nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })),
  });
}

function _applyLayoutPositions(payload) {
  const posById = new Map((payload.positions || []).map((p) => [p.id, p]));
  nodes.forEach((n) => {
    const p = posById.get(n.id);
    if (p) n.position = { x: p.x, y: p.y };
  });
}

function pushLayoutUndoState() {
  _undoStack.push(_snapshotLayoutPositions());
  if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
  _redoStack = [];
}

// Push the current state onto the undo stack (call BEFORE making a change)
function pushUndoState() {
  _undoStack.push(_snapshotState());
  if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
  _redoStack = []; // Any new action clears the redo stack
}

function undoAction() {
  if (_undoStack.length === 0) {
    showToast('Nothing to undo', 'info');
    return;
  }
  const raw = _undoStack[_undoStack.length - 1];
  let prev;
  try {
    prev = JSON.parse(raw);
  } catch (e) {
    console.error('undo parse', e);
    showToast('Undo failed', 'error');
    return;
  }
  if (prev.kind === 'layout') {
    _redoStack.push(_snapshotLayoutPositions());
  } else {
    _redoStack.push(_snapshotState());
  }
  _undoStack.pop();
  if (prev.kind === 'layout') {
    _applyLayoutPositions(prev);
  } else {
    nodes = prev.nodes;
    connections = prev.connections;
    nodeIdCounter = prev.nodeIdCounter;
  }
  selectedNode = null;
  selectedConnectionId = null;
  renderCanvas();
  showToast('Undo', 'info');
}

function redoAction() {
  if (_redoStack.length === 0) {
    showToast('Nothing to redo', 'info');
    return;
  }
  const raw = _redoStack[_redoStack.length - 1];
  let next;
  try {
    next = JSON.parse(raw);
  } catch (e) {
    console.error('redo parse', e);
    showToast('Redo failed', 'error');
    return;
  }
  if (next.kind === 'layout') {
    _undoStack.push(_snapshotLayoutPositions());
  } else {
    _undoStack.push(_snapshotState());
  }
  _redoStack.pop();
  if (next.kind === 'layout') {
    _applyLayoutPositions(next);
  } else {
    nodes = next.nodes;
    connections = next.connections;
    nodeIdCounter = next.nodeIdCounter;
  }
  selectedNode = null;
  selectedConnectionId = null;
  renderCanvas();
  showToast('Redo', 'info');
}

// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', function(e) {
  // Ctrl+Z / Cmd+Z = Undo
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
    e.preventDefault();
    undoAction();
  }
  // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
    e.preventDefault();
    redoAction();
  }
  // Ctrl+Y / Cmd+Y = Redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redoAction();
  }
});

// Validate orchestration
function validateOrchestration() {
  const errors = [];
  const warnings = [];
  
  if (nodes.length === 0) {
    errors.push('Canvas is empty');
  }
  
  const hasEntry = nodes.some(n => n.type === 'entry');
  if (!hasEntry) {
    errors.push('Missing Entry node');
  }
  
  // Check for disconnected nodes
  const connectedNodes = new Set();
  connections.forEach(c => {
    connectedNodes.add(c.from);
    connectedNodes.add(c.to);
  });
  
  const disconnected = nodes.filter(n => !connectedNodes.has(n.id) && n.type !== 'entry');
  if (disconnected.length > 0) {
    errors.push(`${disconnected.length} disconnected node(s)`);
  }
  
  const signalKeys = new Set();
  const duplicateSignals = new Set();
  nodes.forEach(node => {
    if (node.type === 'jump') {
      const targetId = node.config?.target_node_id;
      const target = targetId ? getNodeById(targetId) : null;
      if (!targetId || !target) {
        errors.push(`Jump "${node.name}" is missing a valid target`);
      } else if (['entry', 'exit', 'stop'].includes(target.type)) {
        errors.push(`Jump "${node.name}" targets an invalid node type`);
      }
    }
    if (node.type === 'external_signal') {
      const signalKey = (node.config?.signal_key || '').trim();
      if (!signalKey) {
        errors.push(`External Signal "${node.name}" missing signal key`);
      } else if (signalKeys.has(signalKey)) {
        duplicateSignals.add(signalKey);
      } else {
        signalKeys.add(signalKey);
      }
      if (node.config?.timeout_enabled) {
        const hasTimeout = connections.some(c => c.from === node.id && c.transition_id === 'timeout');
        if (!hasTimeout) {
          errors.push(`External Signal "${node.name}" timeout enabled without fallback path`);
        }
      }
      if (node.config?.require_correlation && !node.config?.correlation_key) {
        errors.push(`External Signal "${node.name}" requires correlation mapping`);
      }
    }
  });
  duplicateSignals.forEach(key => {
    errors.push(`Signal key "${key}" must be unique`);
  });
  
  const hasCycle = detectOrchestrationLoop();
  if (hasCycle) {
    warnings.push('Potential loop detected (jump or connection). Review to avoid infinite runs.');
  }
  
  if (errors.length === 0) {
    const warningText = warnings.length ? `\nWarnings:\n${warnings.join('\n')}` : '';
    showToast(`${_ico('<path d="M20 6 9 17l-5-5"/>')} Orchestration is valid${warningText}`, warnings.length ? 'info' : 'success');
  } else {
    const warningText = warnings.length ? `\nWarnings:\n${warnings.join('\n')}` : '';
    showToast(`Validation failed:\n${errors.join('\n')}${warningText}`, 'error');
  }
}

function detectOrchestrationLoop() {
  const graph = new Map();
  nodes.forEach(n => graph.set(n.id, []));
  connections.forEach(c => {
    if (graph.has(c.from)) graph.get(c.from).push(c.to);
  });
  nodes.filter(n => n.type === 'jump' && n.config?.target_node_id).forEach(n => {
    if (graph.has(n.id)) graph.get(n.id).push(n.config.target_node_id);
  });
  const visiting = new Set();
  const visited = new Set();
  const dfs = (id) => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const nexts = graph.get(id) || [];
    for (const next of nexts) {
      if (dfs(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  for (const node of nodes) {
    if (dfs(node.id)) return true;
  }
  return false;
}

// Preview orchestration
function previewOrchestration() {
  showToast('Preview feature coming soon', 'info');
}

// Category toggle
function toggleCategory(header) {
  header.classList.toggle('collapsed');
}

// ── Node type → icon mapping for AI-generated flows ─────────
const NODE_TYPE_ICONS = {
  entry: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  exit: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  segment: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  exclude: '<circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>',
  split: '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  query: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  build_audience: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  deduplication: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/>',
  enrichment: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>',
  save_audience: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  wait: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  condition: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  scheduler: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  random: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  fork: '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  push: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  webhook: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  direct_mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  read_group: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  data_writer: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 15h8"/>',
  script_condition: '<circle cx="12" cy="12" r="10"/><path d="M9 12h6"/><path d="M12 9v6"/>',
  recurring_delivery: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="1"/>',
  goal: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>'
};

function _getNodeIcon(type) {
  return _ico(NODE_TYPE_ICONS[type] || NODE_TYPE_ICONS.email);
}

// Store last AI suggestion for apply buttons
let _lastAISuggestion = null;

// AI Functions
async function suggestOrchestration() {
  const chat = document.getElementById('orchestration-ai-chat');
  const wfName = currentWorkflowData?.name || '';
  const wfDesc = currentWorkflowData?.description || '';

  if (!wfName) {
    chat.innerHTML += `<div class="ai-message assistant">Please save the workflow with a name first so I can suggest a relevant flow.</div>`;
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  // Show thinking indicator
  const thinkingId = `ai-thinking-${Date.now()}`;
  chat.innerHTML += `<div class="ai-message user">Suggest a flow for: <strong>${wfName}</strong>${wfDesc ? `<br><em>${wfDesc}</em>` : ''}</div>`;
  chat.innerHTML += `<div class="ai-message assistant" id="${thinkingId}"><em>${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Analyzing "${wfName}" and designing flow...</em></div>`;
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch(`${API_BASE}/ai/suggest-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: wfName, description: wfDesc })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get suggestion');

    _lastAISuggestion = data.flow;

    // Build a visual step list
    const stepList = data.flow.map((n, i) => {
      const icon = _getNodeIcon(n.type);
      const configHint = _describeConfig(n);
      return `${i + 1}. ${icon} <strong>${n.name}</strong>${configHint ? ` — <em>${configHint}</em>` : ''}`;
    }).join('<br>');

    const sourceLabel = data.source === 'openai' ? '🤖 AI-generated' : '✨ Smart suggestion';
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) {
      thinkingEl.outerHTML = `
        <div class="ai-message assistant">
          <strong>${_ico('<path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="5"/>')} Suggested Flow</strong> <span style="font-size:11px;color:#6b7280">(${sourceLabel})</span><br><br>
          ${stepList}<br><br>
          <button class="btn btn-sm btn-primary" onclick="applyAISuggestion(null, false)" style="margin-right: 0.5rem;">${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Apply to Canvas</button>
          <button class="btn btn-sm btn-danger" onclick="applyAISuggestion(null, true)">${_ico('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>')} Override All</button>
        </div>
      `;
    }
  } catch (err) {
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) {
      thinkingEl.outerHTML = `<div class="ai-message assistant" style="color:#dc2626">Error: ${err.message}</div>`;
    }
  }
  chat.scrollTop = chat.scrollHeight;
}

// Helper: describe a node's config in a short human-readable string
function _describeConfig(node) {
  const c = node.config || {};
  if (node.type === 'wait') {
    return c.wait_time ? `${c.wait_time} ${c.wait_unit || 'hours'}` : '';
  }
  if (node.type === 'email') return c.subject || '';
  if (node.type === 'sms') return c.message ? c.message.slice(0, 50) + (c.message.length > 50 ? '...' : '') : '';
  if (node.type === 'condition') return c.condition_type ? `Check: ${c.condition_type}` : '';
  if (node.type === 'read_group') {
    const aud = (referenceData.audiences || []).find(a => String(a.id) === String(c.audience_id));
    return aud ? `List: ${aud.name}` : (c.external_list_label || '');
  }
  if (node.type === 'script_condition') return c.execution_branch === 'false' ? 'branch: false' : 'branch: true';
  if (node.type === 'recurring_delivery') return `${c.channel || 'email'}${c.delivery_id ? ` · delivery #${c.delivery_id}` : ''}`;
  if (node.type === 'data_writer') return `${c.operation || 'update'} ${c.entity_type || 'contacts'}`;
  if (node.type === 'segment' || node.type === 'filter') return c.criteria || c.action || '';
  if (node.type === 'split') return c.split_ratio ? `${c.split_ratio}/${100 - c.split_ratio} split` : '';
  if (node.type === 'goal') return c.goal_type || '';
  if (node.type === 'offer_decision') {
    const dec = (referenceData.decisions || []).find(d => d.id == c.decision_id);
    return dec ? dec.name : 'No decision selected';
  }
  if (node.type === 'ab_test') return c.split_pct ? `${c.split_pct}% / ${100 - c.split_pct}%` : '';
  return '';
}

async function optimizeOrchestration() {
  const chat = document.getElementById('orchestration-ai-chat');

  if (!nodes || nodes.length === 0) {
    chat.innerHTML += '<div class="ai-message assistant">There are no nodes on the canvas to optimize. Add some nodes first, or click <strong>Suggest Flow</strong> to generate one.</div>';
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  const thinkingId = 'ai-optimize-' + Date.now();
  chat.innerHTML += '<div class="ai-message user">Optimize my current flow (' + nodes.length + ' nodes)</div>';
  chat.innerHTML += '<div class="ai-message assistant" id="' + thinkingId + '"><em>Analyzing your flow for improvements...</em></div>';
  chat.scrollTop = chat.scrollHeight;

  try {
    const payload = {
      name: currentWorkflowData?.name || '',
      description: currentWorkflowData?.description || '',
      nodes: nodes.map(function(n) {
        return { id: n.id, type: n.type, category: n.category, name: n.name, config: n.config || {} };
      }),
      connections: connections.map(function(c) {
        return { from: c.from, to: c.to };
      })
    };

    const response = await fetch(API_BASE + '/ai/optimize-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Optimization failed');

    // Build score badge
    var scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 50 ? '#f59e0b' : '#ef4444';
    var scoreLabel = data.score >= 80 ? 'Good' : data.score >= 50 ? 'Needs Work' : 'Poor';

    // Build issues list
    var issuesHtml = (data.issues || []).map(function(issue) {
      var icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      return '<div style="margin-bottom:8px"><span>' + icon + '</span> <strong>' + issue.message + '</strong><br><span style="font-size:12px;color:#6b7280;margin-left:20px">' + issue.suggestion + '</span></div>';
    }).join('');

    // Build action buttons if there's an improved flow
    var actionButtons = '';
    if (data.improved_flow && data.improved_flow.length > 0) {
      _lastAISuggestion = data.improved_flow;
      actionButtons = '<br><strong>Apply optimized flow?</strong><br><button class="btn btn-sm btn-primary" onclick="applyAISuggestion(null, false)" style="margin-right:0.5rem;margin-top:6px">Apply Improvements</button> <button class="btn btn-sm btn-danger" onclick="applyAISuggestion(null, true)" style="margin-top:6px">Replace All</button>';
    }

    var sourceLabel = data.source === 'openai' ? '🤖 AI analysis' : '📋 Rule-based analysis';

    var thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) {
      thinkingEl.outerHTML = '<div class="ai-message assistant">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
          '<strong>Flow Analysis</strong>' +
          '<span style="background:' + scoreColor + ';color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">' + data.score + '/100 ' + scoreLabel + '</span>' +
          '<span style="font-size:11px;color:#6b7280">(' + sourceLabel + ')</span>' +
        '</div>' +
        issuesHtml +
        actionButtons +
      '</div>';
    }
  } catch (err) {
    var thinkingEl2 = document.getElementById(thinkingId);
    if (thinkingEl2) {
      thinkingEl2.outerHTML = '<div class="ai-message assistant" style="color:#dc2626">Optimization failed: ' + err.message + '</div>';
    }
  }
  chat.scrollTop = chat.scrollHeight;
}

// Apply AI-suggested flow to canvas
// flowType: null = use _lastAISuggestion (dynamic AI), or a string key for legacy templates
function applyAISuggestion(flowType, override = false) {
  if (override) {
    if (!confirm('This will delete all existing nodes and connections. Continue?')) {
      return;
    }
    pushUndoState();
    nodes = [];
    connections = [];
    nodeIdCounter = 1;
  } else if (nodes.length > 0) {
    if (!confirm('Add suggested flow to existing canvas?')) {
      return;
    }
    pushUndoState();
  } else {
    pushUndoState();
  }
  
  let startY = 100;
  let startX = 200;
  
  // Offset if not overriding
  if (!override && nodes.length > 0) {
    const maxY = Math.max(...nodes.map(n => n.position.y));
    startY = maxY + 150;
  }

  let template;

  if (flowType === null && _lastAISuggestion) {
    // Dynamic AI-generated flow — convert to positioned template
    template = _lastAISuggestion.map((n, i) => ({
      type: n.type,
      category: n.category || 'flow',
      name: n.name,
      icon: _getNodeIcon(n.type),
      x: startX,
      y: startY + (i * 120),
      config: n.config || {}
    }));
  } else {
    // Legacy hardcoded templates (for Optimize and chat-based suggestions)
    const flowTemplates = {
      optimized_flow: [
        { type: 'entry', category: 'flow', name: 'Entry Point', x: startX, y: startY },
        { type: 'segment', category: 'targeting', name: 'Active Subscribers', x: startX, y: startY + 120, config: { action: 'include' } },
        { type: 'split', category: 'flow_control', name: 'A/B Test', x: startX, y: startY + 240, config: { split_ratio: 50 } },
        { type: 'email', category: 'channels', name: 'Email Variant A', x: startX - 150, y: startY + 360, config: { subject: 'Version A Subject' } },
        { type: 'email', category: 'channels', name: 'Email Variant B', x: startX + 150, y: startY + 360, config: { subject: 'Version B Subject' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 24 Hours', x: startX, y: startY + 480, config: { wait_time: 24, wait_unit: 'hours' } },
        { type: 'condition', category: 'flow_control', name: 'Check Engagement', x: startX, y: startY + 600, config: { condition_type: 'email_clicked', time_window: 1 } },
        { type: 'goal', category: 'tracking', name: 'Track Goal', x: startX, y: startY + 720 },
        { type: 'exit', category: 'flow', name: 'Exit', x: startX, y: startY + 840 }
      ]
    };
    template = flowTemplates[flowType];
    if (template) {
      template = template.map(n => ({ ...n, icon: _getNodeIcon(n.type), config: n.config || {} }));
    }
  }

  if (!template || template.length === 0) {
    showToast('No flow template available. Try "Suggest Flow" first.', 'error');
    return;
  }
  
  // Add nodes
  const newNodeIds = [];
  template.forEach(nodeTemplate => {
    const node = {
      id: `node-${nodeIdCounter++}`,
      type: nodeTemplate.type,
      category: nodeTemplate.category,
      name: nodeTemplate.name,
      icon: nodeTemplate.icon,
      position: { x: nodeTemplate.x, y: nodeTemplate.y },
      config: nodeTemplate.config || {}
    };
    nodes.push(node);
    newNodeIds.push(node.id);
  });
  
  // Connect nodes sequentially
  for (let i = 0; i < newNodeIds.length - 1; i++) {
    connections.push({
      id: `conn-${Date.now()}-${i}`,
      from: newNodeIds[i],
      to: newNodeIds[i + 1]
    });
  }
  
  renderCanvas();
  showToast(`${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Applied ${template.length} nodes to canvas!`, 'success');
  
  // Update chat
  const chat = document.getElementById('orchestration-ai-chat');
  chat.innerHTML += `<div class="ai-message assistant">${_ico('<path d="M20 6 9 17l-5-5"/>')} Flow applied successfully! You can now customize each node.</div>`;
  chat.scrollTop = chat.scrollHeight;
}

function sendOrchestrationAIMessage() {
  const input = document.getElementById('orchestration-ai-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  const chat = document.getElementById('orchestration-ai-chat');
  
  chat.innerHTML += `<div class="ai-message user">${message}</div>`;
  input.value = '';

  // Check if this is a flow creation request — route to AI endpoint
  const lower = message.toLowerCase();
  const hasAction = /create|build|design|suggest|make|generate|add/i.test(lower);
  const hasFlowKeyword = /flow|workflow|campaign|journey|sequence|automation|series|welcome|cart|winback|abandon|onboard|nurture|drip|birthday|promo|sale|vip|loyalty/i.test(lower);
  const looksLikeBrief = (message.length > 50 && /trigger|wait|email|discount|reminder|hour|day/i.test(lower));
  const isFlowRequest = (hasAction && hasFlowKeyword) || looksLikeBrief;

  if (isFlowRequest) {
    _handleAIChatFlowRequest(message, chat);
    return;
  }
  
  setTimeout(() => {
    const response = getOrchestrationAIResponse(message);
    chat.innerHTML += `<div class="ai-message assistant">${response}</div>`;
    chat.scrollTop = chat.scrollHeight;
  }, 500);
}

// Parse message into name + description for suggest-flow (e.g. "Title: X. Description: Y" or "X — Y")
function _parseFlowBrief(message) {
  var name = message, description = '';
  var titleMatch = message.match(/\bTitle:\s*(.+?)(?=\s*Description:|\s*$)/is);
  var descMatch = message.match(/\bDescription:\s*([\s\S]+)/i);
  if (titleMatch && descMatch) {
    name = titleMatch[1].trim();
    description = descMatch[1].trim();
  } else if (message.indexOf('—') >= 0 || message.indexOf(' - ') >= 0) {
    var parts = message.split(/\s*[—\-]\s+/, 2);
    if (parts.length >= 2) { name = parts[0].trim(); description = parts[1].trim(); }
  }
  return { name: name || message, description: description || '' };
}

// Handle chat-based flow creation through the AI endpoint
async function _handleAIChatFlowRequest(message, chat) {
  var brief = _parseFlowBrief(message);
  var thinkingId = 'ai-chat-thinking-' + Date.now();
  chat.innerHTML += '<div class="ai-message assistant" id="' + thinkingId + '"><em>Designing your flow...</em></div>';
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch(API_BASE + '/ai/suggest-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: brief.name, description: brief.description })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed');

    _lastAISuggestion = data.flow;
    const stepList = data.flow.map(function(n, i) {
      var hint = _describeConfig(n);
      return (i + 1) + '. ' + _getNodeIcon(n.type) + ' <strong>' + n.name + '</strong>' + (hint ? ' — <em>' + hint + '</em>' : '');
    }).join('<br>');

    var sourceLabel = data.source === 'openai' ? 'AI-generated' : 'Smart suggestion';
    var thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) {
      thinkingEl.outerHTML = '<div class="ai-message assistant"><strong>Here is your flow</strong> <span style="font-size:11px;color:#6b7280">(' + sourceLabel + ')</span><br><br>' + stepList + '<br><br><button class="btn btn-sm btn-primary" onclick="applyAISuggestion(null, false)" style="margin-right:0.5rem">Apply to Canvas</button> <button class="btn btn-sm btn-danger" onclick="applyAISuggestion(null, true)">Override All</button></div>';
    }
  } catch (err) {
    var thinkingEl2 = document.getElementById(thinkingId);
    if (thinkingEl2) {
      thinkingEl2.outerHTML = '<div class="ai-message assistant" style="color:#dc2626">Sorry, could not generate a flow: ' + err.message + '</div>';
    }
  }
  chat.scrollTop = chat.scrollHeight;
}

function getOrchestrationAIResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('how') || lower.includes('start')) {
    return "Start by dragging an <strong>Entry</strong> node to the canvas. Then add targeting (Segment/Filter), channels (Email/SMS), and flow control (Wait/Split) nodes. Connect them by dragging from output (right) to input (left) points.<br><br>Want me to create a template for you? Try: 'create welcome flow' or 'suggest campaign flow'";
  }
  
  if (lower.includes('wait') || lower.includes('timing')) {
    return "Use <strong>Wait</strong> nodes between messages. Recommended: 24-48 hours between emails to avoid overwhelming customers. For urgent campaigns, 1-2 hours minimum.";
  }
  
  if (lower.includes('split') || lower.includes('test') || lower.includes('a/b')) {
    return "Use <strong>A/B Split</strong> to test different messages. Typically split 50/50. For more confidence, use 80/20 (control/test). Needs at least 1000 recipients for statistical significance.";
  }
  
  if (lower.includes('segment') || lower.includes('target') || lower.includes('filter')) {
    return "Use <strong>Segment</strong> nodes to filter your audience. Target VIP customers, recent buyers, or at-risk customers. Dynamic segments update automatically. You can have multiple segment filters in sequence.";
  }
  
  if (false && lower.includes('welcome')) {
    return `I can create a welcome/onboarding flow for you!<br><br>
      <button class="btn btn-sm btn-primary" onclick="applyAISuggestion('welcome_flow', false)" style="margin-right: 0.5rem;">${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Add Welcome Flow</button>
      <button class="btn btn-sm btn-danger" onclick="applyAISuggestion('welcome_flow', true)">${_ico('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>')} Replace All</button>`;
  }
  
  if (lower.includes('cart') || lower.includes('abandon')) {
    return `I can create a cart abandonment recovery flow!<br><br>
      <button class="btn btn-sm btn-primary" onclick="applyAISuggestion('cart_recovery', false)" style="margin-right: 0.5rem;">${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Add Cart Recovery</button>
      <button class="btn btn-sm btn-danger" onclick="applyAISuggestion('cart_recovery', true)">${_ico('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>')} Replace All</button>`;
  }
  
  if (lower.includes('winback') || lower.includes('re-engage') || lower.includes('inactive')) {
    return `I can create a winback campaign for inactive customers!<br><br>
      <button class="btn btn-sm btn-primary" onclick="applyAISuggestion('winback_flow', false)" style="margin-right: 0.5rem;">${_ico('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')} Add Winback Flow</button>
      <button class="btn btn-sm btn-danger" onclick="applyAISuggestion('winback_flow', true)">${_ico('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>')} Replace All</button>`;
  }
  
  if (lower.includes('create') || lower.includes('template') || lower.includes('suggest')) {
    return `I can create these campaign templates:<br><br>
      • <strong>Welcome Flow</strong> - Onboard new subscribers<br>
      • <strong>VIP Campaign</strong> - Target high-value customers<br>
      • <strong>Cart Recovery</strong> - Recover abandoned carts<br>
      • <strong>Winback</strong> - Re-engage inactive customers<br>
      • <strong>Optimized Flow</strong> - Best practices with A/B testing<br><br>
      Just ask: "create welcome flow" or "add cart recovery"`;
  }
  
  return 'I can help with orchestration design, best practices, timing, segmentation, and optimization.<br><br><strong>To generate a complete flow</strong>, use a clear title and description so the AI can derive the right steps and nodes. Example that works well:<br><br><strong>Title:</strong> Cart Abandonment Recovery<br><strong>Description:</strong> Trigger when a contact abandons their cart. Wait 1 hour → reminder email; 24 hours → 10% discount offer; 48 hours → last-chance email. Exclude contacts who purchased. Use conditions to branch on email open. Goal: recover 15–30% of abandoned carts.<br><br>You can type or paste a similar brief in the box above, or click <strong>Suggest Flow</strong> to auto-generate from this workflow\'s name and description.';
}

// --- Export canvas (JPEG / PDF): full graph via temporary pan/zoom + html2canvas ---
function exportWorkflowCanvasBaseName() {
  const raw = (document.getElementById('campaign-name')?.textContent || 'workflow')
    .replace(/\s*[—-]\s*(Preview|Orchestration).*$/i, '')
    .trim()
    .replace(/[^\w\s\-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64) || 'workflow';
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `workflow-canvas-${raw}-${stamp}`;
}

function getWorkflowCanvasExportBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  const pad = 64;
  if (!Number.isFinite(minX) || nodes.length === 0) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2
  };
}

async function captureCanvasContentWithFullGraph() {
  if (typeof html2canvas === 'undefined') {
    throw new Error('html2canvas not loaded (check /vendor/html2canvas.min.js)');
  }
  const canvasEl = document.getElementById('canvas');
  const contentEl = document.getElementById('canvas-content');
  if (!canvasEl || !contentEl) throw new Error('Canvas DOM missing');

  const saved = {
    overflow: canvasEl.style.overflow,
    minW: canvasEl.style.minWidth,
    minH: canvasEl.style.minHeight,
    zoom: canvasState.zoom,
    pan: { ...canvasState.pan }
  };

  try {
    const b = getWorkflowCanvasExportBounds();
    const w = Math.max(480, Math.ceil(b.width));
    const h = Math.max(360, Math.ceil(b.height));
    canvasEl.style.overflow = 'visible';
    canvasEl.style.minWidth = `${w}px`;
    canvasEl.style.minHeight = `${h}px`;
    canvasState.zoom = 1;
    canvasState.pan = { x: -b.minX + 48, y: -b.minY + 48 };
    applyCanvasTransform();
    scheduleRenderConnections();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((r) => setTimeout(r, 100));

    return await html2canvas(contentEl, {
      scale: 2,
      backgroundColor: '#fafbfc',
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0
    });
  } finally {
    canvasEl.style.overflow = saved.overflow;
    canvasEl.style.minWidth = saved.minW;
    canvasEl.style.minHeight = saved.minH;
    canvasState.zoom = saved.zoom;
    canvasState.pan = saved.pan;
    applyCanvasTransform();
    scheduleRenderConnections();
  }
}

function downloadExportBlob(filename, href) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Canvas toolbar export dropdown — resets to placeholder after each choice */
function onCanvasExportFormatChange(selectEl) {
  if (!selectEl) return;
  const v = selectEl.value;
  if (v === 'jpeg') void downloadWorkflowCanvasAsJpeg();
  else if (v === 'pdf') void downloadWorkflowCanvasAsPdf();
  selectEl.selectedIndex = 0;
}

async function downloadWorkflowCanvasAsJpeg() {
  if (!nodes.length) {
    showToast('Nothing on the canvas to export.', 'warning');
    return;
  }
  try {
    showLoading();
    const cap = await captureCanvasContentWithFullGraph();
    downloadExportBlob(`${exportWorkflowCanvasBaseName()}.jpg`, cap.toDataURL('image/jpeg', 0.92));
    showToast('JPEG downloaded', 'success');
  } catch (e) {
    console.error(e);
    showToast('Export failed: ' + (e.message || String(e)), 'error');
  } finally {
    hideLoading();
  }
}

async function downloadWorkflowCanvasAsPdf() {
  if (!nodes.length) {
    showToast('Nothing on the canvas to export.', 'warning');
    return;
  }
  const JsPdfCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!JsPdfCtor) {
    showToast('jsPDF not loaded (check /vendor/jspdf.umd.min.js)', 'error');
    return;
  }
  try {
    showLoading();
    const cap = await captureCanvasContentWithFullGraph();
    const imgData = cap.toDataURL('image/jpeg', 0.92);
    const imgW = cap.width;
    const imgH = cap.height;

    const pdf = new JsPdfCtor({
      unit: 'pt',
      format: 'a4',
      orientation: imgW >= imgH ? 'landscape' : 'portrait',
      compress: true
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const ratio = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const ox = (pageW - drawW) / 2;
    const oy = (pageH - drawH) / 2;

    const title = (document.getElementById('campaign-name')?.textContent || 'Workflow').slice(0, 200);
    pdf.setProperties({ title });

    pdf.addImage(imgData, 'JPEG', ox, oy, drawW, drawH);
    pdf.save(`${exportWorkflowCanvasBaseName()}.pdf`);
    showToast('PDF downloaded', 'success');
  } catch (e) {
    console.error(e);
    showToast('Export failed: ' + (e.message || String(e)), 'error');
  } finally {
    hideLoading();
  }
}

const ORCHESTRATION_PALETTE_COLLAPSED_KEY = 'orchestration_palette_collapsed';

function syncActivityPaletteCollapseUI() {
  const main = document.querySelector('.orchestration-main');
  const collapsed = !!(main && main.classList.contains('palette-collapsed'));
  const expandTab = document.getElementById('palette-expand-tab');
  const headerBtn = document.getElementById('palette-collapse-header-btn');

  if (expandTab) {
    expandTab.classList.toggle('hidden', !collapsed);
    expandTab.setAttribute('aria-expanded', String(!collapsed));
    expandTab.setAttribute('aria-controls', 'activity-palette-root');
  }
  if (headerBtn) {
    headerBtn.classList.toggle('hidden', collapsed);
    headerBtn.setAttribute('aria-expanded', String(!collapsed));
    headerBtn.setAttribute('aria-controls', 'activity-palette-root');
  }
}

function toggleActivityPaletteCollapsed() {
  const main = document.querySelector('.orchestration-main');
  if (!main) return;
  main.classList.toggle('palette-collapsed');
  const collapsed = main.classList.contains('palette-collapsed');
  try {
    localStorage.setItem(ORCHESTRATION_PALETTE_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch (e) {
    /* ignore */
  }
  syncActivityPaletteCollapseUI();
}

function initActivityPaletteCollapseState() {
  const main = document.querySelector('.orchestration-main');
  if (!main) return;
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(ORCHESTRATION_PALETTE_COLLAPSED_KEY) === '1';
  } catch (e) {
    /* ignore */
  }
  main.classList.toggle('palette-collapsed', collapsed);
  syncActivityPaletteCollapseUI();
}

// Navigation
function goBack() {
  if (isOrchestrationPreview) {
    window.location.href = '/workflow-json-viewer.html';
    return;
  }
  window.location.href = '/?view=workflows';
}

// Utility functions
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Test function to manually add a node
function testAddNode() {
  console.log('🧪 TEST: Manually adding a test node');
  addNode('email', 'channels', 'Test Email', _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'), 100, 100);
}

// ══════════════════════════════════════════════════════════════
// AGENTS & SKILLS — Create Skills / Create Agent from Workflow
// ══════════════════════════════════════════════════════════════

let _pendingSkills = [];
let _pendingDecomposition = null;

const CATEGORY_COLORS = {
  targeting:   { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe' },
  content:     { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', badge: '#fde68a' },
  timing:      { bg: '#f0fdf4', border: '#22c55e', text: '#166534', badge: '#bbf7d0' },
  channel:     { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8', badge: '#e9d5ff' },
  conversion:  { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: '#fecaca' }
};

const ROLE_ICONS = {
  orchestrator: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  timing:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  content:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  channel:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  targeting:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  conversion:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
};

// ── Create Skills ────────────────────────────────────────────

async function openCreateSkillsModal() {
  if (!isWorkflowContext || !campaignId) {
    showToast('Save the workflow first before extracting skills', 'warning');
    return;
  }
  if (nodes.length === 0) {
    showToast('Add nodes to the canvas before creating skills', 'warning');
    return;
  }

  await saveOrchestration({ showToastMessage: false });

  const modal = document.getElementById('create-skills-modal');
  const loading = document.getElementById('skills-loading');
  const results = document.getElementById('skills-results');
  modal.classList.remove('hidden');
  loading.classList.remove('hidden');
  results.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/agent-skills/extract/${campaignId}`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to extract skills');

    _pendingSkills = (data.suggested_skills || []).map((s, i) => ({ ...s, selected: true, _idx: i }));
    renderSkillCards();
    loading.classList.add('hidden');
    results.classList.remove('hidden');

    if (data.source === 'mock') {
      showToast('Using pattern-based extraction (add OpenAI key for AI analysis)', 'info');
    }
  } catch (err) {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    document.getElementById('skills-cards').innerHTML = `<p class="agent-error">Error: ${err.message}</p>`;
  }
}

function renderSkillCards() {
  const container = document.getElementById('skills-cards');
  if (_pendingSkills.length === 0) {
    container.innerHTML = '<p class="empty-state">No skills identified in this workflow.</p>';
    return;
  }
  container.innerHTML = _pendingSkills.map((skill, i) => {
    const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.content;
    const coveredNodes = (skill.node_ids || []).map(id => {
      const n = nodes.find(nd => nd.id === id);
      return n ? n.name : id;
    }).join(', ');

    const matchWarning = (skill.existing_matches && skill.existing_matches.length > 0)
      ? `<div class="similarity-warning" onclick="event.stopPropagation()">
           <span class="similarity-icon">⚠</span>
           <span class="similarity-text">Similar skill exists: <strong>${skill.existing_matches[0].name}</strong> (${skill.existing_matches[0].reasons.join(', ')})</span>
           ${skill.existing_matches[0].status === 'active' ? '<span class="similarity-status active">Active</span>' : `<span class="similarity-status">${skill.existing_matches[0].status}</span>`}
         </div>` : '';

    return `
      <div class="agent-card ${skill.selected ? 'selected' : ''}" onclick="toggleSkillSelection(${i})" style="border-color:${skill.selected ? colors.border : 'var(--border-light)'}">
        <div class="agent-card-header">
          <span class="agent-card-badge" style="background:${colors.badge};color:${colors.text}">${skill.category}</span>
          <input type="checkbox" ${skill.selected ? 'checked' : ''} onclick="event.stopPropagation();toggleSkillSelection(${i})">
        </div>
        ${matchWarning}
        <h4 class="agent-card-title">${skill.name}</h4>
        <p class="agent-card-desc">${skill.description}</p>
        ${coveredNodes ? `<div class="agent-card-nodes"><strong>Covers:</strong> ${coveredNodes}</div>` : ''}
        <div class="agent-card-steps" onclick="event.stopPropagation()">
          <label class="form-label" style="font-size:11px;margin-bottom:6px">Steps (${(skill.steps || []).length})</label>
          <ol class="skill-steps-list">
            ${(skill.steps || []).map((st, si) => {
              const actionColors = { wait: '#22c55e', send: '#a855f7', check: '#f59e0b', filter: '#3b82f6', target: '#3b82f6', track: '#ef4444', split: '#6366f1', enrich: '#06b6d4' };
              const ac = actionColors[st.action] || '#6b7280';
              return `<li class="skill-step-item">
                <span class="skill-step-action" style="background:${ac}20;color:${ac};border:1px solid ${ac}40">${st.action}</span>
                <span class="skill-step-text">${st.instruction || ''}</span>
                ${st.channel ? `<span class="skill-step-channel">${st.channel}</span>` : ''}
              </li>`;
            }).join('')}
          </ol>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSkillSelection(idx) {
  _pendingSkills[idx].selected = !_pendingSkills[idx].selected;
  renderSkillCards();
}

async function saveSelectedSkills() {
  const selected = _pendingSkills.filter(s => s.selected);
  if (selected.length === 0) {
    showToast('Select at least one skill to create', 'warning');
    return;
  }

  const btn = document.getElementById('save-skills-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const payload = selected.map(s => ({
      name: s.name,
      description: s.description,
      category: s.category,
      source_workflow_id: parseInt(campaignId),
      scope: s.node_ids && s.node_ids.length < nodes.length ? 'subgraph' : 'workflow',
      node_ids: s.node_ids || [],
      node_snapshot: (s.node_ids || []).map(id => nodes.find(n => n.id === id)).filter(Boolean),
      steps: s.steps || [],
      prompt_template: s.prompt_template || (s.steps || []).map(st => st.step + '. ' + st.instruction).join('\n'),
      input_schema: s.input_schema || {},
      output_schema: s.output_schema || {}
    }));

    const response = await fetch(`${API_BASE}/agent-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create skills');

    const count = Array.isArray(result) ? result.length : 1;
    showToast(`Created ${count} skill${count > 1 ? 's' : ''} from this workflow`, 'success');
    closeSkillsModal();
  } catch (err) {
    showToast('Error creating skills: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Create Selected Skills';
  }
}

function closeSkillsModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.preview-modal-close')) return;
  document.getElementById('create-skills-modal').classList.add('hidden');
  _pendingSkills = [];
}

// ── Create Agent ─────────────────────────────────────────────

async function openCreateAgentModal() {
  if (!isWorkflowContext || !campaignId) {
    showToast('Save the workflow first before creating an agent', 'warning');
    return;
  }
  if (nodes.length === 0) {
    showToast('Add nodes to the canvas before creating an agent', 'warning');
    return;
  }

  await saveOrchestration({ showToastMessage: false });

  const modal = document.getElementById('create-agent-modal');
  const loading = document.getElementById('agent-loading');
  const results = document.getElementById('agent-results');
  modal.classList.remove('hidden');
  loading.classList.remove('hidden');
  results.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/agents/decompose/${campaignId}`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to decompose workflow');

    _pendingDecomposition = data;

    document.getElementById('agent-goal-input').value = data.goal || '';
    document.getElementById('agent-name-input').value = (data.workflow_name || 'Workflow') + ' Agent';

    if (data.guardrails) {
      const g = data.guardrails;
      document.getElementById('guardrail-max-msg').value = g.max_messages_per_contact_per_day || 3;
      document.getElementById('guardrail-email').value = g.channel_limits?.email ?? 2;
      document.getElementById('guardrail-sms').value = g.channel_limits?.sms ?? 1;
      document.getElementById('guardrail-push').value = g.channel_limits?.push ?? 2;
      document.getElementById('guardrail-approval').checked = g.require_approval !== false;
    }

    renderSubAgentCards(data.sub_agents || []);

    // Show agent-level similarity warning
    const agentWarningEl = document.getElementById('agent-similarity-warning');
    if (agentWarningEl) agentWarningEl.remove();
    if (data.existing_agent_matches && data.existing_agent_matches.length > 0) {
      const matchesHtml = data.existing_agent_matches.map(m =>
        `<div class="similarity-match-row">
           <strong>${m.name}</strong>
           <span class="similarity-status ${m.status === 'active' ? 'active' : ''}">${m.status}</span>
           <span class="similarity-detail">${m.reasons.join(', ')}${m.sub_agent_count ? ` · ${m.sub_agent_count} sub-agents` : ''}</span>
         </div>`
      ).join('');
      const warningDiv = document.createElement('div');
      warningDiv.id = 'agent-similarity-warning';
      warningDiv.className = 'similarity-banner';
      warningDiv.innerHTML = `<span class="similarity-icon">⚠</span><div><strong>Similar agent(s) already exist</strong>${matchesHtml}</div>`;
      const resultsEl = document.getElementById('agent-results');
      resultsEl.insertBefore(warningDiv, resultsEl.firstChild);
    }

    loading.classList.add('hidden');
    results.classList.remove('hidden');

    if (data.source === 'mock') {
      showToast('Using pattern-based decomposition (add OpenAI key for AI analysis)', 'info');
    }
  } catch (err) {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    document.getElementById('agent-subagents-cards').innerHTML = `<p class="agent-error">Error: ${err.message}</p>`;
  }
}

function renderSubAgentCards(subAgents) {
  const container = document.getElementById('agent-subagents-cards');
  if (!subAgents || subAgents.length === 0) {
    container.innerHTML = '<p class="empty-state">No sub-agents suggested.</p>';
    return;
  }
  _pendingDecomposition._subAgents = subAgents.map(a => ({ ...a, enabled: true }));

  container.innerHTML = _pendingDecomposition._subAgents.map((agent, i) => {
    const roleColor = CATEGORY_COLORS[agent.role] || CATEGORY_COLORS.content;
    const icon = ROLE_ICONS[agent.role] || ROLE_ICONS.orchestrator;
    const coveredNodes = (agent.node_ids || []).map(id => {
      const n = nodes.find(nd => nd.id === id);
      return n ? n.name : id;
    }).join(', ');

    return `
      <div class="agent-card ${agent.enabled ? 'selected' : ''}" style="border-color:${agent.enabled ? roleColor.border : 'var(--border-light)'}">
        <div class="agent-card-header">
          <span class="agent-card-badge" style="background:${roleColor.badge};color:${roleColor.text}">
            ${icon} ${agent.role}
          </span>
          <input type="checkbox" ${agent.enabled ? 'checked' : ''} onchange="_pendingDecomposition._subAgents[${i}].enabled=this.checked;renderSubAgentCards(_pendingDecomposition._subAgents)">
        </div>
        <h4 class="agent-card-title">${agent.name}</h4>
        <p class="agent-card-desc">${agent.description}</p>
        ${coveredNodes ? `<div class="agent-card-nodes"><strong>Nodes:</strong> ${coveredNodes}</div>` : ''}
        ${agent.skill_ids && agent.skill_ids.length > 0 ? `<div class="agent-card-nodes"><strong>Skills:</strong> ${agent.skill_ids.length} linked</div>` : ''}
        <div class="agent-card-template">
          <label class="agent-card-field-label">Instructions</label>
          <textarea class="agent-card-textarea" rows="2" onchange="_pendingDecomposition._subAgents[${i}].system_instructions=this.value">${agent.system_instructions || ''}</textarea>
        </div>
      </div>
    `;
  }).join('');
}

async function saveAgent() {
  const name = document.getElementById('agent-name-input').value.trim();
  const goal = document.getElementById('agent-goal-input').value.trim();
  if (!name) {
    showToast('Please enter an agent name', 'warning');
    return;
  }

  const enabledSubAgents = (_pendingDecomposition._subAgents || []).filter(a => a.enabled);
  if (enabledSubAgents.length === 0) {
    showToast('Enable at least one sub-agent', 'warning');
    return;
  }

  try {
    const payload = {
      name,
      description: `Agent created from workflow "${_pendingDecomposition.workflow_name || ''}"`,
      goal,
      source_workflow_id: parseInt(campaignId),
      workflow_snapshot: { nodes, connections },
      sub_agents: enabledSubAgents.map(a => ({
        name: a.name,
        role: a.role,
        description: a.description,
        skill_ids: a.skill_ids || [],
        system_instructions: a.system_instructions || '',
        node_ids: a.node_ids || []
      })),
      guardrails: {
        max_messages_per_contact_per_day: parseInt(document.getElementById('guardrail-max-msg').value) || 3,
        channel_limits: {
          email: parseInt(document.getElementById('guardrail-email').value) || 0,
          sms: parseInt(document.getElementById('guardrail-sms').value) || 0,
          push: parseInt(document.getElementById('guardrail-push').value) || 0
        },
        require_approval: document.getElementById('guardrail-approval').checked,
        budget_limit: null
      },
      status: 'draft'
    };

    const response = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create agent');

    showToast(`Agent "${name}" created with ${enabledSubAgents.length} sub-agent${enabledSubAgents.length > 1 ? 's' : ''}`, 'success');
    closeAgentModal();
  } catch (err) {
    showToast('Error creating agent: ' + err.message, 'error');
  }
}

function closeAgentModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.preview-modal-close')) return;
  document.getElementById('create-agent-modal').classList.add('hidden');
  _pendingDecomposition = null;
}

async function openProbabilisticFlow() {
  if (!isWorkflowContext || !campaignId) {
    showToast('Save the workflow first before creating an intelligent flow', 'warning');
    return;
  }
  if (nodes.length === 0) {
    showToast('Build your workflow first — add some nodes to the canvas', 'warning');
    return;
  }

  await saveOrchestration({ showToastMessage: false });

  try {
    const wfId = parseInt(campaignId);

    // Step 1: Check what already exists
    showToast('Preparing probabilistic flow...', 'info');
    const [skillsRes, agentsRes] = await Promise.all([
      fetch(`${API_BASE}/agent-skills`),
      fetch(`${API_BASE}/agents`)
    ]);
    const allSkills = await skillsRes.json();
    const allAgents = await agentsRes.json();
    let wfSkills = (Array.isArray(allSkills) ? allSkills : []).filter(s => s.source_workflow_id === wfId);
    let wfAgent = (Array.isArray(allAgents) ? allAgents : []).find(a =>
      a.source_workflow_id === wfId && (a.type === 'orchestrator' || !a.type)
    );

    // Step 2: Auto-extract and save skills if none exist
    if (wfSkills.length === 0) {
      showToast('Extracting skills from workflow...', 'info');
      const extractRes = await fetch(`${API_BASE}/agent-skills/extract/${wfId}`, { method: 'POST' });
      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error || 'Failed to extract skills');

      const suggested = extractData.suggested_skills || [];
      if (suggested.length > 0) {
        const payload = suggested.map(s => ({
          name: s.name,
          description: s.description,
          category: s.category,
          source_workflow_id: wfId,
          scope: s.node_ids && s.node_ids.length < nodes.length ? 'subgraph' : 'workflow',
          node_ids: s.node_ids || [],
          node_snapshot: (s.node_ids || []).map(id => nodes.find(n => n.id === id)).filter(Boolean),
          steps: s.steps || [],
          prompt_template: s.prompt_template || (s.steps || []).map(st => st.step + '. ' + st.instruction).join('\n'),
          input_schema: s.input_schema || {},
          output_schema: s.output_schema || {}
        }));

        const saveSkillsRes = await fetch(`${API_BASE}/agent-skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const savedSkills = await saveSkillsRes.json();
        if (!saveSkillsRes.ok) throw new Error(savedSkills.error || 'Failed to save skills');

        wfSkills = Array.isArray(savedSkills) ? savedSkills : [savedSkills];
        showToast(`Created ${wfSkills.length} skill${wfSkills.length > 1 ? 's' : ''}`, 'success');
      }
    }

    // Step 3: Auto-create orchestrator agent if none exists
    if (!wfAgent) {
      showToast('Creating orchestrator agent from workflow...', 'info');
      const decomposeRes = await fetch(`${API_BASE}/agents/decompose/${wfId}`, { method: 'POST' });
      const decomposeData = await decomposeRes.json();
      if (!decomposeRes.ok) throw new Error(decomposeData.error || 'Failed to decompose workflow');

      const subAgents = (decomposeData.sub_agents || []).map(a => ({
        name: a.name,
        role: a.role,
        description: a.description,
        skill_ids: a.skill_ids || [],
        system_instructions: a.system_instructions || '',
        node_ids: a.node_ids || []
      }));

      const wfName = decomposeData.workflow_name || 'Workflow';
      const agentPayload = {
        name: wfName + ' Agent',
        description: `Agent created from workflow "${wfName}"`,
        goal: decomposeData.goal || '',
        source_workflow_id: wfId,
        workflow_snapshot: { nodes, connections },
        sub_agents: subAgents,
        guardrails: decomposeData.guardrails || {
          max_messages_per_contact_per_day: 3,
          channel_limits: { email: 2, sms: 1, push: 2 },
          require_approval: true,
          budget_limit: null
        },
        status: 'draft'
      };

      const createAgentRes = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload)
      });
      const createdAgent = await createAgentRes.json();
      if (!createAgentRes.ok) throw new Error(createdAgent.error || 'Failed to create agent');

      wfAgent = createdAgent;
      showToast(`Orchestrator "${wfName} Agent" created`, 'success');
    }

    // Step 4: Generate the probabilistic agent
    showToast('Generating probabilistic agent...', 'info');
    const genRes = await fetch(`${API_BASE}/agents/${wfAgent.id}/probabilistic/generate`, { method: 'POST' });
    const genData = await genRes.json();
    if (!genRes.ok) throw new Error(genData.error || 'Failed to generate intelligent agent');

    const newId = genData.agent_id;
    const newName = genData.agent_name || 'Intelligent Agent';
    showToast(`Agent "${newName}" created! Opening agent builder...`, 'success');
    setTimeout(() => {
      if (typeof navigateTo === 'function') {
        navigateTo('agents', 'edit', newId);
      } else {
        window.location.href = `/?view=agents&edit=${newId}`;
      }
    }, 600);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ── AI NODE SUPPORT FUNCTIONS ─────────────────────────────────────────────────

function buildAINodePropertiesHtml(node) {
  const models = ['gpt-4o-mini', 'gpt-4o', 'claude-haiku-4-5', 'claude-sonnet-4-6', 'gemini-flash'];
  const modelOpts = models.map(m => `<option value="${m}" ${(node.config.model||'gpt-4o-mini') === m ? 'selected' : ''}>${m}</option>`).join('');
  const upstreamVars = getUpstreamAIVariables(node.id);
  const varPills = upstreamVars.length
    ? `<div class="ai-output-vars">${upstreamVars.map(v => `<span class="ai-var-pill" title="${v.description}" onclick="insertVariableRef('${v.ref}')">${v.ref}</span>`).join('')}</div>`
    : '';

  let h = `<div class="ai-section-header">${_ico('<path d="M12 2a5 5 0 1 1-4.546 2.914"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="1"/>')} AI Configuration</div>`;

  if (['ai_branch','ai_classifier','ai_scorer','ai_personalize','ai_enrich','ai_sentiment','ai_next_best_action','ai_content_eval','ai_translate','ai_wait','ai_agent','ai_skill'].includes(node.type)) {
    h += `
      <div class="form-group">
        <label class="form-label">Model</label>
        <select class="form-input" onchange="updateNodeConfig('model', this.value)">
          ${modelOpts}
        </select>
      </div>
    `;
  }

  if (node.type === 'ai_branch') {
    const threshold = node.config.confidence_threshold || 0.7;
    h += `
      <div class="form-group">
        <label class="form-label">Condition Prompt</label>
        <textarea class="form-input" rows="3" placeholder="e.g. Is this contact likely to churn based on their recent activity?" onchange="updateNodeConfig('prompt', this.value)">${node.config.prompt || ''}</textarea>
        <div class="form-help">Natural language condition evaluated per contact. Outputs true/false.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Confidence Threshold <span class="confidence-value-badge">${(threshold*100).toFixed(0)}%</span></label>
        <div class="confidence-slider-row">
          <input type="range" min="0" max="1" step="0.05" value="${threshold}" oninput="updateNodeConfig('confidence_threshold', parseFloat(this.value)); this.previousElementSibling && (this.closest('.form-group').querySelector('.confidence-value-badge').textContent = (this.value*100).toFixed(0)+'%')">
        </div>
        <div class="form-help">Below threshold → fallback path is taken</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable Name</label>
        <input type="text" class="form-input" placeholder="e.g. churn_risk_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference downstream as <code>{{${node.id}.result}}</code>, <code>{{${node.id}.confidence}}</code></div>
      </div>
      <div class="form-group">
        <label class="form-label">Fallback on AI Error</label>
        <label class="toggle"><input type="checkbox" ${node.config.fallback_on_error !== false ? 'checked' : ''} onchange="updateNodeConfig('fallback_on_error', this.checked)"><span class="toggle-slider"></span></label>
        <div class="form-help">Take fallback branch if AI call fails or times out</div>
      </div>
    `;
  } else if (node.type === 'ai_classifier') {
    h += `
      <div class="form-group">
        <label class="form-label">Classes (comma-separated)</label>
        <input type="text" class="form-input" placeholder="e.g. high_value,medium_value,low_value" value="${node.config.classes || ''}" onchange="updateNodeConfig('classes', this.value)">
        <div class="form-help">Each class becomes an output route. Route contacts to matching branches.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Classification Context</label>
        <textarea class="form-input" rows="2" placeholder="Additional context to help classification..." onchange="updateNodeConfig('context', this.value)">${node.config.context || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Confidence Threshold <span class="confidence-value-badge">${((node.config.confidence_threshold||0.6)*100).toFixed(0)}%</span></label>
        <div class="confidence-slider-row">
          <input type="range" min="0" max="1" step="0.05" value="${node.config.confidence_threshold || 0.6}" oninput="updateNodeConfig('confidence_threshold', parseFloat(this.value)); this.closest('.form-group').querySelector('.confidence-value-badge').textContent=(this.value*100).toFixed(0)+'%'">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="classifier_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.class}}</code>, <code>{{${node.id}.confidence}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_scorer') {
    h += `
      <div class="form-group">
        <label class="form-label">Scoring Dimension</label>
        <input type="text" class="form-input" placeholder="e.g. churn_propensity, upsell_likelihood, engagement_score" value="${node.config.dimension || ''}" onchange="updateNodeConfig('dimension', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Branch Threshold <span class="confidence-value-badge">${((node.config.threshold||0.6)*100).toFixed(0)}%</span></label>
        <div class="confidence-slider-row">
          <input type="range" min="0" max="1" step="0.05" value="${node.config.threshold || 0.6}" oninput="updateNodeConfig('threshold', parseFloat(this.value)); this.closest('.form-group').querySelector('.confidence-value-badge').textContent=(this.value*100).toFixed(0)+'%'">
        </div>
        <div class="form-help">Contacts above threshold go to "High" branch, below to "Low"</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="propensity_score" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.score}}</code>, <code>{{${node.id}.tier}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_personalize') {
    h += `
      <div class="form-group">
        <label class="form-label">Content Template</label>
        <textarea class="form-input" rows="4" placeholder="Hi {{first_name}}, based on your recent purchase of {{last_product}}, we think you'll love..." onchange="updateNodeConfig('template', this.value)">${node.config.template || ''}</textarea>
        <div class="form-help">Use <code>{{field_name}}</code> for contact fields. AI will personalize the rest.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="personalized_content" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.content}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_translate') {
    h += `
      <div class="form-group">
        <label class="form-label">Target Language</label>
        <select class="form-input" onchange="updateNodeConfig('target_language', this.value)">
          <option value="">Contact's preferred language</option>
          <option value="es" ${node.config.target_language === 'es' ? 'selected' : ''}>Spanish</option>
          <option value="fr" ${node.config.target_language === 'fr' ? 'selected' : ''}>French</option>
          <option value="de" ${node.config.target_language === 'de' ? 'selected' : ''}>German</option>
          <option value="pt" ${node.config.target_language === 'pt' ? 'selected' : ''}>Portuguese</option>
          <option value="ja" ${node.config.target_language === 'ja' ? 'selected' : ''}>Japanese</option>
          <option value="zh" ${node.config.target_language === 'zh' ? 'selected' : ''}>Chinese</option>
          <option value="ar" ${node.config.target_language === 'ar' ? 'selected' : ''}>Arabic</option>
          <option value="it" ${node.config.target_language === 'it' ? 'selected' : ''}>Italian</option>
          <option value="ko" ${node.config.target_language === 'ko' ? 'selected' : ''}>Korean</option>
        </select>
        <div class="form-help">Leave blank to auto-detect from contact's preferred_language field</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="translated_content" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
      </div>
    `;
  } else if (node.type === 'ai_content_eval') {
    h += `
      <div class="form-group">
        <label class="form-label">Evaluation Rubric</label>
        <textarea class="form-input" rows="3" placeholder="e.g. Content must be professional, under 150 words, include a clear CTA, avoid spam trigger words" onchange="updateNodeConfig('rubric', this.value)">${node.config.rubric || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Minimum Quality Score (0-10)</label>
        <input type="number" class="form-input" min="0" max="10" step="0.5" value="${node.config.min_score || 7}" onchange="updateNodeConfig('min_score', parseFloat(this.value))">
        <div class="form-help">Content scoring below this → fallback branch</div>
      </div>
    `;
  } else if (node.type === 'ai_enrich') {
    h += `
      <div class="form-group">
        <label class="form-label">Fields to Infer</label>
        <input type="text" class="form-input" placeholder="e.g. income_bracket,lifestyle_segment,churn_risk" value="${node.config.fields || ''}" onchange="updateNodeConfig('fields', this.value)">
        <div class="form-help">Comma-separated fields to infer from existing profile data</div>
      </div>
      <div class="form-group">
        <label class="form-label">Enrichment Prompt</label>
        <textarea class="form-input" rows="2" placeholder="Optional: additional context for inference..." onchange="updateNodeConfig('prompt', this.value)">${node.config.prompt || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="enriched_data" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.enriched_fields}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_sentiment') {
    h += `
      <div class="form-group">
        <label class="form-label">Source Field</label>
        <input type="text" class="form-input" placeholder="last_interaction" value="${node.config.source_field || 'last_interaction'}" onchange="updateNodeConfig('source_field', this.value)">
        <div class="form-help">Contact field containing text to analyze</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="sentiment_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.sentiment}}</code>, <code>{{${node.id}.score}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_next_best_action') {
    h += `
      <div class="form-group">
        <label class="form-label">Available Actions</label>
        <textarea class="form-input" rows="3" placeholder="send_winback_email,offer_discount_10,offer_discount_20,send_survey,do_nothing" onchange="updateNodeConfig('actions', this.value)">${node.config.actions || ''}</textarea>
        <div class="form-help">Comma-separated. AI picks the best action for each contact.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="nba_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.action}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_wait') {
    h += `
      <div class="form-group">
        <label class="form-label">Max Wait (hours)</label>
        <input type="number" class="form-input" min="1" max="168" value="${node.config.max_wait_hours || 48}" onchange="updateNodeConfig('max_wait_hours', this.value)">
        <div class="form-help">AI predicts optimal send time per contact, up to this maximum</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="optimal_send_time" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
      </div>
    `;
  } else if (node.type === 'ai_agent') {
    const agents = (window._referenceAgents || []);
    const agentOptions = agents.map(a => `<option value="${a.id}" ${node.config.agent_id == a.id ? 'selected' : ''}>${a.name} (${a.type})</option>`).join('');
    h += `
      <div class="form-group">
        <label class="form-label">Agent</label>
        <select class="form-input" onchange="updateNodeConfig('agent_id', this.value)">
          <option value="">Select an agent...</option>
          ${agentOptions || '<option disabled>No agents found</option>'}
        </select>
        <div class="form-help">The configured agent to invoke inline in this workflow</div>
      </div>
      <div class="form-group">
        <label class="form-label">Timeout (seconds)</label>
        <input type="number" class="form-input" min="5" max="300" value="${node.config.timeout_seconds || 30}" onchange="updateNodeConfig('timeout_seconds', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Fallback on Error</label>
        <label class="toggle"><input type="checkbox" ${node.config.fallback_on_error !== false ? 'checked' : ''} onchange="updateNodeConfig('fallback_on_error', this.checked)"><span class="toggle-slider"></span></label>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="agent_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference: <code>{{${node.id}.agent_output}}</code></div>
      </div>
    `;
  } else if (node.type === 'ai_skill') {
    const skills = (window._referenceSkills || []);
    const skillOptions = skills.map(s => `<option value="${s.id}" ${node.config.skill_id == s.id ? 'selected' : ''}>${s.name} (${s.category})</option>`).join('');
    h += `
      <div class="form-group">
        <label class="form-label">Skill</label>
        <select class="form-input" onchange="updateNodeConfig('skill_id', this.value)">
          <option value="">Select a skill...</option>
          ${skillOptions || '<option disabled>No skills found</option>'}
        </select>
        <div class="form-help">Execute this skill against each contact</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="skill_result" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
      </div>
    `;
  } else if (node.type === 'ai_hitl') {
    h += `
      <div class="form-group">
        <label class="form-label">Review Question</label>
        <input type="text" class="form-input" placeholder="e.g. Should we proceed with this high-value discount offer?" value="${node.config.question || ''}" onchange="updateNodeConfig('question', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Decision Options (comma-separated)</label>
        <input type="text" class="form-input" placeholder="approve,reject,defer" value="${node.config.options || 'approve,reject,defer'}" onchange="updateNodeConfig('options', this.value)">
        <div class="form-help">Each option becomes an output route. "approve" goes to main path.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Timeout (hours)</label>
        <input type="number" class="form-input" min="1" max="168" value="${node.config.timeout_hours || 24}" onchange="updateNodeConfig('timeout_hours', this.value)">
        <div class="form-help">If no decision in this time, take timeout path</div>
      </div>
      <div class="form-group">
        <label class="form-label">Include AI Recommendation</label>
        <label class="toggle"><input type="checkbox" ${node.config.ai_recommendation !== false ? 'checked' : ''} onchange="updateNodeConfig('ai_recommendation', this.checked)"><span class="toggle-slider"></span></label>
        <div class="form-help">AI pre-analyzes the contact and suggests a decision to the reviewer</div>
      </div>
      <div class="form-inline-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewPendingHITL('${node.id}')">View Pending Reviews</button>
      </div>
    `;
  } else if (node.type === 'ai_guardrail') {
    h += `
      <div class="form-group">
        <label class="form-label">Guardrail Rules</label>
        <textarea class="form-input" rows="4" placeholder="e.g.&#10;- Content must not mention competitors&#10;- Discount must not exceed 30%&#10;- Message must include unsubscribe link" onchange="updateNodeConfig('rules', this.value)">${node.config.rules || ''}</textarea>
        <div class="form-help">Natural language rules. AI validates the upstream output against these.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Action on Failure</label>
        <select class="form-input" onchange="updateNodeConfig('action_on_fail', this.value)">
          <option value="fallback" ${node.config.action_on_fail === 'fallback' ? 'selected' : ''}>Take fallback path</option>
          <option value="stop" ${node.config.action_on_fail === 'stop' ? 'selected' : ''}>Stop execution for contact</option>
          <option value="alert" ${node.config.action_on_fail === 'alert' ? 'selected' : ''}>Alert and continue</option>
        </select>
      </div>
    `;
  } else if (node.type === 'confidence_gate') {
    h += `
      <div class="form-group">
        <label class="form-label">Source Node Variable</label>
        <input type="text" class="form-input" placeholder="e.g. node-3.confidence" value="${node.config.source_node_variable || ''}" onchange="updateNodeConfig('source_node_variable', this.value)">
        <div class="form-help">The confidence value from an upstream AI node to evaluate</div>
      </div>
      <div class="form-group">
        <label class="form-label">Minimum Confidence <span class="confidence-value-badge">${((node.config.threshold||0.7)*100).toFixed(0)}%</span></label>
        <div class="confidence-slider-row">
          <input type="range" min="0" max="1" step="0.05" value="${node.config.threshold || 0.7}" oninput="updateNodeConfig('threshold', parseFloat(this.value)); this.closest('.form-group').querySelector('.confidence-value-badge').textContent=(this.value*100).toFixed(0)+'%'">
        </div>
        <div class="form-help">Above threshold → success path. Below → fallback path.</div>
      </div>
      ${upstreamVars.length ? `<div class="form-group"><label class="form-label">Upstream Variables</label>${varPills}</div>` : ''}
    `;
  } else if (node.type === 'prompt_shield') {
    h += `
      <div class="form-group">
        <label class="form-label">Fields to Sanitize</label>
        <input type="text" class="form-input" placeholder="name,email,phone,last_interaction" value="${node.config.fields_to_sanitize || 'name,email,phone'}" onchange="updateNodeConfig('fields_to_sanitize', this.value)">
        <div class="form-help">Comma-separated contact fields that will be sanitized before entering AI nodes</div>
      </div>
      <div class="form-group">
        <label class="form-label">Block Prompt Injections</label>
        <label class="toggle"><input type="checkbox" ${node.config.block_injections !== false ? 'checked' : ''} onchange="updateNodeConfig('block_injections', this.checked)"><span class="toggle-slider"></span></label>
        <div class="form-help">Detect and strip instruction-injection patterns from contact data</div>
      </div>
    `;
  } else if (node.type === 'context_store') {
    h += `
      <div class="form-group">
        <label class="form-label">Context Key</label>
        <input type="text" class="form-input" placeholder="e.g. preferred_channel, last_ai_recommendation" value="${node.config.key || ''}" onchange="updateNodeConfig('key', this.value)">
        <div class="form-help">Key under which this value will be stored for the contact</div>
      </div>
      <div class="form-group">
        <label class="form-label">Value Expression</label>
        <input type="text" class="form-input" placeholder="e.g. {{node-3.action}} or literal value" value="${node.config.value_expression || ''}" onchange="updateNodeConfig('value_expression', this.value)">
        <div class="form-help">Use {{nodeId.variable}} to reference upstream AI node outputs</div>
      </div>
      ${upstreamVars.length ? `<div class="form-group"><label class="form-label">Available Variables</label>${varPills}</div>` : ''}
    `;
  } else if (node.type === 'context_recall') {
    h += `
      <div class="form-group">
        <label class="form-label">Context Key to Recall</label>
        <input type="text" class="form-input" placeholder="e.g. preferred_channel" value="${node.config.key || ''}" onchange="updateNodeConfig('key', this.value)">
        <div class="form-help">Retrieves the value stored by a Context Store node in a prior run</div>
      </div>
      <div class="form-group">
        <label class="form-label">Output Variable</label>
        <input type="text" class="form-input" placeholder="recalled_context" value="${node.config.output_variable || ''}" onchange="updateNodeConfig('output_variable', this.value)">
        <div class="form-help">Reference downstream as <code>{{${node.id}.value}}</code></div>
      </div>
    `;
  } else if (node.type === 'outcome_tracker') {
    h += `
      <div class="form-group">
        <label class="form-label">Metric Name</label>
        <input type="text" class="form-input" placeholder="e.g. conversion, click, churn_prevented" value="${node.config.metric_name || ''}" onchange="updateNodeConfig('metric_name', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Success Condition</label>
        <input type="text" class="form-input" placeholder="e.g. purchased within 7 days" value="${node.config.success_condition || ''}" onchange="updateNodeConfig('success_condition', this.value)">
        <div class="form-help">Natural language condition to evaluate outcome attribution</div>
      </div>
    `;
  } else if (node.type === 'ab_shadow') {
    h += `
      <div class="form-group">
        <label class="form-label">Shadow AI Node</label>
        <select class="form-input" onchange="updateNodeConfig('shadow_node_id', this.value)">
          <option value="">Select AI node to shadow...</option>
          ${nodes.filter(n => n.category === 'ai' && n.id !== node.id).map(n => `<option value="${n.id}" ${node.config.shadow_node_id === n.id ? 'selected' : ''}>${n.name}</option>`).join('')}
        </select>
        <div class="form-help">This AI node runs in parallel to the deterministic path but its output has no effect until promoted</div>
      </div>
      <div class="form-group">
        <label class="form-label">Log Comparison</label>
        <label class="toggle"><input type="checkbox" ${node.config.log_comparison !== false ? 'checked' : ''} onchange="updateNodeConfig('log_comparison', this.checked)"><span class="toggle-slider"></span></label>
        <div class="form-help">Record AI vs deterministic decisions for analysis</div>
      </div>
    `;
  } else {
    h += `<div class="form-help">No additional configuration for this AI node type.</div>`;
  }

  // Cost estimate row (always shown for AI nodes)
  h += `
    <div class="ai-node-cost-row">
      <span>Est. cost per 1,000 contacts</span>
      <span>${getAINodeCostEstimate(node.type)}</span>
    </div>
  `;

  // Test button (always shown for AI nodes)
  h += `
    <div class="ai-section-header">${_ico('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>')} Test This Node</div>
    <div class="form-group">
      <div class="form-inline-actions">
        <button class="btn-ai-test" onclick="testAINode('${node.id}')">
          ${_ico('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>')} Run with sample contact
        </button>
        <button class="btn btn-sm btn-ghost" onclick="startFallbackConnection('${node.id}')">+ Fallback path</button>
      </div>
      <div id="ai-test-result-${node.id}"></div>
    </div>
  `;

  return h;
}

function getAINodeCostEstimate(nodeType) {
  const costs = {
    ai_branch: '$0.10', ai_classifier: '$0.10', ai_scorer: '$0.10',
    ai_personalize: '$0.30', ai_content_eval: '$0.30', ai_translate: '$0.30',
    ai_agent: '$0.50', ai_skill: '$0.15', ai_enrich: '$0.15', ai_sentiment: '$0.10',
    ai_next_best_action: '$0.15', ai_wait: '$0.05', ai_hitl: '$0.00',
    ai_guardrail: '$0.10', confidence_gate: '$0.00', prompt_shield: '$0.00',
    context_store: '$0.00', context_recall: '$0.00', outcome_tracker: '$0.00', ab_shadow: '$0.20'
  };
  return costs[nodeType] || '$0.10';
}

function getUpstreamAIVariables(nodeId) {
  const vars = [];
  const visited = new Set();
  const queue = [nodeId];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const upstream = connections.filter(c => c.to === id).map(c => c.from);
    upstream.forEach(fromId => {
      const n = nodes.find(x => x.id === fromId);
      if (!n) return;
      if (n.category === 'ai' && n.config.output_variable) {
        vars.push({ ref: `{{${n.id}.output}}`, description: `${n.name} output`, nodeId: n.id });
      }
      queue.push(fromId);
    });
  }
  return vars;
}

async function testAINode(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;
  const resultEl = document.getElementById(`ai-test-result-${nodeId}`);
  if (resultEl) {
    resultEl.innerHTML = `<div class="ai-test-result"><div class="ai-test-result-header"><span>Testing...</span></div><pre>Running AI node with sample contact...</pre></div>`;
  }
  try {
    const response = await fetch('/api/ai-nodes/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: node.id, nodeType: node.type, config: node.config, workflowId: campaignId })
    });
    const data = await response.json();
    if (resultEl) {
      const isMock = !data.model || data.model === 'mock';
      resultEl.innerHTML = `
        <div class="ai-test-result">
          <div class="ai-test-result-header">
            <span>${isMock ? 'Mock Output' : 'AI Output'} ${isMock ? '(OpenAI not configured)' : `— ${data.model}`}</span>
            <span class="ai-model-badge">${isMock ? 'Mock' : data.model || 'AI'}</span>
          </div>
          <pre>${JSON.stringify(data.output, null, 2)}</pre>
          ${data.explanation ? `<div class="ai-explanation">${data.explanation}</div>` : ''}
          ${data.cost_estimate_usd ? `<div class="ai-node-cost-row"><span>This test cost</span><span>$${data.cost_estimate_usd.toFixed(6)}</span></div>` : ''}
        </div>
      `;
    }
  } catch(e) {
    if (resultEl) {
      resultEl.innerHTML = `<div class="ai-test-result"><pre style="color:red">Error: ${e.message}</pre></div>`;
    }
  }
}

function startFallbackConnection(nodeId) {
  pendingConnectionMeta = { label: 'Fallback', transitionId: 'fallback', isFallback: true };
  startConnection(nodeId);
  showToast('Click a node to connect the fallback path', 'info');
}

function insertVariableRef(varRef) {
  const activeInput = document.activeElement;
  if (activeInput && (activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA')) {
    const start = activeInput.selectionStart;
    const end = activeInput.selectionEnd;
    const val = activeInput.value;
    activeInput.value = val.slice(0, start) + varRef + val.slice(end);
    activeInput.dispatchEvent(new Event('change'));
    showToast(`Inserted ${varRef}`, 'success');
  } else {
    navigator.clipboard.writeText(varRef).then(() => showToast(`Copied ${varRef} to clipboard`, 'success'));
  }
}

async function viewPendingHITL(nodeId) {
  try {
    const response = await fetch(`/api/ai-nodes/hitl/pending?workflow_id=${campaignId}`);
    const data = await response.json();
    const approvals = (data.approvals || []).filter(a => a.node_id === nodeId);
    const overlay = document.createElement('div');
    overlay.className = 'prop-logs-overlay';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="prop-logs-modal">
        <div class="prop-logs-header">
          <span>Pending Reviews — Human in the Loop</span>
          <button onclick="this.closest('.prop-logs-overlay').remove()">&times;</button>
        </div>
        <div class="prop-logs-body">
          ${approvals.length === 0 ? '<p class="prop-logs-empty">No pending reviews.</p>' : `
            <table class="prop-logs-table">
              <thead><tr><th>Contact</th><th>Question</th><th>AI Suggests</th><th>Action</th></tr></thead>
              <tbody>
                ${approvals.map(a => `
                  <tr>
                    <td>${a.contact_id || '—'}</td>
                    <td>${a.question || '—'}</td>
                    <td>${a.ai_recommendation || '—'}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="decideHITL(${a.id}, 'approved', this.closest('.prop-logs-overlay'))">Approve</button>
                      <button class="btn btn-sm btn-ghost" onclick="decideHITL(${a.id}, 'rejected', this.closest('.prop-logs-overlay'))">Reject</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } catch(e) {
    showToast('Could not load pending reviews', 'error');
  }
}

async function decideHITL(approvalId, decision, overlayEl) {
  try {
    await fetch(`/api/ai-nodes/hitl/${approvalId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decided_by: 'canvas_user' })
    });
    showToast(`Review ${decision}`, 'success');
    if (overlayEl) overlayEl.remove();
  } catch(e) {
    showToast('Could not submit decision', 'error');
  }
}

// Load agents and skills into reference data for AI node property panels
async function loadAIReferenceData() {
  try {
    const [agentsRes, skillsRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/agent-skills')
    ]);
    const agentsData = await agentsRes.json();
    const skillsData = await skillsRes.json();
    window._referenceAgents = agentsData.agents || agentsData || [];
    window._referenceSkills = skillsData.skills || skillsData || [];
  } catch(e) {
    window._referenceAgents = [];
    window._referenceSkills = [];
  }
}

// Load AI reference data on init (add to DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  loadAIReferenceData();
});
