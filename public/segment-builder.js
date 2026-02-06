// Segment Builder JavaScript
const API_BASE = '/api';

// State
let segmentId = null;
let rules = [];
let previewDebounceTimer = null;
let baseEntity = 'customer';
let previewSamples = [];
let customObjectsCache = [];
let sampleColumns = [];

const BASE_ATTRIBUTE_OBJECTS = [
  {
    name: 'customer',
    label: 'Contacts',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    fields: [
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'first_name', label: 'First Name', type: 'text' },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'status', label: 'Status', type: 'select' },
      { name: 'lifecycle_stage', label: 'Lifecycle Stage', type: 'select' },
      { name: 'lead_score', label: 'Lead Score', type: 'number' },
      { name: 'created_at', label: 'Created Date', type: 'date' }
    ]
  },
  {
    name: 'orders',
    label: 'Orders',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    fields: [
      { name: 'id', label: 'Order ID', type: 'number' },
      { name: 'total_amount', label: 'Total Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select' },
      { name: 'created_at', label: 'Created Date', type: 'date' },
      { name: 'total_orders', label: 'Total Orders', type: 'number' },
      { name: 'total_spent', label: 'Total Spent', type: 'number' },
      { name: 'last_order_date', label: 'Last Order Date', type: 'date' }
    ]
  },
  {
    name: 'events',
    label: 'Activity',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    fields: [
      { name: 'event_count', label: 'Total Events', type: 'number' },
      { name: 'last_activity_date', label: 'Last Activity Date', type: 'date' }
    ]
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get segment ID from URL if editing
  const params = new URLSearchParams(window.location.search);
  segmentId = params.get('id');
  const returnView = params.get('return');
  const deliveryId = params.get('deliveryId');
  if (returnView === 'deliveries' && deliveryId) {
    const returnBtn = document.getElementById('return-to-delivery');
    if (returnBtn) returnBtn.style.display = 'inline-flex';
  }
  
  // Load custom objects first
  await loadCustomObjects();
  
  if (segmentId) {
    loadSegment(segmentId);
  }
  
  setupEventListeners();
});

function returnToDelivery() {
  const params = new URLSearchParams(window.location.search);
  const deliveryId = params.get('deliveryId');
  if (deliveryId) {
    window.location.href = `/?view=deliveries&deliveryId=${encodeURIComponent(deliveryId)}&step=2`;
  } else {
    window.location.href = '/?view=deliveries';
  }
}

// Load custom objects and add to attribute library
async function loadCustomObjects() {
  try {
    const response = await fetch(`${API_BASE}/segments/for-segments`);
    const customObjects = await response.json();
    customObjectsCache = customObjects || [];
    renderAttributeLibrary(customObjects);
    renderBaseEntityOptions(customObjects);
    updatePreviewCountLabel();
  } catch (error) {
    console.error('Error loading custom objects:', error);
  }
}

function renderAttributeLibrary(customObjects) {
  const container = document.getElementById('attribute-categories');
  if (!container) return;
  container.innerHTML = '';
  
  const allObjects = [...BASE_ATTRIBUTE_OBJECTS, ...(customObjects || [])];
  allObjects.forEach(obj => {
    const categoryHtml = `
      <div class="attr-category">
        <div class="category-header collapsed" onclick="toggleAttrCategory(this)">
          <span class="category-icon">${obj.icon || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>'}</span>
          <span class="category-title">${obj.label}</span>
          <span class="category-toggle">▼</span>
        </div>
        <div class="category-content">
          ${(obj.fields || []).map(field => `
            <div class="attr-item" draggable="true" data-entity="${obj.name}" data-attr="${field.name}" data-type="${field.type}" data-entity-label="${obj.label}" data-attr-label="${field.label}" title="${field.label} (${capitalizeFirst(field.type)})">
              <span class="attr-icon">${getSvgIconForType(field.type)}</span>
              <div class="attr-info">
                <div class="attr-name">${field.label}</div>
              </div>
              <div class="attr-actions">
                <button class="attr-distribution-btn" type="button" title="Distribution" data-entity="${obj.name}" data-attr="${field.name}" data-entity-label="${obj.label}" data-attr-label="${field.label}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', categoryHtml);
  });
  
  setupDragAndDrop();
  setupDistributionActions();
}

function renderBaseEntityOptions(customObjects) {
  const select = document.getElementById('base-entity');
  if (!select) return;
  const allObjects = [...BASE_ATTRIBUTE_OBJECTS, ...(customObjects || [])];
  select.innerHTML = allObjects.map(obj => `
    <option value="${obj.name}" ${baseEntity === obj.name ? 'selected' : ''}>${obj.label}</option>
  `).join('');
}

