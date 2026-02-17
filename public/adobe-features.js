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
let deliveriesFilters = {
  channel: 'all',
  status: 'all',
  search: ''
};

function clearDeliveriesFilters() {
  deliveriesFilters = { channel: 'all', status: 'all', search: '' };
  loadDeliveries();
}

function clearDeliveriesFilterTag(key) {
  if (key === 'channel') deliveriesFilters.channel = 'all';
  if (key === 'search') deliveriesFilters.search = '';
  if (key === 'status') deliveriesFilters.status = 'all';
  loadDeliveries();
}

function updateDeliveriesFilter(key, value) {
  deliveriesFilters[key] = value || 'all';
  if (key === 'search') {
    deliveriesFilters.search = value || '';
  if (typeof debounce === 'function') {
    debounce('deliveriesSearch', () => loadDeliveries(), 400);
    } else {
      loadDeliveries();
    }
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
    
    // Apply filters
    let filteredDeliveries = deliveries.filter(d => {
      if (deliveriesFilters.channel !== 'all' && d.channel !== deliveriesFilters.channel) return false;
      if (deliveriesFilters.status !== 'all' && d.status !== deliveriesFilters.status) return false;
      if (deliveriesFilters.search) {
        const s = deliveriesFilters.search.toLowerCase();
        if (!(d.name || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });

    const filterTags = [];
    if (deliveriesFilters.channel !== 'all') {
      filterTags.push({ key: 'channel', label: 'Channel', value: deliveriesFilters.channel });
    }
    if (deliveriesFilters.search) {
      filterTags.push({ key: 'search', label: 'Search', value: deliveriesFilters.search });
    }
    if (deliveriesFilters.status !== 'all') {
      filterTags.push({ key: 'status', label: 'Status', value: deliveriesFilters.status });
    }
    
    // Apply sorting — default to last modified (newest first)
    if (!currentTableSort.column) {
      currentTableSort.column = 'updated_at';
      currentTableSort.direction = 'desc';
    }
    const sortedDeliveries = applySorting(filteredDeliveries, currentTableSort.column);
    
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
          <td data-column-id="created_at">${d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</td>
          <td data-column-id="updated_at">${d.updated_at ? new Date(d.updated_at).toLocaleString() : '-'}</td>
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
      { id: 'created_at', label: 'Creation date' },
      { id: 'updated_at', label: 'Last modified' },
      { id: 'created_by', label: 'Created by' },
      { id: 'sent_at', label: 'Sent date' }
    ];
    
    const content = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${_afIco('<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>')} Deliveries</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <span id="sendgrid-status-badge"></span>
            <button class="btn btn-secondary btn-sm" onclick="openSendGridConfig()" title="Email Provider Settings">${_afIco('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', 14)} Brevo</button>
          <button class="btn btn-primary" onclick="showDeliveryForm()">+ Create Delivery</button>
          </div>
        </div>
        
        ${createTableToolbar({
          resultCount: filteredDeliveries.length,
          totalCount: deliveries.length,
          showColumnSelector: true,
          columns,
          viewKey: 'deliveries',
          showSearch: true,
          searchPlaceholder: 'Search deliveries...',
          searchValue: deliveriesFilters.search || '',
          onSearch: 'updateDeliveriesFilter("search", this.value)',
          filterTags,
          onClearTag: 'clearDeliveriesFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Channel',
              value: deliveriesFilters.channel,
              onChange: 'updateDeliveriesFilter("channel", this.value)',
              options: [
                { value: 'all', label: 'All channels' },
                { value: 'Email', label: 'Email' },
                { value: 'SMS', label: 'SMS' },
                { value: 'Push', label: 'Push' }
              ]
            },
            {
              type: 'select',
              label: 'Status',
              value: deliveriesFilters.status,
              onChange: 'updateDeliveriesFilter("status", this.value)',
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
                ${createSortableHeader('created_at', 'Creation date', currentTableSort)}
                ${createSortableHeader('updated_at', 'Last modified', currentTableSort)}
                ${createSortableHeader('created_by', 'Created by', currentTableSort)}
                ${createSortableHeader('sent_at', 'Sent date', currentTableSort)}
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="13" style="text-align: center; padding: 2rem; color: #6B7280;">No deliveries found</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('content').innerHTML = content;
    applyColumnVisibility('deliveries');
    _refreshSendGridBadge();
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
  testProfile: null,       // Selected test contact for personalization
  testProfileSearch: [],   // Contact search results for the picker
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
        <div class="wizard-actions" style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-secondary" onclick="saveDeliveryDraft()">Save</button>
          <button class="btn-back" onclick="loadDeliveries()" title="Back to Deliveries">${BACK_CHEVRON}</button>
        </div>
      </div>
      <div class="wizard-steps">${stepper}</div>
      <div id="delivery-step-content"></div>
      <div class="wizard-nav">
        ${deliveryWizard.currentStep > 1 ? '<button class="btn btn-secondary" onclick="prevDeliveryStep()">Back</button>' : '<div></div>'}
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
            <label class="form-label">Delivery Timing</label>
            <div style="display:flex;gap:0;border:1px solid var(--border-default, #e2e8f0);border-radius:8px;overflow:hidden;margin-bottom:8px">
              <button class="btn ${!d.scheduled_at ? 'btn-primary' : 'btn-ghost'}" style="flex:1;border-radius:0;border:none;padding:8px 12px;font-size:12px" onclick="clearDeliverySchedule()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><polygon points="6 3 20 12 6 21 6 3"/></svg> Send immediately
              </button>
              <button class="btn ${d.scheduled_at ? 'btn-primary' : 'btn-ghost'}" style="flex:1;border-radius:0;border:none;border-left:1px solid var(--border-default, #e2e8f0);padding:8px 12px;font-size:12px" onclick="showDeliverySchedulePicker()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Schedule
              </button>
            </div>
            <div id="delivery-schedule-picker" style="display:${d.scheduled_at ? 'block' : 'none'}">
            <input type="datetime-local" class="form-input" value="${scheduleValue}" onchange="updateDeliveryField('scheduled_at', this.value)">
              <span class="form-helper">Date and time to send</span>
            </div>
            ${!d.scheduled_at ? '<span class="form-helper" style="color:var(--color-success, #10b981)">Sent as soon as published</span>' : ''}
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
      const sampleTemplates = templates.filter(t => t.sample);
      const savedTemplates = templates.filter(t => !t.sample);
      const abEnabled = !!d.ab_test_enabled;
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (Email Designer)</h3>
          <div class="form-group form-grid-full">
            <label class="form-label">Select a design template</label>
            <div class="dw-template-section">
              <div class="dw-template-tabs">
                <button class="dw-tmpl-tab active" onclick="_dwSwitchTemplateTab(this, 'sample')">Sample templates (${sampleTemplates.length})</button>
                <button class="dw-tmpl-tab" onclick="_dwSwitchTemplateTab(this, 'saved')">Saved templates (${savedTemplates.length})</button>
              </div>
              <div class="dw-template-grid" id="dw-template-grid">
                ${_dwRenderTemplateCards(sampleTemplates)}
              </div>
              <input type="hidden" id="delivery-template-select" value="">
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn btn-secondary btn-sm" onclick="saveTemplateFromEmail()">Save current as template</button>
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
    } else if (d.channel === 'SMS') {
      const smsMsg = d.content || '';
      const smsCharCount = smsMsg.length;
      const smsSegments = smsCharCount <= 160 ? 1 : Math.ceil(smsCharCount / 153);
      const optOut = d.sms_opt_out !== false;
      const optOutText = 'Reply STOP to unsubscribe';
      const previewText = smsMsg + (optOut ? '\n\n' + optOutText : '');
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (SMS)</h3>
          <div class="sms-editor-layout">
            <div class="sms-editor-panel">
          <div class="form-group form-grid-full">
                <label class="form-label">Sender ID</label>
                <div class="personalize-input-row">
                  <input type="text" class="form-input" id="sms-sender-input" value="${d.sms_sender_id || ''}" placeholder="e.g. MyBrand or +1555..." oninput="updateDeliveryField('sms_sender_id', this.value)">
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('sms-sender-input', 'sms_sender_id')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <span class="form-helper">Alphanumeric (max 11 chars) or phone number</span>
          </div>
          <div class="form-group form-grid-full">
            <label class="form-label">Message</label>
                <div class="personalize-input-row">
                  <textarea class="form-input sms-textarea" rows="5" maxlength="1600" id="sms-message-input" oninput="updateSmsContent(this.value)">${smsMsg}</textarea>
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('sms-message-input', 'content')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="sms-char-bar">
                  <div class="sms-char-count">
                    <span id="sms-char-num">${smsCharCount}</span> characters
                    <span class="sms-char-sep">&middot;</span>
                    <span id="sms-seg-num">${smsSegments}</span> segment${smsSegments !== 1 ? 's' : ''}
                  </div>
                  <div class="sms-char-limit ${smsCharCount > 160 ? 'warn' : ''}">${smsCharCount <= 160 ? 160 - smsCharCount + ' remaining' : 'Multi-segment'}</div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <div class="ai-compose-card" id="sms-ai-card">
                  <div class="ai-compose-header" onclick="toggleAiCompose('sms')">
                    <div class="ai-compose-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      AI Compose
                    </div>
                    <svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div class="ai-compose-body" id="sms-ai-body" style="display:none">
                    <div class="ai-compose-row">
                      <div class="ai-compose-field">
                        <label class="form-label">What should the SMS be about?</label>
                        <textarea class="form-input" rows="2" id="sms-ai-prompt" placeholder="e.g. Flash sale on winter jackets, 40% off for VIP customers..."></textarea>
                      </div>
                    </div>
                    <div class="ai-compose-row ai-compose-settings">
                      <div class="ai-compose-field">
                        <label class="form-label">Tone</label>
                        <select class="form-input" id="sms-ai-tone">
                          <option value="professional">Professional</option>
                          <option value="friendly" selected>Friendly</option>
                          <option value="casual">Casual</option>
                          <option value="urgent">Urgent</option>
                          <option value="playful">Playful</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Length</label>
                        <select class="form-input" id="sms-ai-length">
                          <option value="short">Short (&lt;100 chars)</option>
                          <option value="medium" selected>Medium (120-150)</option>
                          <option value="long">Full segment (160)</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Language</label>
                        <select class="form-input" id="sms-ai-lang">
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Portuguese">Portuguese</option>
                          <option value="Italian">Italian</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>
                    </div>
                    <div class="ai-compose-actions">
                      <button class="btn btn-primary btn-sm" onclick="aiComposeSms('generate')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        Generate
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="aiComposeSms('refine')" ${smsMsg ? '' : 'disabled'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Refine Current
                      </button>
                    </div>
                    <div class="ai-compose-results" id="sms-ai-results"></div>
                  </div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Options</label>
                <div class="sms-options">
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${optOut ? 'checked' : ''} onchange="updateDeliveryField('sms_opt_out', this.checked); rerenderSmsPreview();">
                    <span>Auto-append opt-out message</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.sms_shorten_links ? 'checked' : ''} onchange="updateDeliveryField('sms_shorten_links', this.checked)">
                    <span>Shorten & track links</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.sms_unicode ? 'checked' : ''} onchange="updateDeliveryField('sms_unicode', this.checked)">
                    <span>Allow Unicode characters</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="sms-preview-panel">
              <div class="phone-mockup">
                <div class="phone-notch"></div>
                <div class="phone-status-bar">
                  <span>9:41</span>
                  <span class="phone-status-icons">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>
                  </span>
                </div>
                <div class="phone-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  <span class="phone-header-title">${d.sms_sender_id || 'Brand'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <div class="phone-messages" id="sms-preview-messages">
                  ${previewText ? '<div class="sms-bubble">' + previewText.replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>'}
                </div>
                <div class="phone-input-bar">
                  <div class="phone-input-field">Text Message</div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#007AFF" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (d.channel === 'Push') {
      const pushTitle = d.subject || '';
      const pushBody = d.content || '';
      const pushImage = d.push_image || '';
      const pushAction = d.push_action_url || '';
      const pushBtn1 = d.push_button_1 || '';
      const pushBtn2 = d.push_button_2 || '';
      const pushPlatform = d.push_platform || 'both';
      html = `
        <div class="form-section compact-form">
          <h3 class="form-section-title">3. Content (Push Notification)</h3>
          <div class="push-editor-layout">
            <div class="push-editor-panel">
              <div class="form-group form-grid-full">
                <label class="form-label form-label-required">Title</label>
                <div class="personalize-input-row">
                  <input type="text" class="form-input" value="${pushTitle}" maxlength="65" id="push-title-input" oninput="updatePushContent('subject', this.value)">
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('push-title-input', 'subject')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="push-char-count"><span id="push-title-chars">${pushTitle.length}</span>/65</div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label form-label-required">Body</label>
                <div class="personalize-input-row">
                  <textarea class="form-input" rows="3" maxlength="240" id="push-body-input" oninput="updatePushContent('content', this.value)">${pushBody}</textarea>
                  <button class="btn btn-icon personalize-btn" type="button" title="Insert personalization" onclick="openDeliveryPersonalizer('push-body-input', 'content')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg></button>
                </div>
                <div class="push-char-count"><span id="push-body-chars">${pushBody.length}</span>/240</div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Rich Media Image</label>
                <input type="text" class="form-input" value="${pushImage}" placeholder="https://example.com/image.png" oninput="updateDeliveryField('push_image', this.value); rerenderPushPreview();">
                <span class="form-helper">Recommended: 1024x512px, JPEG or PNG, max 1 MB</span>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">On-Tap Action URL</label>
                <input type="text" class="form-input" value="${pushAction}" placeholder="https://yourapp.com/deeplink" oninput="updateDeliveryField('push_action_url', this.value)">
                <span class="form-helper">Where the user goes when they tap the notification</span>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Action Buttons (optional)</label>
                <div class="push-action-btns">
                  <input type="text" class="form-input" value="${pushBtn1}" placeholder="Button 1 label" oninput="updateDeliveryField('push_button_1', this.value); rerenderPushPreview();">
                  <input type="text" class="form-input" value="${pushBtn2}" placeholder="Button 2 label" oninput="updateDeliveryField('push_button_2', this.value); rerenderPushPreview();">
                </div>
              </div>
              <div class="form-group form-grid-full">
                <div class="ai-compose-card" id="push-ai-card">
                  <div class="ai-compose-header" onclick="toggleAiCompose('push')">
                    <div class="ai-compose-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      AI Compose
                    </div>
                    <svg class="ai-compose-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                  <div class="ai-compose-body" id="push-ai-body" style="display:none">
                    <div class="ai-compose-row">
                      <div class="ai-compose-field">
                        <label class="form-label">What should the notification be about?</label>
                        <textarea class="form-input" rows="2" id="push-ai-prompt" placeholder="e.g. New arrivals in summer collection, re-engage inactive users..."></textarea>
                      </div>
                    </div>
                    <div class="ai-compose-row ai-compose-settings">
                      <div class="ai-compose-field">
                        <label class="form-label">Tone</label>
                        <select class="form-input" id="push-ai-tone">
                          <option value="professional">Professional</option>
                          <option value="friendly" selected>Friendly</option>
                          <option value="casual">Casual</option>
                          <option value="urgent">Urgent</option>
                          <option value="playful">Playful</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      <div class="ai-compose-field">
                        <label class="form-label">Language</label>
                        <select class="form-input" id="push-ai-lang">
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Portuguese">Portuguese</option>
                          <option value="Italian">Italian</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>
                    </div>
                    <div class="ai-compose-actions">
                      <button class="btn btn-primary btn-sm" onclick="aiComposePush('generate')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        Generate
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="aiComposePush('refine')" ${pushTitle || pushBody ? '' : 'disabled'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Refine Current
                      </button>
                    </div>
                    <div class="ai-compose-results" id="push-ai-results"></div>
                  </div>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Target Platform</label>
                <div class="push-platform-bar">
                  <label class="push-platform-opt ${pushPlatform === 'both' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="both" ${pushPlatform === 'both' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'both'); updatePushPlatformUI();">
                    Both
                  </label>
                  <label class="push-platform-opt ${pushPlatform === 'ios' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="ios" ${pushPlatform === 'ios' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'ios'); updatePushPlatformUI();">
                    iOS
                  </label>
                  <label class="push-platform-opt ${pushPlatform === 'android' ? 'active' : ''}">
                    <input type="radio" name="push_platform" value="android" ${pushPlatform === 'android' ? 'checked' : ''} onchange="updateDeliveryField('push_platform', 'android'); updatePushPlatformUI();">
                    Android
                  </label>
                </div>
              </div>
              <div class="form-group form-grid-full">
                <label class="form-label">Options</label>
                <div class="sms-options">
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_sound !== false ? 'checked' : ''} onchange="updateDeliveryField('push_sound', this.checked)">
                    <span>Play notification sound</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_badge ? 'checked' : ''} onchange="updateDeliveryField('push_badge', this.checked)">
                    <span>Update app badge count</span>
                  </label>
                  <label class="sms-option-toggle">
                    <input type="checkbox" ${d.push_collapse ? 'checked' : ''} onchange="updateDeliveryField('push_collapse', this.checked)">
                    <span>Collapse with previous notifications</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="push-preview-panel">
              <div class="phone-mockup phone-mockup-push">
                <div class="phone-notch"></div>
                <div class="phone-status-bar">
                  <span>9:41</span>
                  <span class="phone-status-icons">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="4" height="12" rx="1"/><rect x="7" y="4" width="4" height="14" rx="1"/><rect x="13" y="2" width="4" height="16" rx="1"/><rect x="19" y="8" width="4" height="10" rx="1"/></svg>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>
                  </span>
                </div>
                <div class="phone-lockscreen">
                  <div class="phone-lock-time">9:41</div>
                  <div class="phone-lock-date">Thursday, February 5</div>
                  <div class="push-notification-card" id="push-preview-card">
                    <div class="push-notif-header">
                      <div class="push-notif-app-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      </div>
                      <span class="push-notif-app-name">YOUR APP</span>
                      <span class="push-notif-time">now</span>
                    </div>
                    <div class="push-notif-body">
                      <div class="push-notif-text">
                        <div class="push-notif-title" id="push-preview-title">${pushTitle || 'Notification Title'}</div>
                        <div class="push-notif-message" id="push-preview-body">${pushBody || 'Your notification message will appear here...'}</div>
                      </div>
                      ${pushImage ? '<img class="push-notif-thumb" src="' + pushImage + '" alt="">' : ''}
                    </div>
                    ${pushImage ? '<img class="push-notif-rich-image" src="' + pushImage + '" alt="" id="push-preview-image">' : '<div class="push-notif-rich-image push-notif-image-placeholder" id="push-preview-image" style="display:none"></div>'}
                    ${(pushBtn1 || pushBtn2) ? '<div class="push-notif-actions">' + (pushBtn1 ? '<button class="push-notif-action">' + pushBtn1 + '</button>' : '') + (pushBtn2 ? '<button class="push-notif-action">' + pushBtn2 + '</button>' : '') + '</div>' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  if (step === 4) {
    const tp = deliveryWizard.testProfile;
    const merge = (text) => tp ? clientMergePersonalization(text, tp) : text;
    let previewContent = '';
    let checksHtml = '';
    if (d.channel === 'Email') {
      const rawPreviewHtml = d.html_output || generateEmailHtml(getCurrentBlocks());
      const previewHtml = merge(rawPreviewHtml);
      const previewSubject = merge(d.subject || '');
      const checks = runDeliverabilityChecks(d.subject, rawPreviewHtml);
      checksHtml = checks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        ${previewSubject ? `<div class="preview-subject-bar"><strong>Subject:</strong> ${previewSubject}</div>` : ''}
        <div class="email-preview">${previewHtml}</div>`;
    } else if (d.channel === 'SMS') {
      const smsMsg = merge(d.content || '');
      const optOut = d.sms_opt_out !== false;
      const optOutText = 'Reply STOP to unsubscribe';
      const fullMsg = smsMsg + (optOut && smsMsg ? '\n\n' + optOutText : '');
      const smsLen = (d.content || '').length;
      const smsSegs = smsLen <= 160 ? 1 : Math.ceil(smsLen / 153);
      const smsChecks = [
        { ok: smsLen > 0, message: smsLen > 0 ? 'Message content is not empty' : 'Message content is empty' },
        { ok: smsLen <= 160, message: smsLen <= 160 ? 'Single segment (' + smsLen + '/160 chars)' : 'Multi-segment: ' + smsSegs + ' segments (' + smsLen + ' chars)' },
        { ok: !!d.sms_sender_id, message: d.sms_sender_id ? 'Sender ID is set' : 'Sender ID is missing' },
        { ok: optOut, message: optOut ? 'Opt-out message included' : 'No opt-out message — may violate regulations' }
      ];
      checksHtml = smsChecks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        <div class="preview-device-center">
          <div class="phone-mockup phone-mockup-sm">
            <div class="phone-notch"></div>
            <div class="phone-header">
              <span class="phone-header-title">${merge(d.sms_sender_id || 'Brand')}</span>
            </div>
            <div class="phone-messages">
              ${fullMsg ? '<div class="sms-bubble">' + fullMsg.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>' : '<div class="sms-bubble sms-bubble-placeholder">No message content</div>'}
            </div>
          </div>
        </div>`;
    } else if (d.channel === 'Push') {
      const pushSubject = merge(d.subject || '');
      const pushContent = merge(d.content || '');
      const pushChecks = [
        { ok: !!(d.subject), message: d.subject ? 'Title is set' : 'Title is missing' },
        { ok: !!(d.content), message: d.content ? 'Body is set' : 'Body is missing' },
        { ok: (d.subject || '').length <= 65, message: (d.subject || '').length <= 65 ? 'Title within limit (' + (d.subject || '').length + '/65)' : 'Title too long (' + (d.subject || '').length + '/65)' },
        { ok: (d.content || '').length <= 240, message: (d.content || '').length <= 240 ? 'Body within limit (' + (d.content || '').length + '/240)' : 'Body too long (' + (d.content || '').length + '/240)' },
        { ok: !!(d.push_action_url), message: d.push_action_url ? 'On-tap action URL set' : 'No on-tap action URL — notification will just open the app' }
      ];
      checksHtml = pushChecks.map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.message}</li>`).join('');
      previewContent = `
        <div class="preview-device-center">
          <div class="phone-mockup phone-mockup-push phone-mockup-sm">
            <div class="phone-notch"></div>
            <div class="phone-lockscreen">
              <div class="phone-lock-time">9:41</div>
              <div class="phone-lock-date">Thursday, February 5</div>
              <div class="push-notification-card">
                <div class="push-notif-header">
                  <div class="push-notif-app-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <span class="push-notif-app-name">YOUR APP</span>
                  <span class="push-notif-time">now</span>
                </div>
                <div class="push-notif-body">
                  <div class="push-notif-text">
                    <div class="push-notif-title">${pushSubject || 'Notification Title'}</div>
                    <div class="push-notif-message">${pushContent || 'Message body'}</div>
                  </div>
                </div>
                ${d.push_image ? '<img class="push-notif-rich-image" src="' + d.push_image + '" alt="">' : ''}
                ${(d.push_button_1 || d.push_button_2) ? '<div class="push-notif-actions">' + (d.push_button_1 ? '<button class="push-notif-action">' + d.push_button_1 + '</button>' : '') + (d.push_button_2 ? '<button class="push-notif-action">' + d.push_button_2 + '</button>' : '') + '</div>' : ''}
              </div>
            </div>
          </div>
        </div>`;
    }
    html = `
      <div class="form-section compact-form">
        <h3 class="form-section-title">4. Preview & Proof</h3>
        ${buildTestProfilePickerHtml()}
        ${previewContent}
        <div class="form-group">
          <label class="form-label">${d.channel === 'Email' ? 'Deliverability' : 'Validation'} Checks</label>
          <ul class="deliverability-list">
            ${checksHtml}
          </ul>
        </div>
        ${d.channel === 'Email' ? `
        <div class="form-group">
          <label class="form-label">Proof Emails (comma separated)</label>
          <input type="text" class="form-input" value="${(d.proof_emails || []).join(', ')}" oninput="updateProofEmails(this.value)">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendProofEmails()">Send Proof</button>
        </div>
        ` : d.channel === 'SMS' ? `
        <div class="form-group">
          <label class="form-label">Test Phone Number</label>
          <input type="text" class="form-input" placeholder="+1 555-0100" id="sms-test-number">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendTestSms()">Send Test SMS</button>
        </div>
        ` : `
        <div class="form-group">
          <label class="form-label">Test Device Token or Email</label>
          <input type="text" class="form-input" placeholder="Device token or email" id="push-test-target">
        </div>
        <div class="form-inline-actions">
          <button class="btn btn-secondary" onclick="sendTestPush()">Send Test Push</button>
        </div>
        `}
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
          <div><strong>Delivery:</strong> ${d.scheduled_at ? 'Scheduled for ' + new Date(d.scheduled_at).toLocaleString() : 'Send immediately on publish'}</div>
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

function showDeliverySchedulePicker() {
  // If no scheduled_at yet, set a default (tomorrow at 10am)
  if (!deliveryWizard.data.scheduled_at) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    deliveryWizard.data.scheduled_at = tomorrow.toISOString().slice(0, 16);
  }
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

// ============================================
// DELIVERY PERSONALIZATION PICKER (shared by SMS & Push)
// ============================================
let _deliveryPersonalizeState = {
  targetInputId: null,
  targetField: null,
  tables: [],
  loaded: false
};

async function openDeliveryPersonalizer(inputId, field) {
  _deliveryPersonalizeState.targetInputId = inputId;
  _deliveryPersonalizeState.targetField = field;

  // Create or show the picker popover
  let picker = document.getElementById('delivery-personalize-picker');
  if (!picker) {
    picker = document.createElement('div');
    picker.id = 'delivery-personalize-picker';
    picker.className = 'dp-picker';
    picker.innerHTML = '<div class="dp-picker-header">'
      + '<span class="dp-picker-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg> Personalization</span>'
      + '<button class="dp-picker-close" onclick="closeDeliveryPersonalizer()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>'
      + '</div>'
      + '<div class="dp-picker-search"><input type="text" class="form-input" placeholder="Search entities & attributes..." oninput="filterDeliveryPersonalizer(this.value)"></div>'
      + '<div class="dp-picker-body" id="dp-picker-body"><div class="dp-picker-loading">Loading entities...</div></div>';
    document.body.appendChild(picker);
  }

  // Position next to the button that was clicked
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  picker.style.top = rect.bottom + 4 + 'px';
  picker.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';
  picker.classList.add('open');

  // Load tables if needed
  if (!_deliveryPersonalizeState.loaded) {
    try {
      const resp = await fetch(API_BASE + '/query/tables');
      const data = await resp.json();
      _deliveryPersonalizeState.tables = data.tables || [];
      _deliveryPersonalizeState.loaded = true;
    } catch (e) {
      _deliveryPersonalizeState.tables = [];
    }
  }
  renderDeliveryPersonalizerTree(_deliveryPersonalizeState.tables);
}

function closeDeliveryPersonalizer() {
  const picker = document.getElementById('delivery-personalize-picker');
  if (picker) picker.classList.remove('open');
}

// Close when clicking outside
document.addEventListener('click', function(e) {
  const picker = document.getElementById('delivery-personalize-picker');
  if (!picker || !picker.classList.contains('open')) return;
  if (picker.contains(e.target)) return;
  if (e.target.closest('.personalize-btn')) return;
  closeDeliveryPersonalizer();
});

function renderDeliveryPersonalizerTree(tables) {
  const body = document.getElementById('dp-picker-body');
  if (!body) return;
  if (!tables.length) {
    body.innerHTML = '<div class="dp-picker-empty">No entities found.</div>';
    return;
  }
  body.innerHTML = tables.map(function(table) {
    var cols = (table.fields || []).map(function(col) {
      return '<button type="button" class="dp-attr-item" onclick="insertDeliveryToken(\'' + table.name + '\', \'' + col + '\')">'
        + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/></svg>'
        + '<span class="dp-attr-name">' + col + '</span>'
        + '</button>';
    }).join('');
    return '<div class="dp-entity" data-entity="' + table.name + '">'
      + '<button type="button" class="dp-entity-row" onclick="toggleDpEntity(\'' + table.name + '\')">'
      + '<svg class="dp-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>'
      + '<span class="dp-entity-name">' + table.name + '</span>'
      + '<span class="dp-entity-count">' + (table.fields || []).length + '</span>'
      + '</button>'
      + '<div class="dp-attr-list">' + cols + '</div>'
      + '</div>';
  }).join('');
}

function toggleDpEntity(name) {
  var el = document.querySelector('.dp-entity[data-entity="' + name + '"]');
  if (el) el.classList.toggle('open');
}

function filterDeliveryPersonalizer(query) {
  var q = (query || '').toLowerCase();
  if (!q) {
    renderDeliveryPersonalizerTree(_deliveryPersonalizeState.tables);
    return;
  }
  var filtered = _deliveryPersonalizeState.tables.map(function(table) {
    var fields = (table.fields || []).filter(function(f) { return f.toLowerCase().indexOf(q) >= 0; });
    var matchesTable = table.name.toLowerCase().indexOf(q) >= 0;
    if (matchesTable) return table;
    if (fields.length) return { name: table.name, count: table.count, fields: fields };
    return null;
  }).filter(Boolean);
  renderDeliveryPersonalizerTree(filtered);
  // Auto-expand matched entities
  filtered.forEach(function(t) {
    var el = document.querySelector('.dp-entity[data-entity="' + t.name + '"]');
    if (el) el.classList.add('open');
  });
}

function insertDeliveryToken(entity, attribute) {
  var token = '{{' + entity + '.' + attribute + '}}';
  var inputId = _deliveryPersonalizeState.targetInputId;
  var field = _deliveryPersonalizeState.targetField;
  var input = document.getElementById(inputId);
  if (!input) { closeDeliveryPersonalizer(); return; }
  var start = input.selectionStart || input.value.length;
  var end = input.selectionEnd || input.value.length;
  var val = input.value;
  input.value = val.substring(0, start) + token + val.substring(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + token.length;

  // Update the delivery data and preview
  if (field === 'content') {
    if (deliveryWizard.data.channel === 'SMS') {
      updateSmsContent(input.value);
    } else {
      updatePushContent('content', input.value);
    }
  } else if (field === 'subject') {
    updatePushContent('subject', input.value);
  } else if (field === 'sms_sender_id') {
    updateDeliveryField('sms_sender_id', input.value);
  } else if (field) {
    updateDeliveryField(field, input.value);
  }
  closeDeliveryPersonalizer();
}

// ============================================
// SMS EDITOR HELPERS
// ============================================
function updateSmsContent(value) {
  deliveryWizard.data.content = value;
  const len = value.length;
  const segments = len <= 160 ? 1 : Math.ceil(len / 153);
  const charEl = document.getElementById('sms-char-num');
  const segEl = document.getElementById('sms-seg-num');
  if (charEl) charEl.textContent = len;
  if (segEl) segEl.textContent = segments;
  const limitEl = document.querySelector('.sms-char-limit');
  if (limitEl) {
    if (len <= 160) {
      limitEl.textContent = (160 - len) + ' remaining';
      limitEl.classList.remove('warn');
    } else {
      limitEl.textContent = 'Multi-segment';
      limitEl.classList.add('warn');
    }
  }
  rerenderSmsPreview();
}

function rerenderSmsPreview() {
  const container = document.getElementById('sms-preview-messages');
  if (!container) return;
  const d = deliveryWizard.data;
  const msg = d.content || '';
  const optOut = d.sms_opt_out !== false;
  const optOutText = 'Reply STOP to unsubscribe';
  const full = msg + (optOut && msg ? '\n\n' + optOutText : '');
  if (full) {
    container.innerHTML = '<div class="sms-bubble">' + full.replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</div>';
  } else {
    container.innerHTML = '<div class="sms-bubble sms-bubble-placeholder">Your message preview will appear here...</div>';
  }
}

// ============================================
// PUSH EDITOR HELPERS
// ============================================
function updatePushContent(field, value) {
  deliveryWizard.data[field] = value;
  if (field === 'subject') {
    const charsEl = document.getElementById('push-title-chars');
    if (charsEl) charsEl.textContent = value.length;
    const previewEl = document.getElementById('push-preview-title');
    if (previewEl) previewEl.textContent = value || 'Notification Title';
  }
  if (field === 'content') {
    const charsEl = document.getElementById('push-body-chars');
    if (charsEl) charsEl.textContent = value.length;
    const previewEl = document.getElementById('push-preview-body');
    if (previewEl) previewEl.textContent = value || 'Your notification message will appear here...';
  }
}

function rerenderPushPreview() {
  const d = deliveryWizard.data;
  const titleEl = document.getElementById('push-preview-title');
  const bodyEl = document.getElementById('push-preview-body');
  const imgEl = document.getElementById('push-preview-image');
  if (titleEl) titleEl.textContent = d.subject || 'Notification Title';
  if (bodyEl) bodyEl.textContent = d.content || 'Your notification message will appear here...';
  if (imgEl) {
    if (d.push_image) {
      imgEl.src = d.push_image;
      imgEl.style.display = 'block';
      imgEl.classList.remove('push-notif-image-placeholder');
    } else {
      imgEl.style.display = 'none';
    }
  }
  // Update action buttons
  const card = document.getElementById('push-preview-card');
  if (card) {
    let actionsEl = card.querySelector('.push-notif-actions');
    if (d.push_button_1 || d.push_button_2) {
      if (!actionsEl) {
        actionsEl = document.createElement('div');
        actionsEl.className = 'push-notif-actions';
        card.appendChild(actionsEl);
      }
      actionsEl.innerHTML = (d.push_button_1 ? '<button class="push-notif-action">' + d.push_button_1 + '</button>' : '')
        + (d.push_button_2 ? '<button class="push-notif-action">' + d.push_button_2 + '</button>' : '');
    } else if (actionsEl) {
      actionsEl.remove();
    }
  }
}

function updatePushPlatformUI() {
  document.querySelectorAll('.push-platform-opt').forEach(el => {
    el.classList.toggle('active', el.querySelector('input').checked);
  });
}

// ============================================
// AI COMPOSE FUNCTIONS (SMS & Push)
// ============================================
function toggleAiCompose(channel) {
  const body = document.getElementById(channel + '-ai-body');
  const card = document.getElementById(channel + '-ai-card');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (card) card.classList.toggle('open', !isOpen);
}

async function aiComposeSms(action) {
  const promptEl = document.getElementById('sms-ai-prompt');
  const prompt = promptEl ? promptEl.value.trim() : '';
  const tone = document.getElementById('sms-ai-tone')?.value || 'friendly';
  const length = document.getElementById('sms-ai-length')?.value || 'medium';
  const lang = document.getElementById('sms-ai-lang')?.value || 'English';
  const currentMessage = deliveryWizard.data.content || '';

  if (action === 'generate' && !prompt) {
    showToast('Please describe what the SMS should be about', 'warning');
    return;
  }

  const resultsEl = document.getElementById('sms-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating messages...</div>';

  try {
    const resp = await fetch(API_BASE + '/ai/generate-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone, length, language: lang, currentMessage, action })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Generation failed');

    const messages = data.messages || [];
    if (!messages.length) {
      if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions generated. Try a different prompt.</div>';
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined variations' : 'Generated messages') + '</div>'
        + messages.map(function(msg, i) {
          var chars = msg.length;
          var segs = chars <= 160 ? 1 : Math.ceil(chars / 153);
          return '<div class="ai-result-card" onclick="applySmsAiResult(this)">'
            + '<div class="ai-result-text">' + msg.replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-meta">'
            + '<span>' + chars + ' chars &middot; ' + segs + ' segment' + (segs > 1 ? 's' : '') + '</span>'
            + '<button class="btn btn-sm btn-primary ai-result-apply">Use this</button>'
            + '</div>'
            + '</div>';
        }).join('');
    }
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>';
  }
}

function applySmsAiResult(card) {
  var textEl = card.querySelector('.ai-result-text');
  if (!textEl) return;
  var text = textEl.textContent;
  var ta = document.getElementById('sms-message-input');
  if (ta) {
    ta.value = text;
    updateSmsContent(text);
  }
  showToast('Message applied', 'success');
}

async function aiComposePush(action) {
  var promptEl = document.getElementById('push-ai-prompt');
  var prompt = promptEl ? promptEl.value.trim() : '';
  var tone = document.getElementById('push-ai-tone')?.value || 'friendly';
  var lang = document.getElementById('push-ai-lang')?.value || 'English';
  var currentTitle = deliveryWizard.data.subject || '';
  var currentBody = deliveryWizard.data.content || '';

  if (action === 'generate' && !prompt) {
    showToast('Please describe what the notification should be about', 'warning');
    return;
  }

  var resultsEl = document.getElementById('push-ai-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-loading"><div class="spinner-sm"></div> Generating notifications...</div>';

  try {
    var resp = await fetch(API_BASE + '/ai/generate-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone, language: lang, currentTitle, currentBody, action })
    });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Generation failed');

    var notifications = data.notifications || [];
    if (!notifications.length) {
      if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">No suggestions generated. Try a different prompt.</div>';
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = '<div class="ai-results-title">' + (action === 'refine' ? 'Refined variations' : 'Generated notifications') + '</div>'
        + notifications.map(function(n, i) {
          return '<div class="ai-result-card" onclick="applyPushAiResult(' + i + ')" data-title="' + (n.title || '').replace(/"/g, '&quot;') + '" data-body="' + (n.body || '').replace(/"/g, '&quot;') + '">'
            + '<div class="ai-result-push-title">' + (n.title || '').replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-text">' + (n.body || '').replace(/</g, '&lt;') + '</div>'
            + '<div class="ai-result-meta">'
            + '<span>Title: ' + (n.title || '').length + '/65 &middot; Body: ' + (n.body || '').length + '/240</span>'
            + '<button class="btn btn-sm btn-primary ai-result-apply">Use this</button>'
            + '</div>'
            + '</div>';
        }).join('');
    }
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = '<div class="ai-compose-empty">Error: ' + e.message + '</div>';
  }
}

function applyPushAiResult(index) {
  var cards = document.querySelectorAll('#push-ai-results .ai-result-card');
  var card = cards[index];
  if (!card) return;
  var title = card.dataset.title || '';
  var body = card.dataset.body || '';
  var titleInput = document.getElementById('push-title-input');
  var bodyInput = document.getElementById('push-body-input');
  if (titleInput) { titleInput.value = title; updatePushContent('subject', title); }
  if (bodyInput) { bodyInput.value = body; updatePushContent('content', body); }
  rerenderPushPreview();
  showToast('Notification applied', 'success');
}

function sendTestSms() {
  const num = document.getElementById('sms-test-number');
  const phone = num ? num.value.trim() : '';
  if (!phone) { showToast('Enter a phone number', 'warning'); return; }
  showToast('Test SMS sent to ' + phone, 'success');
}

function sendTestPush() {
  const el = document.getElementById('push-test-target');
  const target = el ? el.value.trim() : '';
  if (!target) { showToast('Enter a device token or email', 'warning'); return; }
  showToast('Test push notification sent to ' + target, 'success');
}

function updateProofEmails(value) {
  const emails = value.split(',').map(v => v.trim()).filter(Boolean);
  deliveryWizard.data.proof_emails = emails;
}

// ── Client-side personalization merge ──
function clientMergePersonalization(text, profile) {
  if (!text || !profile) return text;
  return text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
    if (profile[field] !== undefined && profile[field] !== null) return String(profile[field]);
    return match;
  });
}

// ── Test Profile (contact) picker for proof and preview personalization ──
let _testProfileDebounce = null;
async function searchTestProfiles(query) {
  clearTimeout(_testProfileDebounce);
  if (!query || query.length < 2) {
    deliveryWizard.testProfileSearch = [];
    renderTestProfileResults();
    return;
  }
  _testProfileDebounce = setTimeout(async () => {
    try {
      const resp = await fetch(`${API_BASE}/contacts?search=${encodeURIComponent(query)}&limit=10`);
      const data = await resp.json();
      deliveryWizard.testProfileSearch = data.contacts || data || [];
      renderTestProfileResults();
    } catch (e) {
      deliveryWizard.testProfileSearch = [];
      renderTestProfileResults();
    }
  }, 300);
}

function renderTestProfileResults() {
  const list = document.getElementById('test-profile-results');
  if (!list) return;
  const results = deliveryWizard.testProfileSearch;
  if (!results.length) {
    list.innerHTML = '';
    list.classList.remove('open');
    return;
  }
  list.innerHTML = results.map(c => `
    <div class="test-profile-item" onclick="selectTestProfile(${c.id})">
      <span class="test-profile-name">${c.first_name || ''} ${c.last_name || ''}</span>
      <span class="test-profile-email">${c.email || ''}</span>
    </div>
  `).join('');
  list.classList.add('open');
}

function selectTestProfile(contactId) {
  const contact = deliveryWizard.testProfileSearch.find(c => c.id === contactId);
  if (!contact) return;
  deliveryWizard.testProfile = contact;
  deliveryWizard.testProfileSearch = [];
  // Re-render step 4 to update the preview with personalization
  renderDeliveryStepContent();
}

function clearTestProfile() {
  deliveryWizard.testProfile = null;
  renderDeliveryStepContent();
}

// Build the test profile picker HTML
function buildTestProfilePickerHtml() {
  const tp = deliveryWizard.testProfile;
  const selectedHtml = tp
    ? `<div class="test-profile-selected">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         <span class="test-profile-selected-name">${tp.first_name || ''} ${tp.last_name || ''}</span>
         <span class="test-profile-selected-email">(${tp.email || ''})</span>
         <button class="test-profile-clear" onclick="clearTestProfile()" title="Clear">&times;</button>
       </div>`
    : '';
  return `
    <div class="form-group">
      <label class="form-label">Test Profile (for personalization)</label>
      <div class="test-profile-picker">
        ${selectedHtml}
        <input type="text" class="form-input" placeholder="Search contacts by name or email..." 
               oninput="searchTestProfiles(this.value)" 
               value=""
               ${tp ? 'style="display:none"' : ''}>
        <div class="test-profile-results" id="test-profile-results"></div>
      </div>
      <span class="form-helper">Select a contact to replace personalization tokens in the preview and proof email</span>
    </div>
  `;
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
  const proofList = deliveryWizard.data.proof_emails || [];
  if (proofList.length === 0) {
    showToast('Enter at least one email address for proof', 'warning');
    return;
  }
  try {
    showLoading();
    const payload = { emails: proofList };
    // Include test profile for personalization if selected
    if (deliveryWizard.testProfile) {
      payload.test_profile_id = deliveryWizard.testProfile.id;
    }
    const response = await fetch(`/api/deliveries/${deliveryWizard.deliveryId}/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send proof emails');
    if (data.provider === 'brevo') {
      if (data.sent > 0) {
        showToast(`Proof email sent to ${data.sent} recipient(s) via Brevo`, 'success');
      } else {
        showToast(data.message || 'Failed to send proof — check Brevo configuration', 'error');
      }
    } else {
      showToast(data.message || 'Proof emails saved', 'success');
    }
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
  // Always save the latest wizard state (including any applied template)
  // before opening the editor, so the editor loads the current content.
    await saveDeliveryDraft();
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

function _dwRenderTemplateCards(templates) {
  const catColors = { onboarding: '#2563EB', promotional: '#DC2626', newsletter: '#7C3AED', transactional: '#059669', event: '#D97706', retention: '#0891B2', custom: '#6B7280' };
  const catLabels = { onboarding: 'Onboarding', promotional: 'Promotional', newsletter: 'Newsletter', transactional: 'Transactional', event: 'Event', retention: 'Retention', custom: 'Custom' };

  if (!templates.length) {
    return '<div style="padding:24px;text-align:center;color:#9ca3af;">No templates available</div>';
  }

  return templates.map(t => {
    const color = catColors[t.category] || '#6B7280';
    const label = catLabels[t.category] || t.category || 'Custom';
    return `
      <div class="dw-tmpl-card" onclick="_dwApplyTemplate(${t.id})">
        <div class="dw-tmpl-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div class="dw-tmpl-card-info">
          <span class="dw-tmpl-cat" style="color:${color};">${label}</span>
          <div class="dw-tmpl-name">${t.name || 'Untitled'}</div>
          <div class="dw-tmpl-desc">${t.description || ''}</div>
        </div>
        <button class="btn btn-primary btn-sm dw-tmpl-use" onclick="event.stopPropagation();_dwApplyTemplate(${t.id})">Use</button>
      </div>
    `;
  }).join('');
}

function _dwSwitchTemplateTab(btn, tab) {
  const allTabs = btn.parentElement.querySelectorAll('.dw-tmpl-tab');
  allTabs.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const templates = deliveryWizard.lists.templates || [];
  const filtered = tab === 'sample' ? templates.filter(t => t.sample) : templates.filter(t => !t.sample);
  const grid = document.getElementById('dw-template-grid');
  if (grid) grid.innerHTML = _dwRenderTemplateCards(filtered);
}

async function _dwApplyTemplate(id) {
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load template');
    deliveryWizard.data.subject = data.subject || '';
    if (Array.isArray(data.blocks)) {
      deliveryWizard.blocks = data.blocks;
    }
    if (data.html) {
      deliveryWizard.data.html_output = data.html;
    }
    showToast(`Template "${data.name}" applied`, 'success');
    renderDeliveryWizard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
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
  // Show a save-as-template modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dw-save-template-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:440px;">
      <div class="modal-header">
        <h3>Save as content template</h3>
        <button class="modal-close" onclick="document.getElementById('dw-save-template-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label form-label-required">Template name</label>
          <input class="form-input" id="dw-save-tmpl-name" placeholder="e.g. Welcome Email v2">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="dw-save-tmpl-desc" placeholder="Brief description">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="dw-save-tmpl-cat">
            <option value="custom">Custom</option>
            <option value="onboarding">Onboarding</option>
            <option value="promotional">Promotional</option>
            <option value="newsletter">Newsletter</option>
            <option value="transactional">Transactional</option>
            <option value="event">Event</option>
            <option value="retention">Retention</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('dw-save-template-modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="_dwDoSaveTemplate()">Save template</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('dw-save-tmpl-name').focus();
}

async function _dwDoSaveTemplate() {
  const name = document.getElementById('dw-save-tmpl-name')?.value?.trim();
  if (!name) { showToast('Please enter a template name', 'warning'); return; }
  const description = document.getElementById('dw-save-tmpl-desc')?.value?.trim() || '';
  const category = document.getElementById('dw-save-tmpl-cat')?.value || 'custom';

  const payload = {
    name,
    description,
    category,
    subject: deliveryWizard.data.subject || '',
    blocks: getCurrentBlocks(),
    html: generateEmailHtml(getCurrentBlocks()),
    status: 'published'
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
    document.getElementById('dw-save-template-modal')?.remove();
    showToast(`Template "${name}" saved!`, 'success');
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
      base.src = '';
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
    const providerLabel = data.provider === 'brevo' ? 'via Brevo' : '(simulated)';
    const detail = data.sent !== undefined ? ` — ${data.sent} sent` : '';
    showToast(`Delivery sent ${providerLabel}${detail}`, 'success');
    loadDeliveries();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ── Brevo Email Configuration ─────────────────────────────────
async function _refreshSendGridBadge() {
  try {
    const resp = await fetch('/api/deliveries/email-provider/status');
    const status = await resp.json();
    const badge = document.getElementById('sendgrid-status-badge');
    if (!badge) return;
    if (status.has_credentials && status.enabled) {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#dcfce7;color:#166534;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>Brevo Active</span>';
    } else if (status.has_credentials && !status.enabled) {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#f3e8ff;color:#6b21a8;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#a855f7;display:inline-block"></span>Brevo Paused</span>';
    } else {
      badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:#fef3c7;color:#92400e;border-radius:9999px;font-size:11px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>Simulated</span>';
    }
  } catch (e) { /* ignore */ }
}

function openSendGridConfig() {
  fetch('/api/deliveries/email-provider/status')
    .then(r => r.json())
    .then(status => {
      const hasCreds = status.has_credentials;
      const isEnabled = status.enabled;
      const isActive = hasCreds && isEnabled;
      const isPaused = hasCreds && !isEnabled;

      let statusBg, statusHtml;
      if (isActive) {
        statusBg = '#dcfce7';
        statusHtml = '<strong style="color:#166534">Active</strong> — Emails will be sent via Brevo SMTP from <strong>' + status.from_email + '</strong>';
      } else if (isPaused) {
        statusBg = '#f3e8ff';
        statusHtml = '<strong style="color:#6b21a8">Paused</strong> — Credentials are saved but sending is disabled. Emails will be simulated.';
      } else {
        statusBg = '#fef3c7';
        statusHtml = '<strong style="color:#92400e">Not configured</strong> — Emails are simulated. Enter your Brevo SMTP credentials below to enable real sending.';
      }

      const overlay = document.createElement('div');
      overlay.id = 'brevo-config-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:24px;width:500px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;font-size:16px">Brevo Email Configuration</h3>
            <button class="btn btn-icon" onclick="document.getElementById('brevo-config-overlay').remove()">&times;</button>
          </div>
          <div style="margin-bottom:12px;padding:10px;border-radius:8px;background:${statusBg};font-size:13px">
            ${statusHtml}
          </div>
          ${hasCreds ? `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:12px;border-radius:8px;border:1px solid ${isEnabled ? '#bbf7d0' : '#e9d5ff'};background:${isEnabled ? '#f0fdf4' : '#faf5ff'}">
            <div>
              <div style="font-size:13px;font-weight:600;color:#374151">Enable live sending</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">${isEnabled ? 'Emails are sent via Brevo (uses your daily quota)' : 'Sending is paused — emails will be simulated'}</div>
            </div>
            <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer">
              <input type="checkbox" id="brevo-enabled-toggle" ${isEnabled ? 'checked' : ''} onchange="toggleBrevoEnabled(this.checked)" style="opacity:0;width:0;height:0">
              <span style="position:absolute;inset:0;border-radius:12px;background:${isEnabled ? '#22c55e' : '#d1d5db'};transition:background 0.2s"></span>
              <span style="position:absolute;top:2px;left:${isEnabled ? '22px' : '2px'};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:left 0.2s"></span>
            </label>
          </div>
          ` : ''}
          <div style="font-size:12px;color:#6b7280;margin-bottom:12px;padding:8px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd">
            <strong>How to get your Brevo SMTP key:</strong><br>
            1. Sign up free at <a href="https://app.brevo.com" target="_blank" style="color:#2563eb">app.brevo.com</a> (300 emails/day)<br>
            2. Go to <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" style="color:#2563eb">Settings &rarr; SMTP & API</a><br>
            3. Copy the SMTP Key and your login email
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">SMTP Key *</label>
              <input type="password" id="brevo-smtp-key" class="form-input" placeholder="xsmtpsib-..." value="${hasCreds ? '••••••••••••••••••' : ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">SMTP Login (Brevo account email) *</label>
              <input type="email" id="brevo-smtp-login" class="form-input" placeholder="you@example.com" value="${status.smtp_login || ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">From Email * (sender address shown to recipients)</label>
              <input type="email" id="brevo-from-email" class="form-input" placeholder="marketing@yourdomain.com" value="${status.from_email || ''}" style="width:100%">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:#374151">From Name</label>
              <input type="text" id="brevo-from-name" class="form-input" placeholder="CRM Marketing" value="${status.from_name || 'CRM Marketing'}" style="width:100%">
            </div>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
            <button class="btn btn-secondary" onclick="document.getElementById('brevo-config-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" id="brevo-save-btn" onclick="saveBrevoConfig()">Save & Connect</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    })
    .catch(() => showToast('Failed to load email provider status', 'error'));
}

async function saveBrevoConfig() {
  const smtpKey = document.getElementById('brevo-smtp-key').value.trim();
  const smtpLogin = document.getElementById('brevo-smtp-login').value.trim();
  const fromEmail = document.getElementById('brevo-from-email').value.trim();
  const fromName = document.getElementById('brevo-from-name').value.trim();

  if (!fromEmail) { showToast('From Email is required', 'error'); return; }
  if (!smtpLogin) { showToast('SMTP Login is required', 'error'); return; }
  if (!smtpKey && !smtpKey.startsWith('••')) { showToast('SMTP Key is required', 'error'); return; }

  const body = { from_email: fromEmail, from_name: fromName, smtp_login: smtpLogin };
  if (smtpKey && !smtpKey.startsWith('••')) body.smtp_key = smtpKey;

  const btn = document.getElementById('brevo-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting...'; }

  try {
    const resp = await fetch('/api/deliveries/email-provider/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || data.message || 'Failed to configure');
    document.getElementById('brevo-config-overlay')?.remove();
    if (data.verified) {
      showToast('Brevo SMTP connected and verified!', 'success');
    } else if (data.configured) {
      showToast('Brevo configured — SMTP verify pending: ' + (data.verify_error || 'will verify on first send'), 'success');
    } else {
      showToast('Configuration saved', 'success');
    }
    _refreshSendGridBadge();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Save & Connect'; }
  }
}

async function toggleBrevoEnabled(enabled) {
  try {
    const resp = await fetch('/api/deliveries/email-provider/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to toggle');
    showToast(data.message, 'success');
    _refreshSendGridBadge();
    // Re-open the dialog to refresh its state
    document.getElementById('brevo-config-overlay')?.remove();
    openSendGridConfig();
  } catch (err) {
    showToast(err.message, 'error');
    // Revert the checkbox
    const toggle = document.getElementById('brevo-enabled-toggle');
    if (toggle) toggle.checked = !enabled;
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
    const rpt = await response.json();
    if (!response.ok) throw new Error(rpt.error || 'Failed to load report');

    const d = rpt.delivery;
    const m = rpt.metrics;
    const r = rpt.rates;
    const ch = d.channel_key; // email | sms | push
    const cd = rpt.channel_data || {};

    const channelIcon =
      ch === 'email' ? _afIco('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>') :
      ch === 'sms' ? _afIco('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') :
      _afIco('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>');

    const statusBadge = '<span class="badge badge-' + ({completed:'success','in-progress':'info',draft:'secondary',scheduled:'warning',paused:'warning',stopped:'danger',failed:'danger'}[d.status] || 'secondary') + '">' + d.status + '</span>';

    // ── Header ──
    let html = `
    <div class="rpt-page">
      <div class="rpt-header card">
        <div class="rpt-header-left">
          <button class="btn-back" onclick="loadDeliveries()" title="Back">${BACK_CHEVRON}</button>
          <div>
            <div class="rpt-header-title">${channelIcon} ${d.name}</div>
            <div class="rpt-header-sub">${d.channel} Delivery Report ${statusBadge} ${d.sent_at ? '&middot; Sent ' + new Date(d.sent_at).toLocaleString() : ''}</div>
        </div>
          </div>
        <div class="rpt-header-actions">
          <button class="btn btn-secondary btn-sm" onclick="exportDeliveryCSV(${id})">
            ${_afIco('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 14)} Export CSV
          </button>
            </div>
          </div>

    <!-- Tab Nav -->
    <div class="rpt-tabs">
      <button class="rpt-tab active" data-tab="summary" onclick="switchDeliveryReportTab(this,'summary')">
        ${_afIco('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>', 14)} Delivery Summary
      </button>
      <button class="rpt-tab" data-tab="tracking" onclick="switchDeliveryReportTab(this,'tracking')">
        ${_afIco('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', 14)} Tracking
      </button>`;

    if (ch === 'email') {
      html += `<button class="rpt-tab" data-tab="urls" onclick="switchDeliveryReportTab(this,'urls')">
        ${_afIco('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 14)} URLs &amp; Click Streams
      </button>`;
    }

    html += `<button class="rpt-tab" data-tab="exclusions" onclick="switchDeliveryReportTab(this,'exclusions')">
        ${_afIco('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>', 14)} Exclusions
      </button>
      <button class="rpt-tab" data-tab="throughput" onclick="switchDeliveryReportTab(this,'throughput')">
        ${_afIco('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', 14)} Throughput
      </button>
    </div>`;

    // ═══════ TAB: Delivery Summary ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-summary">';

    // KPI row – common for all channels
    html += '<div class="rpt-section-title">Delivery Overview</div><div class="rpt-kpi-grid">';

    // KPIs depend on channel
    if (ch === 'email') {
      html += _rptKpi('Sent', m.sent, 'Total processed', '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% rate', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Total Opens', m.opens, r.open_rate + '% open rate', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
      html += _rptKpi('Total Clicks', m.clicks, r.click_rate + '% CTR', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('CTOR', r.ctor + '%', 'Click-to-Open', '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>');
      html += _rptKpi('Bounced', m.bounced, r.bounce_rate + '% bounce', '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
      html += _rptKpi('Unsubscribed', m.unsubscribed, r.unsubscribe_rate + '%', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>');
    } else if (ch === 'sms') {
      html += _rptKpi('Total Sent', m.sent, 'Messages processed', '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% success', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Click-through', m.clicks, r.click_rate + '% CTR', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('Errors', m.errors, r.error_rate + '% error rate', '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
      html += _rptKpi('Opt-outs', cd.opt_outs || 0, '', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>');
      html += _rptKpi('Total Cost', '$' + (cd.total_cost || 0).toFixed(2), '$' + (cd.avg_cost_per_sms || 0).toFixed(3) + '/msg', '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>');
    } else { // push
      html += _rptKpi('Sent', m.sent, 'Messages processed', '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>');
      html += _rptKpi('Delivered', m.delivered, r.delivery_rate + '% rate', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>');
      html += _rptKpi('Impressions', cd.impressions || 0, '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>');
      html += _rptKpi('Direct Opens', cd.direct_opens || 0, r.click_rate + '% open rate', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>');
      html += _rptKpi('Dismissals', cd.dismissals || 0, '', '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>');
      html += _rptKpi('Errors', m.errors, r.error_rate + '%', '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
    }
    html += '</div>';

    // Targeted population
    html += `<div class="rpt-section-title">Targeted Population</div>
      <div class="rpt-stats-table">
        <table><thead><tr><th></th><th>Count</th><th>Percentage</th></tr></thead><tbody>
          <tr><td>Initial target</td><td>${(rpt.summary.targeted || 0).toLocaleString()}</td><td>100%</td></tr>
          <tr><td>Messages to deliver</td><td>${(rpt.summary.to_deliver || 0).toLocaleString()}</td><td>${rpt.summary.targeted > 0 ? ((rpt.summary.to_deliver / rpt.summary.targeted) * 100).toFixed(1) : 0}%</td></tr>
          <tr><td>Exclusions</td><td>${(rpt.summary.excluded || 0).toLocaleString()}</td><td>${rpt.summary.targeted > 0 ? ((rpt.summary.excluded / rpt.summary.targeted) * 100).toFixed(1) : 0}%</td></tr>
        </tbody></table>
      </div>`;

    // Overall statistics
    html += `<div class="rpt-section-title">Overall Statistics</div>
      <div class="rpt-stats-table">
        <table><thead><tr><th></th><th>Count</th><th>Percentage</th></tr></thead><tbody>
          <tr class="rpt-row-success"><td>${_afIco('<path d="M20 6 9 17l-5-5"/>',14)} Success</td><td>${m.delivered.toLocaleString()}</td><td>${r.delivery_rate}%</td></tr>
          <tr class="rpt-row-error"><td>${_afIco('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',14)} Errors</td><td>${m.errors.toLocaleString()}</td><td>${r.error_rate}%</td></tr>
          <tr class="rpt-row-warning"><td>New quarantine</td><td>${(rpt.summary.new_quarantine || 0).toLocaleString()}</td><td>${m.sent > 0 ? ((rpt.summary.new_quarantine / m.sent) * 100).toFixed(1) : 0}%</td></tr>
        </tbody></table>
      </div>`;

    // Channel specific sections inside summary
    if (ch === 'sms' && cd.carrier_breakdown) {
      html += '<div class="rpt-section-title">Carrier Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Carrier</th><th>Delivered</th><th>Share</th></tr></thead><tbody>';
      cd.carrier_breakdown.forEach(function(c) {
        html += '<tr><td>' + c.carrier + '</td><td>' + c.delivered.toLocaleString() + '</td><td>' + c.pct + '%</td></tr>';
      });
      html += '</tbody></table></div>';
    }

    if (ch === 'push' && cd.platform_breakdown) {
      var pb = cd.platform_breakdown;
      html += '<div class="rpt-section-title">Platform Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Platform</th><th>Sent</th><th>Delivered</th><th>Opened</th></tr></thead><tbody>';
      html += '<tr><td>' + _afIco('<path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v12a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3Z"/>',14) + ' iOS</td><td>' + (pb.ios.sent || 0).toLocaleString() + '</td><td>' + (pb.ios.delivered || 0).toLocaleString() + '</td><td>' + (pb.ios.opened || 0).toLocaleString() + '</td></tr>';
      html += '<tr><td>' + _afIco('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',14) + ' Android</td><td>' + (pb.android.sent || 0).toLocaleString() + '</td><td>' + (pb.android.delivered || 0).toLocaleString() + '</td><td>' + (pb.android.opened || 0).toLocaleString() + '</td></tr>';
      html += '</tbody></table></div>';
    }

    if (ch === 'push' && cd.action_button_clicks && cd.action_button_clicks.length > 0) {
      html += '<div class="rpt-section-title">Action Button Performance</div><div class="rpt-stats-table"><table><thead><tr><th>Button</th><th>Clicks</th></tr></thead><tbody>';
      cd.action_button_clicks.forEach(function(b) { html += '<tr><td>' + b.button + '</td><td>' + b.clicks.toLocaleString() + '</td></tr>'; });
      html += '</tbody></table></div>';
    }

    html += '</div>'; // end summary tab

    // ═══════ TAB: Tracking ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-tracking" style="display:none">';
    html += '<div class="rpt-section-title">Engagement Timeline</div>';
    html += '<div class="card"><div class="card-body"><canvas id="drpt-engagement-chart" style="max-height:280px;width:100%"></canvas></div></div>';

    if (ch === 'email') {
      // Reaction statistics
      html += `<div class="rpt-section-title">Reaction Statistics</div>
        <div class="rpt-kpi-grid rpt-kpi-sm">
          ${_rptKpi('Unique Opens', (cd.unique_opens || 0).toLocaleString(), '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')}
          ${_rptKpi('Total Opens', (cd.total_opens || 0).toLocaleString(), '', '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')}
          ${_rptKpi('Unique Clicks', (cd.unique_clicks || 0).toLocaleString(), '', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>')}
          ${_rptKpi('Total Clicks', (cd.total_clicks || 0).toLocaleString(), '', '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>')}
          ${_rptKpi('Forwards', (cd.forwards || 0).toLocaleString(), '', '<path d="m22 2-7 20-4-9-9-4 20-7z"/>')}
          ${_rptKpi('Mirror Page', (cd.mirror_page || 0).toLocaleString(), '', '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>')}
          ${_rptKpi('Unsubscriptions', m.unsubscribed.toLocaleString(), r.unsubscribe_rate + '%', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/>')}
        </div>`;

      // Device & mail client
      html += '<div class="rpt-grid-2"><div>';
      html += '<div class="rpt-section-title">Device Breakdown</div><div class="card"><div class="card-body"><canvas id="drpt-device-chart" style="max-height:240px;width:100%"></canvas></div></div>';
      html += '</div><div>';
      html += '<div class="rpt-section-title">Mail Client</div><div class="rpt-stats-table"><table><thead><tr><th>Client</th><th>Share</th></tr></thead><tbody>';
      (cd.mail_clients || []).forEach(function(c) { html += '<tr><td>' + c.client + '</td><td><div class="rpt-bar-row"><div class="rpt-bar" style="width:' + c.pct + '%"></div><span>' + c.pct + '%</span></div></td></tr>'; });
      html += '</tbody></table></div></div></div>';

      // Geo
      html += '<div class="rpt-section-title">Geographic Performance</div><div class="rpt-stats-table"><table><thead><tr><th>Country</th><th>Opens</th><th>Clicks</th></tr></thead><tbody>';
      (cd.geo_breakdown || []).forEach(function(g) { html += '<tr><td><strong>' + g.country + '</strong></td><td>' + g.opens.toLocaleString() + '</td><td>' + g.clicks.toLocaleString() + '</td></tr>'; });
      html += '</tbody></table></div>';
    }

    // Recipients
    html += '<div class="rpt-section-title">Recipients</div>';
    html += '<div class="rpt-recip-tabs"><button class="rpt-recip-tab active" onclick="switchDrptRecipTab(this,\'engaged\')">Engaged</button><button class="rpt-recip-tab" onclick="switchDrptRecipTab(this,\'non-engaged\')">Non-Engaged</button><button class="rpt-recip-tab" onclick="switchDrptRecipTab(this,\'bounced\')">Bounced</button></div>';

    // Engaged
    html += '<div class="rpt-recip-content" id="drpt-engaged"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th>';
    if (ch === 'email') html += '<th>Opened</th><th>Clicked</th>';
    if (ch === 'sms') html += '<th>Delivered</th><th>Clicked</th>';
    if (ch === 'push') html += '<th>Delivered</th><th>Opened</th>';
    html += '<th>Engagement</th></tr></thead><tbody>';
    rpt.recipients.top_engaged.forEach(function(rc) {
      var engLabel = rc.engagement_score >= 3 ? '<span class="badge badge-success">High</span>' : rc.engagement_score >= 1 ? '<span class="badge badge-info">Medium</span>' : '<span class="badge badge-secondary">Low</span>';
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td>';
      if (ch === 'email') html += '<td>' + (rc.opened_at ? new Date(rc.opened_at).toLocaleString() : '-') + '</td><td>' + (rc.clicked_at ? new Date(rc.clicked_at).toLocaleString() : '-') + '</td>';
      if (ch === 'sms' || ch === 'push') html += '<td>' + (rc.opened_at ? new Date(rc.opened_at).toLocaleString() : 'Yes') + '</td><td>' + (rc.clicked_at ? new Date(rc.clicked_at).toLocaleString() : '-') + '</td>';
      html += '<td>' + engLabel + '</td></tr>';
    });
    if (rpt.recipients.top_engaged.length === 0) html += '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#94a3b8">No engaged recipients yet</td></tr>';
    html += '</tbody></table></div></div>';

    // Non-engaged
    html += '<div class="rpt-recip-content" id="drpt-non-engaged" style="display:none"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th><th>Status</th></tr></thead><tbody>';
    rpt.recipients.non_engaged.forEach(function(rc) {
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td><td><span class="badge badge-secondary">No interaction</span></td></tr>';
    });
    if (rpt.recipients.non_engaged.length === 0) html += '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#94a3b8">All recipients engaged!</td></tr>';
    html += '</tbody></table></div></div>';

    // Bounced
    html += '<div class="rpt-recip-content" id="drpt-bounced" style="display:none"><div class="rpt-stats-table"><table><thead><tr><th>Recipient</th><th>' + (ch === 'sms' ? 'Phone' : 'Email') + '</th><th>Sent</th><th>Bounce Type</th></tr></thead><tbody>';
    rpt.recipients.bounced.forEach(function(rc) {
      html += '<tr><td><strong>' + rc.name + '</strong></td><td>' + (ch === 'sms' ? (rc.phone || rc.email) : rc.email) + '</td><td>' + (rc.sent_at ? new Date(rc.sent_at).toLocaleDateString() : '-') + '</td><td><span class="badge badge-danger">' + rc.bounce_type + '</span></td></tr>';
    });
    if (rpt.recipients.bounced.length === 0) html += '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#94a3b8">No bounces</td></tr>';
    html += '</tbody></table></div></div>';
    html += '</div>'; // end tracking tab

    // ═══════ TAB: URLs & Click Streams (email only) ═══════
    if (ch === 'email') {
      html += '<div class="rpt-tab-content" id="rpt-tab-urls" style="display:none">';
      html += '<div class="rpt-section-title">Top Visited Links</div>';
      if (cd.top_links && cd.top_links.length > 0) {
        cd.top_links.forEach(function(lk) {
          html += '<div class="rpt-link-item"><div class="rpt-link-header"><span class="rpt-link-url">' + lk.url + '</span><span class="rpt-link-clicks">' + lk.clicks.toLocaleString() + ' clicks</span></div><div class="rpt-link-bar-bg"><div class="rpt-link-bar" style="width:' + lk.percentage + '%"></div></div></div>';
        });
      } else {
        html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No link data available</div>';
      }
      html += '</div>';
    }

    // ═══════ TAB: Exclusions ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-exclusions" style="display:none">';
    html += '<div class="rpt-section-title">Causes of Exclusion</div>';
    if (rpt.exclusions && rpt.exclusions.length > 0) {
      html += '<div class="rpt-stats-table"><table><thead><tr><th>Reason</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
      rpt.exclusions.forEach(function(e) { html += '<tr><td>' + e.reason + '</td><td>' + e.count.toLocaleString() + '</td><td>' + e.pct + '%</td></tr>'; });
      html += '</tbody></table></div>';
    } else {
      html += '<div style="text-align:center;padding:2rem;color:#94a3b8">No exclusions</div>';
    }

    // Error categories (SMS & Push)
    if ((ch === 'sms' || ch === 'push') && cd.error_categories && cd.error_categories.length > 0) {
      html += '<div class="rpt-section-title">Error Breakdown</div><div class="rpt-stats-table"><table><thead><tr><th>Error Type</th><th>Count</th><th>Share</th></tr></thead><tbody>';
      cd.error_categories.forEach(function(e) { html += '<tr><td>' + e.reason + '</td><td>' + e.count.toLocaleString() + '</td><td>' + e.pct + '%</td></tr>'; });
      html += '</tbody></table></div>';
    }
    html += '</div>'; // end exclusions tab

    // ═══════ TAB: Throughput ═══════
    html += '<div class="rpt-tab-content" id="rpt-tab-throughput" style="display:none">';
    html += '<div class="rpt-section-title">Delivery Throughput</div>';
    html += '<div class="card"><div class="card-body"><canvas id="drpt-throughput-chart" style="max-height:280px;width:100%"></canvas></div></div>';
    html += '</div>'; // end throughput tab

    html += '</div>'; // end rpt-page

    document.getElementById('content').innerHTML = html;

    // Draw charts after DOM ready
    setTimeout(function() {
      _drawDrptEngagementChart(rpt.engagement_timeline, ch);
      _drawDrptThroughputChart(rpt.throughput);
      if (ch === 'email' && cd.device_breakdown) _drawDrptDeviceChart(cd.device_breakdown);
    }, 100);

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// ── Delivery report helpers ──
function _rptKpi(title, value, sub, iconPath) {
  return '<div class="rpt-kpi"><div class="rpt-kpi-header"><span class="rpt-kpi-title">' + title + '</span><span class="rpt-kpi-icon">' + _afIco(iconPath, 16) + '</span></div><div class="rpt-kpi-value">' + value + '</div>' + (sub ? '<div class="rpt-kpi-sub">' + sub + '</div>' : '') + '</div>';
}

function switchDeliveryReportTab(btn, tab) {
  document.querySelectorAll('.rpt-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rpt-tab-content').forEach(function(c) { c.style.display = 'none'; });
  var el = document.getElementById('rpt-tab-' + tab);
  if (el) el.style.display = 'block';
}

function switchDrptRecipTab(btn, tab) {
  document.querySelectorAll('.rpt-recip-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.rpt-recip-content').forEach(function(c) { c.style.display = 'none'; });
  var el = document.getElementById('drpt-' + tab);
  if (el) el.style.display = 'block';
}

function exportDeliveryCSV(id) {
  showToast('CSV export not yet implemented', 'info');
}

// ── Chart drawing functions ──
function _drawDrptEngagementChart(timeline, channel) {
  var canvas = document.getElementById('drpt-engagement-chart');
  if (!canvas || !timeline || timeline.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth;
  var h = 280;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxO = Math.max(1, ...timeline.map(function(d) { return d.opens; }));
  var maxC = Math.max(1, ...timeline.map(function(d) { return d.clicks; }));
  var maxV = Math.max(maxO, maxC);
  var spacing = cw / (timeline.length - 1 || 1);

  // Axes
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  // Area fill – opens
  ctx.fillStyle = 'rgba(59,130,246,0.08)';
  ctx.beginPath(); ctx.moveTo(pad, h - pad);
  timeline.forEach(function(d, i) { ctx.lineTo(pad + i * spacing, h - pad - (d.opens / maxV) * ch2); });
  ctx.lineTo(pad + (timeline.length - 1) * spacing, h - pad);
  ctx.closePath(); ctx.fill();

  // Line – opens
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  timeline.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.opens / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Line – clicks
  ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  timeline.forEach(function(d, i) { var x = pad + i * spacing, y = h - pad - (d.clicks / maxV) * ch2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Y labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 5; i++) {
    var val = Math.round((maxV / 5) * i);
    ctx.fillText(val.toString(), pad - 8, h - pad - (ch2 / 5) * i + 4);
  }
  // X labels
  ctx.textAlign = 'center';
  timeline.forEach(function(d, i) { if (i % 6 === 0) ctx.fillText(d.hour + 'h', pad + i * spacing, h - pad + 18); });
  // Legend
  ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6'; ctx.fillText('● Opens', w - 160, 24);
  ctx.fillStyle = '#10b981'; ctx.fillText('● Clicks', w - 160, 42);
}

function _drawDrptThroughputChart(throughput) {
  var canvas = document.getElementById('drpt-throughput-chart');
  if (!canvas || !throughput || throughput.length === 0) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth;
  var h = 280;
  canvas.width = w; canvas.height = h;
  var pad = 50;
  var cw = w - pad * 2, ch2 = h - pad * 2;
  var maxM = Math.max(1, ...throughput.map(function(d) { return d.messages; }));
  var barW = Math.max(8, (cw / throughput.length) - 6);

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();

  throughput.forEach(function(d, i) {
    var x = pad + (i + 0.5) * (cw / throughput.length) - barW / 2;
    var barH = (d.messages / maxM) * ch2;
    var grad = ctx.createLinearGradient(x, h - pad - barH, x, h - pad);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = grad;
    var r2 = 4;
    ctx.beginPath();
    ctx.moveTo(x + r2, h - pad - barH);
    ctx.lineTo(x + barW - r2, h - pad - barH);
    ctx.quadraticCurveTo(x + barW, h - pad - barH, x + barW, h - pad - barH + r2);
    ctx.lineTo(x + barW, h - pad);
    ctx.lineTo(x, h - pad);
    ctx.lineTo(x, h - pad - barH + r2);
    ctx.quadraticCurveTo(x, h - pad - barH, x + r2, h - pad - barH);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(d.hour + 'h', x + barW / 2, h - pad + 16);
    if (d.messages > 0) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px system-ui';
      ctx.fillText(d.messages.toLocaleString(), x + barW / 2, h - pad - barH - 6);
    }
  });
  // Y labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (var i = 0; i <= 4; i++) {
    ctx.fillText(Math.round((maxM / 4) * i).toLocaleString(), pad - 8, h - pad - (ch2 / 4) * i + 4);
  }
  ctx.fillStyle = '#64748b'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('Messages / hour', w / 2, 20);
}

function _drawDrptDeviceChart(breakdown) {
  var canvas = document.getElementById('drpt-device-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.parentElement.clientWidth; var h = 240;
  canvas.width = w; canvas.height = h;
  var cx = w / 2, cy = h / 2 - 10, rad = Math.min(w, h) / 3;
  var devices = [
    { label: 'Desktop', value: breakdown.desktop, color: '#3b82f6' },
    { label: 'Mobile', value: breakdown.mobile, color: '#10b981' },
    { label: 'Tablet', value: breakdown.tablet, color: '#f59e0b' },
    { label: 'Other', value: breakdown.other, color: '#94a3b8' }
  ];
  var total = devices.reduce(function(s, d) { return s + d.value; }, 0);
  if (total === 0) { ctx.fillStyle = '#94a3b8'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('No data', cx, cy); return; }
  var start = -Math.PI / 2;
  devices.forEach(function(dv) {
    var slice = (dv.value / total) * Math.PI * 2;
    ctx.fillStyle = dv.color;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rad, start, start + slice); ctx.closePath(); ctx.fill();
    if (dv.value > 0) {
      var mid = start + slice / 2;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(Math.round((dv.value / total) * 100) + '%', cx + Math.cos(mid) * rad * 0.65, cy + Math.sin(mid) * rad * 0.65 + 4);
    }
    start += slice;
  });
  // Legend
  devices.forEach(function(dv, i) {
    var lx = 12, ly = h - 50 + i * 16;
    ctx.fillStyle = dv.color; ctx.fillRect(lx, ly, 10, 10);
    ctx.fillStyle = '#1e293b'; ctx.font = '11px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(dv.label + ': ' + dv.value.toLocaleString(), lx + 16, ly + 9);
  });
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

// ═══════════════════════════════════════════════════════════════
// Content Templates View (Adobe Campaign / AJO style)
// ═══════════════════════════════════════════════════════════════

const _ctCategoryLabels = {
  onboarding: 'Onboarding',
  promotional: 'Promotional',
  newsletter: 'Newsletter',
  transactional: 'Transactional',
  event: 'Event',
  retention: 'Retention',
  custom: 'Custom'
};

const _ctCategoryColors = {
  onboarding: '#2563EB',
  promotional: '#DC2626',
  newsletter: '#7C3AED',
  transactional: '#059669',
  event: '#D97706',
  retention: '#0891B2',
  custom: '#6B7280'
};

let _ctState = {
  templates: [],
  filter: 'all',        // 'all', 'sample', 'saved'
  categoryFilter: '',
  search: '',
  view: 'list'          // 'grid' or 'list'
};

async function loadContentTemplates() {
  showLoading();
  try {
    const resp = await fetch(`${API_BASE}/email-templates`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load templates');
    _ctState.templates = data.templates || [];
    _renderContentTemplatesPage();
  } catch (error) {
    showError('Failed to load Content Templates: ' + error.message);
  } finally {
    hideLoading();
  }
}

function _renderContentTemplatesPage() {
  let templates = _ctState.templates;

  // Filters
  if (_ctState.filter === 'sample') templates = templates.filter(t => t.sample);
  if (_ctState.filter === 'saved') templates = templates.filter(t => !t.sample);
  if (_ctState.categoryFilter) templates = templates.filter(t => t.category === _ctState.categoryFilter);
  if (_ctState.search) {
    const q = _ctState.search.toLowerCase();
    templates = templates.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  // Category counts
  const allCats = {};
  _ctState.templates.forEach(t => {
    const cat = t.category || 'custom';
    allCats[cat] = (allCats[cat] || 0) + 1;
  });

  const filterTabs = `
    <div class="ct-filter-tabs">
      <button class="ct-filter-tab ${_ctState.filter === 'all' ? 'active' : ''}" onclick="_ctSetFilter('all')">All templates <span class="ct-filter-count">${_ctState.templates.length}</span></button>
      <button class="ct-filter-tab ${_ctState.filter === 'sample' ? 'active' : ''}" onclick="_ctSetFilter('sample')">Sample templates <span class="ct-filter-count">${_ctState.templates.filter(t => t.sample).length}</span></button>
      <button class="ct-filter-tab ${_ctState.filter === 'saved' ? 'active' : ''}" onclick="_ctSetFilter('saved')">Saved templates <span class="ct-filter-count">${_ctState.templates.filter(t => !t.sample).length}</span></button>
        </div>
  `;

  const categoryPills = Object.keys(allCats).length > 1 ? `
    <div class="ct-category-pills">
      <button class="ct-cat-pill ${!_ctState.categoryFilter ? 'active' : ''}" onclick="_ctSetCategory('')">All</button>
      ${Object.entries(allCats).map(([cat, count]) => `
        <button class="ct-cat-pill ${_ctState.categoryFilter === cat ? 'active' : ''}" onclick="_ctSetCategory('${cat}')">
          <span class="ct-cat-dot" style="background:${_ctCategoryColors[cat] || '#6B7280'}"></span>
          ${_ctCategoryLabels[cat] || cat} (${count})
        </button>
      `).join('')}
    </div>
  ` : '';

  const toolbar = `
    <div class="ct-toolbar">
      <div class="ct-toolbar-left">
        <input type="text" class="form-input ct-search" placeholder="Search templates..." value="${_ctState.search}" oninput="_ctSetSearch(this.value)">
      </div>
      <div class="ct-toolbar-right">
        <button class="btn btn-icon ${_ctState.view === 'grid' ? 'active' : ''}" onclick="_ctSetView('grid')" title="Grid view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="btn btn-icon ${_ctState.view === 'list' ? 'active' : ''}" onclick="_ctSetView('list')" title="List view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <button class="btn btn-primary" onclick="_ctCreateTemplate()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create template
        </button>
      </div>
    </div>
  `;

  let body = '';
  if (templates.length === 0) {
    body = `
      <div class="ct-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <h3>No templates found</h3>
        <p>${_ctState.search || _ctState.categoryFilter ? 'Try adjusting your filters' : 'Create your first template to get started'}</p>
        ${!_ctState.search && !_ctState.categoryFilter ? '<button class="btn btn-primary" onclick="_ctCreateTemplate()">Create template</button>' : ''}
      </div>
    `;
  } else if (_ctState.view === 'grid') {
    body = `<div class="ct-grid">${templates.map(t => _ctRenderCard(t)).join('')}</div>`;
  } else {
    body = `
          <div class="table-container">
        <table class="ct-table">
              <thead>
                <tr>
                  <th>Name</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
          <tbody>${templates.map(t => _ctRenderRow(t)).join('')}</tbody>
            </table>
          </div>
    `;
  }

  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${_afIco('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', 16)} Content Templates</h3>
        <div class="card-subtitle">Design reusable email templates for consistent brand messaging</div>
      </div>
      <div class="card-body" style="padding: 0;">
        ${filterTabs}
        ${categoryPills}
        ${toolbar}
        <div class="ct-body">${body}</div>
        </div>
      </div>
    `;

  // Populate iframe previews after DOM is ready
  requestAnimationFrame(() => _ctPopulateIframePreviews());
}

function _ctPopulateIframePreviews() {
  document.querySelectorAll('.ct-card-iframe').forEach(iframe => {
    const html = decodeURIComponent(iframe.dataset.html || '');
    if (!html) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;pointer-events:none;transform-origin:top left;transform:scale(0.35);width:286%;font-family:Arial,sans-serif;}</style></head><body>${html}</body></html>`);
      doc.close();
    } catch (e) { /* cross-origin safety */ }
  });
}

function _ctRenderCard(t) {
  const catColor = _ctCategoryColors[t.category] || '#6B7280';
  const catLabel = _ctCategoryLabels[t.category] || t.category || 'Custom';
  const modified = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—';
  const statusBadge = t.status === 'published'
    ? '<span class="ct-status ct-status-published">Published</span>'
    : '<span class="ct-status ct-status-draft">Draft</span>';
  const sampleBadge = t.sample ? '<span class="ct-badge-sample">Sample</span>' : '';

  // Build preview: iframe if html exists, fallback to icon
  let previewInner;
  if (t.html) {
    const iframeId = `ct-preview-${t.id}`;
    previewInner = `<iframe id="${iframeId}" class="ct-card-iframe" scrolling="no" sandbox="allow-same-origin" data-html="${encodeURIComponent(t.html)}"></iframe>`;
  } else {
    previewInner = `<div class="ct-card-preview-inner">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    </div>`;
  }

  return `
    <div class="ct-card" onclick="_ctEditTemplate(${t.id})">
      <div class="ct-card-preview">${previewInner}</div>
      <div class="ct-card-body">
        <div class="ct-card-top-row">
          <span class="ct-cat-badge" style="background:${catColor}15; color:${catColor}; border:1px solid ${catColor}30">${catLabel}</span>
          ${sampleBadge}
          ${statusBadge}
        </div>
        <div class="ct-card-name">${t.name || 'Untitled'}</div>
        <div class="ct-card-desc">${t.description || ''}</div>
        <div class="ct-card-meta">Modified ${modified}</div>
      </div>
      <div class="ct-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-icon btn-sm" onclick="_ctEditTemplate(${t.id})" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-icon btn-sm" onclick="_ctDuplicateTemplate(${t.id})" title="Duplicate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="btn btn-icon btn-sm" onclick="_ctDeleteTemplate(${t.id}, '${(t.name || '').replace(/'/g, "\\'")}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

function _ctRenderRow(t) {
  const catColor = _ctCategoryColors[t.category] || '#6B7280';
  const catLabel = _ctCategoryLabels[t.category] || t.category || 'Custom';
  const modified = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—';
  const statusClass = t.status === 'published' ? 'ct-status-published' : 'ct-status-draft';
  const sampleBadge = t.sample ? ' <span class="ct-badge-sample">Sample</span>' : '';

  return `
    <tr onclick="_ctEditTemplate(${t.id})" style="cursor:pointer;">
      <td>
        <div class="ct-row-name">${t.name || 'Untitled'}${sampleBadge}</div>
        <div class="ct-row-desc">${t.description || ''}</div>
      </td>
      <td><span class="ct-cat-badge" style="background:${catColor}15; color:${catColor}; border:1px solid ${catColor}30">${catLabel}</span></td>
      <td class="ct-row-subject">${t.subject || '—'}</td>
      <td><span class="ct-status ${statusClass}">${t.status || 'draft'}</span></td>
      <td>${modified}</td>
      <td onclick="event.stopPropagation()">
        <div class="ct-row-actions">
          <button class="btn btn-icon btn-sm" onclick="_ctEditTemplate(${t.id})" title="Edit content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-icon btn-sm" onclick="_ctDuplicateTemplate(${t.id})" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="btn btn-icon btn-sm" onclick="_ctDeleteTemplate(${t.id}, '${(t.name || '').replace(/'/g, "\\'")}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Actions
function _ctSetFilter(filter) { _ctState.filter = filter; _renderContentTemplatesPage(); }
function _ctSetCategory(cat) { _ctState.categoryFilter = cat; _renderContentTemplatesPage(); }
function _ctSetSearch(val) { _ctState.search = val; _renderContentTemplatesPage(); }
function _ctSetView(view) { _ctState.view = view; _renderContentTemplatesPage(); }

function _ctCreateTemplate() {
  // Open a modal to get name, description, and category
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ct-create-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <h3>Create content template</h3>
        <button class="modal-close" onclick="document.getElementById('ct-create-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label form-label-required">Template name</label>
          <input class="form-input" id="ct-new-name" placeholder="e.g. Welcome Email">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ct-new-desc" placeholder="Brief description of the template">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="ct-new-category">
            <option value="custom">Custom</option>
            <option value="onboarding">Onboarding</option>
            <option value="promotional">Promotional</option>
            <option value="newsletter">Newsletter</option>
            <option value="transactional">Transactional</option>
            <option value="event">Event</option>
            <option value="retention">Retention</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Start from</label>
          <div class="ct-start-options">
            <label class="ct-start-option">
              <input type="radio" name="ct-start" value="scratch" checked>
              <span>Design from scratch</span>
            </label>
            <label class="ct-start-option">
              <input type="radio" name="ct-start" value="existing">
              <span>Use existing template</span>
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('ct-create-modal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="_ctDoCreate()">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('ct-new-name').focus();
}

async function _ctDoCreate() {
  const name = document.getElementById('ct-new-name').value.trim();
  if (!name) { showToast('Please enter a template name', 'warning'); return; }
  const description = document.getElementById('ct-new-desc').value.trim();
  const category = document.getElementById('ct-new-category').value;

  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, category, status: 'draft' })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to create template');
    document.getElementById('ct-create-modal')?.remove();
    // Open the email editor for this template
    _ctEditTemplate(data.id);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

function _ctEditTemplate(id) {
  // Open the email editor in template mode
  window.open(`/email-designer.html?templateId=${id}`, '_blank');
}

async function _ctDuplicateTemplate(id) {
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}/duplicate`, { method: 'POST' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to duplicate');
    showToast(`Template duplicated as "${data.name}"`, 'success');
    loadContentTemplates();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

async function _ctDeleteTemplate(id, name) {
  if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
  try {
    showLoading();
    const resp = await fetch(`${API_BASE}/email-templates/${id}`, { method: 'DELETE' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to delete');
    showToast('Template deleted', 'success');
    loadContentTemplates();
  } catch (error) {
    showToast(error.message, 'error');
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
          resultCount: filters.length,
          totalCount: filters.length,
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
          resultCount: assets.length,
          totalCount: assets.length,
          showColumnSelector: true,
          columns,
          viewKey: 'assets',
          showSearch: true,
          searchPlaceholder: 'Search assets...',
          searchValue: assetsSearch || '',
          onSearch: 'updateAssetsSearch(this.value)',
          filterTags: assetsType !== 'all' ? [{ key: 'type', label: 'Type', value: assetsType === 'image' ? 'Images' : 'Files' }] : [],
          onClearTag: 'clearAssetsFilterTag',
          filters: [
            {
              type: 'select',
              label: 'Type',
              value: assetsType,
              onChange: 'updateAssetsType(this.value)',
              options: [
                { value: 'all', label: 'All types' },
                { value: 'image', label: 'Images' },
                { value: 'file', label: 'Files' }
              ]
            }
          ]
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

function clearAssetsFilterTag(key) {
  if (key === 'type') assetsType = 'all';
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
