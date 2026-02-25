// ============================================
// FOLDER TREE COMPONENT
// Adobe Campaign-style hierarchical folder tree
// ============================================

const FOLDER_ICONS = {
  folder:           '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'folder-open':    '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  users:            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  send:             '<path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/>',
  'file-text':      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  gift:             '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  database:         '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  star:             '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'user-plus':      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  mail:             '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'git-branch':     '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  radio:            '<circle cx="12" cy="12" r="2"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  zap:              '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  clock:            '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  bell:             '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  layers:           '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  image:            '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  file:             '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  globe:            '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  tag:              '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
  user:             '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield:           '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  layout:           '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  filter:           '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  'bar-chart':      '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  target:           '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'check-circle':   '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  edit:             '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'
};

function getFolderIcon(iconName, size) {
  size = size || 16;
  const pathData = FOLDER_ICONS[iconName] || FOLDER_ICONS.folder;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathData}</svg>`;
}

// State
let _folderTreeData = [];
let _folderTreeFlat = [];
let _folderExpandedState = {};
let _folderSelectedId = null;
let _folderTreeCallback = null;
let _folderContextMenuTarget = null;
let _folderEntityFilter = null;

// Fetch folders from API
async function fetchFolderTree(entityType) {
  try {
    const url = entityType ? `/api/folders?entity_type=${entityType}` : '/api/folders';
    const resp = await fetch(url);
    const data = await resp.json();
    _folderTreeData = data.tree || [];
    _folderTreeFlat = data.folders || [];
    return data;
  } catch (err) {
    console.error('Failed to load folders:', err);
    _folderTreeData = [];
    _folderTreeFlat = [];
    return { tree: [], folders: [] };
  }
}

// Render the tree into a container
function renderFolderTree(containerId, options) {
  options = options || {};
  _folderTreeCallback = options.onSelect || null;
  _folderEntityFilter = options.entityType || null;

  const container = document.getElementById(containerId);
  if (!container) return;

  const showRoot = options.showRoot !== false;
  const showActions = options.showActions !== false;

  let html = '<div class="folder-tree">';

  // Toolbar
  if (showActions) {
    html += `
      <div class="folder-tree-toolbar">
        <button class="folder-tree-btn" onclick="createFolderPrompt(window._folderSelectedId)" title="New folder inside selected">
          ${getFolderIcon('folder', 14)}
          <span>New Folder</span>
        </button>
        <button class="folder-tree-btn" onclick="toggleAllFolders(true)" title="Expand all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
        </button>
        <button class="folder-tree-btn" onclick="toggleAllFolders(false)" title="Collapse all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg>
        </button>
      </div>`;
  }

  // "All Items" root node
  if (showRoot) {
    const rootSelected = _folderSelectedId === null ? ' selected' : '';
    html += `
      <div class="folder-tree-node root${rootSelected}" onclick="selectFolder(null)" data-folder-id="root">
        <span class="folder-tree-icon">${getFolderIcon('database', 15)}</span>
        <span class="folder-tree-label">All Items</span>
      </div>`;
  }

  // Render tree nodes
  html += renderTreeNodes(_folderTreeData, 0);
  html += '</div>';

  container.innerHTML = html;
}

function renderTreeNodes(nodes, depth) {
  if (!nodes || !nodes.length) return '';
  let html = '';
  for (const node of nodes) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = _folderExpandedState[node.id] !== false;
    const isSelected = _folderSelectedId === node.id;
    const indent = depth * 20;

    html += `<div class="folder-tree-item" data-folder-id="${node.id}">`;
    html += `<div class="folder-tree-node${isSelected ? ' selected' : ''}" 
                  style="padding-left:${12 + indent}px" 
                  onclick="selectFolder(${node.id})"
                  oncontextmenu="showFolderContextMenu(event, ${node.id})"
                  draggable="true"
                  ondragstart="onFolderDragStart(event, ${node.id})"
                  ondragover="onFolderDragOver(event)"
                  ondrop="onFolderDrop(event, ${node.id})">`;

    // Expand/collapse toggle
    if (hasChildren) {
      html += `<span class="folder-tree-toggle${isExpanded ? ' expanded' : ''}" onclick="event.stopPropagation(); toggleFolder(${node.id})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </span>`;
    } else {
      html += `<span class="folder-tree-toggle-placeholder"></span>`;
    }

    // Icon
    const iconName = isExpanded && hasChildren ? 'folder-open' : (node.icon || 'folder');
    html += `<span class="folder-tree-icon">${getFolderIcon(iconName, 15)}</span>`;

    // Label
    html += `<span class="folder-tree-label">${escapeHtml(node.name)}</span>`;

    html += '</div>';

    // Children
    if (hasChildren) {
      html += `<div class="folder-tree-children${isExpanded ? '' : ' collapsed'}">${renderTreeNodes(node.children, depth + 1)}</div>`;
    }

    html += '</div>';
  }
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Interactions
function toggleFolder(folderId) {
  _folderExpandedState[folderId] = _folderExpandedState[folderId] === false ? true : false;
  const item = document.querySelector(`.folder-tree-item[data-folder-id="${folderId}"]`);
  if (!item) return;
  const toggle = item.querySelector(':scope > .folder-tree-node .folder-tree-toggle');
  const children = item.querySelector(':scope > .folder-tree-children');
  if (toggle) toggle.classList.toggle('expanded');
  if (children) children.classList.toggle('collapsed');

  // Update icon
  const iconEl = item.querySelector(':scope > .folder-tree-node .folder-tree-icon');
  const node = findNodeById(_folderTreeData, folderId);
  if (iconEl && node) {
    const hasKids = node.children && node.children.length > 0;
    const isNowExpanded = _folderExpandedState[folderId] !== false;
    const icoName = isNowExpanded && hasKids ? 'folder-open' : (node.icon || 'folder');
    iconEl.innerHTML = getFolderIcon(icoName, 15);
  }
}

