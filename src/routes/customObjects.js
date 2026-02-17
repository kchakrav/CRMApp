const express = require('express');
const router = express.Router();
const { query, db, saveDatabase } = require('../database');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

function ensureJunctionObject(leftTable, rightTable) {
  const sorted = [leftTable, rightTable].sort();
  const junctionName = `${sorted[0]}_${sorted[1]}_link`;
  const existing = query.all('custom_objects').find(o => o.name === junctionName);
  if (existing) return existing;
  
  const junctionFields = [
    { name: `${sorted[0]}_id`, label: `${sorted[0]} ID`, type: 'number', is_required: true },
    { name: `${sorted[1]}_id`, label: `${sorted[1]} ID`, type: 'number', is_required: true }
  ];
  
  const relationships = [
    { name: `${junctionName}_to_${sorted[0]}`, to_table: sorted[0], to_field: 'id', type: 'N:1' },
    { name: `${junctionName}_to_${sorted[1]}`, to_table: sorted[1], to_field: 'id', type: 'N:1' }
  ];
  
  const result = query.insert('custom_objects', {
    name: junctionName,
    label: `${sorted[0]} ↔ ${sorted[1]} Link`,
    description: `Auto-generated junction table between ${sorted[0]} and ${sorted[1]}.`,
    fields: junctionFields,
    relationships,
    record_count: 0,
    is_active: true
  });
  
  if (!db.custom_object_data[junctionName]) {
    db.custom_object_data[junctionName] = [];
  }
  saveDatabase();
  return result.record;
}

function getPrimaryFieldName(object) {
  const primary = (object.fields || []).find(f => f.is_primary);
  return primary ? primary.name : 'id';
}

function inverseCardinality(type) {
  if (type === '1:N') return 'N:1';
  if (type === 'N:1') return '1:N';
  return type;
}

function ensureReverseRelationship(sourceObject, rel) {
  const target = query.all('custom_objects').find(o => o.name === rel.to_table);
  if (!target) return;
  
  const sourcePk = getPrimaryFieldName(sourceObject);
  const reverse = {
    name: rel.name ? `${rel.name}_reverse` : `${target.name}_to_${sourceObject.name}`,
    to_table: sourceObject.name,
    to_field: sourcePk,
    type: inverseCardinality(rel.type)
  };
  
  const existing = (target.relationships || []).some(r =>
    r.to_table === reverse.to_table && r.to_field === reverse.to_field && r.type === reverse.type
  );
  if (existing) return;
  
  const updated = [...(target.relationships || []), reverse];
  query.update('custom_objects', target.id, { relationships: updated });
}

