const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Entity types that support folders
const FOLDER_ENTITY_TYPES = [
  'deliveries', 'workflows', 'segments', 'content_templates',
  'fragments', 'landing_pages', 'offers', 'placements',
  'collections', 'decision_rules', 'selection_strategies', 'decisions',
  'contacts', 'audiences', 'assets', 'brands', 'subscription_services'
];

// Build tree from flat list
function buildTree(folders, parentId = null) {
  return folders
    .filter(f => f.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name))
    .map(f => ({
      ...f,
      children: buildTree(folders, f.id)
    }));
}

// Get all descendants of a folder (recursive)
function getDescendantIds(folders, parentId) {
  const ids = [];
  const children = folders.filter(f => f.parent_id === parentId);
  for (const child of children) {
    ids.push(child.id);
    ids.push(...getDescendantIds(folders, child.id));
  }
  return ids;
}

// GET /api/folders/entity-types -- list supported entity types (before /:id)
router.get('/entity-types', (req, res) => {
  res.json({ entity_types: FOLDER_ENTITY_TYPES });
});

// POST /api/folders/move-to-root -- move items to root (before /:id)
router.post('/move-to-root', (req, res) => {
  try {
    const { entity_type, item_ids } = req.body;
    if (!entity_type || !Array.isArray(item_ids)) {
      return res.status(400).json({ error: 'entity_type and item_ids[] are required' });
    }
    let moved = 0;
    item_ids.forEach(itemId => {
      const updated = query.update(entity_type, itemId, { folder_id: null });
      if (updated) moved++;
    });
    res.json({ success: true, moved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/folders -- full tree (optionally filtered by entity_type)
router.get('/', (req, res) => {
  try {
    const { entity_type, flat } = req.query;
    let folders = query.all('folders');
    if (entity_type) {
      folders = folders.filter(f => f.entity_type === entity_type);
    }
    if (flat === '1' || flat === 'true') {
      return res.json({ folders });
    }
    const tree = buildTree(folders);
    res.json({ folders, tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/folders/:id -- single folder with breadcrumb path
router.get('/:id', (req, res) => {
  try {
    const folder = query.get('folders', parseInt(req.params.id));
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Build breadcrumb path
    const allFolders = query.all('folders');
    const breadcrumbs = [];
    let current = folder;
    while (current) {
      breadcrumbs.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? allFolders.find(f => f.id === current.parent_id) : null;
    }

    // Get child folders
    const children = allFolders.filter(f => f.parent_id === folder.id);

    // Get items in this folder
    let items = [];
    if (folder.entity_type) {
      items = query.all(folder.entity_type, item => item.folder_id === folder.id);
    }

    res.json({ folder, breadcrumbs, children, items, item_count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/folders -- create folder
router.post('/', (req, res) => {
  try {
    const { name, parent_id, entity_type, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Validate parent exists if specified
    if (parent_id) {
      const parent = query.get('folders', parent_id);
      if (!parent) return res.status(400).json({ error: 'Parent folder not found' });
    }

    // Count siblings for sort order
    const siblings = query.all('folders', f => f.parent_id === (parent_id || null));

    const result = query.insert('folders', {
      name,
      parent_id: parent_id || null,
      entity_type: entity_type || null,
      icon: icon || 'folder',
      description: description || '',
      sort_order: siblings.length
    });

    res.status(201).json(result.record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/folders/:id -- update folder
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const folder = query.get('folders', id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const updates = {};
    ['name', 'parent_id', 'icon', 'description', 'sort_order', 'entity_type'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Prevent moving a folder into its own subtree
    if (updates.parent_id !== undefined && updates.parent_id !== null) {
      const allFolders = query.all('folders');
      const descendantIds = getDescendantIds(allFolders, id);
      if (descendantIds.includes(updates.parent_id) || updates.parent_id === id) {
        return res.status(400).json({ error: 'Cannot move a folder into its own subtree' });
      }
    }

    query.update('folders', id, updates);
    res.json(query.get('folders', id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/folders/:id -- delete folder (optionally cascade)
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const folder = query.get('folders', id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const allFolders = query.all('folders');
    const descendantIds = getDescendantIds(allFolders, id);

    // Move items in this folder (and descendants) to parent or root
    const targetFolderId = folder.parent_id || null;
    if (folder.entity_type) {
      const items = query.all(folder.entity_type, item => item.folder_id === id);
      items.forEach(item => query.update(folder.entity_type, item.id, { folder_id: targetFolderId }));
    }

    // Delete descendants bottom-up
    descendantIds.reverse().forEach(descId => {
      const descFolder = query.get('folders', descId);
      if (descFolder && descFolder.entity_type) {
        const descItems = query.all(descFolder.entity_type, item => item.folder_id === descId);
        descItems.forEach(item => query.update(descFolder.entity_type, item.id, { folder_id: targetFolderId }));
      }
      query.delete('folders', descId);
    });

    query.delete('folders', id);
    res.json({ success: true, moved_to: targetFolderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/folders/:id/move-items -- move entity items into this folder
router.post('/:id/move-items', (req, res) => {
  try {
    const folderId = parseInt(req.params.id);
    const folder = query.get('folders', folderId);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    const { entity_type, item_ids } = req.body;
    if (!entity_type || !Array.isArray(item_ids)) {
      return res.status(400).json({ error: 'entity_type and item_ids[] are required' });
    }

    let moved = 0;
    item_ids.forEach(itemId => {
      const updated = query.update(entity_type, itemId, { folder_id: folderId });
      if (updated) moved++;
    });

    res.json({ success: true, moved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