// Helper to get icon for field type
function getIconForType(type) {
  const icons = {
    text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>',
    number: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    date: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    select: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    boolean: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="6" ry="6"/><circle cx="16" cy="12" r="2"/></svg>'
  };
  return icons[type] || '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';
}

// SVG icons for field types (compact chip style)
function getSvgIconForType(type) {
  const icons = {
    text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    number: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    date: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    select: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    boolean: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };
  return icons[type] || '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
}

// Helper to capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load existing segment
async function loadSegment(id) {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/segments/${id}`);
    const segment = await response.json();
    
    document.getElementById('segment-name').value = segment.name;
    document.getElementById('segment-description').value = segment.description || '';
    document.getElementById('segment-type').value = segment.segment_type || 'dynamic';
    document.getElementById('segment-name-display').textContent = segment.name;
    
    // Load rules from conditions
    if (segment.conditions && segment.conditions.rules) {
    if (segment.conditions.base_entity) {
      baseEntity = segment.conditions.base_entity;
      const baseSelect = document.getElementById('base-entity');
      if (baseSelect) baseSelect.value = baseEntity;
    }
      rules = segment.conditions.rules;
      document.getElementById('logic-operator').value = segment.conditions.logic || 'AND';
      renderRules();
      updatePreview();
    }
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading segment', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Segment name sync
  document.getElementById('segment-name').addEventListener('input', (e) => {
    document.getElementById('segment-name-display').textContent = e.target.value || 'New Segment';
  });
  
  const baseEntitySelect = document.getElementById('base-entity');
  if (baseEntitySelect) {
    baseEntitySelect.addEventListener('change', (e) => {
      baseEntity = e.target.value || 'customer';
      sampleColumns = loadSampleColumns(baseEntity);
      updatePreviewCountLabel();
      updateSQLPreview();
    });
  }
  
  // Attribute search
  document.getElementById('attr-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const categories = document.querySelectorAll('.attr-category');
    
    categories.forEach(category => {
      const items = category.querySelectorAll('.attr-item');
      let visibleCount = 0;
      items.forEach(item => {
        const name = item.querySelector('.attr-name').textContent.toLowerCase();
        const show = name.includes(searchTerm);
        item.style.display = show ? 'flex' : 'none';
        if (show) visibleCount += 1;
      });
      category.style.display = visibleCount > 0 ? 'block' : 'none';
      const header = category.querySelector('.category-header');
      if (header && searchTerm) header.classList.remove('collapsed');
    });
  });

  document.addEventListener('click', (event) => {
    const menu = document.getElementById('sample-columns-menu');
    const button = document.getElementById('sample-columns-btn');
    if (!menu || !button) return;
    if (menu.classList.contains('hidden')) return;
    if (!menu.contains(event.target) && !button.contains(event.target)) {
      menu.classList.add('hidden');
    }
  });
}

function updatePreviewCountLabel() {
  const label = document.getElementById('preview-count-label');
  if (!label) return;
  const allObjects = [...BASE_ATTRIBUTE_OBJECTS, ...(customObjectsCache || [])];
  const entity = allObjects.find(obj => obj.name === baseEntity);
  const entityLabel = entity?.label || 'Contacts';
  label.textContent = `Matching ${entityLabel}`;
}

function setupDistributionActions() {
  document.querySelectorAll('.attr-distribution-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      openDistributionModal({
        entity: btn.dataset.entity,
        attribute: btn.dataset.attr,
        entityLabel: btn.dataset.entityLabel,
        attributeLabel: btn.dataset.attrLabel
      });
    });
  });
}

function buildCurrentConditions() {
  return {
    logic: document.getElementById('logic-operator').value,
    base_entity: baseEntity,
    rules: rules.map(r => ({
      entity: r.entity,
      attribute: r.attribute,
      operator: r.operator,
      value: r.value
    }))
  };
}

async function openDistributionModal({ entity, attribute, entityLabel, attributeLabel }) {
  const modal = document.getElementById('distribution-modal');
  const title = document.getElementById('distribution-title');
  const list = document.getElementById('distribution-list');
  if (!modal || !title || !list) return;
  title.textContent = `${attributeLabel} (${entityLabel})`;
  list.innerHTML = '<p class="empty-preview">Loading distribution...</p>';
  modal.classList.remove('hidden');
  try {
    const response = await fetch(`${API_BASE}/segments/distribution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conditions: buildCurrentConditions(),
        attribute: { entity, name: attribute }
      })
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    if (!response.ok) {
      const message = data?.error || `Request failed (${response.status})`;
      list.innerHTML = `<p class="empty-preview">${message}</p>`;
      return;
    }
    renderDistributionList(data);
  } catch (error) {
    list.innerHTML = '<p class="empty-preview">Unable to load distribution.</p>';
  }
}

