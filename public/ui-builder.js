const API_BASE = '/api';

let objectId = null;
let currentObject = null;
let builderState = {
  layout: null,
  sections: [],
  selected: null,
  listConfig: { columns: [] } // which fields to show in list view
};
let history = [];
let historyIndex = -1;
let canvasView = 'detail'; // 'detail' or 'list'

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    objectId = parseInt(params.get('objectId'), 10);
    if (!objectId) {
      showToast('Missing object id', 'error');
      return;
    }
    await loadObject();
    await loadDraft();
    renderLayouts();
    renderLibrary();
    renderCanvas();
    bindActions();
  } catch (error) {
    showToast(error.message || 'Failed to load UI Builder', 'error');
  }
});

async function loadObject() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}`);
  const data = await res.json();
  if (!res.ok) {
    showToast(data.error || 'Failed to load object', 'error');
    currentObject = { label: 'Unknown Object', name: 'unknown', fields: [] };
  } else {
    currentObject = data;
  }
  document.getElementById('ui-builder-object-label').textContent = currentObject.label || currentObject.name || 'Custom Object';
}

async function loadDraft() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui?mode=draft`);
  if (!res.ok) return;
  const data = await res.json();
  if (data.layout) {
    builderState = data.layout;
    // Ensure listConfig exists for older saved drafts
    if (!builderState.listConfig) {
      builderState.listConfig = { columns: [] };
    }
  }
}

function bindActions() {
  document.getElementById('ui-back-btn').addEventListener('click', () => {
    window.location.href = '/?view=custom-objects';
  });
  document.getElementById('add-section-btn').addEventListener('click', () => {
    addSection();
  });
  document.getElementById('undo-btn').addEventListener('click', undo);
  document.getElementById('redo-btn').addEventListener('click', redo);
  document.getElementById('ui-save-btn').addEventListener('click', saveDraft);
  document.getElementById('ui-publish-btn').addEventListener('click', publishLayout);
  document.getElementById('ui-preview-btn').addEventListener('click', () => {
    window.open(`/object-ui.html?objectId=${objectId}&preview=1`, '_blank');
  });
  document.getElementById('ui-versions-btn').addEventListener('click', openVersionHistory);

  // Canvas view toggle
  document.getElementById('detail-view-btn').addEventListener('click', () => switchCanvasView('detail'));
  document.getElementById('list-view-btn').addEventListener('click', () => switchCanvasView('list'));
}

function switchCanvasView(view) {
  canvasView = view;
  document.getElementById('detail-view-btn').classList.toggle('active', view === 'detail');
  document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
  document.getElementById('canvas-content').classList.toggle('hidden', view !== 'detail');
  document.getElementById('canvas-empty').classList.toggle('hidden', view !== 'detail' || !!builderState.layout);
  document.getElementById('list-config-content').classList.toggle('hidden', view !== 'list');
  document.getElementById('add-section-btn').classList.toggle('hidden', view !== 'detail');
  if (view === 'list') {
    renderListConfig();
  }
}

function renderLayouts() {
  const layouts = [
    { id: 'single', label: 'Single column', thumb: [[1],[1],[1]] },
    { id: 'two-column', label: 'Two column', thumb: [[1,1],[1,1]] },
    { id: 'tabs', label: 'Tabs', thumb: [[1],[1,1]] },
    { id: 'master-detail', label: 'Master-detail', thumb: [[1,1]] }
  ];
  const grid = document.getElementById('layout-grid');
  grid.innerHTML = layouts.map(layout => `
    <div class="layout-card ${builderState.layout === layout.id ? 'active' : ''}" onclick="selectLayout('${layout.id}')">
      <div class="layout-thumb">
        ${layout.thumb.map(row => `
          <div style="display:grid;grid-template-columns:repeat(${row.length},1fr);gap:4px;">
            ${row.map(() => '<div></div>').join('')}
          </div>
        `).join('')}
      </div>
      <div class="layout-label">${layout.label}</div>
    </div>
  `).join('');
}

function selectLayout(id) {
  builderState.layout = id;
  builderState.sections = layoutToSections(id);
  builderState.selected = null;
  pushHistory();
  renderLayouts();
  renderCanvas();
}

