// Shared back-button chevron SVG
const BACK_CHEVRON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Helper function for Lucide-style SVG icons
const _afIco = (p, s) => '<svg width="' + (s||16) + '" height="' + (s||16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

// ============================================
// NAVIGATION SECTION TOGGLE (Adobe-style)
// ============================================

function toggleNavSection(header) {
  const section = header.parentElement;
  section.classList.toggle('collapsed');
}

// ============================================
// NEW ADOBE CAMPAIGN VIEWS
// ============================================

// Explorer View
async function loadExplorer() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>')} Explorer</h3>
          <div class="card-subtitle">Browse and search all system entities</div>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-400);">
            <div class="explorer-card" onclick="navigateTo('contacts', 'list')">
              <div class="explorer-icon">${_afIco('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}</div>
              <div class="explorer-title">Profiles</div>
              <div class="explorer-desc">Contact database</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('workflows', 'list')">
              <div class="explorer-icon">${_afIco('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>')}</div>
              <div class="explorer-title">Workflows</div>
              <div class="explorer-desc">Campaign workflows</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('deliveries', 'list')">
              <div class="explorer-icon">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')}</div>
              <div class="explorer-title">Deliveries</div>
              <div class="explorer-desc">Message deliveries</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('segments', 'list')">
              <div class="explorer-icon">${_afIco('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>')}</div>
              <div class="explorer-title">Segments</div>
              <div class="explorer-desc">Audience segments</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('content-templates', 'list')">
              <div class="explorer-icon">${_afIco('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>')}</div>
              <div class="explorer-title">Templates</div>
              <div class="explorer-desc">Content templates</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('assets', 'list')">
              <div class="explorer-icon">${_afIco('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>')}</div>
              <div class="explorer-title">Asset Library</div>
              <div class="explorer-desc">Images and files</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('landing-pages', 'list')">
              <div class="explorer-icon">${_afIco('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>')}</div>
              <div class="explorer-title">Landing Pages</div>
              <div class="explorer-desc">Web landing pages</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('brands', 'list')">
              <div class="explorer-icon">${_afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>')}</div>
              <div class="explorer-title">Brands</div>
              <div class="explorer-desc">Brand management</div>
            </div>
            <div class="explorer-card" onclick="navigateTo('subscription-services', 'list')">
              <div class="explorer-icon">${_afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 20)}</div>
              <div class="explorer-title">Subscriptions</div>
              <div class="explorer-desc">Service subscriptions</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Explorer');
  } finally {
    hideLoading();
  }
}

// Deliveries View
let currentDeliveriesTab = 'All';
let deliveriesSearch = '';
let deliveriesStatus = 'all';

function setDeliveriesTab(tabLabel) {
  currentDeliveriesTab = tabLabel;
  loadDeliveries();
}

function clearDeliveriesFilters() {
  currentDeliveriesTab = 'All';
  deliveriesSearch = '';
  deliveriesStatus = 'all';
  loadDeliveries();
}

function clearDeliveriesFilterTag(key) {
  if (key === 'channel') {
    currentDeliveriesTab = 'All';
  }
  if (key === 'search') {
    deliveriesSearch = '';
  }
  if (key === 'status') {
    deliveriesStatus = 'all';
  }
  loadDeliveries();
}

function updateDeliveriesStatus(value) {
  deliveriesStatus = value || 'all';
  loadDeliveries();
}

function updateDeliveriesSearch(value) {
  deliveriesSearch = value || '';
  if (typeof debounce === 'function') {
    debounce('deliveriesSearch', () => loadDeliveries(), 400);
  } else {
    loadDeliveries();
  }
}

