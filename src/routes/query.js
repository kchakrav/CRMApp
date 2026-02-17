const express = require('express');
const router = express.Router();
const { db, query } = require('../database');

function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function applyFilter(record, filters) {
  return Object.entries(filters).every(([key, condition]) => {
    const value = getValueByPath(record, key);
    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      if ('$gte' in condition && !(value >= condition.$gte)) return false;
      if ('$lte' in condition && !(value <= condition.$lte)) return false;
      if ('$gt' in condition && !(value > condition.$gt)) return false;
      if ('$lt' in condition && !(value < condition.$lt)) return false;
      if ('$ne' in condition && !(value !== condition.$ne)) return false;
      if ('$contains' in condition) {
        const str = String(value || '').toLowerCase();
        const needle = String(condition.$contains).toLowerCase();
        if (!str.includes(needle)) return false;
      }
      if ('$in' in condition && Array.isArray(condition.$in)) {
        if (!condition.$in.includes(value)) return false;
      }
      return true;
    }
    return value === condition;
  });
}

function splitByAnd(input) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if ((char === '"' || char === "'") && (i === 0 || input[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
        quoteChar = '';
      }
    }
    if (!inQuotes && input.slice(i, i + 4).toLowerCase() === ' and') {
      parts.push(current.trim());
      current = '';
      i += 3;
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSqlValue(raw) {
  const trimmed = raw.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.toLowerCase() === 'null') return null;
  return trimmed;
}

function getFieldValue(record, field, tableOrder) {
  if (field.includes('.')) {
    const [table, key] = field.split('.');
    return record[table]?.[key];
  }
  for (const t of tableOrder) {
    if (record[t] && Object.prototype.hasOwnProperty.call(record[t], field)) {
      return record[t][field];
    }
  }
  return undefined;
}

function parseSelectFields(selectText) {
  return selectText.split(',').map(part => {
    const raw = part.trim();
    const asMatch = raw.match(/^(.*)\s+as\s+([\w_]+)$/i);
    if (asMatch) {
      const expr = asMatch[1].trim();
      const agg = parseAggregateExpr(expr);
      return { expr, alias: asMatch[2].trim(), aggregate: agg };
    }
    const pieces = raw.split(/\s+/);
    if (pieces.length > 1) {
      const expr = pieces.slice(0, -1).join(' ');
      const agg = parseAggregateExpr(expr);
      return { expr, alias: pieces[pieces.length - 1], aggregate: agg };
    }
    const agg = parseAggregateExpr(raw);
    return { expr: raw, alias: null, aggregate: agg };
  });
}

function parseAggregateExpr(expr) {
  const match = expr.match(/^(count|sum|avg|min|max)\((.*)\)$/i);
  if (!match) return null;
  const fn = match[1].toLowerCase();
  const field = match[2].trim();
  return { fn, field: field === '*' ? null : field };
}

function parseWhereClause(whereText) {
  const clauses = splitByAnd(whereText);
  return clauses.map(clause => {
    const trimmed = clause.trim();

    // IS NOT NULL
    const isNotNullMatch = trimmed.match(/^([\w\.]+)\s+is\s+not\s+null$/i);
    if (isNotNullMatch) {
      return { field: isNotNullMatch[1].trim(), operator: 'is not null', value: null };
    }

    // IS NULL
    const isNullMatch = trimmed.match(/^([\w\.]+)\s+is\s+null$/i);
    if (isNullMatch) {
      return { field: isNullMatch[1].trim(), operator: 'is null', value: null };
    }

    // NOT LIKE
    const notLikeMatch = trimmed.match(/^([\w\.]+)\s+not\s+like\s+(.+)$/i);
    if (notLikeMatch) {
      return { field: notLikeMatch[1].trim(), operator: 'not like', value: parseSqlValue(notLikeMatch[2]) };
    }

    // LIKE
    const likeMatch = trimmed.match(/^([\w\.]+)\s+like\s+(.+)$/i);
    if (likeMatch) {
      return { field: likeMatch[1].trim(), operator: 'like', value: parseSqlValue(likeMatch[2]) };
    }

    // IN (val1, val2, ...)
    const inMatch = trimmed.match(/^([\w\.]+)\s+in\s*\((.+)\)$/i);
    if (inMatch) {
      const values = inMatch[2].split(',').map(v => parseSqlValue(v.trim()));
      return { field: inMatch[1].trim(), operator: 'in', value: values };
    }

    // NOT IN (val1, val2, ...)
    const notInMatch = trimmed.match(/^([\w\.]+)\s+not\s+in\s*\((.+)\)$/i);
    if (notInMatch) {
      const values = notInMatch[2].split(',').map(v => parseSqlValue(v.trim()));
      return { field: notInMatch[1].trim(), operator: 'not in', value: values };
    }

    // Standard operators: =, !=, >=, <=, >, <, contains
    const match = trimmed.match(/^([\w\.]+)\s*(=|!=|>=|<=|>|<|contains)\s*(.+)$/i);
    if (!match) return null;
    return {
      field: match[1].trim(),
      operator: match[2].toLowerCase(),
      value: parseSqlValue(match[3])
    };
  }).filter(Boolean);
}

function sqlLikeMatch(text, pattern) {
  const str = String(text || '').toLowerCase();
  const pat = String(pattern || '').toLowerCase();
  const regex = pat
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp('^' + regex + '$').test(str);
}

function applySqlWhere(record, whereClauses, tableOrder) {
  if (!whereClauses.length) return true;
  return whereClauses.every(({ field, operator, value }) => {
    const v = getFieldValue(record, field, tableOrder);
    switch (operator) {
      case '=': return v == value;
      case '!=': return v != value;
      case '>': return Number(v) > Number(value);
      case '<': return Number(v) < Number(value);
      case '>=': return Number(v) >= Number(value);
      case '<=': return Number(v) <= Number(value);
      case 'contains': return String(v || '').toLowerCase().includes(String(value).toLowerCase());
      case 'like': return sqlLikeMatch(v, value);
      case 'not like': return !sqlLikeMatch(v, value);
      case 'in': return Array.isArray(value) && value.some(item => item == v);
      case 'not in': return Array.isArray(value) && !value.some(item => item == v);
      case 'is null': return v === null || v === undefined || v === '';
      case 'is not null': return v !== null && v !== undefined && v !== '';
      default: return false;
    }
  });
}

function flattenForSelect(record, tableOrder) {
  const flat = {};
  tableOrder.forEach(table => {
    const row = record[table] || {};
    Object.entries(row).forEach(([key, value]) => {
      flat[`${table}.${key}`] = value;
    });
  });
  return flat;
}

function parseSqlQuery(sql) {
  const rawSql = String(sql || '');
  const cleaned = rawSql
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/;$/, '');
  const normalized = cleaned.replace(/[\r\n\t]+/g, ' ');

  // Check for common syntax errors: WHERE/LIMIT/ORDER before FROM
  const fromPos = normalized.search(/\bfrom\b/i);
  const wherePos = normalized.search(/\bwhere\b/i);
  if (wherePos !== -1 && (fromPos === -1 || wherePos < fromPos)) {
    throw new Error('SQL syntax error: WHERE clause must come after FROM. Correct syntax: SELECT ... FROM table WHERE ...');
  }
  const limitPos = normalized.search(/\blimit\b/i);
  if (limitPos !== -1 && (fromPos === -1 || limitPos < fromPos)) {
    throw new Error('SQL syntax error: LIMIT must come after FROM. Correct syntax: SELECT ... FROM table ... LIMIT n');
  }

  let selectMatch = normalized.match(/^select\s+([\s\S]+?)\s+from\s+([\w_]+)([\s\S]*)$/i);
  if (!selectMatch) {
    selectMatch = normalized.replace(/\s+/g, ' ').trim()
      .match(/^select\s+([\s\S]+?)\s+from\s+([\w_]+)([\s\S]*)$/i);
  }
  if (!selectMatch) throw new Error('Invalid SQL: missing SELECT/FROM. Expected: SELECT columns FROM table [WHERE ...] [ORDER BY ...] [LIMIT n]');
  const selectText = selectMatch[1].trim();
  const baseTable = selectMatch[2].trim();
  let rest = selectMatch[3] || '';
  const joins = [];
  
  let joinMatch = rest.match(/^\s*join\s+([\w_]+)\s+on\s+([\w\.]+)\s*=\s*([\w\.]+)([\s\S]*)$/i);
  while (joinMatch) {
    joins.push({ table: joinMatch[1], left: joinMatch[2], right: joinMatch[3] });
    rest = joinMatch[4] || '';
    joinMatch = rest.match(/^\s*join\s+([\w_]+)\s+on\s+([\w\.]+)\s*=\s*([\w\.]+)([\s\S]*)$/i);
  }
  
  const whereMatch = rest.match(/\s+where\s+([\s\S]+?)(?=\s+order\s+by\s+|\s+limit\s+|\s+offset\s+|$)/i);
  const whereText = whereMatch ? whereMatch[1].trim() : '';
  
  const groupMatch = rest.match(/\s+group\s+by\s+([\w\.,\s]+?)(?=\s+order\s+by\s+|\s+limit\s+|\s+offset\s+|$)/i);
  const orderMatch = rest.match(/\s+order\s+by\s+([\w\.]+)(?:\s+(asc|desc))?/i);
  const orderBy = orderMatch ? { field: orderMatch[1], direction: (orderMatch[2] || 'asc').toLowerCase() } : null;
  
  const limitMatch = rest.match(/\s+limit\s+(\d+)/i);
  const offsetMatch = rest.match(/\s+offset\s+(\d+)/i);
  const groupBy = groupMatch
    ? groupMatch[1].split(',').map(f => f.trim()).filter(Boolean)
    : [];
  
  return {
    select: parseSelectFields(selectText),
    baseTable,
    joins,
    where: whereText ? parseWhereClause(whereText) : [],
    orderBy,
    limit: limitMatch ? parseInt(limitMatch[1], 10) : 50,
    offset: offsetMatch ? parseInt(offsetMatch[1], 10) : 0,
    groupBy
  };
}