function closeDistributionModal() {
  const modal = document.getElementById('distribution-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function renderDistributionList(data) {
  const list = document.getElementById('distribution-list');
  if (!list) return;
  const items = data?.items || [];
  if (!items.length) {
    list.innerHTML = '<p class="empty-preview">No distribution available.</p>';
    return;
  }
  list.innerHTML = `
    <div class="distribution-table">
      <div class="distribution-row distribution-header">
        <div>Value</div>
        <div>Count</div>
        <div>Percentage</div>
      </div>
      ${items.map(item => `
        <div class="distribution-row">
          <div class="distribution-value">${item.value}</div>
          <div class="distribution-count">${item.count}</div>
          <div class="distribution-bar">
            <span class="distribution-bar-fill" style="width:${Math.round(item.percentage * 100)}%"></span>
            <span class="distribution-percent">${Math.round(item.percentage * 100)}%</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="distribution-footer">The list shows only the first 20 values. There may be more values.</div>
  `;
}

// Setup drag and drop
function setupDragAndDrop() {
  const attrItems = document.querySelectorAll('.attr-item');
  const rulesContainer = document.getElementById('rules-container');
  
  // Remove existing listeners first to prevent duplicates
  attrItems.forEach(item => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
  });
  
  // Re-query after cloning
  const freshAttrItems = document.querySelectorAll('.attr-item');
  
  freshAttrItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const data = {
        entity: item.dataset.entity,
        attribute: item.dataset.attr,
        type: item.dataset.type,
        label: item.querySelector('.attr-name').textContent
      };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
  
  // Remove existing drop listeners
  const newContainer = rulesContainer.cloneNode(true);
  rulesContainer.parentNode.replaceChild(newContainer, rulesContainer);
  
  // Re-query the new container
  const freshContainer = document.getElementById('rules-container');
  
  freshContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    freshContainer.classList.add('drag-over');
  });
  
  freshContainer.addEventListener('dragleave', (e) => {
    // Only remove if we're leaving the container itself
    if (e.target === freshContainer) {
      freshContainer.classList.remove('drag-over');
    }
  });
  
  freshContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    freshContainer.classList.remove('drag-over');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data && data.attribute) {
        addRule(data);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  });
}

// Add rule from dropped attribute
function addRule(attr) {
  const rule = {
    id: Date.now(),
    entity: attr.entity,
    attribute: attr.attribute,
    label: attr.label,
    type: attr.type,
    operator: getDefaultOperator(attr.type),
    value: ''
  };
  
  rules.push(rule);
  renderRules();
  updatePreview();
}

// Add empty rule manually with attribute selection
function addEmptyRule() {
  const rule = {
    id: Date.now(),
    entity: null,
    attribute: null,
    label: null,
    type: null,
    operator: null,
    value: '',
    isNew: true  // Flag to show attribute selector
  };
  
  rules.push(rule);
  renderRules();
}

// Get default operator for attribute type
function getDefaultOperator(type) {
  switch(type) {
    case 'text':
      return 'contains';
    case 'number':
      return 'greater_than';
    case 'date':
      return 'in_last';
    case 'select':
      return 'equals';
    default:
      return 'equals';
  }
}

// Get operators for attribute type
function getOperatorsForType(type) {
  switch(type) {
    case 'text':
      return [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' },
        { value: 'contains', label: 'contains' },
        { value: 'not_contains', label: 'does not contain' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' },
        { value: 'is_empty', label: 'is empty' },
        { value: 'is_not_empty', label: 'is not empty' }
      ];
    case 'number':
      return [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' },
        { value: 'greater_than', label: 'greater than' },
        { value: 'less_than', label: 'less than' },
        { value: 'greater_than_or_equal', label: 'greater than or equal' },
        { value: 'less_than_or_equal', label: 'less than or equal' }
      ];
    case 'date':
      return [
        { value: 'in_last', label: 'in last (days)' },
        { value: 'not_in_last', label: 'not in last (days)' },
        { value: 'greater_than', label: 'after' },
        { value: 'less_than', label: 'before' }
      ];
    case 'select':
      return [
        { value: 'equals', label: 'is' },
        { value: 'not_equals', label: 'is not' }
      ];
    default:
      return [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' }
      ];
  }
}

// Get select options for attribute
function getSelectOptions(entity, attribute) {
  if (entity === 'customer' && attribute === 'status') {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ];
  } else if (entity === 'customer' && attribute === 'lifecycle_stage') {
    return [
      { value: 'lead', label: 'Lead' },
      { value: 'customer', label: 'Customer' },
      { value: 'vip', label: 'VIP' },
      { value: 'at_risk', label: 'At Risk' },
      { value: 'churned', label: 'Churned' }
    ];
  }
  return [];
}

// Render all rules
function renderRules() {
  const container = document.getElementById('rules-container');
  
  if (rules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Drag attributes from the left to build your segment</p>
        <p class="empty-state-hint">or</p>
        <button class="btn btn-secondary" onclick="addEmptyRule()">+ Add Condition</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = rules.map(rule => renderRule(rule)).join('');
  
  // Do NOT call setupDragAndDrop here - it's already set up once
}

// Render single rule
function renderRule(rule) {
  // If this is a new rule without attribute selected, show attribute selector
  if (rule.isNew && !rule.attribute) {
    return renderAttributeSelector(rule);
  }
  
  const operators = getOperatorsForType(rule.type);
  const operatorOptions = operators.map(op => 
    `<option value="${op.value}" ${rule.operator === op.value ? 'selected' : ''}>${op.label}</option>`
  ).join('');
  
  let valueInput = '';
  
  // Operators that don't need value input
  const noValueOperators = ['is_empty', 'is_not_empty', 'is_set', 'is_not_set'];
  
  if (!noValueOperators.includes(rule.operator)) {
    if (rule.type === 'select') {
      const options = getSelectOptions(rule.entity, rule.attribute);
      valueInput = `
        <select class="rule-select" onchange="updateRuleValue(${rule.id}, this.value)">
          <option value="">Select...</option>
          ${options.map(opt => 
            `<option value="${opt.value}" ${rule.value === opt.value ? 'selected' : ''}>${opt.label}</option>`
          ).join('')}
        </select>
      `;
    } else if (rule.type === 'number') {
      valueInput = `
        <input type="number" class="rule-input" 
               value="${rule.value}" 
               onchange="updateRuleValue(${rule.id}, this.value)" 
               placeholder="Enter value...">
      `;
    } else if (rule.type === 'date') {
      if (rule.operator === 'in_last' || rule.operator === 'not_in_last') {
        valueInput = `
          <input type="number" class="rule-input" 
                 value="${rule.value}" 
                 onchange="updateRuleValue(${rule.id}, this.value)" 
                 placeholder="Days...">
        `;
      } else {
        valueInput = `
          <input type="date" class="rule-input" 
                 value="${rule.value}" 
                 onchange="updateRuleValue(${rule.id}, this.value)">
        `;
      }
    } else {
      valueInput = `
        <input type="text" class="rule-input" 
               value="${rule.value}" 
               oninput="updateRuleValue(${rule.id}, this.value)" 
               placeholder="Enter value...">
      `;
    }
  }
  
  return `
    <div class="rule-item" data-rule-id="${rule.id}">
      <span class="rule-handle">⋮⋮</span>
      <div class="rule-content">
        <div class="rule-attribute-selector">
          <button class="rule-attribute-btn" onclick="showAttributeSelector(${rule.id})">
            ${rule.label} <span class="dropdown-arrow">▾</span>
          </button>
        </div>
        <select class="rule-select" onchange="updateRuleOperator(${rule.id}, this.value)">
          ${operatorOptions}
        </select>
        ${valueInput}
      </div>
      <button class="rule-delete" onclick="deleteRule(${rule.id})" title="Remove condition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
}

// Render attribute selector for new rules
function renderAttributeSelector(rule) {
  // Collect all available attributes from the page
  const allAttributes = [];
  document.querySelectorAll('.attr-item').forEach(item => {
    allAttributes.push({
      entity: item.dataset.entity,
      attribute: item.dataset.attr,
      type: item.dataset.type,
      label: item.querySelector('.attr-name').textContent,
      category: item.closest('.attr-category').querySelector('.category-title').textContent
    });
  });
  
  // Group by category
  const grouped = {};
  allAttributes.forEach(attr => {
    if (!grouped[attr.category]) {
      grouped[attr.category] = [];
    }
    grouped[attr.category].push(attr);
  });
  
  const optionsHtml = Object.keys(grouped).map(category => `
    <optgroup label="${category}">
      ${grouped[category].map(attr => 
        `<option value="${JSON.stringify({entity: attr.entity, attribute: attr.attribute, type: attr.type, label: attr.label}).replace(/"/g, '&quot;')}">${attr.label}</option>`
      ).join('')}
    </optgroup>
  `).join('');
  
  return `
    <div class="rule-item rule-item-new" data-rule-id="${rule.id}">
      <span class="rule-handle">⋮⋮</span>
      <div class="rule-content">
        <select class="rule-attribute-select" onchange="selectAttribute(${rule.id}, this.value)">
          <option value="">Select an attribute...</option>
          ${optionsHtml}
        </select>
      </div>
      <button class="rule-delete" onclick="deleteRule(${rule.id})" title="Remove condition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
}