function layoutToSections(id) {
  if (id === 'two-column') {
    return [createSection('Section', 2)];
  }
  if (id === 'tabs') {
    return [createSection('Tab 1', 1), createSection('Tab 2', 1)];
  }
  if (id === 'master-detail') {
    const section = createSection('Master / Detail', 2);
    section.columns[0].blocks.push({ id: uid(), type: 'list', label: 'Record list' });
    section.columns[1].blocks.push({ id: uid(), type: 'form', label: 'Record detail' });
    return [section];
  }
  return [createSection('Section', 1)];
}

function createSection(title, columns) {
  return {
    id: uid(),
    title,
    columns: Array.from({ length: columns }, () => ({ id: uid(), blocks: [] }))
  };
}

function renderLibrary() {
  const fieldLibrary = document.getElementById('field-library');
  const fields = currentObject?.fields || [];
  fieldLibrary.innerHTML = fields.length
    ? fields.map(field => `
      <div class="library-item" draggable="true" data-type="field" data-field="${field.name}">
        <div class="library-item-info">
          <span class="library-item-name">${field.label}</span>
          <span class="library-item-type">${field.type}</span>
        </div>
        <button class="library-add-btn" type="button" title="Add to canvas" data-add-type="field" data-add-field="${field.name}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    `).join('')
    : '<div class="form-help">No fields found for this object.</div>';
  const blockLibrary = document.getElementById('block-library');
  const blocks = [
    { type: 'header', label: 'Header' },
    { type: 'divider', label: 'Divider' },
    { type: 'button', label: 'Button' },
    { type: 'related', label: 'Related List' }
  ];
  blockLibrary.innerHTML = blocks.map(block => `
    <div class="library-item" draggable="true" data-type="${block.type}">
      <div class="library-item-info">
        <span class="library-item-name">${block.label}</span>
        <span class="library-item-type">Block</span>
      </div>
      <button class="library-add-btn" type="button" title="Add to canvas" data-add-type="${block.type}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  `).join('');

  // Attach drag-and-drop
  document.querySelectorAll('.library-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        from: 'library',
        type: item.dataset.type,
        field: item.dataset.field || null
      }));
    });
  });

  // Attach click-to-add buttons
  document.querySelectorAll('.library-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = btn.dataset.addType;
      const field = btn.dataset.addField || null;
      addBlockFromLibraryClick(type, field);
    });
  });
}

// Add a block/field to the canvas via click (no drag needed)
function addBlockFromLibraryClick(type, fieldName) {
  if (!builderState.layout) {
    showToast('Select a layout first', 'warning');
    return;
  }
  // If no sections exist, create one
  if (!builderState.sections.length) {
    builderState.sections.push(createSection('Section', 1));
  }
  // Find target column: use the selected section if a section is selected,
  // otherwise use the last section's first column
  let targetColumn = null;
  if (builderState.selected?.type === 'section') {
    const section = builderState.sections.find(s => s.id === builderState.selected.id);
    if (section) targetColumn = section.columns[0];
  }
  if (!targetColumn) {
    const lastSection = builderState.sections[builderState.sections.length - 1];
    targetColumn = lastSection.columns[0];
  }
  // Create the block
  const data = { from: 'library', type, field: fieldName };
  const block = createBlockFromLibrary(data);
  // Add to end of column
  targetColumn.blocks.push(block);
  pushHistory();
  renderCanvas();
  // Brief visual feedback on the button
  showToast(`Added "${block.fieldLabel || block.label || block.type}"`, 'success');
}

