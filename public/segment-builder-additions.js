
// ============================================
// SQL GENERATION AND DISPLAY
// ============================================

// Generate SQL from current rules
function generateSQL() {
  if (rules.length === 0) {
    return 'SELECT * FROM contacts';
  }
  
  const logic = document.getElementById('logic-operator')?.value || 'AND';
  const conditions = [];
  
  rules.forEach((rule, index) => {
    if (!rule.attribute) return;
    
    let condition = '';
    const tableName = rule.entity || 'contacts';
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
  
  let sql = 'SELECT *\nFROM contacts';
  
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
  if (panel) {
    panel.classList.toggle('collapsed');
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
        <p>👆 Drag attributes from the left to build your segment</p>
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
