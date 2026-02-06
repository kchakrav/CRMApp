const API_BASE = '/api';

let objectId = null;
let currentObject = null;
let uiLayout = null;
let records = [];
let selectedRecord = null;
let previewMode = false;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  objectId = parseInt(params.get('objectId'), 10);
  previewMode = params.get('preview') === '1';
  if (!objectId) return;
  await loadObject();
  await loadLayout();
  await loadRecords();
  applyLayoutMode();
  renderList();
  bindActions();
});

function bindActions() {
  document.getElementById('new-record-btn').addEventListener('click', () => openRecordModal());
  document.getElementById('back-to-builder-btn').addEventListener('click', () => {
    window.location.href = `/ui-builder.html?objectId=${objectId}`;
  });
  document.getElementById('record-search').addEventListener('input', renderList);
  document.getElementById('record-sort').addEventListener('change', renderList);
  document.getElementById('detail-edit-btn').addEventListener('click', () => {
    if (selectedRecord) openRecordModal(selectedRecord);
  });
  document.getElementById('detail-delete-btn').addEventListener('click', async () => {
    if (!selectedRecord) return;
    if (!confirm('Delete this record?')) return;
    await fetch(`${API_BASE}/custom-objects/${objectId}/data/${selectedRecord.id}`, { method: 'DELETE' });
    closeDetailPanel();
    await loadRecords();
    renderList();
  });
  document.getElementById('save-record-btn').addEventListener('click', saveRecord);

  // Close quick action menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.row-actions-trigger') && !e.target.closest('.row-actions-menu')) {
      document.querySelectorAll('.row-actions-menu.open').forEach(m => m.classList.remove('open'));
    }
  });
}

async function loadObject() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}`);
  currentObject = await res.json();
  document.getElementById('object-ui-title').textContent = currentObject.label || currentObject.name;
  document.getElementById('object-ui-subtitle').textContent = previewMode ? 'Preview mode' : 'Published UI';
  const sort = document.getElementById('record-sort');
  sort.innerHTML = currentObject.fields.map(f => `<option value="${f.name}">${f.label}</option>`).join('');
}

async function loadLayout() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui?mode=${previewMode ? 'draft' : 'published'}`);
  if (!res.ok) {
    showToast('UI layout not found', 'error');
    return;
  }
  const data = await res.json();
  uiLayout = data.layout || null;
}

function applyLayoutMode() {
  const body = document.querySelector('.object-ui-body');
  const layoutType = uiLayout?.layout || 'master-detail';
  body.classList.remove('layout-single', 'layout-two-column', 'layout-tabs', 'layout-master-detail');
  body.classList.add(`layout-${layoutType}`);

  const subtitleEl = document.getElementById('object-ui-subtitle');
  const modeLabel = previewMode ? 'Preview mode' : 'Published UI';
  const layoutLabels = { 'single': 'Single Column', 'two-column': 'Two Column', 'tabs': 'Tabs', 'master-detail': 'Master-Detail' };
  subtitleEl.innerHTML = `${modeLabel} <span class="layout-badge">${layoutLabels[layoutType] || layoutType}</span>`;
}

async function loadRecords() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}/data`);
  const data = await res.json();
  records = data.records || [];
}

// Get the list of fields to show as columns
function getListColumns() {
  const listConfig = uiLayout?.listConfig;
  if (listConfig?.columns?.length) {
    // Return only configured columns, in order
    return listConfig.columns
      .map(name => currentObject.fields.find(f => f.name === name))
      .filter(Boolean);
  }
  // Fallback: show all fields
  return currentObject.fields;
}

function renderList() {
  const container = document.getElementById('record-table-container');
  if (!uiLayout) {
    container.innerHTML = '<div class="empty-state">No published UI layout.</div>';
    return;
  }
  const search = (document.getElementById('record-search').value || '').toLowerCase();
  const sortField = document.getElementById('record-sort').value;
  let filtered = records.slice();
  if (search) {
    filtered = filtered.filter(record => {
      return currentObject.fields.some(f => String(record[f.name] || '').toLowerCase().includes(search));
    });
  }
  filtered.sort((a, b) => String(a[sortField] || '').localeCompare(String(b[sortField] || '')));
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No records found.</div>';
    return;
  }

  const columns = getListColumns();

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          ${columns.map(f => `<th>${f.label}</th>`).join('')}
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(record => `
          <tr class="${selectedRecord?.id === record.id ? 'row-selected' : ''}">
            ${columns.map(f => `<td>${formatValue(record[f.name], f.type)}</td>`).join('')}
            <td class="actions-col">
              <div class="row-actions">
                <button class="row-actions-trigger" onclick="toggleRowMenu(event, ${record.id})" title="Actions">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
                <div class="row-actions-menu" id="row-menu-${record.id}">
                  <button class="row-action-item" onclick="viewRecordDetail(${record.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View Details
                  </button>
                  <button class="row-action-item" onclick="editRecord(${record.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <div class="row-action-divider"></div>
                  <button class="row-action-item row-action-danger" onclick="deleteRecord(${record.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleRowMenu(e, recordId) {
  e.stopPropagation();
  // Close all other menus
  document.querySelectorAll('.row-actions-menu.open').forEach(m => m.classList.remove('open'));
  const menu = document.getElementById(`row-menu-${recordId}`);
  if (menu) {
    menu.classList.toggle('open');
    // Position: use fixed positioning to avoid overflow clipping
    const trigger = e.currentTarget;
    const rect = trigger.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    // Flip up if overflowing bottom
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight - 8) {
      menu.style.top = (rect.top - menuRect.height - 4) + 'px';
    }
  }
}