async function loadDeliveries() {
  showLoading();
  try {
    const response = await fetch('/api/deliveries');
    const data = await response.json();
    const deliveries = data.deliveries || [];
    const workflowsResp = await fetch('/api/workflows');
    const workflowsData = await workflowsResp.json();
    const workflows = workflowsData.workflows || workflowsData || [];
    
    // Apply tab filter
    let filteredDeliveries = deliveries;
    if (currentDeliveriesTab && currentDeliveriesTab !== 'All') {
      filteredDeliveries = deliveries.filter(d => d.channel === currentDeliveriesTab);
    }
    
    if (deliveriesSearch) {
      const s = deliveriesSearch.toLowerCase();
      filteredDeliveries = filteredDeliveries.filter(d => (d.name || '').toLowerCase().includes(s));
    }
    
    if (deliveriesStatus !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(d => d.status === deliveriesStatus);
    }

    const filterTags = [];
    if (currentDeliveriesTab !== 'All') {
      filterTags.push({ key: 'channel', label: 'Channel', value: currentDeliveriesTab });
    }
    if (deliveriesSearch) {
      filterTags.push({ key: 'search', label: 'Search', value: deliveriesSearch });
    }
    if (deliveriesStatus !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: deliveriesStatus });
    }
    
    // Apply sorting
    const sortedDeliveries = applySorting(filteredDeliveries, currentTableSort.column || 'id');
    
    const deliveryUsage = new Map();
    const ensureDeliveryUsage = (id) => {
      if (!deliveryUsage.has(id)) {
        deliveryUsage.set(id, { workflows: [] });
      }
      return deliveryUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    workflows.forEach(w => {
      const nodes = w.orchestration?.nodes || [];
      nodes.forEach(node => {
        if (['email', 'sms', 'push'].includes(node.type) && node.config?.delivery_id) {
          const usage = ensureDeliveryUsage(node.config.delivery_id);
          addUniqueUsage(usage.workflows, { id: w.id, name: w.name });
        }
      });
    });
    
    // Generate Adobe Campaign style table rows
    const tableRows = sortedDeliveries.map(d => {
      const statusMap = {
        'completed': 'stopped',
        'in-progress': 'in-progress',
        'draft': 'draft',
        'failed': 'stopped',
        'scheduled': 'paused',
        'paused': 'paused',
        'stopped': 'stopped'
      };
      
      const channelIcon = 
        d.channel === 'Email' ? _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') :
        d.channel === 'SMS' ? _afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') : _afIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>');
      
      const actions = [
        {icon: _afIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 14), label: 'View Report', onclick: `showDeliveryReport(${d.id})`},
        {icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editDelivery(${d.id})`},
        {icon: _afIco('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 14), label: 'Duplicate', onclick: `duplicateDelivery(${d.id})`},
        {divider: true},
        {icon: _afIco('<polygon points="6 3 20 12 6 21 6 3"/>', 14), label: 'Send now', onclick: `sendDelivery(${d.id})`},
        ...(d.approval_required && !d.approved_at ? [{icon: _afIco('<path d="M20 6 9 17l-5-5"/>', 14), label: 'Approve', onclick: `approveDelivery(${d.id})`}] : []),
        {icon: _afIco('<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>', 14), label: 'Pause', onclick: `pauseDelivery(${d.id})`},
        {icon: _afIco('<polygon points="6 3 20 12 6 21 6 3"/>', 14), label: 'Resume', onclick: `resumeDelivery(${d.id})`},
        {icon: _afIco('<rect width="14" height="14" x="5" y="5" rx="2"/>', 14), label: 'Stop', onclick: `stopDelivery(${d.id})`},
        {divider: true},
        {icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteDelivery(${d.id})`, danger: true}
      ];
      
      const usage = deliveryUsage.get(d.id) || { workflows: [] };
      const usedInItems = [
        ...usage.workflows.map(w => ({ label: `Workflow: ${w.name}`, onclick: `navigateTo('workflows', 'edit', ${w.id})` }))
      ];
      
      const draftMeta = d.status === 'draft' && d.last_saved_step ? `<div class="table-subtext">Draft • Step ${d.last_saved_step}</div>` : '';
      return `
        <tr>
          <td data-column-id="name">${createTableLink(`${channelIcon} ${d.name}`, `editDelivery(${d.id})`)}${draftMeta}</td>
          <td data-column-id="status">${createStatusIndicator(statusMap[d.status] || 'draft', d.status)}</td>
          <td data-column-id="channel">${d.channel}</td>
          <td data-column-id="sent">${(d.sent || 0).toLocaleString()}</td>
          <td data-column-id="delivered">${(d.delivered || 0).toLocaleString()}</td>
          <td data-column-id="opens">${d.opens > 0 ? d.opens.toLocaleString() : '-'}</td>
          <td data-column-id="clicks">${d.clicks > 0 ? d.clicks.toLocaleString() : '-'}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="created_by">${d.created_by || 'System'}</td>
          <td data-column-id="sent_at">${d.sent_at ? new Date(d.sent_at).toLocaleString() : (d.scheduled_at ? `Scheduled: ${new Date(d.scheduled_at).toLocaleString()}` : 'Not sent')}</td>
          <td>${createActionMenu(d.id, actions)}</td>
        </tr>
      `;
    }).join('');
    
    const columns = [
      { id: 'name', label: 'Delivery' },
      { id: 'status', label: 'Status' },
      { id: 'channel', label: 'Channel' },
      { id: 'sent', label: 'Sent' },
      { id: 'delivered', label: 'Delivered' },
      { id: 'opens', label: 'Opens' },
      { id: 'clicks', label: 'Clicks' },
      { id: 'used_in', label: 'Used in' },
      { id: 'created_by', label: 'Created by' },
      { id: 'sent_at', label: 'Sent date' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')} Deliveries</h3>
          <button class="btn btn-primary" onclick="showDeliveryForm()">+ Create Delivery</button>
        </div>
        
        ${createTableToolbar({
          tabs: ['All', 'Email', 'SMS', 'Push'],
          activeTab: currentDeliveriesTab,
          resultCount: filteredDeliveries.length,
          totalCount: deliveries.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'deliveries',
          showSearch: true,
          searchPlaceholder: 'Search deliveries...',
          searchValue: deliveriesSearch || '',
          onSearch: 'updateDeliveriesSearch(this.value)',
          filterTags,
          onClearTag: 'clearDeliveriesFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Status',
              value: deliveriesStatus,
              onChange: 'updateDeliveriesStatus(this.value)',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in-progress', label: 'In progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'paused', label: 'Paused' },
                { value: 'stopped', label: 'Stopped' },
                { value: 'failed', label: 'Failed' }
              ]
            }
          ]
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="deliveries">
            <thead>
              <tr>
                ${createSortableHeader('name', 'Delivery', currentTableSort)}
                ${createSortableHeader('status', 'Status', currentTableSort)}
                ${createSortableHeader('channel', 'Channel', currentTableSort)}
                ${createSortableHeader('sent', 'Sent', currentTableSort)}
                ${createSortableHeader('delivered', 'Delivered', currentTableSort)}
                <th data-column-id="opens">Opens</th>
                <th data-column-id="clicks">Clicks</th>
                <th data-column-id="used_in">Used in</th>
                ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                ${createSortableHeader('sent_at', 'Sent date', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #6B7280;">No deliveries found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('deliveries');
    if (window.pendingDeliveryId) {
      const id = window.pendingDeliveryId;
      window.pendingDeliveryId = null;
      setTimeout(() => editDelivery(id), 0);
    }
  } catch (error) {
    showError('Failed to load Deliveries');
  } finally {
    hideLoading();
  }
}

const deliverySteps = [
  { id: 1, label: 'Properties' },
  { id: 2, label: 'Audience/Segments' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Preview & Proof' },
  { id: 5, label: 'Publish' }
];

let deliveryWizard = {
  currentStep: 1,
  deliveryId: null,
  data: {},
  blocks: [],
  blocksByVariant: { A: [], B: [] },
  currentVariant: 'A',
  lists: { segments: [], audiences: [], templates: [], assets: [] }
};

async function showDeliveryForm(delivery = null) {
  initDeliveryWizard(delivery);
  await loadDeliveryLists();
  renderDeliveryWizard();
}

function initDeliveryWizard(delivery) {
  const draftState = delivery?.draft_state && typeof delivery.draft_state === 'object'
    ? delivery.draft_state
    : {};
  deliveryWizard.deliveryId = delivery?.id || null;
  deliveryWizard.currentStep = delivery?.last_saved_step || delivery?.wizard_step || 1;
  const deliveryBlocks = delivery?.content_blocks;
  const draftBlocks = draftState.content_blocks;
  deliveryWizard.blocks = (deliveryBlocks && (Array.isArray(deliveryBlocks) || typeof deliveryBlocks === 'object'))
    ? deliveryBlocks
    : (draftBlocks || []);
  const htmlOutput = delivery?.html_output || draftState.html_output || '';
  const proofEmails = delivery?.proof_emails || draftState.proof_emails || [];
  deliveryWizard.data = {
    name: delivery?.name || draftState.name || '',
    channel: delivery?.channel || draftState.channel || 'Email',
    status: delivery?.status || draftState.status || 'draft',
    scheduled_at: delivery?.scheduled_at || draftState.scheduled_at || null,
    audience_id: delivery?.audience_id || draftState.audience_id || '',
    segment_id: delivery?.segment_id || draftState.segment_id || '',
    approval_required: delivery?.approval_required ?? draftState.approval_required ?? false,
    subject: delivery?.subject || draftState.subject || '',
    preheader: delivery?.preheader || draftState.preheader || '',
    document_title: delivery?.document_title || draftState.document_title || '',
    document_language: delivery?.document_language || draftState.document_language || '',
    content: delivery?.content || draftState.content || '',
    html_output: htmlOutput,
    proof_emails: Array.isArray(proofEmails) ? proofEmails : [],
    ab_test_enabled: delivery?.ab_test_enabled ?? draftState.ab_test_enabled ?? false,
    ab_split_pct: delivery?.ab_split_pct || draftState.ab_split_pct || 50,
    ab_winner_rule: delivery?.ab_winner_rule || draftState.ab_winner_rule || 'open_rate',
    ab_weighted_metrics: delivery?.ab_weighted_metrics || draftState.ab_weighted_metrics || [],
    ab_guardrails: delivery?.ab_guardrails || draftState.ab_guardrails || []
  };
  applyPendingSegmentSelection();
  applyPendingDeliveryStep();
}

async function loadDeliveryLists() {
  try {
    const segRes = await fetch('/api/segments');
    const segData = await segRes.json();
    deliveryWizard.lists.segments = segData.segments || segData || [];
    const audRes = await fetch('/api/audiences');
    const audData = await audRes.json();
    deliveryWizard.lists.audiences = audData.audiences || audData || [];
    const tplRes = await fetch('/api/email-templates');
    const tplData = await tplRes.json();
    deliveryWizard.lists.templates = tplData.templates || [];
  } catch (error) {
    deliveryWizard.lists.segments = [];
    deliveryWizard.lists.audiences = [];
    deliveryWizard.lists.templates = [];
  }
}

function renderDeliveryWizard() {
  const stepper = deliverySteps.map(step => `
    <div class="wizard-step ${step.id === deliveryWizard.currentStep ? 'active' : step.id < deliveryWizard.currentStep ? 'completed' : ''}">
      <div class="wizard-step-index">${step.id}</div>
      <div class="wizard-step-label">${step.label}</div>
    </div>
  `).join('');
  
  const content = `
    <div class="form-container">
      <div class="wizard-header">
        <div class="wizard-title">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')} Delivery</div>
        <div class="wizard-actions">
          <button class="btn btn-secondary" onclick="saveDeliveryDraft()">Save Draft</button>
          <button class="btn-back" onclick="loadDeliveries()" title="Back to Deliveries">${BACK_CHEVRON}</button>
        </div>
      </div>
      <div class="wizard-steps">${stepper}</div>
      <div id="delivery-step-content"></div>
      <div class="wizard-nav">
        <button class="btn btn-secondary" onclick="prevDeliveryStep()" ${deliveryWizard.currentStep === 1 ? 'disabled' : ''}>Back</button>
        <button class="btn btn-primary" onclick="nextDeliveryStep()">${deliveryWizard.currentStep === 5 ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  `;
  document.getElementById('content').innerHTML = content;
  renderDeliveryStepContent();
}

function renderDeliveryStepContent() {
  const step = deliveryWizard.currentStep;
  const d = deliveryWizard.data;
  const segments = deliveryWizard.lists.segments;
  const audiences = deliveryWizard.lists.audiences;
  const scheduleValue = d.scheduled_at ? new Date(d.scheduled_at).toISOString().slice(0, 16) : '';
  let html = '';
  
  if (step === 1) {
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">1. Properties</h3>
        <div class="form-grid">
          <div class="form-group form-grid-full">
            <label class="form-label form-label-required">Name</label>
            <input type="text" class="form-input" value="${d.name}" oninput="updateDeliveryField('name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label form-label-required">Channel</label>
            <select class="form-input" onchange="updateDeliveryField('channel', this.value)">
              <option value="Email" ${d.channel === 'Email' ? 'selected' : ''}>Email</option>
              <option value="SMS" ${d.channel === 'SMS' ? 'selected' : ''}>SMS</option>
              <option value="Push" ${d.channel === 'Push' ? 'selected' : ''}>Push</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" onchange="updateDeliveryField('status', this.value)">
              <option value="draft" ${d.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="scheduled" ${d.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="in-progress" ${d.status === 'in-progress' ? 'selected' : ''}>In progress</option>
              <option value="paused" ${d.status === 'paused' ? 'selected' : ''}>Paused</option>
              <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="stopped" ${d.status === 'stopped' ? 'selected' : ''}>Stopped</option>
              <option value="failed" ${d.status === 'failed' ? 'selected' : ''}>Failed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Schedule</label>
            <input type="datetime-local" class="form-input" value="${scheduleValue}" onchange="updateDeliveryField('scheduled_at', this.value)">
            <div class="form-inline-actions" style="margin-top: 0.5rem;">
              <button class="btn btn-ghost" onclick="clearDeliverySchedule()">Send now</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Approval Required</label>
            <select class="form-input" onchange="updateDeliveryField('approval_required', this.value === 'yes')">
              <option value="no" ${d.approval_required ? '' : 'selected'}>No</option>
              <option value="yes" ${d.approval_required ? 'selected' : ''}>Yes</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
  
  if (step === 2) {
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">2. Segments & Audience</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Audience</label>
            <select class="form-input" onchange="updateDeliveryField('audience_id', this.value)">
              <option value="">Select audience...</option>
              ${audiences.map(a => `<option value="${a.id}" ${d.audience_id == a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Segment</label>
            <select class="form-input" onchange="updateDeliveryField('segment_id', this.value)">
              <option value="">Select segment...</option>
              ${segments.map(s => `<option value="${s.id}" ${d.segment_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group form-grid-full">
            <div class="form-inline-actions">
              <button class="btn btn-secondary" onclick="openSegmentBuilder()">+ Create Segment</button>
              <button class="btn btn-secondary" onclick="refreshDeliveryLists()">Refresh lists</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  if (step === 3) {
    if (d.channel === 'Email') {
      const templates = deliveryWizard.lists.templates || [];
      const templateOptions = templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      const abEnabled = !!d.ab_test_enabled;
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (Email Designer)</h3>
          <div class="form-group form-grid-full">
            <label class="form-label">Templates</label>
            <div class="form-inline-actions">
              <select class="form-input" id="delivery-template-select">
                <option value="">Select template...</option>
                ${templateOptions}
              </select>
              <button class="btn btn-secondary" onclick="applyTemplateToEmail()">Apply</button>
              <button class="btn btn-secondary" onclick="saveTemplateFromEmail()">Save as Template</button>
            </div>
          </div>
          <div class="form-group form-grid-full">
            <label class="form-label">A/B Testing</label>
            <div class="form-help-row">
              <span class="form-help">Send two variants and let the system pick a winner.</span>
              <button class="btn btn-ghost btn-sm" type="button" onclick="showAbTestingHelp()">How it works</button>
            </div>
            <div class="form-inline-actions">
              <select class="form-input" onchange="updateDeliveryField('ab_test_enabled', this.value === 'yes')">
                <option value="no" ${abEnabled ? '' : 'selected'}>Disabled</option>
                <option value="yes" ${abEnabled ? 'selected' : ''}>Enabled</option>
              </select>
              <input class="form-input" type="number" min="10" max="90" value="${d.ab_split_pct || 50}" oninput="updateDeliveryField('ab_split_pct', this.value)" placeholder="Split % for A">
              <select class="form-input" onchange="updateDeliveryField('ab_winner_rule', this.value)">
                <option value="open_rate" ${d.ab_winner_rule === 'open_rate' ? 'selected' : ''}>Open rate</option>
                <option value="click_rate" ${d.ab_winner_rule === 'click_rate' ? 'selected' : ''}>Click rate</option>
                <option value="delivered_rate" ${d.ab_winner_rule === 'delivered_rate' ? 'selected' : ''}>Delivered rate</option>
                <option value="ctor" ${d.ab_winner_rule === 'ctor' ? 'selected' : ''}>Click-to-open rate</option>
                <option value="conversion_rate" ${d.ab_winner_rule === 'conversion_rate' ? 'selected' : ''}>Conversion rate</option>
                <option value="revenue" ${d.ab_winner_rule === 'revenue' ? 'selected' : ''}>Revenue</option>
              </select>
              <select class="form-input" onchange="switchEmailVariant(this.value)">
                <option value="A" ${deliveryWizard.currentVariant === 'A' ? 'selected' : ''}>Variant A</option>
                <option value="B" ${deliveryWizard.currentVariant === 'B' ? 'selected' : ''}>Variant B</option>
              </select>
            </div>
            <div class="form-inline-actions ab-weighted-row">
              <select class="form-input" id="ab-weighted-metric">
                <option value="open_rate">Open rate</option>
                <option value="click_rate">Click rate</option>
                <option value="delivered_rate">Delivered rate</option>
                <option value="ctor">Click-to-open rate</option>
                <option value="conversion_rate">Conversion rate</option>
                <option value="revenue">Revenue</option>
              </select>
              <input class="form-input" type="number" min="1" max="100" value="50" id="ab-weighted-weight" placeholder="Weight %">
              <button class="btn btn-secondary" type="button" onclick="addAbWeightedMetric()">Add</button>
            </div>
            <div class="ab-weighted-summary" id="ab-weighted-summary">${renderAbWeightedSummary(d.ab_weighted_metrics || [])}</div>
            <div class="form-inline-actions ab-guardrail-row">
              <select class="form-input" id="ab-guardrail-metric">
                <option value="unsubscribe_rate">Unsubscribe rate</option>
                <option value="bounce_rate">Bounce rate</option>
                <option value="spam_rate">Spam complaint rate</option>
                <option value="delivered_rate">Delivered rate</option>
                <option value="open_rate">Open rate</option>
                <option value="click_rate">Click rate</option>
              </select>
              <select class="form-input" id="ab-guardrail-operator">
                <option value="<">≤</option>
                <option value=">">≥</option>
              </select>
              <input class="form-input" type="number" min="0" max="100" value="1" id="ab-guardrail-value" placeholder="%">
              <button class="btn btn-secondary" type="button" onclick="addAbGuardrail()">Add guardrail</button>
            </div>
            <div class="ab-guardrail-summary" id="ab-guardrail-summary">${renderAbGuardrailSummary(d.ab_guardrails || [])}</div>
          </div>
          <div class="email-editor-launch">
            <div>
              <h4>Email designer</h4>
              <p>Open the full-page editor to design the email content, manage assets, tracked URLs, and structure.</p>
              <div class="email-editor-meta">
                <span><strong>Subject:</strong> ${d.subject || '—'}</span>
                <span><strong>Blocks:</strong> ${(d.content_blocks || []).length}</span>
              </div>
            </div>
            <div>
              <button class="btn btn-primary" onclick="openEmailEditorPage()">Open Email Designer</button>
            </div>
          </div>
        </div>
      `;
    } else {
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content</h3>
          <div class="form-group form-grid-full">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" value="${d.subject || ''}" oninput="updateDeliveryField('subject', this.value)">
          </div>
          <div class="form-group form-grid-full">
            <label class="form-label">Message</label>
            <textarea class="form-input" rows="6" oninput="updateDeliveryField('content', this.value)">${d.content || ''}</textarea>
          </div>
        </div>
      `;
    }
  }
  
  if (step === 4) {
    const previewHtml = d.channel === 'Email' ? (d.html_output || generateEmailHtml(getCurrentBlocks())) : `<pre>${d.content || ''}</pre>`;
    const checks = runDeliverabilityChecks(d.subject, previewHtml);
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">4. Preview & Proof</h3>
        <div class="email-preview">${previewHtml}</div>
        <div class="form-group">
          <label class="form-label">Deliverability Checks</label>
          <ul class="deliverability-list">
            ${checks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('')}
          </ul>
        </div>
        <div class="form-group">
          <label class="form-label">Proof Emails (comma separated)</label>
          <input type="text" class="form-input" value="${(d.proof_emails || []).join(', ')}" oninput="updateProofEmails(this.value)">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendProofEmails()">Send Proof</button>
        </div>
      </div>
    `;
  }
  
  if (step === 5) {
    html = `
      <div class="form-section">
        <h3 class="form-section-title">5. Publish</h3>
        <div class="preview-meta">
          <div><strong>Name:</strong> ${d.name || '-'}</div>
          <div><strong>Channel:</strong> ${d.channel}</div>
          <div><strong>Schedule:</strong> ${d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'Send now'}</div>
          <div><strong>Audience:</strong> ${d.audience_id || '—'}</div>
          <div><strong>Segment:</strong> ${d.segment_id || '—'}</div>
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-primary" onclick="publishDelivery()">Publish</button>
          <button class="btn btn-secondary" onclick="sendDeliveryNow()">Send now</button>
        </div>
      </div>
    `;
  }
  
  document.getElementById('delivery-step-content').innerHTML = html;
  if (step === 3 && d.channel === 'Email') {
    initEmailDesigner();
  }
}

function updateDeliveryField(field, value) {
  deliveryWizard.data[field] = value;
}

function clearDeliverySchedule() {
  deliveryWizard.data.scheduled_at = null;
  renderDeliveryStepContent();
}

function sendDeliveryNow() {
  deliveryWizard.data.scheduled_at = null;
  publishDelivery();
}

function switchEmailVariant(variant) {
  deliveryWizard.currentVariant = variant;
  renderEmailBlocks();
}

function getCurrentBlocks() {
  if (deliveryWizard.data.ab_test_enabled) {
    return deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || [];
  }
  return deliveryWizard.blocks;
}

function prevDeliveryStep() {
  if (deliveryWizard.currentStep > 1) {
    deliveryWizard.currentStep -= 1;
    renderDeliveryWizard();
  }
}

function nextDeliveryStep() {
  if (deliveryWizard.currentStep < 5) {
    deliveryWizard.currentStep += 1;
    renderDeliveryWizard();
  } else {
    publishDelivery();
  }
}

async function openSegmentBuilder() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) {
    showToast('Save delivery draft before creating a segment', 'warning');
    return;
  }
  const url = `/segment-builder.html?return=deliveries&deliveryId=${encodeURIComponent(deliveryWizard.deliveryId)}`;
  window.open(url, '_blank');
}

async function refreshDeliveryLists() {
  await loadDeliveryLists();
  renderDeliveryWizard();
}

function applyPendingSegmentSelection() {
  if (!deliveryWizard.deliveryId) return;
  const raw = localStorage.getItem('deliverySegmentSelection');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.deliveryId === deliveryWizard.deliveryId && data.segmentId) {
      deliveryWizard.data.segment_id = data.segmentId;
      deliveryWizard.currentStep = Math.max(deliveryWizard.currentStep, 2);
      localStorage.removeItem('deliverySegmentSelection');
    }
  } catch (error) {
    // ignore
  }
}

function applyPendingDeliveryStep() {
  const step = window.pendingDeliveryStep;
  if (!step || Number.isNaN(step)) return;
  deliveryWizard.currentStep = Math.max(deliveryWizard.currentStep, step);
  window.pendingDeliveryStep = null;
}

function updateProofEmails(value) {
  const emails = value.split(',').map(v => v.trim()).filter(Boolean);
  deliveryWizard.data.proof_emails = emails;
}

async function saveDeliveryDraft() {
  const contentBlocks = deliveryWizard.data.ab_test_enabled ? deliveryWizard.blocksByVariant : deliveryWizard.blocks;
  const htmlOutput = deliveryWizard.data.ab_test_enabled ? {
    A: generateEmailHtml(deliveryWizard.blocksByVariant.A || []),
    B: generateEmailHtml(deliveryWizard.blocksByVariant.B || [])
  } : (deliveryWizard.data.html_output || generateEmailHtml(deliveryWizard.blocks));
  const payload = {
    ...deliveryWizard.data,
    status: 'draft',
    wizard_step: deliveryWizard.currentStep,
    last_saved_step: deliveryWizard.currentStep,
    content_blocks: contentBlocks,
    html_output: htmlOutput,
    proof_emails: deliveryWizard.data.proof_emails || [],
    draft_state: {
      ...deliveryWizard.data,
      content_blocks: contentBlocks,
      html_output: htmlOutput,
      proof_emails: deliveryWizard.data.proof_emails || []
    }
  };
  
  try {
    showLoading();
    const isEdit = !!deliveryWizard.deliveryId;
    const url = isEdit ? `/api/deliveries/${deliveryWizard.deliveryId}` : '/api/deliveries';
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save delivery');
    deliveryWizard.deliveryId = data.id || deliveryWizard.deliveryId;
    showToast('Draft saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function publishDelivery() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) return;
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${deliveryWizard.deliveryId}/publish`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to publish delivery');
    showToast('Delivery published', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function sendProofEmails() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) return;
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${deliveryWizard.deliveryId}/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: deliveryWizard.data.proof_emails || [] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save proof emails');
    showToast('Proof emails saved', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function insertTokenToSubject(token) {
  deliveryWizard.data.subject = `${deliveryWizard.data.subject || ''}${token}`;
  renderDeliveryWizard();
}

function getSelectedDeliveryAudienceLabel() {
  const d = deliveryWizard.data || {};
  const audiences = deliveryWizard.lists.audiences || [];
  const segments = deliveryWizard.lists.segments || [];
  const selectedAudience = audiences.find(a => String(a.id) === String(d.audience_id));
  const selectedSegment = segments.find(s => String(s.id) === String(d.segment_id));
  if (selectedAudience && selectedSegment) {
    return `${selectedAudience.name} + ${selectedSegment.name}`;
  }
  if (selectedAudience) return selectedAudience.name;
  if (selectedSegment) return selectedSegment.name;
  return 'General audience';
}

async function generateSubjectForDelivery() {
  const output = document.getElementById('delivery-subject-suggestions');
  if (!output) return;
  const productName = deliveryWizard.data.name || 'Campaign';
  const targetAudience = getSelectedDeliveryAudienceLabel();
  try {
    showLoading();
    const response = await fetch(`/api/ai/generate-subject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, targetAudience, count: 5 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate subject lines');
    let html = '<h4>Suggested subject lines</h4>';
    data.subjects.forEach((subject, i) => {
      html += `<div class="ai-output-item ai-output-clickable" onclick="applyDeliverySubject('${subject.replace(/'/g, "\\'")}')">${i + 1}. ${subject}</div>`;
    });
    if (data.source === 'mock') {
      html += `<p class="ai-output-note">Note: ${data.message}</p>`;
    }
    output.innerHTML = html;
    output.classList.remove('hidden');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function applyDeliverySubject(subject) {
  const input = document.getElementById('delivery-subject-input');
  if (input) {
    input.value = subject;
  }
  updateDeliveryField('subject', subject);
}

function applyPersonalizationToken(selectId, inputId, field) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input || !select.value) return;
  const token = select.value;
  input.value = `${input.value || ''}${token}`;
  const targetField = field || (inputId === 'delivery-subject-input' ? 'subject' : null);
  if (targetField) updateDeliveryField(targetField, input.value);
  select.value = '';
}

async function openEmailEditorPage() {
  if (!deliveryWizard.deliveryId) {
    await saveDeliveryDraft();
  }
  if (!deliveryWizard.deliveryId) {
    showToast('Save the delivery before editing content.', 'warning');
    return;
  }
  const url = `/email-designer.html?deliveryId=${encodeURIComponent(deliveryWizard.deliveryId)}&return=modal&step=3`;
  if (typeof window.openEmailEditorModal === 'function') {
    window.openEmailEditorModal(url, deliveryWizard.deliveryId);
    return;
  }
  window.location.href = url;
}

function applyTemplateToEmail() {
  const select = document.getElementById('delivery-template-select');
  if (!select || !select.value) return;
  const template = deliveryWizard.lists.templates.find(t => String(t.id) === String(select.value));
  if (!template) return;
  deliveryWizard.data.subject = template.subject || '';
  if (Array.isArray(template.blocks)) {
    deliveryWizard.blocks = template.blocks;
  }
  if (template.html) {
    deliveryWizard.data.html_output = template.html;
  }
  renderDeliveryWizard();
}

function showAbTestingHelp() {
  const message = `
    A/B testing sends two variants to a split audience.
    The winner is chosen by the selected rule (open or click rate),
    and can be applied to the remaining audience.
  `.replace(/\s+/g, ' ').trim();
  showToast(message, 'info');
}

function addAbWeightedMetric() {
  const metricEl = document.getElementById('ab-weighted-metric');
  const weightEl = document.getElementById('ab-weighted-weight');
  if (!metricEl || !weightEl) return;
  const metric = metricEl.value;
  const weight = Math.max(1, Math.min(100, parseInt(weightEl.value, 10) || 0));
  if (!metric || !weight) return;
  const list = deliveryWizard.data.ab_weighted_metrics || [];
  const existing = list.find(item => item.metric === metric);
  if (existing) {
    existing.weight = weight;
  } else {
    list.push({ metric, weight });
  }
  deliveryWizard.data.ab_weighted_metrics = list;
  renderAbWeightedSummary(list);
}

function removeAbWeightedMetric(metric) {
  const list = (deliveryWizard.data.ab_weighted_metrics || []).filter(item => item.metric !== metric);
  deliveryWizard.data.ab_weighted_metrics = list;
  renderAbWeightedSummary(list);
}

function renderAbWeightedSummary(list) {
  const container = document.getElementById('ab-weighted-summary');
  const items = (list || []).map(item => `
    <div class="ab-weighted-item">
      <span>${formatAbMetric(item.metric)}</span>
      <span>${item.weight}%</span>
      <button class="btn btn-ghost btn-sm" onclick="removeAbWeightedMetric('${item.metric}')">Remove</button>
    </div>
  `).join('');
  const total = (list || []).reduce((sum, item) => sum + (item.weight || 0), 0);
  const html = `
    ${items || '<div class="ab-weighted-empty">Add metrics to create a weighted score.</div>'}
    <div class="ab-weighted-total">Total weight: ${total}%</div>
  `;
  if (container) container.innerHTML = html;
  return html;
}

function formatAbMetric(metric) {
  const map = {
    open_rate: 'Open rate',
    click_rate: 'Click rate',
    delivered_rate: 'Delivered rate',
    ctor: 'Click-to-open rate',
    conversion_rate: 'Conversion rate',
    revenue: 'Revenue',
    unsubscribe_rate: 'Unsubscribe rate',
    bounce_rate: 'Bounce rate',
    spam_rate: 'Spam complaint rate'
  };
  return map[metric] || metric;
}

function addAbGuardrail() {
  const metricEl = document.getElementById('ab-guardrail-metric');
  const operatorEl = document.getElementById('ab-guardrail-operator');
  const valueEl = document.getElementById('ab-guardrail-value');
  if (!metricEl || !operatorEl || !valueEl) return;
  const metric = metricEl.value;
  const operator = operatorEl.value;
  const value = Math.max(0, Math.min(100, parseFloat(valueEl.value)));
  if (!metric || Number.isNaN(value)) return;
  const list = deliveryWizard.data.ab_guardrails || [];
  const existing = list.find(item => item.metric === metric);
  if (existing) {
    existing.operator = operator;
    existing.value = value;
  } else {
    list.push({ metric, operator, value });
  }
  deliveryWizard.data.ab_guardrails = list;
  renderAbGuardrailSummary(list);
}

function removeAbGuardrail(metric) {
  const list = (deliveryWizard.data.ab_guardrails || []).filter(item => item.metric !== metric);
  deliveryWizard.data.ab_guardrails = list;
  renderAbGuardrailSummary(list);
}

function renderAbGuardrailSummary(list) {
  const container = document.getElementById('ab-guardrail-summary');
  const items = (list || []).map(item => `
    <div class="ab-guardrail-item">
      <span>${formatAbMetric(item.metric)} ${item.operator} ${item.value}%</span>
      <button class="btn btn-ghost btn-sm" onclick="removeAbGuardrail('${item.metric}')">Remove</button>
    </div>
  `).join('');
  const html = items || '<div class="ab-guardrail-empty">No guardrails set.</div>';
  if (container) container.innerHTML = html;
  return html;
}

async function saveTemplateFromEmail() {
  const name = prompt('Template name?');
  if (!name) return;
  const payload = {
    name,
    subject: deliveryWizard.data.subject || '',
    blocks: getCurrentBlocks(),
    html: generateEmailHtml(getCurrentBlocks())
  };
  try {
    showLoading();
    const response = await fetch('/api/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save template');
    showToast('Template saved', 'success');
    await loadDeliveryLists();
    renderDeliveryWizard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function runDeliverabilityChecks(subject, html) {
  const checks = [];
  const spamWords = ['free', 'winner', 'urgent', 'guarantee'];
  checks.push({ ok: !!subject, message: subject ? 'Subject present' : 'Subject missing' });
  const hasUnsub = html.toLowerCase().includes('unsubscribe');
  checks.push({ ok: hasUnsub, message: hasUnsub ? 'Unsubscribe link present' : 'Unsubscribe link missing' });
  const hasImages = html.toLowerCase().includes('<img');
  checks.push({ ok: hasImages, message: hasImages ? 'Contains images' : 'No images detected' });
  const spamHit = spamWords.find(w => subject.toLowerCase().includes(w));
  checks.push({ ok: !spamHit, message: !spamHit ? 'No common spam words detected' : `Spam word detected: ${spamHit}` });
  return checks;
}

// Email designer helpers
function initEmailDesigner() {
  const canvas = document.getElementById('email-designer-canvas');
  if (!canvas) return;
  
  document.querySelectorAll('.email-block-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.block);
    });
  });
  
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    addEmailBlock(type);
  });
  
  renderEmailBlocks();
}

function addEmailBlock(type) {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type };
  switch (type) {
    case 'text':
      base.content = 'Add your text here';
      break;
    case 'image':
      base.src = 'https://via.placeholder.com/600x200';
      base.alt = 'Image';
      break;
    case 'button':
      base.text = 'Click me';
      base.url = 'https://example.com';
      break;
    case 'divider':
      base.thickness = 1;
      break;
    case 'spacer':
      base.height = 20;
      break;
    case 'html':
      base.html = '<div>Custom HTML</div>';
      break;
  }
  if (deliveryWizard.data.ab_test_enabled) {
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] = deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || [];
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant].push(base);
  } else {
    deliveryWizard.blocks.push(base);
  }
  renderEmailBlocks();
}

function updateEmailBlock(id, field, value) {
  const blocks = getCurrentBlocks();
  const block = blocks.find(b => b.id === id);
  if (!block) return;
  block[field] = value;
  renderEmailBlocks();
}

function moveEmailBlock(id, direction) {
  const blocks = getCurrentBlocks();
  const idx = blocks.findIndex(b => b.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return;
  const temp = blocks[idx];
  blocks[idx] = blocks[swapIdx];
  blocks[swapIdx] = temp;
  renderEmailBlocks();
}

function deleteEmailBlock(id) {
  if (deliveryWizard.data.ab_test_enabled) {
    deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] = (deliveryWizard.blocksByVariant[deliveryWizard.currentVariant] || []).filter(b => b.id !== id);
  } else {
    deliveryWizard.blocks = deliveryWizard.blocks.filter(b => b.id !== id);
  }
  renderEmailBlocks();
}

function renderEmailBlocks() {
  const canvas = document.getElementById('email-designer-canvas');
  if (!canvas) return;
  const blocks = getCurrentBlocks();
  if (!blocks.length) {
    canvas.innerHTML = '<div class="email-canvas-empty">Drag blocks to build your email</div>';
    return;
  }
  canvas.innerHTML = blocks.map(block => {
    let editor = '';
    if (block.type === 'text') {
      editor = `<textarea class="form-input" rows="3" oninput="updateEmailBlock('${block.id}','content', this.value)">${block.content || ''}</textarea>`;
    } else if (block.type === 'image') {
      editor = `
        <input class="form-input" type="text" placeholder="Image URL" value="${block.src || ''}" oninput="updateEmailBlock('${block.id}','src', this.value)">
        <input class="form-input" type="text" placeholder="Alt text" value="${block.alt || ''}" oninput="updateEmailBlock('${block.id}','alt', this.value)">
        <div class="form-inline-actions">
          <button class="btn btn-sm btn-secondary" onclick="openAssetPicker('${block.id}')">Choose from assets</button>
        </div>
      `;
    } else if (block.type === 'button') {
      editor = `
        <input class="form-input" type="text" placeholder="Button text" value="${block.text || ''}" oninput="updateEmailBlock('${block.id}','text', this.value)">
        <input class="form-input" type="text" placeholder="URL" value="${block.url || ''}" oninput="updateEmailBlock('${block.id}','url', this.value)">
      `;
    } else if (block.type === 'divider') {
      editor = `<input class="form-input" type="number" min="1" value="${block.thickness || 1}" oninput="updateEmailBlock('${block.id}','thickness', this.value)">`;
    } else if (block.type === 'spacer') {
      editor = `<input class="form-input" type="number" min="4" value="${block.height || 20}" oninput="updateEmailBlock('${block.id}','height', this.value)">`;
    } else if (block.type === 'html') {
      editor = `<textarea class="form-input" rows="3" oninput="updateEmailBlock('${block.id}','html', this.value)">${block.html || ''}</textarea>`;
    }
    return `
      <div class="email-block">
        <div class="email-block-header">
          <strong>${block.type.toUpperCase()}</strong>
          <div class="email-block-actions">
            <button class="btn btn-sm btn-secondary" onclick="moveEmailBlock('${block.id}','up')">↑</button>
            <button class="btn btn-sm btn-secondary" onclick="moveEmailBlock('${block.id}','down')">↓</button>
            <button class="btn btn-sm btn-secondary" onclick="deleteEmailBlock('${block.id}')">${_afIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14)}</button>
          </div>
        </div>
        <div class="email-block-body">${editor}</div>
      </div>
    `;
  }).join('');
  
  deliveryWizard.data.html_output = generateEmailHtml(blocks);
}

function generateEmailHtml(blocks) {
  const html = blocks.map(block => {
    if (block.type === 'text') {
      return `<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">${block.content || ''}</p>`;
    }
    if (block.type === 'image') {
      return `<img src="${block.src || ''}" alt="${block.alt || ''}" style="max-width: 100%; display: block;">`;
    }
    if (block.type === 'button') {
      return `<a href="${block.url || '#'}" style="display:inline-block;padding:10px 16px;background:#1473E6;color:#fff;border-radius:4px;text-decoration:none;">${block.text || 'Button'}</a>`;
    }
    if (block.type === 'divider') {
      return `<hr style="border:none;border-top:${block.thickness || 1}px solid #E1E1E1;">`;
    }
    if (block.type === 'spacer') {
      return `<div style="height:${block.height || 20}px;"></div>`;
    }
    if (block.type === 'html') {
      return block.html || '';
    }
    return '';
  }).join('');
  
  return `<div style="max-width:640px;margin:0 auto;">${html}</div>`;
}

async function openAssetPicker(blockId) {
  const modal = document.getElementById('asset-picker-modal');
  if (!modal) {
    createAssetPickerModal();
  }
  const list = document.getElementById('asset-picker-list');
  if (!list) return;
  list.innerHTML = 'Loading assets...';
  try {
    const response = await fetch('/api/assets?type=image');
    const data = await response.json();
    const assets = data.assets || [];
    list.innerHTML = assets.map(a => `
      <div class="asset-item" onclick="selectAssetForBlock('${blockId}', '${a.url}')">
        <img src="${a.url}" alt="${a.name}">
        <div class="asset-name">${a.name}</div>
      </div>
    `).join('') || '<div class="empty-state">No assets found</div>';
    document.getElementById('asset-picker-modal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load assets', 'error');
  }
}

function selectAssetForBlock(blockId, url) {
  updateEmailBlock(blockId, 'src', url);
  closeAssetPicker();
}

function closeAssetPicker() {
  const modal = document.getElementById('asset-picker-modal');
  if (modal) modal.classList.add('hidden');
}

function createAssetPickerModal() {
  const modal = document.createElement('div');
  modal.id = 'asset-picker-modal';
  modal.className = 'asset-picker-modal hidden';
  modal.innerHTML = `
    <div class="asset-picker-content">
      <div class="asset-picker-header">
        <h3>Asset Library</h3>
        <button class="btn btn-sm btn-secondary" onclick="closeAssetPicker()">${_afIco('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 14)}</button>
      </div>
      <div id="asset-picker-list" class="asset-picker-grid"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function sendDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/send`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send delivery');
    showToast('Delivery sent', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function pauseDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/pause`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to pause delivery');
    showToast('Delivery paused', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function resumeDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/resume`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to resume delivery');
    showToast('Delivery resumed', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function stopDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/stop`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to stop delivery');
    showToast('Delivery stopped', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function approveDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/approve`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to approve delivery');
    showToast('Delivery approved', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function showDeliveryReport(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}/report`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load report');
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 16)} Delivery Report</h3>
          <button class="btn-back" onclick="loadDeliveries()" title="Back to Deliveries">${BACK_CHEVRON}</button>
        </div>
        <div class="card-body">
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-card-title">Sent</div><div class="stat-card-value">${(data.sent || 0).toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-card-title">Delivered</div><div class="stat-card-value">${(data.delivered || 0).toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-card-title">Opens</div><div class="stat-card-value">${(data.opens || 0).toLocaleString()}</div></div>
            <div class="stat-card"><div class="stat-card-title">Clicks</div><div class="stat-card-value">${(data.clicks || 0).toLocaleString()}</div></div>
          </div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">Details</h3></div>
            <div class="card-body">
              <div><strong>Status:</strong> ${data.status || 'draft'}</div>
              <div><strong>Scheduled:</strong> ${data.scheduled_at ? new Date(data.scheduled_at).toLocaleString() : '-'}</div>
              <div><strong>Sent at:</strong> ${data.sent_at ? new Date(data.sent_at).toLocaleString() : '-'}</div>
              <div><strong>Channel:</strong> ${data.channel}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load delivery');
    showDeliveryForm(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteDelivery(id) {
  if (!confirm('Delete this delivery?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete delivery');
    showToast('Delivery deleted', 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function duplicateDelivery(id) {
  try {
    showLoading();
    const response = await fetch(`/api/deliveries/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load delivery');
    const copy = {
      ...data,
      id: null,
      name: `${data.name} (Copy)`,
      status: 'draft',
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      sent_at: null,
      approved_at: null,
      last_saved_step: 1,
      wizard_step: 1
    };
    showDeliveryForm(copy);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Transactional Messages View
async function loadTransactionalMessages() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 16)} Transactional Messages</h3>
          <div class="card-subtitle">Event-triggered messages (order confirmations, password resets, etc.)</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Event Type</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Total Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="7" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 48)}</div>
                  <h3>No transactional messages configured</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Set up automated messages triggered by customer events</p>
                  <button class="btn btn-primary" onclick="showToast('Transactional message setup coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Transactional Message</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Transactional Messages');
  } finally {
    hideLoading();
  }
}

// Event History View
async function loadEventHistory() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 16)} Event History</h3>
          <div class="card-subtitle">Track all system events and triggers</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Source</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', 48)}</div>
                  <h3>No events recorded</h3>
                  <p style="color: var(--text-secondary);">System events will appear here as they occur</p>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Event History');
  } finally {
    hideLoading();
  }
}