function toggleAllFolders(expand) {
  _folderTreeFlat.forEach(f => { _folderExpandedState[f.id] = expand; });
  const container = document.querySelector('.folder-tree');
  if (container) {
    const treeContainer = container.closest('[id]');
    if (treeContainer) renderFolderTree(treeContainer.id, { onSelect: _folderTreeCallback, entityType: _folderEntityFilter });
  }
}

function selectFolder(folderId) {
  _folderSelectedId = folderId;

  // Update visual selection
  document.querySelectorAll('.folder-tree-node').forEach(n => n.classList.remove('selected'));
  if (folderId === null) {
    const rootNode = document.querySelector('.folder-tree-node.root');
    if (rootNode) rootNode.classList.add('selected');
  } else {
    const item = document.querySelector(`.folder-tree-item[data-folder-id="${folderId}"] > .folder-tree-node`);
    if (item) item.classList.add('selected');
  }

  if (_folderTreeCallback) {
    const folder = folderId ? _folderTreeFlat.find(f => f.id === folderId) : null;
    _folderTreeCallback(folder);
  }
}

function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Context Menu
function showFolderContextMenu(event, folderId) {
  event.preventDefault();
  event.stopPropagation();
  _folderContextMenuTarget = folderId;

  // Remove existing menu
  const existing = document.getElementById('folder-context-menu');
  if (existing) existing.remove();

  const folder = _folderTreeFlat.find(f => f.id === folderId);
  const name = folder ? folder.name : 'Folder';

  const menu = document.createElement('div');
  menu.id = 'folder-context-menu';
  menu.className = 'folder-context-menu';
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.innerHTML = `
    <div class="folder-ctx-item" onclick="createSubfolderPrompt(${folderId})">
      ${getFolderIcon('folder', 14)} New Subfolder
    </div>
    <div class="folder-ctx-item" onclick="renameFolderPrompt(${folderId})">
      ${getFolderIcon('edit', 14)} Rename
    </div>
    <div class="folder-ctx-separator"></div>
    <div class="folder-ctx-item danger" onclick="deleteFolderPrompt(${folderId})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      Delete
    </div>
  `;
  document.body.appendChild(menu);

  // Auto-close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeFolderContextMenu, { once: true });
  }, 0);
}