function renderListConfig() {
  const container = document.getElementById('list-config-content');
  const fields = currentObject?.fields || [];
  if (!fields.length) {
    container.innerHTML = '<div class="canvas-empty">No fields available for this object.</div>';
    return;
  }

  const selectedColumns = builderState.listConfig?.columns || [];

  // Build ordered list: selected columns first (in order), then unselected
  const orderedFields = [];
  selectedColumns.forEach(name => {
    const f = fields.find(field => field.name === name);
    if (f) orderedFields.push({ ...f, enabled: true });
  });
  fields.forEach(f => {
    if (!selectedColumns.includes(f.name)) {
      orderedFields.push({ ...f, enabled: false });
    }
  });

  const enabledCount = orderedFields.filter(f => f.enabled).length;

  container.innerHTML = `
    <div class="list-config-panel">
      <div class="list-config-header">
        <div>
          <div class="list-config-title">List View Columns</div>
          <div class="list-config-subtitle">Choose which fields appear as columns in the record list. Drag to reorder.</div>
        </div>
        <span class="list-config-count">${enabledCount} of ${fields.length} selected</span>
      </div>
      <div class="list-config-items" id="list-config-items">
        ${orderedFields.map((field, idx) => `
          <div class="list-config-item ${field.enabled ? 'enabled' : ''}" draggable="${field.enabled ? 'true' : 'false'}" data-field="${field.name}" data-idx="${idx}">
            <div class="list-config-drag ${field.enabled ? '' : 'invisible'}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <label class="list-config-toggle">
              <input type="checkbox" ${field.enabled ? 'checked' : ''} onchange="toggleListColumn('${field.name}', this.checked)">
              <span class="list-config-check"></span>
            </label>
            <div class="list-config-info">
              <span class="list-config-name">${field.label}</span>
              <span class="list-config-type">${field.type}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="list-config-preview">
        <div class="list-config-preview-title">Preview</div>
        <div class="list-config-table-wrap">
          <table class="list-config-table">
            <thead>
              <tr>
                ${(enabledCount ? orderedFields.filter(f => f.enabled) : fields.slice(0, 4)).map(f => `<th>${f.label}</th>`).join('')}
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                ${(enabledCount ? orderedFields.filter(f => f.enabled) : fields.slice(0, 4)).map(() => '<td class="list-config-sample"></td>').join('')}
                <td class="list-config-actions-cell">
                  <span class="list-config-dots">&#8943;</span>
                </td>
              </tr>
              <tr>
                ${(enabledCount ? orderedFields.filter(f => f.enabled) : fields.slice(0, 4)).map(() => '<td class="list-config-sample short"></td>').join('')}
                <td class="list-config-actions-cell">
                  <span class="list-config-dots">&#8943;</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        ${!enabledCount ? '<div class="list-config-hint">No columns selected — all fields will be shown by default.</div>' : ''}
      </div>
    </div>
  `;
  attachListConfigDnD();
}

function toggleListColumn(fieldName, checked) {
  if (!builderState.listConfig) builderState.listConfig = { columns: [] };
  if (checked) {
    if (!builderState.listConfig.columns.includes(fieldName)) {
      builderState.listConfig.columns.push(fieldName);
    }
  } else {
    builderState.listConfig.columns = builderState.listConfig.columns.filter(c => c !== fieldName);
  }
  pushHistory();
  renderListConfig();
}

function attachListConfigDnD() {
  const container = document.getElementById('list-config-items');
  if (!container) return;
  let dragItem = null;
  container.querySelectorAll('.list-config-item.enabled').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      if (dragItem) dragItem.classList.remove('dragging');
      dragItem = null;
    });
  });
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragItem) return;
    const afterEl = getDragAfterElement(container, e.clientY);
    if (afterEl) {
      container.insertBefore(dragItem, afterEl);
    } else {
      container.appendChild(dragItem);
    }
  });
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    // Rebuild columns order from DOM
    const items = container.querySelectorAll('.list-config-item.enabled');
    builderState.listConfig.columns = Array.from(items).map(el => el.dataset.field);
    pushHistory();
    renderListConfig();
  });
}

function getDragAfterElement(container, y) {
  const elements = Array.from(container.querySelectorAll('.list-config-item:not(.dragging)'));
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;
  elements.forEach(el => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = el;
    }
  });
  return closest;
}

function renderCanvas() {
  const empty = document.getElementById('canvas-empty');
  const container = document.getElementById('canvas-content');
  if (!builderState.layout) {
    empty.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');
  container.innerHTML = builderState.sections.map(section => `
    <div class="ui-section" data-section="${section.id}">
      <div class="ui-section-header">
        <div class="ui-section-title">${section.title}</div>
        <div class="ui-section-actions">
          <button class="btn btn-sm btn-ghost" onclick="selectSection('${section.id}')">Edit</button>
        </div>
      </div>
      <div class="ui-columns" style="grid-template-columns: repeat(${section.columns.length}, 1fr);">
        ${section.columns.map(column => `
          <div class="ui-column" data-column="${column.id}">
            ${column.blocks.map(block => renderBlock(block)).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  attachCanvasDnD();
}

function renderBlock(block) {
  const selected = builderState.selected?.type === 'block' && builderState.selected.id === block.id;
  const label = block.label || block.fieldLabel || block.fieldName || block.type;
  return `
    <div class="ui-block ${selected ? 'selected' : ''}" draggable="true" data-block="${block.id}">
      <span>${label}</span>
      <button class="btn btn-sm btn-ghost" onclick="selectBlock('${block.id}')">Edit</button>
    </div>
  `;
}

function attachCanvasDnD() {
  document.querySelectorAll('.ui-block').forEach(block => {
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        from: 'canvas',
        blockId: block.dataset.block
      }));
    });
  });

  document.querySelectorAll('.ui-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      const indicator = getDropIndicator(column);
      const { index } = getDropIndex(column, e.clientY);
      positionIndicator(column, indicator, index);
    });
    column.addEventListener('dragleave', () => clearIndicator(column));
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { index } = getDropIndex(column, e.clientY);
      if (data.from === 'library') {
        const block = createBlockFromLibrary(data);
        insertBlock(column.dataset.column, block, index);
      } else if (data.from === 'canvas') {
        moveBlockToColumn(data.blockId, column.dataset.column, index);
      }
      clearIndicator(column);
      renderCanvas();
      pushHistory();
    });
  });
}

function createBlockFromLibrary(data) {
  if (data.type === 'field') {
    const field = currentObject.fields.find(f => f.name === data.field);
    return {
      id: uid(),
      type: 'field',
      fieldName: field.name,
      fieldLabel: field.label,
      fieldType: field.type,
      required: !!field.is_required,
      helpText: ''
    };
  }
  return { id: uid(), type: data.type, label: data.type };
}

function insertBlock(columnId, block, index) {
  builderState.sections.forEach(section => {
    section.columns.forEach(column => {
      if (column.id === columnId) {
        column.blocks.splice(index, 0, block);
      }
    });
  });
}

function moveBlockToColumn(blockId, columnId, index) {
  const block = removeBlock(blockId);
  if (!block) return;
  insertBlock(columnId, block, index);
}

function removeBlock(blockId) {
  for (const section of builderState.sections) {
    for (const column of section.columns) {
      const idx = column.blocks.findIndex(b => b.id === blockId);
      if (idx !== -1) {
        return column.blocks.splice(idx, 1)[0];
      }
    }
  }
  return null;
}

function selectBlock(blockId) {
  builderState.selected = { type: 'block', id: blockId };
  renderInspector();
  renderCanvas();
}

function selectSection(sectionId) {
  builderState.selected = { type: 'section', id: sectionId };
  renderInspector();
}

function renderInspector() {
  const container = document.getElementById('inspector-content');
  const selection = builderState.selected;
  if (!selection) {
    container.textContent = 'Select a block or section to edit properties.';
    return;
  }
  if (selection.type === 'section') {
    const section = builderState.sections.find(s => s.id === selection.id);
    if (!section) return;
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Section title</label>
        <input class="form-input" value="${section.title}" onchange="updateSectionTitle('${section.id}', this.value)">
      </div>
    `;
    return;
  }
  const block = findBlock(selection.id);
  if (!block) return;
  const isField = block.type === 'field';
  container.innerHTML = `
    <div class="form-group">
      <label class="form-label">Label</label>
      <input class="form-input" value="${block.fieldLabel || block.label || ''}" onchange="updateBlock('${block.id}', 'fieldLabel', this.value)">
    </div>
    ${isField ? `
      <div class="form-group">
        <label class="form-label">Required</label>
        <label class="toggle">
          <input type="checkbox" ${block.required ? 'checked' : ''} onchange="updateBlock('${block.id}', 'required', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Default value</label>
        <input class="form-input" value="${block.defaultValue || ''}" onchange="updateBlock('${block.id}', 'defaultValue', this.value)">
      </div>
    ` : ''}
    <div class="form-group">
      <label class="form-label">Help text</label>
      <input class="form-input" value="${block.helpText || ''}" onchange="updateBlock('${block.id}', 'helpText', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">Visibility rule</label>
      <input class="form-input" value="${block.visibility || ''}" placeholder="e.g., status == 'active'" onchange="updateBlock('${block.id}', 'visibility', this.value)">
    </div>
  `;
}

function updateSectionTitle(sectionId, value) {
  const section = builderState.sections.find(s => s.id === sectionId);
  if (section) section.title = value;
  pushHistory();
  renderCanvas();
}

function updateBlock(blockId, key, value) {
  const block = findBlock(blockId);
  if (!block) return;
  block[key] = value;
  pushHistory();
}

function findBlock(blockId) {
  for (const section of builderState.sections) {
    for (const column of section.columns) {
      const block = column.blocks.find(b => b.id === blockId);
      if (block) return block;
    }
  }
  return null;
}

function addSection() {
  if (!builderState.layout) {
    showToast('Select a layout first', 'warning');
    return;
  }
  builderState.sections.push(createSection('New section', 1));
  pushHistory();
  renderCanvas();
}

function pushHistory() {
  const snapshot = JSON.stringify(builderState);
  if (historyIndex >= 0 && history[historyIndex] === snapshot) return;
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);
  historyIndex = history.length - 1;
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  builderState = JSON.parse(history[historyIndex]);
  renderLayouts();
  renderCanvas();
  if (canvasView === 'list') renderListConfig();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  builderState = JSON.parse(history[historyIndex]);
  renderLayouts();
  renderCanvas();
  if (canvasView === 'list') renderListConfig();
}

