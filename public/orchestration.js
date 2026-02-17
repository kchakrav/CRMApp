// Orchestration Canvas JavaScript
console.log('🚀 ORCHESTRATION.JS LOADED!');
const API_BASE = '/api';

// Icon helper function for inline SVG icons
const _ico = (p) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

// State
let campaignId = null;
let isWorkflowContext = false;
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
  waitingNodeId: null
};
let runtimeByNode = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 DOM Content Loaded - Starting initialization');
  
  // Get campaign/workflow ID from URL (support both parameter names)
  const params = new URLSearchParams(window.location.search);
  const workflowId = params.get('workflowId');
  isWorkflowContext = !!workflowId;
  campaignId = parseInt(params.get('campaignId') || workflowId);
  
  console.log('🆔 Workflow ID from URL:', campaignId);
  
  if (!campaignId) {
    console.error('❌ No workflow ID in URL parameters');
    showToast('No workflow ID specified', 'error');
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
  // Load orchestration
  await loadOrchestration();
  
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
    category: 'Channels',
    icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
    items: [
      { type: 'email', category: 'channels', name: 'Email', desc: 'Send email', icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') },
      { type: 'sms', category: 'channels', name: 'SMS', desc: 'Send SMS', icon: _ico('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') },
      { type: 'push', category: 'channels', name: 'Push', desc: 'Push notification', icon: _ico('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>') },
      { type: 'direct_mail', category: 'channels', name: 'Direct Mail', desc: 'Physical delivery', icon: _ico('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') },
      { type: 'webhook', category: 'channels', name: 'Webhook', desc: 'HTTP callback', icon: _ico('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>') }
    ]
  },
  // Actions, Data Management, Analytics removed per requirements
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
    // Load segments
    const segmentsResponse = await fetch(`${API_BASE}/segments`);
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
    const response = await fetch(`${API_BASE}/orchestration/${campaignId}`);
    const data = await response.json();
    
    nodes = data.nodes || [];
    connections = data.connections || [];
    canvasState = data.canvas_state || { zoom: 1, pan: { x: 0, y: 0 } };
    syncNodeIdCounter();

    if (nodes.length === 0) {
      // Always start with an Entry activity on empty canvas
      addNode('entry', 'flow', 'Entry Point', _ico('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'), 80, 120);
      showToast('Added Entry activity to start the flow', 'info');
    } else {
      renderCanvas();
    }
    
    applyPendingWorkflowSegmentSelection();
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading orchestration', 'error');
    console.error(error);
  }
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
  const { showToastMessage = true } = options;
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/orchestration/${campaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes,
        connections,
        canvas_state: canvasState
      })
    });
    
    const result = await response.json();
    hideLoading();
    if (showToastMessage) {
      showToast('Orchestration saved successfully', 'success');
    }
    await loadCampaignInfo();
    return true;
  } catch (error) {
    hideLoading();
    if (showToastMessage) {
      showToast('Error saving orchestration', 'error');
    }
    console.error(error);
    return false;
  }
}

// Execute orchestration
async function executeOrchestration() {
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
  
  // Run the visual workflow so nodes show executing → complete on the canvas
  startWorkflow();
  
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
  } catch (error) {
    showToast('Error executing orchestration', 'error');
    console.error(error);
  }
}

// Setup event listeners
function setupEventListeners() {
  const canvas = document.getElementById('canvas');
  const content = document.getElementById('canvas-content');
  
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
  document.getElementById('activity-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.activity-item');
    
    items.forEach(item => {
      const name = item.querySelector('.activity-name').textContent.toLowerCase();
      const desc = (item.getAttribute('title') || '').toLowerCase();
      const matches = name.includes(searchTerm) || desc.includes(searchTerm);
      item.style.display = matches ? 'inline-flex' : 'none';
    });
  });
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

  activityItems.forEach((item, index) => {
    console.log(`  📌 Setting up activity ${index + 1}:`, item.dataset.type);
    
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
  
  console.log('➕ Adding node:', node);
  console.log('📊 Nodes array before:', nodes.length);
  
  pushUndoState();
  nodes.push(node);
  
  console.log('📊 Nodes array after:', nodes.length);
  console.log('🔄 Calling renderCanvas...');
  
  renderCanvas();
  showToast(`Added ${name} node`, 'success');
  
  console.log('✅ Node add complete');
  
  if (returnIdOnly) {
    return node.id;
  }
}

function getNodeDimensions(node) {
  const el = document.querySelector(`[data-node-id="${node.id}"]`);
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
  
  console.log('🎨 renderCanvas called');
  console.log('📍 Canvas element:', canvas);
  console.log('📊 Total nodes to render:', nodes.length);
  
  if (!canvas || !content) return;
  
  // Clear existing nodes (keep only canvas content)
  const existingNodes = content.querySelectorAll('.canvas-node');
  console.log('🧹 Removing', existingNodes.length, 'existing nodes');
  existingNodes.forEach(node => node.remove());
  
  // Render nodes
  nodes.forEach((node, index) => {
    console.log(`🎨 Rendering node ${index + 1}/${nodes.length}:`, node);
    const nodeEl = createNodeElement(node);
    console.log('📦 Created element:', nodeEl);
    content.appendChild(nodeEl);
    console.log('✅ Appended to canvas');
  });
  
  console.log('🎨 renderCanvas complete, checking canvas children...');
  console.log('👶 Canvas children count:', canvas.children.length);
  
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
    // Never hide the entire sidebar — AI Assistant should always be visible
    sidebar.classList.remove('all-hidden');
  }
}