function closeFolderContextMenu() {
  const menu = document.getElementById('folder-context-menu');
  if (menu) menu.remove();
}

// CRUD Prompts
async function createFolderPrompt(parentId) {
  closeFolderContextMenu();
  const parentFolder = parentId ? _folderTreeFlat.find(f => f.id === parentId) : null;
  const location = parentFolder ? `in "${parentFolder.name}"` : 'at root level';
  const name = prompt(`New folder name (${location}):`);
  if (!name || !name.trim()) return;

  try {
    const body = { name: name.trim(), parent_id: parentId || null };
    if (parentFolder && parentFolder.entity_type) body.entity_type = parentFolder.entity_type;
    else if (_folderEntityFilter) body.entity_type = _folderEntityFilter;
    await fetch('/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (parentId) _folderExpandedState[parentId] = true;
    if (typeof showToast === 'function') showToast('Folder created', 'success');
    await refreshFolderTree();
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to create folder', 'error');
  }
}

async function createSubfolderPrompt(parentId) {
  closeFolderContextMenu();
  const parentFolder = _folderTreeFlat.find(f => f.id === parentId);
  const name = prompt(`New subfolder in "${parentFolder ? parentFolder.name : 'folder'}":`);
  if (!name || !name.trim()) return;

  try {
    const body = { name: name.trim(), parent_id: parentId };
    if (parentFolder && parentFolder.entity_type) body.entity_type = parentFolder.entity_type;
    else if (_folderEntityFilter) body.entity_type = _folderEntityFilter;
    await fetch('/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    _folderExpandedState[parentId] = true;
    if (typeof showToast === 'function') showToast('Subfolder created', 'success');
    await refreshFolderTree();
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to create subfolder', 'error');
  }
}

async function renameFolderPrompt(folderId) {
  closeFolderContextMenu();
  const folder = _folderTreeFlat.find(f => f.id === folderId);
  const name = prompt('Rename folder:', folder ? folder.name : '');
  if (!name || !name.trim()) return;

  try {
    await fetch(`/api/folders/${folderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
    if (typeof showToast === 'function') showToast('Folder renamed', 'success');
    await refreshFolderTree();
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to rename folder', 'error');
  }
}

async function deleteFolderPrompt(folderId) {
  closeFolderContextMenu();
  const folder = _folderTreeFlat.find(f => f.id === folderId);
  if (!confirm(`Delete folder "${folder ? folder.name : ''}"? Items will be moved to the parent folder.`)) return;

  try {
    await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    if (_folderSelectedId === folderId) _folderSelectedId = null;
    if (typeof showToast === 'function') showToast('Folder deleted', 'success');
    await refreshFolderTree();
    if (_folderTreeCallback) _folderTreeCallback(null);
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to delete folder', 'error');
  }
}

async function refreshFolderTree() {
  await fetchFolderTree(_folderEntityFilter);
  const container = document.querySelector('.folder-tree');
  if (container) {
    const treeContainer = container.closest('[id]');
    if (treeContainer) renderFolderTree(treeContainer.id, { onSelect: _folderTreeCallback, entityType: _folderEntityFilter });
  }
}

// Drag and Drop for folders (reorder / reparent)
function onFolderDragStart(event, folderId) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folderId }));
  event.dataTransfer.effectAllowed = 'move';
}

function onFolderDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const node = event.target.closest('.folder-tree-node');
  if (node) node.classList.add('drag-over');
}

function onFolderDrop(event, targetFolderId) {
  event.preventDefault();
  event.stopPropagation();

  // Remove drag-over styling
  document.querySelectorAll('.folder-tree-node.drag-over').forEach(n => n.classList.remove('drag-over'));

  let dragData;
  try {
    dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
  } catch (e) { return; }

  if (dragData.type === 'folder' && dragData.id !== targetFolderId) {
    moveFolderToParent(dragData.id, targetFolderId);
  } else if (dragData.type === 'item' && dragData.entityType && dragData.itemIds) {
    moveItemsToFolder(targetFolderId, dragData.entityType, dragData.itemIds);
  }
}

async function moveFolderToParent(folderId, newParentId) {
  try {
    await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: newParentId })
    });
    _folderExpandedState[newParentId] = true;
    if (typeof showToast === 'function') showToast('Folder moved', 'success');
    await refreshFolderTree();
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to move folder', 'error');
  }
}

async function moveItemsToFolder(folderId, entityType, itemIds) {
  try {
    await fetch(`/api/folders/${folderId}/move-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: entityType, item_ids: itemIds })
    });
    if (typeof showToast === 'function') showToast(`Moved ${itemIds.length} item(s) to folder`, 'success');
    // Refresh the current view
    if (_folderTreeCallback) {
      const folder = _folderTreeFlat.find(f => f.id === folderId);
      _folderTreeCallback(folder);
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('Failed to move items', 'error');
  }
}