// Handle attribute selection for new rules
function selectAttribute(ruleId, attrJsonString) {
  if (!attrJsonString) return;
  
  const attr = JSON.parse(attrJsonString);
  const rule = rules.find(r => r.id === ruleId);
  
  if (rule) {
    rule.entity = attr.entity;
    rule.attribute = attr.attribute;
    rule.label = attr.label;
    rule.type = attr.type;
    rule.operator = getDefaultOperator(attr.type);
    rule.isNew = false;
    
    renderRules();
    updatePreviewDebounced();
  }
}

// Show attribute selector modal for changing attribute
function showAttributeSelector(ruleId) {
  const rule = rules.find(r => r.id === ruleId);
  if (!rule) return;
  
  const allAttributes = [];
  document.querySelectorAll('.attr-item').forEach(item => {
    allAttributes.push({
      entity: item.dataset.entity,
      attribute: item.dataset.attr,
      type: item.dataset.type,
      label: item.querySelector('.attr-name').textContent,
      category: item.closest('.attr-category').querySelector('.category-title').textContent
    });
  });
  
  // Group by category
  const grouped = {};
  allAttributes.forEach(attr => {
    if (!grouped[attr.category]) {
      grouped[attr.category] = [];
    }
    grouped[attr.category].push(attr);
  });
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'attribute-selector-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeAttributeSelector()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>Select Attribute</h3>
        <button class="modal-close" onclick="closeAttributeSelector()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="modal-body">
        <input type="text" class="modal-search" id="modal-attr-search" placeholder="Search attributes..." onkeyup="filterModalAttributes(this.value)">
        <div class="modal-attributes" id="modal-attributes">
          ${Object.keys(grouped).map(category => `
            <div class="modal-category">
              <div class="modal-category-title">${category}</div>
              ${grouped[category].map(attr => `
                <div class="modal-attr-item" data-category="${category}" onclick='selectAttributeFromModal(${ruleId}, ${JSON.stringify(attr).replace(/'/g, "&apos;")})'>
                  ${attr.label}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Filter attributes in modal