function viewRecordDetail(recordId) {
  document.querySelectorAll('.row-actions-menu.open').forEach(m => m.classList.remove('open'));
  selectedRecord = records.find(r => r.id === recordId);
  if (!selectedRecord) return;
  openDetailPanel();
}

function editRecord(recordId) {
  document.querySelectorAll('.row-actions-menu.open').forEach(m => m.classList.remove('open'));
  const record = records.find(r => r.id === recordId);
  if (record) openRecordModal(record);
}

async function deleteRecord(recordId) {
  document.querySelectorAll('.row-actions-menu.open').forEach(m => m.classList.remove('open'));
  if (!confirm('Delete this record?')) return;
  await fetch(`${API_BASE}/custom-objects/${objectId}/data/${recordId}`, { method: 'DELETE' });
  if (selectedRecord?.id === recordId) {
    selectedRecord = null;
    closeDetailPanel();
  }
  await loadRecords();
  renderList();
  showToast('Record deleted', 'success');
}

// ── Detail Slide-out Panel ─────────────────────────────

function openDetailPanel() {
  const overlay = document.getElementById('detail-overlay');
  const panel = document.getElementById('detail-panel');
  overlay.classList.remove('hidden');
  panel.classList.remove('hidden');
  renderDetailPanel();
  renderList(); // highlight selected row
}

function closeDetailPanel() {
  document.getElementById('detail-overlay').classList.add('hidden');
  document.getElementById('detail-panel').classList.add('hidden');
  selectedRecord = null;
  renderList();
}