// Build breadcrumb path for a folder
function getFolderBreadcrumbs(folderId) {
  const crumbs = [];
  let current = _folderTreeFlat.find(f => f.id === folderId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parent_id ? _folderTreeFlat.find(f => f.id === current.parent_id) : null;
  }
  return crumbs;
}

function renderFolderBreadcrumbs(folderId) {
  if (!folderId) return '';
  const crumbs = getFolderBreadcrumbs(folderId);
  if (!crumbs.length) return '';
  return `<div class="folder-breadcrumbs">
    <span class="folder-bc-item" onclick="selectFolder(null)">
      ${getFolderIcon('database', 13)} All
    </span>
    ${crumbs.map(c => `<span class="folder-bc-sep">/</span><span class="folder-bc-item${c.id === folderId ? ' current' : ''}" onclick="selectFolder(${c.id})">${escapeHtml(c.name)}</span>`).join('')}
  </div>`;
}

// Get all descendant folder IDs (for filtering items in sub-folders)
function getAllDescendantFolderIds(folderId) {
  const ids = [folderId];
  const children = _folderTreeFlat.filter(f => f.parent_id === folderId);
  for (const child of children) {
    ids.push(...getAllDescendantFolderIds(child.id));
  }
  return ids;
}

// ============================================
// LIST PAGE FOLDER INTEGRATION HELPER
// ============================================

// State for which list views have folder sidebar enabled
let _listFolderEnabled = {};

function isListFolderEnabled(viewKey) {
  return _listFolderEnabled[viewKey] === true;
}

function toggleListFolderSidebar(viewKey, entityType, reloadFn) {
  _listFolderEnabled[viewKey] = !_listFolderEnabled[viewKey];
  if (!_listFolderEnabled[viewKey]) {
    // Disable: clear folder filter and reload
    window['_folderFilter_' + viewKey] = null;
  }
  reloadFn();
}

// Wrap existing list content with folder sidebar
// Call this inside your load* function AFTER building your main HTML
// Returns the wrapped HTML string
function wrapWithFolderSidebarHtml(viewKey, entityType, mainContentHtml) {
  if (!_listFolderEnabled[viewKey]) return mainContentHtml;

  const selectedFolderId = window['_folderFilter_' + viewKey] || null;
  const bcHtml = selectedFolderId ? renderFolderBreadcrumbs(selectedFolderId) : '';

  return `
    <div class="folder-layout" style="min-height:calc(100vh - 180px);">
      <div class="list-folder-sidebar">
        <div class="list-folder-sidebar-header">
          ${getFolderIcon('folder', 14)} Folders
        </div>
        <div id="list-folder-tree-${viewKey}" style="flex:1;overflow-y:auto;"></div>
      </div>
      <div class="folder-layout-content">
        ${bcHtml ? '<div style="padding:0 0 8px 0;">' + bcHtml + '</div>' : ''}
        ${mainContentHtml}
      </div>
    </div>`;
}