function filterModalAttributes(searchTerm) {
  const items = document.querySelectorAll('.modal-attr-item');
  const categories = document.querySelectorAll('.modal-category');
  const lowerSearch = searchTerm.toLowerCase();
  
  categories.forEach(category => {
    const categoryItems = category.querySelectorAll('.modal-attr-item');
    let visibleCount = 0;
    
    categoryItems.forEach(item => {
      const label = item.textContent.toLowerCase();
      if (label.includes(lowerSearch)) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    
    // Hide category if no visible items
    category.style.display = visibleCount > 0 ? 'block' : 'none';
  });
}

// Select attribute from modal
function selectAttributeFromModal(ruleId, attr) {
  const rule = rules.find(r => r.id === ruleId);
  
  if (rule) {
    rule.entity = attr.entity;
    rule.attribute = attr.attribute;
    rule.label = attr.label;
    rule.type = attr.type;
    rule.operator = getDefaultOperator(attr.type);
    rule.value = '';  // Reset value when changing attribute
    rule.isNew = false;
    
    renderRules();
    updatePreviewDebounced();
  }
  
  closeAttributeSelector();
}

// Close attribute selector modal
function closeAttributeSelector() {
  const modal = document.querySelector('.attribute-selector-modal');
  if (modal) {
    modal.remove();
  }
}

// Update rule operator
function updateRuleOperator(ruleId, operator) {
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    rule.operator = operator;
    renderRules();
    updatePreviewDebounced();
  }
}

// Update rule value
function updateRuleValue(ruleId, value) {
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    rule.value = value;
    updatePreviewDebounced();
  }
}

// Delete rule
function deleteRule(ruleId) {
  rules = rules.filter(r => r.id !== ruleId);
  renderRules();
  updatePreview();
}

// Clear all rules
function clearRules() {
  if (rules.length === 0) return;
  
  if (confirm('Clear all conditions?')) {
    rules = [];
    renderRules();
    updatePreview();
  }
}

// Update preview with debounce
function updatePreviewDebounced() {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(updatePreview, 500);
}

