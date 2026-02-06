// Object Data JavaScript
const API_BASE = '/api';

let objectId = null;
let currentObject = null;
let currentRecordId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  objectId = parseInt(params.get('objectId'));
  
  if (!objectId) {
    showToast('No object ID specified', 'error');
    return;
  }
  
  await loadObject();
  await loadData();
});

// Load object definition
async function loadObject() {
  try {
    const response = await fetch(`${API_BASE}/custom-objects/${objectId}`);
    currentObject = await response.json();
    
    document.getElementById('object-label').textContent = currentObject.label;
  } catch (error) {
    showToast('Error loading object', 'error');
  }
}

// Load data
async function loadData() {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/custom-objects/${objectId}/data`);
    const data = await response.json();
    
    document.getElementById('record-count').textContent = data.count.toLocaleString();
    
    // Build table
    if (data.records.length === 0) {
      document.getElementById('data-table-container').innerHTML = '<p style="text-align: center; padding: 2rem; color: #6B7280;">No records yet. Import CSV or add manually.</p>';
    } else {
      renderDataTable(data.records);
    }
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading data', 'error');
  }
}

// Render data table
function renderDataTable(records) {
  const fields = currentObject.fields;
  
  const headerHtml = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Customer ID</th>
        ${fields.map(f => `<th>${f.label}</th>`).join('')}
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
  `;
  
  const rowsHtml = records.map(record => `
    <tr>
      <td>${record.id}</td>
      <td>${record.customer_id || 'N/A'}</td>
      ${fields.map(f => `<td>${formatValue(record[f.name], f.type)}</td>`).join('')}
      <td>${new Date(record.created_at).toLocaleDateString()}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-secondary" onclick="editRecord(${record.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRecord(${record.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
      </td>
    </tr>
  `).join('');
  
  document.getElementById('data-table-container').innerHTML = `
    <table>
      ${headerHtml}
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

// Format value based on type
function formatValue(value, type) {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'number':
      return Number(value).toLocaleString();
    case 'boolean':
      return value ? '<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Yes</span>' : '<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> No</span>';
    default:
      return value;
  }
}

// Show import modal
function showImportModal() {
  document.getElementById('import-modal').classList.remove('hidden');
}

// Close import modal
function closeImportModal() {
  document.getElementById('import-modal').classList.add('hidden');
  document.getElementById('csv-file').value = '';
}

// Import CSV
async function importCSV() {
  const fileInput = document.getElementById('csv-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showToast('Please select a CSV file', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/custom-objects/${objectId}/import`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) throw new Error(result.error);
    
    hideLoading();
    closeImportModal();
    showToast(`Imported ${result.imported} records successfully`, 'success');
    loadData();
  } catch (error) {
    hideLoading();
    showToast(error.message || 'Error importing CSV', 'error');
  }
}

// Show add record modal
function showAddRecordModal() {
  currentRecordId = null;
  document.getElementById('record-modal-title').textContent = 'Add Record';
  
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Customer ID (optional)</label>
      <input type="number" id="record-customer-id" class="form-input" placeholder="Link to customer...">
      <div class="form-help">Enter customer ID to link this record to a customer</div>
    </div>
    ${currentObject.fields.map(field => `
      <div class="form-group">
        <label class="form-label ${field.is_required ? 'form-label-required' : ''}">${field.label}</label>
        ${renderFieldInput(field, '')}
      </div>
    `).join('')}
  `;
  
  document.getElementById('record-form-container').innerHTML = formHtml;
  document.getElementById('add-record-modal').classList.remove('hidden');
}

// Render field input based on type
function renderFieldInput(field, value) {
  switch (field.type) {
    case 'text':
      return `<input type="text" id="field-${field.name}" class="form-input" value="${value || ''}">`;
    case 'number':
      return `<input type="number" id="field-${field.name}" class="form-input" value="${value || ''}">`;
    case 'date':
      return `<input type="date" id="field-${field.name}" class="form-input" value="${value || ''}">`;
    case 'boolean':
      return `
        <select id="field-${field.name}" class="form-input">
          <option value="true" ${value === true ? 'selected' : ''}>Yes</option>
          <option value="false" ${value === false ? 'selected' : ''}>No</option>
        </select>
      `;
    case 'select':
      return `<input type="text" id="field-${field.name}" class="form-input" value="${value || ''}">`;
    default:
      return `<input type="text" id="field-${field.name}" class="form-input" value="${value || ''}">`;
  }
}

// Close add record modal
function closeAddRecordModal() {
  document.getElementById('add-record-modal').classList.add('hidden');
  currentRecordId = null;
}

// Save record
async function saveRecord() {
  const record = {
    customer_id: document.getElementById('record-customer-id').value || null
  };
  
  // Get all field values
  currentObject.fields.forEach(field => {
    const input = document.getElementById(`field-${field.name}`);
    if (input) {
      let value = input.value;
      
      // Convert types
      if (field.type === 'number') {
        value = value ? Number(value) : null;
      } else if (field.type === 'boolean') {
        value = value === 'true';
      }
      
      record[field.name] = value;
    }
  });

  const missing = currentObject.fields
    .filter(field => field.is_required || field.is_primary)
    .filter(field => {
      const value = record[field.name];
      return value === null || value === undefined || value === '';
    });
  if (missing.length > 0) {
    showToast(`Missing required fields: ${missing.map(f => f.label || f.name).join(', ')}`, 'error');
    return;
  }
  
  const url = currentRecordId 
    ? `${API_BASE}/custom-objects/${objectId}/data/${currentRecordId}`
    : `${API_BASE}/custom-objects/${objectId}/data`;
  const method = currentRecordId ? 'PUT' : 'POST';
  
  showLoading();
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record })
    });
    
    if (!response.ok) throw new Error('Failed to save record');
    
    hideLoading();
    closeAddRecordModal();
    showToast(`Record ${currentRecordId ? 'updated' : 'added'} successfully`, 'success');
    loadData();
  } catch (error) {
    hideLoading();
    showToast(error.message, 'error');
  }
}

// Edit record
async function editRecord(recordId) {
  try {
    const response = await fetch(`${API_BASE}/custom-objects/${objectId}/data`);
    const data = await response.json();
    const record = data.records.find(r => r.id === recordId);
    
    if (!record) {
      showToast('Record not found', 'error');
      return;
    }
    
    currentRecordId = recordId;
    document.getElementById('record-modal-title').textContent = 'Edit Record';
    
    const formHtml = `
      <div class="form-group">
        <label class="form-label">Customer ID (optional)</label>
        <input type="number" id="record-customer-id" class="form-input" value="${record.customer_id || ''}" placeholder="Link to customer...">
      </div>
      ${currentObject.fields.map(field => `
        <div class="form-group">
          <label class="form-label ${field.is_required ? 'form-label-required' : ''}">${field.label}</label>
          ${renderFieldInput(field, record[field.name])}
        </div>
      `).join('')}
    `;
    
    document.getElementById('record-form-container').innerHTML = formHtml;
    document.getElementById('add-record-modal').classList.remove('hidden');
  } catch (error) {
    showToast('Error loading record', 'error');
  }
}

// Delete record
async function deleteRecord(recordId) {
  if (!confirm('Delete this record?')) return;
  
  showLoading();
  try {
    const response = await fetch(`${API_BASE}/custom-objects/${objectId}/data/${recordId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete');
    
    hideLoading();
    showToast('Record deleted successfully', 'success');
    loadData();
  } catch (error) {
    hideLoading();
    showToast('Error deleting record', 'error');
  }
}

// Go back
function goBack() {
  window.location.href = '/?view=custom-objects';
}

// Utility functions
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