// Get all custom objects
router.get('/', (req, res) => {
  try {
    const objects = query.all('custom_objects');
    res.json(objects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Relationship metadata
router.get('/relationship-meta', (req, res) => {
  try {
    const fallbackFields = {
      contacts: ['id', 'email', 'first_name', 'last_name', 'status', 'created_at', 'updated_at'],
      audiences: ['id', 'name', 'status', 'contact_count', 'created_at', 'updated_at'],
      segments: ['id', 'name', 'segment_type', 'status', 'contact_count', 'created_at', 'updated_at'],
      groups: ['id', 'name', 'created_at', 'updated_at'],
      deliveries: ['id', 'name', 'channel', 'status', 'scheduled_at', 'created_at', 'updated_at'],
      workflows: ['id', 'name', 'status', 'created_at', 'updated_at'],
      assets: ['id', 'name', 'type', 'url', 'created_at', 'updated_at'],
      custom_objects: ['id', 'name', 'label', 'created_at', 'updated_at']
    };
    const tables = Object.keys(db)
      .filter(key => Array.isArray(db[key]))
      .map(key => {
        const rows = db[key];
        const fields = rows[0] ? Object.keys(rows[0]) : (fallbackFields[key] || ['id']);
        return { name: key, fields };
      });
    
    const customTables = query.all('custom_objects').map(obj => ({
      name: obj.name,
      fields: ['id', 'customer_id', 'contact_id', 'created_at', 'updated_at', ...(obj.fields || []).map(f => f.name)]
    }));
    
    const deduped = new Map();
    [...tables, ...customTables].forEach(table => {
      if (!deduped.has(table.name)) {
        deduped.set(table.name, table);
      }
    });
    res.json({ tables: Array.from(deduped.values()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single custom object
router.get('/:id', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    res.json(object);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get UI layout (draft or published)
router.get('/:id/ui', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    const mode = String(req.query.mode || 'published');
    const layout = mode === 'draft' ? object.ui_builder_draft : object.ui_builder_published;
    res.json({ layout, status: object.ui_builder_status || 'draft' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save UI draft
router.put('/:id/ui/draft', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    const { layout } = req.body;
    if (!layout) return res.status(400).json({ error: 'layout is required' });
    query.update('custom_objects', object.id, {
      ui_builder_draft: layout,
      ui_builder_status: 'draft',
      updated_at: new Date().toISOString()
    });
    query.insert('event_history', {
      event_type: 'ui_builder_draft_saved',
      source: 'ui_builder',
      status: 'draft',
      details: { object_id: object.id, object_name: object.name }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish UI (snapshots the previous published version into version history)
router.post('/:id/ui/publish', (req, res) => {
  try {
    if (!isUiBuilderAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    const layout = object.ui_builder_draft;
    if (!layout || !layout.sections?.length) {
      return res.status(400).json({ error: 'Draft layout is empty' });
    }

    // Snapshot the current published version before overwriting
    if (object.ui_builder_published && object.ui_builder_published.sections?.length) {
      const existingVersions = query.all('ui_builder_versions', v => v.object_id === object.id);
      const versionNumber = existingVersions.length + 1;
      query.insert('ui_builder_versions', {
        object_id: object.id,
        object_name: object.name,
        version: versionNumber,
        label: `v${versionNumber}`,
        layout: JSON.parse(JSON.stringify(object.ui_builder_published)),
        published_at: object.updated_at || new Date().toISOString()
      });
    }

    query.update('custom_objects', object.id, {
      ui_builder_published: layout,
      ui_builder_status: 'published',
      updated_at: new Date().toISOString()
    });
    query.insert('event_history', {
      event_type: 'ui_builder_published',
      source: 'ui_builder',
      status: 'published',
      details: { object_id: object.id, object_name: object.name }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List UI version history for a custom object
router.get('/:id/ui/versions', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    const versions = query.all('ui_builder_versions', v => v.object_id === object.id)
      .sort((a, b) => b.version - a.version); // newest first
    // Include current published as the "live" entry
    const result = [];
    if (object.ui_builder_published && object.ui_builder_published.sections?.length) {
      result.push({
        id: 'current',
        version: versions.length + 1,
        label: 'Current (Live)',
        layout_type: object.ui_builder_published.layout || 'unknown',
        sections_count: object.ui_builder_published.sections?.length || 0,
        published_at: object.updated_at,
        is_current: true
      });
    }
    versions.forEach(v => {
      result.push({
        id: v.id,
        version: v.version,
        label: v.label,
        layout_type: v.layout?.layout || 'unknown',
        sections_count: v.layout?.sections?.length || 0,
        published_at: v.published_at,
        is_current: false
      });
    });
    res.json({ versions: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific version's full layout
router.get('/:id/ui/versions/:versionId', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    if (req.params.versionId === 'current') {
      return res.json({ layout: object.ui_builder_published });
    }
    const version = query.get('ui_builder_versions', parseInt(req.params.versionId));
    if (!version || version.object_id !== object.id) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json({ layout: version.layout, version: version.version, label: version.label });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore a previous version (loads it as the current draft)
router.post('/:id/ui/versions/:versionId/restore', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) return res.status(404).json({ error: 'Custom object not found' });
    let layout;
    if (req.params.versionId === 'current') {
      layout = object.ui_builder_published;
    } else {
      const version = query.get('ui_builder_versions', parseInt(req.params.versionId));
      if (!version || version.object_id !== object.id) {
        return res.status(404).json({ error: 'Version not found' });
      }
      layout = version.layout;
    }
    if (!layout) return res.status(400).json({ error: 'Version has no layout data' });
    // Load the old version into the draft slot
    query.update('custom_objects', object.id, {
      ui_builder_draft: JSON.parse(JSON.stringify(layout)),
      ui_builder_status: 'draft',
      updated_at: new Date().toISOString()
    });
    query.insert('event_history', {
      event_type: 'ui_builder_version_restored',
      source: 'ui_builder',
      status: 'draft',
      details: { object_id: object.id, version_id: req.params.versionId }
    });
    res.json({ success: true, layout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── DDL Import — parse SQL DDL and create custom objects ──────────────
router.post('/import-ddl', upload.single('file'), (req, res) => {
  try {
    let ddlText = '';
    if (req.file) {
      ddlText = req.file.buffer.toString('utf-8');
    } else if (req.body.ddl) {
      ddlText = req.body.ddl;
    }
    if (!ddlText.trim()) {
      return res.status(400).json({ error: 'No DDL content provided. Upload a file or pass a "ddl" field.' });
    }

    const created = [];
    const errors = [];

    // Built-in system entities that can be referenced in DDL relationships
    const systemEntities = new Set([
      'contacts', 'segments', 'audiences', 'workflows', 'deliveries',
      'orders', 'products', 'events', 'templates', 'forms',
      'content_templates', 'landing_pages', 'fragments', 'brands', 'assets',
      'subscription_services', 'subscriptions', 'predefined_filters',
      'loyalty_programs', 'enumerations'
    ]);

    // Track tables created during this import session for cross-referencing
    const createdInSession = new Set();

    // Extract CREATE TABLE statements (handles multi-line, various SQL dialects)
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;|$)/gi;
    let match;

    while ((match = tableRegex.exec(ddlText)) !== null) {
      const rawName = match[1].toLowerCase();
      const bodyText = match[2];

      // Skip system/internal tables
      if (['information_schema', 'pg_catalog', 'sys'].some(s => rawName.startsWith(s))) continue;

      // Check for duplicate
      const existing = query.all('custom_objects').find(o => o.name === rawName);
      if (existing) {
        errors.push(`Table "${rawName}" already exists — skipped.`);
        continue;
      }

      // Validate name
      if (!/^[a-z][a-z0-9_]*$/.test(rawName)) {
        errors.push(`Table "${rawName}" has an invalid name — skipped.`);
        continue;
      }

      // Parse columns
      const fields = [];
      const relationships = [];
      const lines = bodyText.split(',').map(l => l.trim()).filter(Boolean);

      for (const line of lines) {
        // Skip constraints, indexes, keys (multi-word keywords)
        if (/^\s*(PRIMARY\s+KEY|UNIQUE|INDEX|KEY|CONSTRAINT|CHECK|FOREIGN\s+KEY|ALTER)/i.test(line)) {
          // Try to parse FOREIGN KEY for relationships
          const fkMatch = line.match(/FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i);
          if (fkMatch) {
            relationships.push({
              name: `${rawName}_to_${fkMatch[2].toLowerCase()}`,
              to_table: fkMatch[2].toLowerCase(),
              to_field: fkMatch[3].toLowerCase(),
              type: 'N:1'
            });
          }
          continue;
        }

        // Parse column: name type [modifiers...]
        // Support ENUM_REF(enum_internal_name) to reference a defined enumeration
        const enumRefMatch = line.match(/^[`"']?(\w+)[`"']?\s+ENUM_REF\s*\(\s*(\w+)\s*\)/i);
        const colMatch = enumRefMatch || line.match(/^[`"']?(\w+)[`"']?\s+(\w+(?:\(\d+(?:,\s*\d+)?\))?)/i);
        if (!colMatch) continue;

        const colName = colMatch[1].toLowerCase();
        const colTypeRaw = enumRefMatch ? 'enum_ref' : (colMatch[2] || '').toLowerCase();
        const enumRef = enumRefMatch ? enumRefMatch[2].toLowerCase() : null;

        // Skip auto-generated columns we handle ourselves
        if (['created_at', 'updated_at'].includes(colName)) continue;

        // Map SQL types to our field types
        let fieldType = 'text';
        if (colTypeRaw === 'enum_ref' && enumRef) {
          fieldType = 'select';
        } else if (/^(int|integer|bigint|smallint|tinyint|serial|bigserial)/.test(colTypeRaw)) fieldType = 'number';
        else if (/^(decimal|numeric|float|double|real|money)/.test(colTypeRaw)) fieldType = 'number';
        else if (/^(date)$/.test(colTypeRaw)) fieldType = 'date';
        else if (/^(datetime|timestamp|timestamptz)/.test(colTypeRaw)) fieldType = 'datetime';
        else if (/^(bool|boolean)/.test(colTypeRaw)) fieldType = 'boolean';
        else if (/^(enum|set)/.test(colTypeRaw)) fieldType = 'select';

        const isPrimary = /PRIMARY\s+KEY/i.test(line) || (colName === 'id' && /auto_increment|serial/i.test(line));
        const isRequired = /NOT\s+NULL/i.test(line) || isPrimary;

        // Detect FK references inline: column_name INT REFERENCES other_table(id)
        const inlineFk = line.match(/REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i);
        if (inlineFk) {
          relationships.push({
            name: `${rawName}_to_${inlineFk[1].toLowerCase()}`,
            to_table: inlineFk[1].toLowerCase(),
            to_field: inlineFk[2].toLowerCase(),
            type: 'N:1'
          });
        }

        // Auto-detect FK by naming convention (e.g. contact_id → contacts)
        if (!inlineFk && colName.endsWith('_id') && colName !== 'id') {
          const guessTable = colName.replace(/_id$/, '') + 's'; // naive pluralize
          relationships.push({
            name: `${rawName}_to_${guessTable}`,
            to_table: guessTable,
            to_field: 'id',
            type: 'N:1'
          });
        }

        // Generate a human-readable label
        const label = colName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const fieldDef = {
          name: colName,
          label,
          type: fieldType,
          is_primary: isPrimary,
          is_required: isRequired
        };
        if (enumRef) fieldDef.enum_ref = enumRef;
        fields.push(fieldDef);
      }

      if (fields.length === 0) {
        errors.push(`Table "${rawName}" has no parseable columns — skipped.`);
        continue;
      }

      // Create the custom object
      const result = query.insert('custom_objects', {
        name: rawName,
        label: rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Imported from DDL`,
        fields,
        relationships,
        record_count: 0,
        is_active: true
      });

      if (!db.custom_object_data[rawName]) {
        db.custom_object_data[rawName] = [];
      }

      createdInSession.add(rawName);

      // Handle N:N relationships and reverse links
      const linkedTables = [];
      const systemLinked = [];
      const missingTables = [];
      relationships.forEach(rel => {
        if (!rel.to_table) return;

        // 1. Check if target is another custom object (existing or just created in this batch)
        const existsAsCustomObj = query.all('custom_objects').find(o => o.name === rel.to_table);
        if (existsAsCustomObj) {
          linkedTables.push(rel.to_table);
          if (rel.type === 'N:N') {
            ensureJunctionObject(rawName, rel.to_table);
          } else {
            ensureReverseRelationship(result.record, rel);
          }
          return;
        }

        // 2. Check if target is a built-in system entity (contacts, orders, etc.)
        if (systemEntities.has(rel.to_table)) {
          systemLinked.push(rel.to_table);
          return; // Relationship is saved in the object; reverse link doesn't apply to built-in entities
        }

        // 3. Check if target was created earlier in this same DDL import session
        if (createdInSession.has(rel.to_table)) {
          linkedTables.push(rel.to_table);
          const batchObj = query.all('custom_objects').find(o => o.name === rel.to_table);
          if (batchObj && rel.type !== 'N:N') {
            ensureReverseRelationship(result.record, rel);
          } else if (batchObj && rel.type === 'N:N') {
            ensureJunctionObject(rawName, rel.to_table);
          }
          return;
        }

        // 4. Not found anywhere
        missingTables.push(rel.to_table);
      });

      if (missingTables.length > 0) {
        errors.push(`Table "${rawName}": referenced table(s) not found in system — ${missingTables.join(', ')}. Relationships saved but reverse links not created.`);
      }

      created.push({ id: result.record.id, name: rawName, fields: fields.length, relationships: relationships.length, linkedTables, systemLinked, missingTables });
    }

    if (created.length > 0) saveDatabase();

    res.json({
      success: true,
      created,
      errors,
      summary: `Created ${created.length} object(s)${errors.length ? `, ${errors.length} skipped/error(s)` : ''}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom object
router.post('/', (req, res) => {
  try {
    const { name, label, description, fields, relationships = [] } = req.body;
    
    if (!name || !label || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Name, label, and fields are required' });
    }
    
    // Validate name (alphanumeric and underscore only)
    if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
      return res.status(400).json({ error: 'Name must start with a letter and contain only letters, numbers, and underscores' });
    }
    
    // Check if object with this name already exists
    const existing = query.all('custom_objects').find(o => o.name === name);
    if (existing) {
      return res.status(400).json({ error: 'An object with this name already exists' });
    }
    
    // Validate fields
    let primaryCount = 0;
    for (const field of fields) {
      if (!field.name || !field.type) {
        return res.status(400).json({ error: 'Each field must have a name and type' });
      }
      if (field.is_primary) primaryCount += 1;
    }
    if (primaryCount > 1) {
      return res.status(400).json({ error: 'Only one primary key field is allowed' });
    }
    
    // Validate relationships
    for (const rel of relationships) {
      if (!rel.to_table || !rel.to_field || !rel.type) {
        return res.status(400).json({ error: 'Each relationship must include table, field, and type' });
      }
      if (!['1:N', 'N:1', 'N:N'].includes(rel.type)) {
        return res.status(400).json({ error: 'Invalid relationship type' });
      }
    }
    
    const result = query.insert('custom_objects', {
      name,
      label,
      description: description || '',
      fields,
      relationships,
      record_count: 0,
      is_active: true
    });
    
    // Initialize empty data array for this object
    if (!db.custom_object_data[name]) {
      db.custom_object_data[name] = [];
    }
    
    relationships.forEach(rel => {
      if (rel.type === 'N:N' && rel.to_table) {
        ensureJunctionObject(name, rel.to_table);
      } else if (rel.to_table) {
        ensureReverseRelationship(result.record, rel);
      }
    });
    saveDatabase();
    
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update custom object
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { label, description, fields, relationships, is_active } = req.body;
    
    const existing = query.get('custom_objects', id);
    if (!existing) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    // Cannot change name after creation
    const updateData = {};
    if (label) updateData.label = label;
    if (description !== undefined) updateData.description = description;
    if (fields) {
      let primaryCount = 0;
      fields.forEach(field => { if (field.is_primary) primaryCount += 1; });
      if (primaryCount > 1) {
        return res.status(400).json({ error: 'Only one primary key field is allowed' });
      }
      updateData.fields = fields;
    }
    if (relationships) {
      for (const rel of relationships) {
        if (!rel.to_table || !rel.to_field || !rel.type) {
          return res.status(400).json({ error: 'Each relationship must include table, field, and type' });
        }
        if (!['1:N', 'N:1', 'N:N'].includes(rel.type)) {
          return res.status(400).json({ error: 'Invalid relationship type' });
        }
      }
      updateData.relationships = relationships;
      
      relationships.forEach(rel => {
        if (rel.type === 'N:N' && rel.to_table) {
          ensureJunctionObject(existing.name, rel.to_table);
        } else if (rel.to_table) {
          ensureReverseRelationship(existing, rel);
        }
      });
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const result = query.update('custom_objects', id, updateData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete custom object
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const object = query.get('custom_objects', id);
    
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    // Delete the data
    if (db.custom_object_data[object.name]) {
      delete db.custom_object_data[object.name];
    }
    
    query.delete('custom_objects', id);
    saveDatabase();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get data for a custom object
router.get('/:id/data', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    const data = db.custom_object_data[object.name] || [];
    res.json({ records: data, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add record to custom object
router.post('/:id/data', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    const { record } = req.body;
    if (!record) {
      return res.status(400).json({ error: 'Record data is required' });
    }
      
      const requiredFields = (object.fields || []).filter(f => f.is_required || f.is_primary);
      const missing = requiredFields.filter(f => {
        const value = record[f.name];
        return value === undefined || value === null || value === '';
      });
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.map(f => f.name).join(', ')}` });
      }
    
    // Initialize data array if needed
    if (!db.custom_object_data[object.name]) {
      db.custom_object_data[object.name] = [];
    }
    
    // Add ID and timestamps
    const newRecord = {
      id: Date.now(),
      contact_id: record.contact_id || record.customer_id || null, // Optional link to contact (support both for backwards compatibility)
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.custom_object_data[object.name].push(newRecord);
    
    // Update record count
    query.update('custom_objects', object.id, {
      record_count: db.custom_object_data[object.name].length
    });
    
    saveDatabase();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import data (CSV)
router.post('/:id/import', upload.single('file'), async (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse CSV
    const results = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    if (results.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV' });
    }
    
    // Initialize data array if needed
    if (!db.custom_object_data[object.name]) {
      db.custom_object_data[object.name] = [];
    }
    
    // Add records with IDs and timestamps
    const imported = results.map(record => ({
      id: Date.now() + Math.random(), // Unique ID
      customer_id: record.customer_id || null,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    db.custom_object_data[object.name].push(...imported);
    
    // Update record count
    query.update('custom_objects', object.id, {
      record_count: db.custom_object_data[object.name].length
    });
    
    saveDatabase();
    
    res.json({
      success: true,
      imported: imported.length,
      total: db.custom_object_data[object.name].length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update record in custom object
router.put('/:id/data/:recordId', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    const recordId = parseFloat(req.params.recordId);
    const data = db.custom_object_data[object.name] || [];
    const recordIndex = data.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const requiredFields = (object.fields || []).filter(f => f.is_required || f.is_primary);
    const missing = requiredFields.filter(f => {
      const value = req.body.record?.[f.name];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.map(f => f.name).join(', ')}` });
    }
    
    // Update record
    db.custom_object_data[object.name][recordIndex] = {
      ...data[recordIndex],
      ...req.body.record,
      id: recordId, // Preserve ID
      updated_at: new Date().toISOString()
    };
    
    saveDatabase();
    res.json(db.custom_object_data[object.name][recordIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete record from custom object
router.delete('/:id/data/:recordId', (req, res) => {
  try {
    const object = query.get('custom_objects', parseInt(req.params.id));
    if (!object) {
      return res.status(404).json({ error: 'Custom object not found' });
    }
    
    const recordId = parseFloat(req.params.recordId);
    const data = db.custom_object_data[object.name] || [];
    
    db.custom_object_data[object.name] = data.filter(r => r.id !== recordId);
    
    // Update record count
    query.update('custom_objects', object.id, {
      record_count: db.custom_object_data[object.name].length
    });
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

function isUiBuilderAuthorized(req) {
  const token = process.env.UI_BUILDER_ADMIN_TOKEN;
  if (!token) return true;
  return req.headers['x-ui-admin'] === token;
}