// Update preview
async function updatePreview() {
  if (rules.length === 0) {
    document.getElementById('preview-count').textContent = '0';
    previewSamples = [];
    updateSampleResultsUI();
    document.getElementById('preview-stats').style.display = 'none';
    return;
  }
  
  try {
    const conditions = {
      logic: document.getElementById('logic-operator').value,
      base_entity: baseEntity,
      rules: rules.map(r => ({
        entity: r.entity,
        attribute: r.attribute,
        operator: r.operator,
        value: r.value
      }))
    };
    
    const response = await fetch(`${API_BASE}/segments/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditions })
    });
    
    const data = await response.json();
    
    // Update count
    document.getElementById('preview-count').textContent = data.count.toLocaleString();
    
    // Update samples
    if (data.samples.length > 0) {
      previewSamples = data.samples;
      updateSampleResultsUI();
      
      // Calculate and show stats (use real-time stats when available)
      const stats = data.stats || {};
      const avgScore = Number(stats.avg_score ?? 0);
      const activeCount = Number(stats.active_count ?? 0);
      const vipCount = Number(stats.vip_count ?? 0);
      const totalCount = data.count || data.samples.length;
      
      document.getElementById('stat-avg-score').textContent = avgScore ? avgScore.toFixed(0) : '0';
      document.getElementById('stat-active').textContent = `${activeCount}/${totalCount || 0}`;
      document.getElementById('stat-vip').textContent = `${vipCount}/${totalCount || 0}`;
      document.getElementById('preview-stats').style.display = 'block';
    } else {
      previewSamples = [];
      updateSampleResultsUI();
      document.getElementById('preview-stats').style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating preview:', error);
  }
}

function updateSampleResultsUI() {
  const meta = document.getElementById('sample-results-meta');
  const button = document.getElementById('sample-results-btn');
  const list = document.getElementById('sample-results');
  if (!meta || !button || !list) return;
  if (!previewSamples.length) {
    const emptyText = rules.length ? 'No customers match your criteria' : 'Build your query to see results';
    meta.textContent = emptyText;
    button.textContent = 'View';
    list.innerHTML = `<p class="empty-preview">${emptyText}</p>`;
    return;
  }
  ensureSampleColumns();
  meta.textContent = `${previewSamples.length} sample${previewSamples.length > 1 ? 's' : ''} available`;
  button.textContent = 'View';
  renderSampleTable();
}

function openSampleResults() {
  const modal = document.getElementById('sample-results-modal');
  if (!modal) return;
  if (!previewSamples.length) {
    updateSampleResultsUI();
  }
  renderSampleColumnsMenu();
  modal.classList.remove('hidden');
}

function closeSampleResults() {
  const modal = document.getElementById('sample-results-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function getEntityFieldOptions(entity) {
  const allObjects = [...BASE_ATTRIBUTE_OBJECTS, ...(customObjectsCache || [])];
  const match = allObjects.find(obj => obj.name === entity);
  return match?.fields || [];
}

function getFieldLabel(entity, name) {
  const field = getEntityFieldOptions(entity).find(f => f.name === name);
  return field?.label || name;
}

function ensureSampleColumns() {
  if (sampleColumns.length) return;
  const saved = loadSampleColumns(baseEntity);
  if (saved.length) {
    sampleColumns = saved;
    return;
  }
  const defaults = ['first_name', 'last_name', 'email', 'status'];
  const fields = getEntityFieldOptions(baseEntity);
  const available = new Set(fields.map(f => f.name));
  sampleColumns = defaults.filter(col => available.has(col));
  if (!sampleColumns.length && fields.length) {
    sampleColumns = fields.slice(0, 4).map(f => f.name);
  }
}

function renderSampleColumnsMenu() {
  const menu = document.getElementById('sample-columns-menu');
  if (!menu) return;
  const fields = getEntityFieldOptions(baseEntity);
  ensureSampleColumns();
  menu.innerHTML = fields.map(field => `
    <label class="sample-columns-option">
      <input type="checkbox" data-col="${field.name}" ${sampleColumns.includes(field.name) ? 'checked' : ''}>
      <span>${field.label}</span>
    </label>
  `).join('');
  menu.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', () => {
      const col = input.dataset.col;
      if (input.checked) {
        if (!sampleColumns.includes(col)) sampleColumns.push(col);
      } else {
        sampleColumns = sampleColumns.filter(c => c !== col);
      }
      saveSampleColumns(baseEntity, sampleColumns);
      renderSampleTable();
    });
  });
}

function toggleSampleColumnsMenu() {
  const menu = document.getElementById('sample-columns-menu');
  if (!menu) return;
  const next = menu.classList.contains('hidden');
  if (next) renderSampleColumnsMenu();
  menu.classList.toggle('hidden', !next);
}

function renderSampleTable() {
  const list = document.getElementById('sample-results');
  if (!list) return;
  if (!sampleColumns.length) {
    list.innerHTML = '<p class="empty-preview">Select at least one column.</p>';
    return;
  }
  list.style.setProperty('--sample-columns', sampleColumns.length);
  const header = `
    <div class="sample-table-header">
      ${sampleColumns.map(col => `<div class="sample-table-cell">${getFieldLabel(baseEntity, col)}</div>`).join('')}
    </div>
  `;
  const rows = previewSamples.map(item => `
    <div class="sample-table-row">
      ${sampleColumns.map(col => `<div class="sample-table-cell">${item[col] ?? ''}</div>`).join('')}
    </div>
  `).join('');
  list.innerHTML = header + rows;
}

function loadSampleColumns(entity) {
  try {
    const raw = localStorage.getItem(`segmentSampleColumns:${entity}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSampleColumns(entity, columns) {
  try {
    localStorage.setItem(`segmentSampleColumns:${entity}`, JSON.stringify(columns));
  } catch (error) {
    // ignore storage issues
  }
}

// Save segment
async function saveSegment(activate = false) {
  const name = document.getElementById('segment-name').value.trim();
  
  if (!name) {
    showToast('Please enter a segment name', 'error');
    return;
  }
  
  if (rules.length === 0) {
    showToast('Please add at least one condition', 'error');
    return;
  }
  
  const segmentData = {
    name,
    description: document.getElementById('segment-description').value,
    segment_type: document.getElementById('segment-type').value,
    conditions: {
      logic: document.getElementById('logic-operator').value,
      base_entity: baseEntity,
      rules: rules.map(r => ({
        entity: r.entity,
        attribute: r.attribute,
        operator: r.operator,
        value: r.value
      }))
    },
    status: activate ? 'active' : 'draft',
    is_active: activate
  };
  
  const url = segmentId ? `${API_BASE}/segments/${segmentId}` : `${API_BASE}/segments`;
  const method = segmentId ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segmentData)
    });
    const saved = await response.json();
    if (!response.ok) throw new Error(saved.error || 'Failed to save segment');
    
    hideLoading();
    showToast(`Segment ${segmentId ? 'updated' : 'created'} successfully`, 'success');
    
    const params = new URLSearchParams(window.location.search);
    const returnView = params.get('return');
    const deliveryId = params.get('deliveryId');
  const workflowId = params.get('workflowId');
  const nodeId = params.get('nodeId');
    if (returnView === 'deliveries' && deliveryId) {
      const segmentSelection = {
        deliveryId: parseInt(deliveryId, 10),
        segmentId: saved.id || segmentId
      };
      localStorage.setItem('deliverySegmentSelection', JSON.stringify(segmentSelection));
      setTimeout(() => {
        window.location.href = `/?view=deliveries&deliveryId=${encodeURIComponent(deliveryId)}&step=2`;
      }, 600);
  } else if (returnView === 'workflow' && workflowId && nodeId) {
    const segmentSelection = {
      workflowId: parseInt(workflowId, 10),
      nodeId,
      segmentId: saved.id || segmentId
    };
    localStorage.setItem('workflowSegmentSelection', JSON.stringify(segmentSelection));
    setTimeout(() => {
      window.location.href = `/orchestration.html?workflowId=${encodeURIComponent(workflowId)}`;
    }, 600);
    } else {
      setTimeout(() => {
        window.location.href = '/?view=segments';
      }, 1000);
    }
  } catch (error) {
    hideLoading();
    showToast(`Error ${segmentId ? 'updating' : 'creating'} segment`, 'error');
  }
}