// Content Templates View
async function loadContentTemplates() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', 16)} Content Templates</h3>
          <div class="card-subtitle">Reusable email, SMS, and push templates</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Last Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', 48)}</div>
                  <h3>No content templates</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Create reusable templates for consistent messaging</p>
                  <button class="btn btn-primary" onclick="showToast('Template builder coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Template</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Content Templates');
  } finally {
    hideLoading();
  }
}

// Landing Pages View
async function loadLandingPages() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/landing-pages`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load landing pages');
    window.landingPagesCache = data.pages || [];
    const content = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${_afIco('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', 16)} Landing Pages</h3>
            <div class="card-subtitle">Create and manage web landing pages</div>
          </div>
          <button class="btn btn-primary" onclick="createLandingPage()">+ Create landing page</button>
        </div>
        <div class="card-body">
          <div class="table-toolbar">
            <input type="text" id="landing-page-search" class="form-input" placeholder="Search landing pages">
            <select id="landing-page-status-filter" class="form-input">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <input type="text" id="landing-page-tag-filter" class="form-input" placeholder="Filter by tag">
            <select id="landing-page-sort" class="form-input">
              <option value="updated_desc">Last updated (newest)</option>
              <option value="updated_asc">Last updated (oldest)</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
            </select>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Owner</th>
                  <th>Tags/Folder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="landing-pages-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    renderLandingPagesTable();
    const search = document.getElementById('landing-page-search');
    const statusFilter = document.getElementById('landing-page-status-filter');
    const tagFilter = document.getElementById('landing-page-tag-filter');
    const sort = document.getElementById('landing-page-sort');
    [search, statusFilter, tagFilter, sort].forEach(el => {
      if (!el) return;
      el.addEventListener('input', renderLandingPagesTable);
      el.addEventListener('change', renderLandingPagesTable);
    });
  } catch (error) {
    showError('Failed to load Landing Pages');
  } finally {
    hideLoading();
  }
}

function renderLandingPagesTable() {
  const body = document.getElementById('landing-pages-table-body');
  if (!body) return;
  const pages = Array.isArray(window.landingPagesCache) ? window.landingPagesCache.slice() : [];
  const search = (document.getElementById('landing-page-search')?.value || '').toLowerCase();
  const status = document.getElementById('landing-page-status-filter')?.value || 'all';
  const tag = (document.getElementById('landing-page-tag-filter')?.value || '').toLowerCase();
  const sort = document.getElementById('landing-page-sort')?.value || 'updated_desc';
  let filtered = pages.filter(page => {
    const matchesSearch = !search || (page.name || '').toLowerCase().includes(search) || (page.slug || '').toLowerCase().includes(search);
    const matchesStatus = status === 'all' || page.status === status;
    const tagList = Array.isArray(page.tags) ? page.tags.join(' ') : '';
    const matchesTag = !tag || tagList.toLowerCase().includes(tag) || (page.folder || '').toLowerCase().includes(tag);
    return matchesSearch && matchesStatus && matchesTag;
  });
  filtered.sort((a, b) => {
    if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sort === 'updated_asc') return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });
  if (!filtered.length) {
    body.innerHTML = `
      <tr><td colspan="7" style="text-align:center; padding: var(--spacing-500);">
        <div style="font-size: 2rem; margin-bottom: var(--spacing-200);">${_afIco('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', 32)}</div>
        <strong>No landing pages</strong>
        <div style="color: var(--text-secondary); margin-top: var(--spacing-100);">Create your first landing page to get started.</div>
      </td></tr>
    `;
    return;
  }
  body.innerHTML = filtered.map(page => {
    const typeLabel = page.type || page.channel || page.page_type || 'Landing Page';
    const tagLabel = Array.isArray(page.tags) && page.tags.length ? `Tags: ${page.tags.join(', ')}` : '';
    const folderLabel = page.folder ? `Folder: ${page.folder}` : '';
    const taxonomy = [folderLabel, tagLabel].filter(Boolean).join(' · ') || '—';
    const updated = page.updated_at || page.created_at || '';
    return `
      <tr>
        <td><strong>${page.name || 'Untitled'}</strong><div class="table-subtext">${page.slug || '—'}</div></td>
        <td>${typeLabel}</td>
        <td>${page.status || 'draft'}</td>
        <td>${updated ? new Date(updated).toLocaleDateString() : '—'}</td>
        <td>${page.updated_by || page.created_by || 'System'}</td>
        <td>${taxonomy}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editLandingPage(${page.id})">Edit</button>
          <button class="btn btn-sm btn-ghost" onclick="toggleLandingPageStatus(${page.id})">${page.status === 'published' ? 'Unpublish' : 'Publish'}</button>
          <button class="btn btn-sm btn-ghost" onclick="duplicateLandingPage(${page.id})">Duplicate</button>
        </td>
      </tr>
    `;
  }).join('');
}

function createLandingPage() {
  if (typeof window.openLandingPageEditorModal === 'function') {
    window.openLandingPageEditorModal();
  } else {
    openLandingPageEditor();
  }
}

function editLandingPage(id) {
  if (typeof window.openLandingPageEditorModal === 'function') {
    window.openLandingPageEditorModal(id);
  } else {
    openLandingPageEditor(id);
  }
}

async function duplicateLandingPage(id) {
  const page = (window.landingPagesCache || []).find(p => String(p.id) === String(id));
  if (!page) return;
  const toSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const baseName = page.name || 'Landing Page';
  const copyName = `Copy of ${baseName}`;
  const slugBase = page.slug ? `${page.slug}-copy` : toSlug(copyName);
  const payload = {
    name: copyName,
    slug: slugBase,
    status: 'draft',
    version: 1,
    content_blocks: Array.isArray(page.content_blocks) ? page.content_blocks : [],
    html_output: page.html_output || '',
    body_style: page.body_style || null,
    tags: Array.isArray(page.tags) ? page.tags : [],
    folder: page.folder || '',
    created_by: page.updated_by || page.created_by || 'System'
  };
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/landing-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to duplicate landing page');
    window.landingPagesCache = [data, ...(window.landingPagesCache || [])];
    renderLandingPagesTable();
    showToast('Landing page duplicated', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function toggleLandingPageStatus(id) {
  const page = (window.landingPagesCache || []).find(p => String(p.id) === String(id));
  if (!page) return;
  const nextStatus = page.status === 'published' ? 'draft' : 'published';
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/landing-pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update landing page');
    window.landingPagesCache = (window.landingPagesCache || []).map(p => p.id === id ? data : p);
    renderLandingPagesTable();
    showToast(`Landing page ${nextStatus}`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function openLandingPageEditor(pageId = null) {
  const url = pageId
    ? `/email-designer.html?landingPageId=${encodeURIComponent(pageId)}&landingPageMode=1&return=app`
    : `/email-designer.html?landingPageMode=1&return=app`;
  window.location.href = url;
}

// Fragments View
async function loadFragments() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/fragments`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load fragments');
    window.fragmentsCache = data.fragments || data || [];
    const content = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${_afIco('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', 16)} Fragments</h3>
            <div class="card-subtitle">Reusable content blocks (headers, footers, disclaimers)</div>
          </div>
          <button class="btn btn-primary" onclick="createFragment()">+ Create fragment</button>
        </div>
        <div class="card-body">
          <div class="table-toolbar">
            <input type="text" id="fragment-search" class="form-input" placeholder="Search fragments">
            <select id="fragment-status-filter" class="form-input">
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <select id="fragment-type-filter" class="form-input">
              <option value="all">All types</option>
              <option value="landing">Landing</option>
              <option value="email">Email</option>
            </select>
            <input type="text" id="fragment-tag-filter" class="form-input" placeholder="Filter by tag">
            <select id="fragment-sort" class="form-input">
              <option value="updated_desc">Last updated (newest)</option>
              <option value="updated_asc">Last updated (oldest)</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
            </select>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Owner</th>
                  <th>Tags/Folder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="fragments-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    renderFragmentsTable();
    const search = document.getElementById('fragment-search');
    const statusFilter = document.getElementById('fragment-status-filter');
    const typeFilter = document.getElementById('fragment-type-filter');
    const tagFilter = document.getElementById('fragment-tag-filter');
    const sort = document.getElementById('fragment-sort');
    [search, statusFilter, typeFilter, tagFilter, sort].forEach(el => {
      if (!el) return;
      el.addEventListener('input', renderFragmentsTable);
      el.addEventListener('change', renderFragmentsTable);
    });
  } catch (error) {
    showError('Failed to load Fragments');
  } finally {
    hideLoading();
  }
}