function renderDetailPanel() {
  const body = document.getElementById('detail-panel-body');
  if (!uiLayout || !selectedRecord) {
    body.innerHTML = '<div class="empty-state">No data to display.</div>';
    return;
  }
  const record = selectedRecord;
  const layoutType = uiLayout.layout || 'master-detail';

  // Update title
  const primaryField = currentObject.fields[0];
  const titleValue = primaryField ? record[primaryField.name] : record.id;
  document.getElementById('detail-panel-title').textContent = titleValue || 'Record Details';

  // Tabs layout: render sections as switchable tabs
  if (layoutType === 'tabs' && uiLayout.sections.length > 1) {
    const activeTab = body.dataset.activeTab || uiLayout.sections[0].id;
    body.innerHTML = `
      <div class="ui-tabs-row">
        ${uiLayout.sections.map(section => `
          <button class="ui-tab-btn ${section.id === activeTab ? 'active' : ''}" type="button" onclick="switchDetailTab('${section.id}')">${section.title}</button>
        `).join('')}
      </div>
      ${uiLayout.sections.map(section => `
        <div class="ui-tab-panel ${section.id === activeTab ? '' : 'hidden'}" data-tab-id="${section.id}">
          <div class="ui-form-columns" style="grid-template-columns: repeat(${section.columns.length}, 1fr);">
            ${section.columns.map(column => `
              <div>${column.blocks.map(block => renderBlock(block, record)).join('')}</div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
    return;
  }

  // Standard: render sections stacked
  const sectionsHtml = uiLayout.sections.map(section => `
    <div class="ui-form-section">
      <div class="ui-form-section-title">${section.title}</div>
      <div class="ui-form-columns" style="grid-template-columns: repeat(${section.columns.length}, 1fr);">
        ${section.columns.map(column => `
          <div>${column.blocks.map(block => renderBlock(block, record)).join('')}</div>
        `).join('')}
      </div>
    </div>
  `).join('');
  body.innerHTML = sectionsHtml || '<div class="empty-state">No blocks in layout.</div>';
}

function switchDetailTab(tabId) {
  const body = document.getElementById('detail-panel-body');
  body.dataset.activeTab = tabId;
  renderDetailPanel();
}

function renderBlock(block, record) {
  if (block.type === 'field') {
    const field = currentObject.fields.find(f => f.name === block.fieldName);
    const label = block.fieldLabel || field?.label || block.fieldName;
    return `
      <div class="ui-form-block">
        <label class="form-label">${label}</label>
        <div class="form-value">${formatValue(record[block.fieldName], field?.type)}</div>
      </div>
    `;
  }
  if (block.type === 'header') {
    return `<div class="ui-form-block"><strong>${block.label || 'Header'}</strong></div>`;
  }
  if (block.type === 'divider') {
    return `<div class="ui-form-block"><hr></div>`;
  }
  if (block.type === 'button') {
    return `<div class="ui-form-block"><button class="btn btn-secondary">${block.label || 'Action'}</button></div>`;
  }
  if (block.type === 'related') {
    return `<div class="ui-form-block"><div class="form-help">Related list coming soon</div></div>`;
  }
  if (block.type === 'list') {
    return `<div class="ui-form-block"><div class="form-help">Record list</div></div>`;
  }
  if (block.type === 'form') {
    return `<div class="ui-form-block"><div class="form-help">Record detail</div></div>`;
  }
  return '';
}

// ── Record Modal ───────────────────────────────────────

function openRecordModal(record = null) {
  const modal = document.getElementById('record-modal');
  modal.classList.remove('hidden');
  document.getElementById('record-modal-title').textContent = record ? 'Edit Record' : 'New Record';
  const fieldsHtml = currentObject.fields.map(field => `
    <div class="form-group">
      <label class="form-label ${field.is_required ? 'form-label-required' : ''}">${field.label}</label>
      ${renderInput(field, record ? record[field.name] : '')}
    </div>
  `).join('');
  document.getElementById('record-modal-body').innerHTML = fieldsHtml;
  modal.dataset.recordId = record ? record.id : '';
}

function closeRecordModal() {
  document.getElementById('record-modal').classList.add('hidden');
}

async function saveRecord() {
  const modal = document.getElementById('record-modal');
  const recordId = modal.dataset.recordId;
  const record = {};
  currentObject.fields.forEach(field => {
    const input = document.getElementById(`field-${field.name}`);
    if (!input) return;
    record[field.name] = input.value;
  });
  const url = recordId
    ? `${API_BASE}/custom-objects/${objectId}/data/${recordId}`
    : `${API_BASE}/custom-objects/${objectId}/data`;
  const method = recordId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record })
  });
  if (!res.ok) {
    const data = await res.json();
    showToast(data.error || 'Failed to save', 'error');
    return;
  }
  closeRecordModal();
  await loadRecords();
  renderList();
  // Refresh detail panel if open
  if (selectedRecord && !document.getElementById('detail-panel').classList.contains('hidden')) {
    selectedRecord = records.find(r => r.id === parseInt(recordId)) || selectedRecord;
    renderDetailPanel();
  }
  showToast(recordId ? 'Record updated' : 'Record created', 'success');
}

function renderInput(field, value) {
  const id = `field-${field.name}`;
  if (field.type === 'number') return `<input type="number" id="${id}" class="form-input" value="${value || ''}">`;
  if (field.type === 'date') return `<input type="date" id="${id}" class="form-input" value="${value || ''}">`;
  if (field.type === 'datetime') return `<input type="datetime-local" id="${id}" class="form-input" value="${value || ''}">`;
  if (field.type === 'boolean') {
    return `
      <select id="${id}" class="form-input">
        <option value="true" ${value === true ? 'selected' : ''}>Yes</option>
        <option value="false" ${value === false ? 'selected' : ''}>No</option>
      </select>
    `;
  }
  return `<input type="text" id="${id}" class="form-input" value="${value || ''}">`;
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'date') return new Date(value).toLocaleDateString();
  if (type === 'datetime') return new Date(value).toLocaleString();
  if (type === 'number') return Number(value).toLocaleString();
  if (type === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('object-ui-toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.background = type === 'error' ? '#b91c1c' : type === 'success' ? '#047857' : '#1f2937';
  setTimeout(() => toast.classList.add('hidden'), 2000);
}