// Toggle attribute category
function toggleAttrCategory(header) {
  header.classList.toggle('collapsed');
}

// Go back
function goBack() {
  window.location.href = '/?view=segments';
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
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================
// SQL GENERATION AND DISPLAY
// ============================================

function mapEntityToTable(entity) {
  if (!entity) return 'contacts';
  if (entity === 'contact' || entity === 'contacts' || entity === 'customer') return 'contacts';
  if (entity === 'events') return 'contact_events';
  return entity;
}

function getBaseEntity() {
  const select = document.getElementById('base-entity');
  return select?.value || baseEntity || 'customer';
}

// Generate SQL from current rules
function generateSQL() {
  if (rules.length === 0) {
    return `SELECT * FROM ${mapEntityToTable(getBaseEntity())}`;
  }
  
  const logic = document.getElementById('logic-operator')?.value || 'AND';
  const conditions = [];
  
  rules.forEach((rule, index) => {
    if (!rule.attribute) return;
    
    let condition = '';
    const tableName = mapEntityToTable(rule.entity || getBaseEntity());
    const columnName = rule.attribute;
    const value = rule.value;
    
    switch (rule.operator) {
      case 'equals':
        condition = `${tableName}.${columnName} = '${value}'`;
        break;
      case 'not_equals':
        condition = `${tableName}.${columnName} != '${value}'`;
        break;
      case 'contains':
        condition = `${tableName}.${columnName} LIKE '%${value}%'`;
        break;
      case 'not_contains':
        condition = `${tableName}.${columnName} NOT LIKE '%${value}%'`;
        break;
      case 'starts_with':
        condition = `${tableName}.${columnName} LIKE '${value}%'`;
        break;
      case 'ends_with':
        condition = `${tableName}.${columnName} LIKE '%${value}'`;
        break;
      case 'greater_than':
        condition = `${tableName}.${columnName} > ${value}`;
        break;
      case 'less_than':
        condition = `${tableName}.${columnName} < ${value}`;
        break;
      case 'greater_than_or_equal':
        condition = `${tableName}.${columnName} >= ${value}`;
        break;
      case 'less_than_or_equal':
        condition = `${tableName}.${columnName} <= ${value}`;
        break;
      case 'is_empty':
        condition = `(${tableName}.${columnName} IS NULL OR ${tableName}.${columnName} = '')`;
        break;
      case 'is_not_empty':
        condition = `(${tableName}.${columnName} IS NOT NULL AND ${tableName}.${columnName} != '')`;
        break;
      case 'in_last':
        condition = `${tableName}.${columnName} >= DATE_SUB(NOW(), INTERVAL ${value} DAY)`;
        break;
      case 'before':
        condition = `${tableName}.${columnName} < '${value}'`;
        break;
      case 'after':
        condition = `${tableName}.${columnName} > '${value}'`;
        break;
      default:
        condition = `${tableName}.${columnName} = '${value}'`;
    }
    
    conditions.push(condition);
    
    // Add operator between conditions (except for last one)
    if (index < rules.length - 1 && rule.nextOperator) {
      conditions.push(rule.nextOperator);
    }
  });
  
  let sql = `SELECT *\nFROM ${mapEntityToTable(getBaseEntity())}`;
  
  if (conditions.length > 0) {
    // Join conditions with the global logic operator if no specific operators
    const hasSpecificOperators = rules.some(r => r.nextOperator);
    if (hasSpecificOperators) {
      sql += '\nWHERE ' + conditions.join('\n  ');
    } else {
      sql += '\nWHERE ' + conditions.join(`\n  ${logic} `);
    }
  }
  
  sql += ';';
  
  return sql;
}

// Update SQL preview display
function updateSQLPreview() {
  const sql = generateSQL();
  const sqlOutput = document.getElementById('sql-output');
  if (sqlOutput) {
    sqlOutput.textContent = sql;
  }
}

// Copy SQL to clipboard
function copySQLToClipboard() {
  const sql = document.getElementById('sql-output')?.textContent;
  if (!sql) return;
  
  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy SQL', 'error');
  });
}