function renderFragmentsTable() {
  const body = document.getElementById('fragments-table-body');
  if (!body) return;
  const fragments = Array.isArray(window.fragmentsCache) ? window.fragmentsCache.slice() : [];
  const search = (document.getElementById('fragment-search')?.value || '').toLowerCase();
  const status = document.getElementById('fragment-status-filter')?.value || 'all';
  const type = document.getElementById('fragment-type-filter')?.value || 'all';
  const tag = (document.getElementById('fragment-tag-filter')?.value || '').toLowerCase();
  const sort = document.getElementById('fragment-sort')?.value || 'updated_desc';
  let filtered = fragments.filter(fragment => {
    const matchesSearch = !search || (fragment.name || '').toLowerCase().includes(search);
    const matchesStatus = status === 'all' || fragment.status === status;
    const matchesType = type === 'all' || fragment.type === type;
    const tagList = Array.isArray(fragment.tags) ? fragment.tags.join(' ') : '';
    const matchesTag = !tag || tagList.toLowerCase().includes(tag) || (fragment.folder || '').toLowerCase().includes(tag);
    return matchesSearch && matchesStatus && matchesType && matchesTag;
  });
  filtered.sort((a, b) => {
    if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sort === 'updated_asc') return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });
  if (!filtered.length) {
    body.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: var(--spacing-500);">
        <div style="font-size: 2rem; margin-bottom: var(--spacing-200);">${_afIco('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>', 32)}</div>
        <strong>No fragments</strong>
        <div style="color: var(--text-secondary); margin-top: var(--spacing-100);">Create a reusable fragment to get started.</div>
      </td></tr>
    `;
    return;
  }
  body.innerHTML = filtered.map(fragment => {
    const updated = fragment.updated_at || fragment.created_at || '';
    const tagLabel = Array.isArray(fragment.tags) && fragment.tags.length ? `Tags: ${fragment.tags.join(', ')}` : '';
    const folderLabel = fragment.folder ? `Folder: ${fragment.folder}` : '';
    const taxonomy = [folderLabel, tagLabel].filter(Boolean).join(' · ') || '—';
    return `
      <tr>
        <td><strong>${fragment.name || 'Untitled'}</strong></td>
        <td>${(fragment.type || 'email')}</td>
        <td>${fragment.status || 'draft'}</td>
        <td>${updated ? new Date(updated).toLocaleDateString() : '—'}</td>
        <td>${fragment.updated_by || fragment.created_by || 'System'}</td>
        <td>${taxonomy}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editFragment(${fragment.id}, '${fragment.type || 'email'}')">Edit</button>
        </td>
      </tr>
    `;
  }).join('');
}

function createFragment() {
  const type = document.getElementById('fragment-type-filter')?.value || 'landing';
  openFragmentEditor(null, type === 'all' ? 'landing' : type);
}

function editFragment(id, type = 'email') {
  openFragmentEditor(id, type);
}

function openFragmentEditor(fragmentId = null, fragmentType = 'landing') {
  const params = new URLSearchParams({ fragmentMode: '1', fragmentType });
  if (fragmentId) params.set('fragmentId', fragmentId);
  window.location.href = `/email-designer.html?${params.toString()}`;
}

// Brands View
async function loadBrands() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 20)} Brands</h3>
          <div class="card-subtitle">Manage brand identities and configurations</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Brand Name</th>
                  <th>Domain</th>
                  <th>From Email</th>
                  <th>Reply-To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="7" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>', 20)}</div>
                  <h3>No brands configured</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Set up brand configurations for multi-brand campaigns</p>
                  <button class="btn btn-primary" onclick="showToast('Brand manager coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Brand</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Brands');
  } finally {
    hideLoading();
  }
}

// Subscription Services View
async function loadSubscriptionServices() {
  showLoading();
  try {
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 16)} Subscription Services</h3>
          <div class="card-subtitle">Manage subscription lists and preferences</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Name</th>
                  <th>Type</th>
                  <th>Subscribers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="6" style="text-align: center; padding: var(--spacing-700);">
                  <div style="font-size: 3rem; margin-bottom: var(--spacing-300);">${_afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', 48)}</div>
                  <h3>No subscription services</h3>
                  <p style="color: var(--text-secondary); margin-bottom: var(--spacing-400);">Create subscription lists for newsletter management</p>
                  <button class="btn btn-primary" onclick="showToast('Subscription manager coming soon!', 'info')">${_afIco('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', 14)} Create Service</button>
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
  } catch (error) {
    showError('Failed to load Subscription Services');
  } finally {
    hideLoading();
  }
}

// Predefined Filters View
async function loadPredefinedFilters() {
  showLoading();
  try {
    const response = await fetch('/api/predefined-filters');
    const data = await response.json();
    const filters = data.filters || [];
    
    const tableRows = filters.map(f => `
      <tr>
        <td data-column-id="id">${f.id}</td>
        <td data-column-id="name">${createTableLink(f.name, `editPredefinedFilter(${f.id})`)}</td>
        <td data-column-id="entity_type">${f.entity_type}</td>
        <td data-column-id="conditions"><code>${JSON.stringify(f.conditions || {})}</code></td>
        <td data-column-id="usage_count">${f.usage_count || 0}</td>
        <td>${createActionMenu(f.id, [
          {icon: _afIco('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', 14), label: 'Edit', onclick: `editPredefinedFilter(${f.id})`},
          {divider: true},
          {icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deletePredefinedFilter(${f.id})`, danger: true}
        ])}</td>
      </tr>
    `).join('');
    
    const columns = [
      { id: 'id', label: 'ID' },
      { id: 'name', label: 'Filter Name' },
      { id: 'entity_type', label: 'Entity Type' },
      { id: 'conditions', label: 'Conditions' },
      { id: 'usage_count', label: 'Usage Count' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>', 16)} Predefined Filters</h3>
          <button class="btn btn-primary" onclick="showPredefinedFilterForm()">+ Create Filter</button>
        </div>
        
        ${createTableToolbar({
          tabs: ['All'],
          activeTab: 'All',
          resultCount: filters.length,
          totalCount: filters.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'predefined-filters'
        })}
        
        <div class="data-table-container">
          <table class="data-table" data-view="predefined-filters">
            <thead>
              <tr>
                ${createSortableHeader('id', 'ID', currentTableSort)}
                ${createSortableHeader('name', 'Filter Name', currentTableSort)}
                ${createSortableHeader('entity_type', 'Entity Type', currentTableSort)}
                <th data-column-id="conditions">Conditions</th>
                ${createSortableHeader('usage_count', 'Usage Count', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No predefined filters found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('predefined-filters');
  } catch (error) {
    showError('Failed to load Predefined Filters');
  } finally {
    hideLoading();
  }
}

// Asset Library View
let assetsSearch = '';
let assetsType = 'all';

function updateAssetsSearch(value) {
  assetsSearch = value || '';
  if (typeof debounce === 'function') {
    debounce('assetsSearch', () => loadAssets(), 300);
  } else {
    loadAssets();
  }
}

function updateAssetsType(value) {
  assetsType = value || 'all';
  loadAssets();
}

async function loadAssets() {
  showLoading();
  try {
    const query = new URLSearchParams();
    if (assetsType !== 'all') query.set('type', assetsType);
    if (assetsSearch) query.set('search', assetsSearch);
    const response = await fetch(`/api/assets?${query.toString()}`);
    const data = await response.json();
    const assets = data.assets || [];
    const deliveriesResp = await fetch('/api/deliveries');
    const deliveriesData = await deliveriesResp.json();
    const deliveries = deliveriesData.deliveries || deliveriesData || [];
    
    const deliveryContent = deliveries.map(d => ({
      id: d.id,
      name: d.name,
      content: `${JSON.stringify(d.content_blocks || '')} ${d.content || ''}`
    }));
    
    const assetUsage = new Map();
    const ensureAssetUsage = (id) => {
      if (!assetUsage.has(id)) {
        assetUsage.set(id, { deliveries: [] });
      }
      return assetUsage.get(id);
    };
    const addUniqueUsage = (list, item) => {
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item);
      }
    };
    
    assets.forEach(asset => {
      const assetUrl = String(asset.url || '');
      if (!assetUrl) return;
      deliveryContent.forEach(delivery => {
        if (delivery.content.includes(assetUrl)) {
          const usage = ensureAssetUsage(asset.id);
          addUniqueUsage(usage.deliveries, { id: delivery.id, name: delivery.name });
        }
      });
    });
    
    const rows = assets.map(a => {
      const usage = assetUsage.get(a.id) || { deliveries: [] };
      const usedInItems = [
        ...usage.deliveries.map(d => ({ label: `Delivery: ${d.name}`, onclick: `editDelivery(${d.id})` }))
      ];
      return `
        <tr>
          <td data-column-id="preview"><img src="${a.url}" alt="${a.name}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td>
          <td data-column-id="name">${a.name}</td>
          <td data-column-id="type">${a.type}</td>
          <td data-column-id="size">${(a.size / 1024).toFixed(1)} KB</td>
          <td data-column-id="tags">${(a.tags || []).join(', ') || '-'}</td>
          <td data-column-id="used_in">${renderUsedInList(usedInItems)}</td>
          <td data-column-id="created_at">${new Date(a.created_at || Date.now()).toLocaleString()}</td>
          <td>${createActionMenu(a.id, [
            { icon: _afIco('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 14), label: 'Copy URL', onclick: `copyAssetUrl("${a.url}")`},
            { divider: true },
            { icon: _afIco('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 14), label: 'Delete', onclick: `deleteAsset(${a.id})`, danger: true }
          ])}</td>
        </tr>
      `;
    }).join('');
    
    const columns = [
      { id: 'preview', label: 'Preview' },
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'size', label: 'Size' },
      { id: 'tags', label: 'Tags' },
      { id: 'used_in', label: 'Used in' },
      { id: 'created_at', label: 'Created at' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>')} Asset Library</h3>
          <label class="btn btn-primary" style="cursor:pointer;">
            + Upload
            <input type="file" id="asset-upload-input" style="display:none;" onchange="uploadAsset(this.files)">
          </label>
        </div>
        ${createTableToolbar({
          tabs: ['All', 'Images', 'Files'],
          activeTab: assetsType === 'image' ? 'Images' : assetsType === 'file' ? 'Files' : 'All',
          resultCount: assets.length,
          totalCount: assets.length,
          showRefresh: false,
          showColumnSelector: true,
          columns,
          viewKey: 'assets',
          showSearch: true,
          searchPlaceholder: 'Search assets...',
          searchValue: assetsSearch || '',
          onSearch: 'updateAssetsSearch(this.value)'
        })}
        <div class="data-table-container">
          <table class="data-table" data-view="assets">
            <thead>
              <tr>
                <th data-column-id="preview">Preview</th>
                ${createSortableHeader('name', 'Name', currentTableSort)}
                ${createSortableHeader('type', 'Type', currentTableSort)}
                <th data-column-id="size">Size</th>
                <th data-column-id="tags">Tags</th>
                <th data-column-id="used_in">Used in</th>
                ${createSortableHeader('created_at', 'Created at', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6B7280;">No assets found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('assets');
  } catch (error) {
    showError('Failed to load assets');
  } finally {
    hideLoading();
  }
}

function setAssetsTab(tabLabel) {
  assetsType = tabLabel === 'Images' ? 'image' : tabLabel === 'Files' ? 'file' : 'all';
  loadAssets();
}

async function uploadAsset(files) {
  if (!files || !files.length) return;
  const file = files[0];
  const form = new FormData();
  form.append('file', file);
  try {
    showLoading();
    const response = await fetch('/api/assets', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    showToast('Asset uploaded', 'success');
    loadAssets();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteAsset(id) {
  if (!confirm('Delete this asset?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Delete failed');
    showToast('Asset deleted', 'success');
    loadAssets();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function copyAssetUrl(url) {
  navigator.clipboard.writeText(url);
  showToast('Asset URL copied', 'success');
}

function showPredefinedFilterForm(filter = null) {
  const isEdit = !!filter;
  const content = `
    <div class="form-container">
      <form id="predefined-filter-form" onsubmit="handlePredefinedFilterSubmit(event, ${filter?.id || 'null'})">
        <div class="form-section">
          <h3 class="form-section-title">Filter Details</h3>
          <div class="form-grid">
            <div class="form-group form-grid-full">
              <label class="form-label form-label-required">Name</label>
              <input type="text" id="filter-name" class="form-input" value="${filter?.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label form-label-required">Entity Type</label>
              <select id="filter-entity" class="form-input" required>
                <option value="contacts" ${filter?.entity_type === 'contacts' ? 'selected' : ''}>Contacts</option>
                <option value="workflows" ${filter?.entity_type === 'workflows' ? 'selected' : ''}>Workflows</option>
                <option value="deliveries" ${filter?.entity_type === 'deliveries' ? 'selected' : ''}>Deliveries</option>
                <option value="segments" ${filter?.entity_type === 'segments' ? 'selected' : ''}>Segments</option>
                <option value="audiences" ${filter?.entity_type === 'audiences' ? 'selected' : ''}>Audiences</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Usage Count</label>
              <input type="number" id="filter-usage" class="form-input" value="${filter?.usage_count || 0}" min="0">
            </div>
            <div class="form-group form-grid-full">
              <label class="form-label">Conditions (JSON)</label>
              <textarea id="filter-conditions" class="form-input" rows="5">${JSON.stringify(filter?.conditions || {}, null, 2)}</textarea>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="loadPredefinedFilters()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Filter</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('content').innerHTML = content;
}

async function handlePredefinedFilterSubmit(event, filterId) {
  event.preventDefault();
  let conditions = {};
  try {
    const raw = document.getElementById('filter-conditions').value || '{}';
    conditions = JSON.parse(raw);
  } catch (error) {
    showToast('Invalid JSON in conditions', 'error');
    return;
  }
  
  const payload = {
    name: document.getElementById('filter-name').value,
    entity_type: document.getElementById('filter-entity').value,
    usage_count: parseInt(document.getElementById('filter-usage').value || '0', 10),
    conditions
  };
  
  try {
    showLoading();
    const isEdit = !!filterId;
    const url = isEdit ? `/api/predefined-filters/${filterId}` : '/api/predefined-filters';
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save filter');
    showToast(`Filter ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    loadPredefinedFilters();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function editPredefinedFilter(id) {
  try {
    showLoading();
    const response = await fetch(`/api/predefined-filters/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load filter');
    showPredefinedFilterForm(data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deletePredefinedFilter(id) {
  if (!confirm('Delete this filter?')) return;
  try {
    showLoading();
    const response = await fetch(`/api/predefined-filters/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete filter');
    showToast('Filter deleted', 'success');
    loadPredefinedFilters();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}