router.post('/sql', (req, res) => {
  try {
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL is required' });
    }
    
    const parsed = parseSqlQuery(sql);
    const tablesInOrder = [parsed.baseTable, ...parsed.joins.map(j => j.table)];
    
    if (!db[parsed.baseTable] || !Array.isArray(db[parsed.baseTable])) {
      return res.status(400).json({ error: 'Invalid base table' });
    }
    for (const join of parsed.joins) {
      if (!db[join.table] || !Array.isArray(db[join.table])) {
        return res.status(400).json({ error: `Invalid join table: ${join.table}` });
      }
    }
    
    let rows = db[parsed.baseTable].map(row => ({ [parsed.baseTable]: row }));
    
    parsed.joins.forEach(join => {
      const joined = [];
      rows.forEach(record => {
        const leftValue = getFieldValue(record, join.left, tablesInOrder);
        db[join.table].forEach(row => {
          const rightValue = getFieldValue({ [join.table]: row }, join.right, [join.table]);
          if (leftValue == rightValue) {
            joined.push({ ...record, [join.table]: row });
          }
        });
      });
      rows = joined;
    });
    
    if (parsed.where.length) {
      rows = rows.filter(record => applySqlWhere(record, parsed.where, tablesInOrder));
    }

    const aggregates = parsed.select.filter(s => s.aggregate);
    const nonAggregates = parsed.select.filter(s => !s.aggregate && s.expr !== '*');
    if (aggregates.length) {
      if (nonAggregates.length && !parsed.groupBy.length) {
        return res.status(400).json({ error: 'GROUP BY required for non-aggregate fields' });
      }
      const groupFields = parsed.groupBy || [];
      const groups = new Map();
      const keyFor = record => groupFields.map(f => getFieldValue(record, f, tablesInOrder)).join('|');
      rows.forEach(record => {
        const key = groupFields.length ? keyFor(record) : '__all__';
        if (!groups.has(key)) {
          const base = {};
          groupFields.forEach(field => { base[field] = getFieldValue(record, field, tablesInOrder); });
          groups.set(key, { rows: [], base });
        }
        groups.get(key).rows.push(record);
      });
      rows = Array.from(groups.values()).map(group => {
        const out = { ...group.base };
        aggregates.forEach(sel => {
          const fn = sel.aggregate.fn;
          const field = sel.aggregate.field;
          const alias = sel.alias || `${fn}_${field || 'all'}`;
          const values = field ? group.rows.map(r => getFieldValue(r, field, tablesInOrder)).filter(v => v !== undefined && v !== null) : [];
          if (fn === 'count') {
            out[alias] = field ? values.length : group.rows.length;
          } else if (fn === 'sum') {
            out[alias] = values.reduce((sum, v) => sum + Number(v || 0), 0);
          } else if (fn === 'avg') {
            out[alias] = values.length ? values.reduce((sum, v) => sum + Number(v || 0), 0) / values.length : 0;
          } else if (fn === 'min') {
            out[alias] = values.length ? Math.min(...values.map(v => Number(v))) : null;
          } else if (fn === 'max') {
            out[alias] = values.length ? Math.max(...values.map(v => Number(v))) : null;
          }
        });
        return out;
      });
    }
    
    if (parsed.orderBy && parsed.orderBy.field) {
      const dir = parsed.orderBy.direction === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = getFieldValue(a, parsed.orderBy.field, tablesInOrder);
        const bv = getFieldValue(b, parsed.orderBy.field, tablesInOrder);
        if (av === bv) return 0;
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        return av > bv ? dir : -dir;
      });
    }
    
    const total = rows.length;
    rows = rows.slice(Math.max(0, parsed.offset), Math.max(0, parsed.offset) + Math.min(1000, parsed.limit));
    
    const selectAll = parsed.select.length === 1 && parsed.select[0].expr === '*';
    const mappedRows = rows.map(record => {
      if (aggregates.length) return record;
      if (selectAll) return flattenForSelect(record, tablesInOrder);
      const out = {};
      parsed.select.forEach(field => {
        if (field.expr.endsWith('.*')) {
          const table = field.expr.replace('.*', '');
          const row = record[table] || {};
          Object.entries(row).forEach(([key, value]) => {
            out[`${table}.${key}`] = value;
          });
          return;
        }
        const value = getFieldValue(record, field.expr, tablesInOrder);
        const key = field.alias || field.expr;
        out[key] = value;
      });
      return out;
    });
    
    const columns = mappedRows[0] ? Object.keys(mappedRows[0]) : [];
    res.json({ rows: mappedRows, total, columns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tables', (req, res) => {
  try {
    const tables = Object.keys(db)
      .filter(key => Array.isArray(db[key]))
      .map(key => {
        const rows = db[key];
        const fields = rows[0] ? Object.keys(rows[0]) : [];
        return { name: key, count: rows.length, fields };
      });
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      table,
      filters = {},
      fields = null,
      limit = 50,
      offset = 0,
      orderBy = null,
      aggregates = null,
      groupBy = null
    } = req.body || {};
    
    if (!table || !db[table] || !Array.isArray(db[table])) {
      return res.status(400).json({ error: 'Invalid table' });
    }
    
    let rows = query.all(table);
    if (filters && Object.keys(filters).length) {
      rows = rows.filter(row => applyFilter(row, filters));
    }
    
    const hasAggregates = Array.isArray(aggregates) && aggregates.length > 0;
    const groupFields = Array.isArray(groupBy) ? groupBy : [];
    if (hasAggregates) {
      const groups = new Map();
      const normalizeKey = (row) => groupFields.map(field => getValueByPath(row, field)).join('|');
      
      rows.forEach(row => {
        const key = groupFields.length ? normalizeKey(row) : '__all__';
        if (!groups.has(key)) {
          const base = {};
          groupFields.forEach(field => {
            base[field] = getValueByPath(row, field);
          });
          groups.set(key, { rows: [], base });
        }
        groups.get(key).rows.push(row);
      });
      
      rows = Array.from(groups.values()).map(group => {
        const out = { ...group.base };
        aggregates.forEach(agg => {
          const fn = String(agg.fn || '').toLowerCase();
          const field = agg.field || null;
          const alias = agg.alias || `${fn}_${field || 'all'}`;
          const values = field ? group.rows.map(r => getValueByPath(r, field)).filter(v => v !== undefined && v !== null) : [];
          
          if (fn === 'count') {
            out[alias] = field ? values.length : group.rows.length;
          } else if (fn === 'sum') {
            out[alias] = values.reduce((sum, v) => sum + Number(v || 0), 0);
          } else if (fn === 'avg') {
            out[alias] = values.length ? values.reduce((sum, v) => sum + Number(v || 0), 0) / values.length : 0;
          } else if (fn === 'min') {
            out[alias] = values.length ? Math.min(...values.map(v => Number(v))) : null;
          } else if (fn === 'max') {
            out[alias] = values.length ? Math.max(...values.map(v => Number(v))) : null;
          }
        });
        return out;
      });
    }
    
    if (orderBy && orderBy.field) {
      const dir = String(orderBy.direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      const field = orderBy.field;
      rows = [...rows].sort((a, b) => {
        const av = getValueByPath(a, field);
        const bv = getValueByPath(b, field);
        if (av === bv) return 0;
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        return av > bv ? dir : -dir;
      });
    }
    
    const total = rows.length;
    rows = rows.slice(Math.max(0, offset), Math.max(0, offset) + Math.min(1000, limit));
    
    if (!hasAggregates && Array.isArray(fields) && fields.length) {
      rows = rows.map(row => {
        const subset = {};
        fields.forEach(f => {
          subset[f] = getValueByPath(row, f);
        });
        return subset;
      });
    }
    
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    res.json({ rows, total, columns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