async function saveDraft() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ layout: builderState })
  });
  const data = await res.json();
  if (!res.ok) {
    showToast(data.error || 'Failed to save', 'error');
    return;
  }
  showToast('Draft saved', 'success');
}

async function publishLayout() {
  const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) {
    showToast(data.error || 'Failed to publish', 'error');
    return;
  }
  showToast('Published', 'success');
}

function getDropIndex(column, clientY) {
  const blocks = Array.from(column.querySelectorAll('.ui-block'));
  let index = blocks.length;
  blocks.forEach((block, idx) => {
    const rect = block.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2 && index === blocks.length) {
      index = idx;
    }
  });
  return { index };
}

function getDropIndicator(column) {
  let indicator = column.querySelector('.drop-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    column.appendChild(indicator);
  }
  return indicator;
}

function positionIndicator(column, indicator, index) {
  const blocks = Array.from(column.querySelectorAll('.ui-block'));
  if (index >= blocks.length) {
    column.appendChild(indicator);
  } else {
    column.insertBefore(indicator, blocks[index]);
  }
}

function clearIndicator(column) {
  const indicator = column.querySelector('.drop-indicator');
  if (indicator) indicator.remove();
}

function uid() {
  return `ui-${Math.random().toString(36).slice(2, 8)}`;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('ui-toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.background = type === 'error' ? '#b91c1c' : type === 'success' ? '#047857' : '#1f2937';
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// ── Version History ──────────────────────────────────────
let versionData = [];
let selectedVersionId = null;

async function openVersionHistory() {
  const modal = document.getElementById('version-history-modal');
  modal.classList.remove('hidden');
  selectedVersionId = null;
  document.getElementById('version-preview').innerHTML = '<div class="version-preview-empty">Select a version to preview its layout.</div>';
  await loadVersions();
}

function closeVersionHistory() {
  document.getElementById('version-history-modal').classList.add('hidden');
}

async function loadVersions() {
  const listEl = document.getElementById('version-list');
  listEl.innerHTML = '<div class="version-empty">Loading...</div>';
  try {
    const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui/versions`);
    const data = await res.json();
    versionData = data.versions || [];
    renderVersionList();
  } catch (err) {
    listEl.innerHTML = '<div class="version-empty">Failed to load versions.</div>';
  }
}

function renderVersionList() {
  const listEl = document.getElementById('version-list');
  if (!versionData.length) {
    listEl.innerHTML = `
      <div class="version-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p>No version history yet.</p>
        <p class="version-empty-hint">Each time you publish, the previous published version is saved here automatically.</p>
      </div>
    `;
    return;
  }

  const layoutLabels = { 'single': 'Single', 'two-column': 'Two Col', 'tabs': 'Tabs', 'master-detail': 'M-Detail' };

  listEl.innerHTML = versionData.map(v => {
    const date = v.published_at ? new Date(v.published_at) : null;
    const dateStr = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const timeStr = date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
    const layoutLabel = layoutLabels[v.layout_type] || v.layout_type;
    const isSelected = selectedVersionId === v.id;
    return `
      <div class="version-item ${v.is_current ? 'version-current' : ''} ${isSelected ? 'version-selected' : ''}" onclick="selectVersion('${v.id}')">
        <div class="version-item-header">
          <span class="version-label">${v.label}</span>
          ${v.is_current ? '<span class="version-live-badge">LIVE</span>' : ''}
        </div>
        <div class="version-item-meta">
          <span class="version-date">${dateStr} ${timeStr}</span>
          <span class="version-layout-type">${layoutLabel}</span>
          <span class="version-sections">${v.sections_count} section${v.sections_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function selectVersion(versionId) {
  selectedVersionId = versionId;
  renderVersionList();

  const previewEl = document.getElementById('version-preview');
  previewEl.innerHTML = '<div class="version-preview-empty">Loading preview...</div>';

  try {
    const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui/versions/${versionId}`);
    const data = await res.json();
    if (!data.layout) {
      previewEl.innerHTML = '<div class="version-preview-empty">No layout data for this version.</div>';
      return;
    }
    renderVersionPreview(data.layout, versionId);
  } catch (err) {
    previewEl.innerHTML = '<div class="version-preview-empty">Failed to load version.</div>';
  }
}

function renderVersionPreview(layout, versionId) {
  const previewEl = document.getElementById('version-preview');
  const layoutLabels = { 'single': 'Single Column', 'two-column': 'Two Column', 'tabs': 'Tabs', 'master-detail': 'Master-Detail' };
  const layoutType = layout.layout || 'unknown';

  const sectionsHtml = (layout.sections || []).map(section => {
    const blocksHtml = section.columns.map(col =>
      col.blocks.map(b => `<div class="vp-block">${b.fieldLabel || b.label || b.type}</div>`).join('')
    ).join('');
    return `
      <div class="vp-section">
        <div class="vp-section-title">${section.title}</div>
        <div class="vp-section-cols" style="grid-template-columns: repeat(${section.columns.length}, 1fr);">
          ${section.columns.map(col => `
            <div class="vp-column">
              ${col.blocks.length ? col.blocks.map(b => `<div class="vp-block">${b.fieldLabel || b.label || b.type}</div>`).join('') : '<div class="vp-empty">Empty</div>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  const isCurrent = versionId === 'current';

  previewEl.innerHTML = `
    <div class="vp-header">
      <div>
        <div class="vp-layout-label">${layoutLabels[layoutType] || layoutType} Layout</div>
        <div class="vp-section-count">${layout.sections?.length || 0} section${(layout.sections?.length || 0) !== 1 ? 's' : ''}</div>
      </div>
      ${!isCurrent ? `<button class="btn btn-primary btn-sm" onclick="restoreVersion('${versionId}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        Restore as Draft
      </button>` : '<span class="version-live-badge">Currently Live</span>'}
    </div>
    <div class="vp-sections">${sectionsHtml || '<div class="version-preview-empty">No sections.</div>'}</div>
  `;
}

async function restoreVersion(versionId) {
  if (!confirm('This will replace your current draft with this version. Continue?')) return;
  try {
    const res = await fetch(`${API_BASE}/custom-objects/${objectId}/ui/versions/${versionId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to restore', 'error');
      return;
    }
    // Reload the draft into the builder
    builderState = data.layout;
    if (!builderState.listConfig) builderState.listConfig = { columns: [] };
    pushHistory();
    renderLayouts();
    renderCanvas();
    if (canvasView === 'list') renderListConfig();
    closeVersionHistory();
    showToast('Version restored as draft', 'success');
  } catch (err) {
    showToast('Failed to restore version', 'error');
  }
}