function fitToView() {
  const canvas = document.getElementById('canvas');
  if (!canvas || nodes.length === 0) {
    showToast('Add activities to fit the view', 'info');
    return;
  }
  const wrapper = document.querySelector('.canvas-wrapper');
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
  const boundsWidth = maxX - minX + padding * 2;
  const boundsHeight = maxY - minY + padding * 2;
  const viewWidth = (wrapper?.clientWidth || canvas.clientWidth || 1);
  const viewHeight = (wrapper?.clientHeight || canvas.clientHeight || 1);
  const scale = Math.min(viewWidth / boundsWidth, viewHeight / boundsHeight, 1);
  canvasState.zoom = scale;
  const centerX = (minX + maxX) / 2 * scale;
  const centerY = (minY + maxY) / 2 * scale;
  canvasState.pan.x = viewWidth / 2 - centerX;
  canvasState.pan.y = viewHeight / 2 - centerY;
  applyCanvasTransform();
  showToast('Fit to view applied', 'success');
}

// Create node element
function createNodeElement(node) {
  const nodeEl = document.createElement('div');
  nodeEl.className = 'canvas-node';
  nodeEl.dataset.nodeId = node.id;
  nodeEl.dataset.category = node.category;
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
        <div><strong>Jump to:</strong> ${targetName}</div>
        ${!isMissing && node.config?.target_node_id ? `<button class="btn btn-sm btn-ghost" type="button" onclick="focusNode('${node.config.target_node_id}')">Go to target</button>` : ''}
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
        <div><strong>Waiting for:</strong> ${signalName || 'Unset'}</div>
        ${badge}
      </div>
    `;
  } else if (Object.keys(node.config).length > 0) {
    configHtml = '<div class="node-config">';
    for (const [key, value] of Object.entries(node.config)) {
      configHtml += `<div><strong>${key}:</strong> ${value}</div>`;
    }
    configHtml += '</div>';
  }
  
  const transitions = node.type === 'split' ? (node.config.transitions || []) : [];
  const splitOutputs = transitions.length
    ? transitions.map((t, idx) => {
        const position = transitions.length > 1 ? 30 + (40 * idx) / (transitions.length - 1) : 50;
        return `<div class="connection-point output split-output" data-transition-id="${t.id}" style="top:${position}%"></div>`;
      }).join('')
    : '';

  const description = getNodeDescription(node);
  const stateBadge = node.disabled
    ? '<span class="node-status node-status-disabled">disabled</span>'
    : node.paused
      ? '<span class="node-status node-status-paused">paused</span>'
      : (runtime.status ? `<span class="node-status ${runtime.status}">${runtime.status}</span>` : '');

  nodeEl.innerHTML = `
    <div class="node-header">
      <span class="node-icon">${node.icon}</span>
      <span class="node-title" title="${node.name}">${node.name}</span>
      ${stateBadge}
      <button class="node-menu" onclick="selectNodeById('${node.id}')" title="Properties">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
    ${description ? `<div class="node-body">${description}</div>` : ''}
    ${configHtml}
    <div class="connection-point input" data-node-id="${node.id}" data-type="input"></div>
    ${node.type === 'split' ? `<div class="split-output-points">${splitOutputs}</div>` : `<div class="connection-point output" data-node-id="${node.id}" data-type="output"></div>`}
  `;
  
  // Make draggable
  makeNodeDraggable(nodeEl, node);
  
  // Observe size changes to keep connections aligned
  if (!nodeResizeObserver && window.ResizeObserver) {
    nodeResizeObserver = new ResizeObserver(() => scheduleRenderConnections());
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
    javascript: 'Run script'
  };
  
  if (node.type === 'jump') {
    return `Jump to: ${getJumpTargetLabel(node)}`;
  }
  if (node.type === 'external_signal') {
    const signalName = node.config?.signal_key || node.config?.signal || 'Unset';
    return `Waiting for: ${signalName}`;
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
    transition_id: pendingConnectionMeta?.transitionId || null
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
  
  // Add arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
    </marker>
    <marker id="arrowhead-jump" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
    </marker>
  `;
  svg.appendChild(defs);
  
  connections.forEach(conn => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return;
    
    // Use a standard node size (we know nodes are roughly 180-250px wide, ~80-90px tall)
    // Get actual rendered dimensions
    const fromEl = document.querySelector(`[data-node-id="${conn.from}"]`);
    const toEl = document.querySelector(`[data-node-id="${conn.to}"]`);
    
    if (!fromEl || !toEl) return;
    
    const fromWidth = fromEl.offsetWidth;
    const fromHeight = fromEl.offsetHeight;
    const toWidth = toEl.offsetWidth;
    const toHeight = toEl.offsetHeight;
    
    // Connection points are at:
    // - Output: right edge of node (node.x + width), vertically centered (node.y + height/2)
    // - Input: left edge of node (node.x), vertically centered (node.y + height/2)
    let y1 = fromNode.position.y + (fromHeight / 2);
    if (fromNode.type === 'split' && conn.transition_id) {
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
    
    path.setAttribute('d', curve);
    path.setAttribute('stroke', '#6366f1');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('class', `connection-line${selectedConnectionId === conn.id ? ' selected' : ''}`);
    path.dataset.connectionId = conn.id;
    
    // Click to select
    path.style.cursor = 'pointer';
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      selectConnection(conn.id);
    });
    
    svg.appendChild(path);

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
    const mid = path.getPointAtLength(length / 2);
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
    
    // Label on connection
    const fromRuntime = runtimeByNode[conn.from];
    const connLabel = conn.label || 'Result';
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('class', 'connection-result-label');
    const text = (fromRuntime && fromRuntime.count !== undefined && fromRuntime.seconds !== undefined)
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
  nodes.filter(n => n.type === 'jump' && n.config?.target_node_id).forEach(node => {
    const target = nodes.find(n => n.id === node.config.target_node_id);
    if (!target) return;
    const fromEl = document.querySelector(`[data-node-id="${node.id}"]`);
    const toEl = document.querySelector(`[data-node-id="${target.id}"]`);
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

function focusNode(nodeId) {
  const node = getNodeById(nodeId);
  if (!node) return;
  const canvas = document.getElementById('canvas');
  const wrapper = document.getElementById('canvas-wrapper') || canvas;
  if (!canvas || !wrapper) return;
  const { width, height } = getNodeDimensions(node);
  const centerX = node.position.x + width / 2;
  const centerY = node.position.y + height / 2;
  const viewWidth = wrapper.clientWidth || canvas.clientWidth || 1;
  const viewHeight = wrapper.clientHeight || canvas.clientHeight || 1;
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
  
  const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
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
  
  assignRuntimeCounts(executionState.order);
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
      html += `
        <div class="form-group">
          <label class="form-label">Select Segment</label>
          <select class="form-input" onchange="updateNodeConfig('segment_id', this.value)">
            <option value="">Choose a segment...</option>
            ${referenceData.segments.map(seg => `
              <option value="${seg.id}" ${node.config.segment_id == seg.id ? 'selected' : ''}>
                ${seg.name} (${seg.contact_count || 0} contacts)
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
    html += `
      <div class="form-group">
        <label class="form-label">Select Segment</label>
        <select class="form-input" onchange="updateNodeConfig('segment_id', this.value)">
          <option value="">Choose a segment...</option>
          ${referenceData.segments.map(seg => `
            <option value="${seg.id}" ${node.config.segment_id == seg.id ? 'selected' : ''}>
              ${seg.name} (${seg.contact_count || 0} contacts)
            </option>
          `).join('')}
        </select>
        <div class="form-help">Filter contacts by this segment</div>
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
  const sidebar = document.getElementById('right-sidebar');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  if (sidebar) sidebar.classList.toggle('ai-collapsed', panel.classList.contains('collapsed'));
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
  
  const name = prompt(`Enter ${channel.toUpperCase()} delivery name:`);
  if (!name) return;
  
  try {
    showLoading();
    const payload = {
      name,
      channel: channel.toLowerCase() === 'sms' ? 'SMS' : channel.toLowerCase() === 'push' ? 'Push' : 'Email',
      status: 'draft',
      subject: node.config.subject || '',
      content: node.config.content || ''
    };
    
    const response = await fetch(`${API_BASE}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    referenceData.deliveries.push(data);
    node.config.delivery_id = data.id;
    showToast('Delivery created and selected', 'success');
    renderCanvas();
    showNodeProperties(node);
  } catch (error) {
    showToast(`Failed to create delivery: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
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
    renderCanvas();
    selectNode(node);
    requestAnimationFrame(() => {
      focusNode(node);
    });
    localStorage.removeItem('workflowSegmentSelection');
  } catch (error) {
    // ignore
  }
}

function focusNode(node) {
  const canvas = document.getElementById('canvas');
  const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
  if (!canvas || !nodeEl) return;
  const targetLeft = Math.max(0, nodeEl.offsetLeft + (nodeEl.offsetWidth / 2) - (canvas.clientWidth / 2));
  const targetTop = Math.max(0, nodeEl.offsetTop + (nodeEl.offsetHeight / 2) - (canvas.clientHeight / 2));
  canvas.scrollTo({ left: targetLeft, top: targetTop, behavior: 'smooth' });
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
  content.style.transform = `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`;
  if (canvas) {
    canvas.style.backgroundPosition = `${canvasState.pan.x}px ${canvasState.pan.y}px`;
    canvas.style.backgroundSize = `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`;
  }
  scheduleRenderConnections();
}

function autoLayout() {
  if (nodes.length === 0) return;
  pushUndoState();
  
  // Improved auto-layout: arrange nodes by depth, reduce overlap
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
  const startNodes = entryNodes.length ? entryNodes : nodes.filter(n => (incoming.get(n.id) || []).length === 0);
  
  const depth = new Map();
  const queue = [];
  startNodes.forEach(n => {
    depth.set(n.id, 0);
    queue.push(n.id);
  });
  
  while (queue.length) {
    const id = queue.shift();
    const d = depth.get(id) || 0;
    (outgoing.get(id) || []).forEach(childId => {
      const nextDepth = Math.max(depth.get(childId) ?? 0, d + 1);
      if (!depth.has(childId) || nextDepth > depth.get(childId)) {
        depth.set(childId, nextDepth);
        queue.push(childId);
      }
    });
  }
  
  // Group by depth
  const columns = new Map();
  nodes.forEach(n => {
    const d = depth.get(n.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(n);
  });
  
  const columnGap = 100;
  const rowGap = 80;
  const startX = 140;
  const startY = 80;
  const depthOrder = Array.from(columns.keys()).sort((a, b) => a - b);
  
  const columnWidths = new Map();
  depthOrder.forEach(d => {
    const columnNodes = columns.get(d);
    const maxWidth = Math.max(...columnNodes.map(n => getNodeDimensions(n).width));
    columnWidths.set(d, Math.max(maxWidth, DEFAULT_NODE_SIZE.width));
  });
  
  let currentX = startX;
  depthOrder.forEach((d, colIndex) => {
    const columnNodes = columns.get(d);
    columnNodes.sort((a, b) => a.id.localeCompare(b.id));
    let currentY = startY;
    columnNodes.forEach(node => {
      const { height } = getNodeDimensions(node);
      node.position = { x: currentX, y: currentY };
      currentY += height + rowGap;
    });
    const colWidth = columnWidths.get(d) || DEFAULT_NODE_SIZE.width;
    currentX += colWidth + columnGap;
  });
  
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
  // Save current state to redo stack
  _redoStack.push(_snapshotState());
  // Restore previous state
  const prev = JSON.parse(_undoStack.pop());
  nodes = prev.nodes;
  connections = prev.connections;
  nodeIdCounter = prev.nodeIdCounter;
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
  // Save current state to undo stack
  _undoStack.push(_snapshotState());
  // Restore next state
  const next = JSON.parse(_redoStack.pop());
  nodes = next.nodes;
  connections = next.connections;
  nodeIdCounter = next.nodeIdCounter;
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
  const isFlowRequest = (/create|build|design|suggest|make|generate|add/i.test(lower) &&
    /flow|workflow|campaign|journey|sequence|automation|series|welcome|cart|winback|abandon|onboard|nurture|drip|birthday|promo|sale|vip|loyalty/i.test(lower));

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

// Handle chat-based flow creation through the AI endpoint
async function _handleAIChatFlowRequest(message, chat) {
  const thinkingId = 'ai-chat-thinking-' + Date.now();
  chat.innerHTML += '<div class="ai-message assistant" id="' + thinkingId + '"><em>Designing your flow...</em></div>';
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch(API_BASE + '/ai/suggest-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: message, description: '' })
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
  
  return 'I can help with orchestration design, best practices, timing, segmentation, and optimization.<br><br>To generate a flow, just describe what you need, e.g.:<br>• <em>"Create a welcome email series"</em><br>• <em>"Build a cart abandonment flow"</em><br>• <em>"Design a VIP loyalty campaign"</em><br><br>Or click <strong>Suggest Flow</strong> above to auto-generate based on this workflow\'s name.';
}

// Navigation
function goBack() {
  window.location.href = '/?view=workflows';
}

// Utility functions
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
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