// Initialize the folder tree for a list page after innerHTML is set
async function initListFolderTree(viewKey, entityType, reloadFn) {
  if (!_listFolderEnabled[viewKey]) return;
  
  await fetchFolderTree(entityType);

  // Expand root-level folders by default
  window._folderTreeFlat.forEach(f => {
    if (f.parent_id === null && _folderExpandedState[f.id] === undefined) {
      _folderExpandedState[f.id] = true;
    }
  });

  const selectedId = window['_folderFilter_' + viewKey] || null;
  window._folderSelectedId = selectedId;

  renderFolderTree('list-folder-tree-' + viewKey, {
    onSelect: function(folder) {
      window['_folderFilter_' + viewKey] = folder ? folder.id : null;
      reloadFn();
    },
    entityType: entityType,
    showRoot: true,
    showActions: true
  });
}

// Filter items by the currently selected folder for this view
function applyFolderFilter(viewKey, items) {
  const folderId = window['_folderFilter_' + viewKey];
  if (!folderId) return items;
  
  // Include items in this folder and all descendant folders
  const folderIds = getAllDescendantFolderIds(folderId);
  return items.filter(item => folderIds.includes(item.folder_id));
}

// Generate the folder toggle button HTML for toolbar injection
function getFolderToggleButtonHtml(viewKey) {
  const active = _listFolderEnabled[viewKey];
  const safeKey = (viewKey + '').replace(/'/g, "\\'");
  return `<button class="folder-toggle-btn${active ? ' active' : ''}" onclick="var __k='${safeKey}';if(window['_folderToggle_'+__k])window['_folderToggle_'+__k]()" title="${active ? 'Hide' : 'Show'} folder tree" style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid ${active ? '#1473E6' : '#e5e7eb'};border-radius:5px;background:${active ? '#EFF6FF' : '#fff'};color:${active ? '#1473E6' : '#6b7280'};cursor:pointer;font-size:12px;transition:all 0.15s;">
    ${getFolderIcon('folder', 14)}
    <span>Folders</span>
  </button>`;
}

// ============================================
// FOLDER PICKER FOR FORMS
// ============================================

// Cache for folder options per entity type
let _folderPickerCache = {};

// Fetch folders for a given entity type (cached)
async function ensureFolderPickerData(entityType) {
  if (_folderPickerCache[entityType]) return _folderPickerCache[entityType];
  try {
    const resp = await fetch(`/api/folders?entity_type=${entityType}`);
    const data = await resp.json();
    _folderPickerCache[entityType] = data.folders || [];
    return _folderPickerCache[entityType];
  } catch (e) {
    return [];
  }
}

// Invalidate cache when folders change
function invalidateFolderPickerCache(entityType) {
  if (entityType) delete _folderPickerCache[entityType];
  else _folderPickerCache = {};
}

// Build a flat indented options list from folders
// Handles filtered sets where parent_id may reference a folder outside the set
function buildFolderOptionsList(folders, parentId, depth) {
  depth = depth || 0;

  // On first call (no explicit parentId), detect "local roots"
  // i.e. folders whose parent_id is NOT in the current set
  if (parentId === undefined) {
    const idSet = new Set(folders.map(f => f.id));
    const localRoots = folders
      .filter(f => !idSet.has(f.parent_id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
    let options = [];
    for (const root of localRoots) {
      options.push({ id: root.id, name: root.name, depth: 0, icon: root.icon });
      options.push(...buildFolderOptionsList(folders, root.id, 1));
    }
    return options;
  }

  // Recursive: find children of parentId
  let options = [];
  const children = folders
    .filter(f => f.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  for (const child of children) {
    options.push({ id: child.id, name: child.name, depth, icon: child.icon });
    options.push(...buildFolderOptionsList(folders, child.id, depth + 1));
  }
  return options;
}

// Generate folder picker HTML for a form
// Returns the HTML string for a form-group with a folder select dropdown
function folderPickerHtml(fieldId, entityType, currentFolderId) {
  const folders = _folderPickerCache[entityType] || [];
  const options = buildFolderOptionsList(folders);

  // Normalize currentFolderId to integer for comparison
  const selectedId = currentFolderId ? parseInt(currentFolderId) : null;
  const currentFolder = selectedId ? folders.find(f => f.id === selectedId) : null;
  const currentPath = currentFolder ? getFolderBreadcrumbText(folders, selectedId) : '';

  let optionsHtml = `<option value="">-- No folder (root) --</option>`;
  for (const opt of options) {
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(opt.depth);
    const prefix = opt.depth > 0 ? '└ ' : '';
    const sel = selectedId && selectedId === opt.id ? 'selected' : '';
    optionsHtml += `<option value="${opt.id}" ${sel}>${indent}${prefix}${opt.name}</option>`;
  }

  return `
    <div class="form-group">
      <label class="form-label">Folder</label>
      <div style="display:flex;gap:6px;align-items:center">
        <select id="${fieldId}" class="form-input" style="flex:1" onchange="updateFolderPickerPath('${fieldId}', '${entityType}')">
          ${optionsHtml}
        </select>
      </div>
      <div id="${fieldId}-path" class="form-help" style="margin-top:3px;display:flex;align-items:center;gap:4px;min-height:18px">${currentPath ? `${getFolderIcon('folder', 12)} <span style="color:#6b7280;font-size:11px">${currentPath}</span>` : ''}</div>
    </div>`;
}

// Build breadcrumb text from folder ID
function getFolderBreadcrumbText(folders, folderId) {
  const crumbs = [];
  let current = folders.find(f => f.id === folderId);
  while (current) {
    crumbs.unshift(current.name);
    // Stop if parent is outside the set
    const parent = current.parent_id ? folders.find(f => f.id === current.parent_id) : null;
    current = parent;
  }
  return crumbs.join(' / ');
}

// Get the selected folder_id value from a form
function getSelectedFolderId(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el || !el.value) return null;
  return parseInt(el.value) || null;
}

// Find the default folder for a given entity type
// Returns the top-level folder for the entity type (the "root" of that type's hierarchy)
function getDefaultFolderForEntity(entityType) {
  const folders = _folderPickerCache[entityType] || [];
  if (!folders.length) return null;
  // Find the "local root" — the folder whose parent is NOT in the set
  const idSet = new Set(folders.map(f => f.id));
  const localRoot = folders.find(f => !idSet.has(f.parent_id));
  return localRoot ? localRoot.id : folders[0].id;
}

// Update the breadcrumb path below the folder picker when selection changes
function updateFolderPickerPath(fieldId, entityType) {
  const el = document.getElementById(fieldId);
  const pathEl = document.getElementById(fieldId + '-path');
  if (!el || !pathEl) return;
  const folderId = parseInt(el.value) || null;
  const folders = _folderPickerCache[entityType] || [];
  if (folderId) {
    const path = getFolderBreadcrumbText(folders, folderId);
    pathEl.innerHTML = `${getFolderIcon('folder', 12)} <span style="color:#6b7280;font-size:11px">${path}</span>`;
  } else {
    pathEl.innerHTML = '';
  }
}

// ============================================
// FOLDER NAME RESOLVER FOR TABLE COLUMNS
// ============================================

// Global flat cache of ALL folders (regardless of entity_type) for table display
let _allFoldersCache = null;
let _allFoldersFetching = null;

async function ensureAllFoldersLoaded() {
  if (_allFoldersCache) return _allFoldersCache;
  if (_allFoldersFetching) return _allFoldersFetching;
  _allFoldersFetching = fetch('/api/folders')
    .then(r => r.json())
    .then(data => {
      _allFoldersCache = data.folders || [];
      _allFoldersFetching = null;
      return _allFoldersCache;
    })
    .catch(() => { _allFoldersFetching = null; return []; });
  return _allFoldersFetching;
}

// Resolve folder_id to a display name (sync — uses cache, returns '' if not loaded)
function getFolderNameById(folderId) {
  if (!folderId || !_allFoldersCache) return '';
  const folder = _allFoldersCache.find(f => f.id === folderId);
  return folder ? folder.name : '';
}

// Resolve folder_id to a full breadcrumb path
function getFolderPathById(folderId) {
  if (!folderId || !_allFoldersCache) return '';
  const crumbs = [];
  let current = _allFoldersCache.find(f => f.id === folderId);
  while (current) {
    crumbs.unshift(current.name);
    current = current.parent_id ? _allFoldersCache.find(f => f.id === current.parent_id) : null;
  }
  return crumbs.join(' / ');
}

// Generate the folder cell HTML for a table row
function folderCellHtml(folderId) {
  if (!folderId) return '<span style="color:#aaa;font-size:12px">—</span>';
  const name = getFolderNameById(folderId);
  const path = getFolderPathById(folderId);
  if (!name) return '<span style="color:#aaa;font-size:12px">—</span>';
  return `<span title="${path}" style="font-size:13px;display:inline-flex;align-items:center;gap:4px">${getFolderIcon('folder', 13)} ${name}</span>`;
}

// Invalidate the all-folders cache (call after folder create/rename/delete)
function invalidateAllFoldersCache() {
  _allFoldersCache = null;
}

window.ensureAllFoldersLoaded = ensureAllFoldersLoaded;
window.getFolderNameById = getFolderNameById;
window.getFolderPathById = getFolderPathById;
window.folderCellHtml = folderCellHtml;
window.invalidateAllFoldersCache = invalidateAllFoldersCache;

// Expose globally
window.ensureFolderPickerData = ensureFolderPickerData;
window.invalidateFolderPickerCache = invalidateFolderPickerCache;
window.folderPickerHtml = folderPickerHtml;
window.getSelectedFolderId = getSelectedFolderId;
window.getDefaultFolderForEntity = getDefaultFolderForEntity;
window.updateFolderPickerPath = updateFolderPickerPath;

// Expose globally
window.fetchFolderTree = fetchFolderTree;
window.renderFolderTree = renderFolderTree;
window.selectFolder = selectFolder;
window.toggleFolder = toggleFolder;
window.toggleAllFolders = toggleAllFolders;
window.createFolderPrompt = createFolderPrompt;
window.createSubfolderPrompt = createSubfolderPrompt;
window.renameFolderPrompt = renameFolderPrompt;
window.deleteFolderPrompt = deleteFolderPrompt;
window.showFolderContextMenu = showFolderContextMenu;
window.closeFolderContextMenu = closeFolderContextMenu;
window.onFolderDragStart = onFolderDragStart;
window.onFolderDragOver = onFolderDragOver;
window.onFolderDrop = onFolderDrop;
window.getFolderBreadcrumbs = getFolderBreadcrumbs;
window.renderFolderBreadcrumbs = renderFolderBreadcrumbs;
window.getAllDescendantFolderIds = getAllDescendantFolderIds;
window.getFolderIcon = getFolderIcon;
window.isListFolderEnabled = isListFolderEnabled;
window.toggleListFolderSidebar = toggleListFolderSidebar;
window.wrapWithFolderSidebarHtml = wrapWithFolderSidebarHtml;
window.initListFolderTree = initListFolderTree;
window.applyFolderFilter = applyFolderFilter;
window.getFolderToggleButtonHtml = getFolderToggleButtonHtml;
window._folderTreeFlat = _folderTreeFlat;
window._folderSelectedId = null;
Object.defineProperty(window, '_folderSelectedId', {
  get: () => _folderSelectedId,
  set: (v) => { _folderSelectedId = v; }
});
Object.defineProperty(window, '_folderTreeFlat', {
  get: () => _folderTreeFlat,
  set: (v) => { _folderTreeFlat = v; }
});