// Toggle SQL panel collapsed/expanded
function toggleSQLPanel() {
  const panel = document.querySelector('.sql-preview-panel');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  const button = panel.querySelector('.sql-actions .btn');
  if (button) {
    button.textContent = panel.classList.contains('collapsed') ? 'Expand' : 'Collapse';
  }
}

// Toggle preview panel collapsed/expanded
function togglePreviewPanel() {
  const panel = document.querySelector('.preview-panel');
  const button = document.getElementById('preview-toggle-btn');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  if (button) {
    button.textContent = panel.classList.contains('collapsed') ? 'Show' : 'Hide';
  }
}

// ============================================
// AND/OR OPERATORS BETWEEN CONDITIONS
// ============================================

// Set operator for a specific rule (what comes after this rule)
function setRuleOperator(ruleIndex, operator) {
  if (rules[ruleIndex]) {
    rules[ruleIndex].nextOperator = operator;
    renderRules();
    updateSQLPreview();
  }
}

// Update renderRules to include AND/OR operators
const originalRenderRules = renderRules;
renderRules = function() {
  const container = document.getElementById('rules-container');
  
  if (rules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Drag attributes from the left to build your segment</p>
        <p class="empty-state-hint">or</p>
        <button class="btn btn-secondary" onclick="addEmptyRule()">+ Add Condition</button>
      </div>
    `;
    updateSQLPreview();
    return;
  }
  
  let html = '';
  
  rules.forEach((rule, index) => {
    // Render the rule
    html += renderRule(rule);
    
    // Add AND/OR operator selector between rules (except after last rule)
    if (index < rules.length - 1) {
      const currentOperator = rule.nextOperator || 'AND';
      html += `
        <div class="condition-operator">
          <div class="operator-toggle-group">
            <button class="operator-toggle ${currentOperator === 'AND' ? 'active' : ''}" 
                    onclick="setRuleOperator(${index}, 'AND')">
              AND
            </button>
            <button class="operator-toggle ${currentOperator === 'OR' ? 'active' : ''}" 
                    onclick="setRuleOperator(${index}, 'OR')">
              OR
            </button>
          </div>
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
  updateSQLPreview();
};

// Override updatePreview to also update SQL
const originalUpdatePreview = updatePreview;
updatePreview = async function() {
  await originalUpdatePreview();
  updateSQLPreview();
};

// Override functions that modify rules to also update SQL
const originalDeleteRule = deleteRule;
deleteRule = function(ruleId) {
  originalDeleteRule(ruleId);
  updateSQLPreview();
};

const originalClearRules = clearRules;
clearRules = function() {
  originalClearRules();
  updateSQLPreview();
};

// Initialize SQL preview on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateSQLPreview, 500);
});
