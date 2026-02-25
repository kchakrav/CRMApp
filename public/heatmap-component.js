/**
 * Heatmap Component — Reusable SVG heatmap renderer
 * Provides: renderHeatmapGrid, renderBarSpark, renderAIRecommendations,
 *           renderDeviceHeatmap, renderGeoHeatmap, renderClickZones,
 *           renderFunnelHeatmap, renderNodePerformance
 */

(function () {
  'use strict';

  /* ── Color scales ── */
  const PALETTES = {
    blue:    ['#EFF6FF','#DBEAFE','#BFDBFE','#93C5FD','#60A5FA','#3B82F6','#2563EB','#1D4ED8','#1E40AF'],
    green:   ['#F0FDF4','#DCFCE7','#BBF7D0','#86EFAC','#4ADE80','#22C55E','#16A34A','#15803D','#166534'],
    purple:  ['#FAF5FF','#F3E8FF','#E9D5FF','#D8B4FE','#C084FC','#A855F7','#9333EA','#7E22CE','#6B21A8'],
    orange:  ['#FFF7ED','#FFEDD5','#FED7AA','#FDBA74','#FB923C','#F97316','#EA580C','#C2410C','#9A3412'],
    red:     ['#FEF2F2','#FEE2E2','#FECACA','#FCA5A5','#F87171','#EF4444','#DC2626','#B91C1C','#991B1B'],
    thermal: ['#1E3A5F','#1E5F8C','#27AE60','#F1C40F','#E67E22','#E74C3C','#C0392B','#922B21','#641E16']
  };

  function getColor(value, max, palette) {
    const colors = PALETTES[palette] || PALETTES.blue;
    if (!max || max === 0 || value <= 0) return colors[0];
    const idx = Math.min(Math.floor((value / max) * (colors.length - 1)), colors.length - 1);
    return colors[idx];
  }

  /* ── SVG Heatmap Grid (hour × day) ── */
  function renderHeatmapGrid(containerId, data, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const {
      cellSize = 36,
      gap = 3,
      palette = 'blue',
      valueKey = 'opens',
      days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      hours = Array.from({length: 24}, (_, i) => i),
      maxVal = 0,
      title = '',
      showLegend = true,
      formatValue = (v) => v.toLocaleString()
    } = options;

    const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0));
    const dayLabelW = 44;
    const hourLabelH = 28;
    const legendH = showLegend ? 48 : 0;
    const w = dayLabelW + hours.length * (cellSize + gap) + gap;
    const h = hourLabelH + days.length * (cellSize + gap) + gap + legendH;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${w} ${h}" style="max-width:${w}px;font-family:system-ui,-apple-system,sans-serif">`;

    // Hour labels
    hours.forEach((hr, ci) => {
      const x = dayLabelW + ci * (cellSize + gap) + cellSize / 2;
      svg += `<text x="${x}" y="16" text-anchor="middle" font-size="10" fill="#94a3b8">${hr === 0 ? '12a' : hr < 12 ? hr + 'a' : hr === 12 ? '12p' : (hr - 12) + 'p'}</text>`;
    });

    // Day labels + cells
    days.forEach((day, ri) => {
      const y = hourLabelH + ri * (cellSize + gap);
      svg += `<text x="36" y="${y + cellSize / 2 + 4}" text-anchor="end" font-size="11" font-weight="500" fill="#64748b">${day}</text>`;

      hours.forEach((hr, ci) => {
        const x = dayLabelW + ci * (cellSize + gap);
        const cell = data.find(d => d.day === day && d.hour === hr);
        const val = cell ? (cell[valueKey] || 0) : 0;
        const color = getColor(val, max, palette);
        const rx = 4;
        svg += `<g class="hm-cell" data-tip="${day} ${hr}:00 — ${formatValue(val)}">`;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${rx}" fill="${color}" stroke="white" stroke-width="1"/>`;
        if (cellSize >= 30 && val > 0) {
          const textColor = val / max > 0.55 ? '#fff' : '#334155';
          svg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 4}" text-anchor="middle" font-size="9" font-weight="600" fill="${textColor}">${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}</text>`;
        }
        svg += `</g>`;
      });
    });

    // Legend
    if (showLegend) {
      const colors = PALETTES[palette] || PALETTES.blue;
      const ly = hourLabelH + days.length * (cellSize + gap) + 12;
      svg += `<text x="${dayLabelW}" y="${ly + 8}" font-size="10" fill="#94a3b8">Less</text>`;
      const legStart = dayLabelW + 30;
      colors.forEach((c, i) => {
        svg += `<rect x="${legStart + i * 18}" y="${ly}" width="15" height="15" rx="3" fill="${c}"/>`;
      });
      svg += `<text x="${legStart + colors.length * 18 + 4}" y="${ly + 8}" font-size="10" fill="#94a3b8">More</text>`;
    }

    svg += '</svg>';

    el.innerHTML = `
      ${title ? `<div class="hm-grid-title">${title}</div>` : ''}
      <div class="hm-grid-wrap">${svg}</div>
      <div class="hm-tooltip" id="${containerId}-tip"></div>
    `;

    // Tooltip interactivity
    const tip = document.getElementById(containerId + '-tip');
    el.querySelectorAll('.hm-cell').forEach(g => {
      g.addEventListener('mouseenter', e => {
        const text = g.getAttribute('data-tip');
        tip.textContent = text;
        tip.style.display = 'block';
      });
      g.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        tip.style.left = (e.clientX - rect.left + 12) + 'px';
        tip.style.top = (e.clientY - rect.top - 30) + 'px';
      });
      g.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    });
  }

  /* ── Bar Sparkline (horizontal) ── */
  function renderBarSpark(containerId, labels, values, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { palette = 'blue', barHeight = 28, title = '', formatValue = v => v.toLocaleString() } = options;
    const max = Math.max(...values, 1);
    const colors = PALETTES[palette] || PALETTES.blue;

    el.innerHTML = `
      ${title ? `<div class="hm-grid-title">${title}</div>` : ''}
      <div class="hm-bar-spark">
        ${labels.map((label, i) => {
          const pct = (values[i] / max) * 100;
          const color = colors[Math.min(Math.floor((values[i] / max) * (colors.length - 1)), colors.length - 1)];
          return `<div class="hm-bar-row">
            <span class="hm-bar-label">${label}</span>
            <div class="hm-bar-track"><div class="hm-bar-fill" style="width:${pct}%;background:${color};height:${barHeight}px"></div></div>
            <span class="hm-bar-value">${formatValue(values[i])}</span>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── Device Heatmap ── */
  function renderDeviceHeatmap(containerId, deviceData, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'Device Breakdown' } = options;
    const devices = Object.entries(deviceData);
    const totalOpens = devices.reduce((s, [, d]) => s + (d.opens || 0), 0) || 1;
    const totalClicks = devices.reduce((s, [, d]) => s + (d.clicks || 0), 0) || 1;

    const icons = {
      desktop: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
      mobile: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>',
      tablet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>',
      other: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };

    el.innerHTML = `
      <div class="hm-grid-title">${title}</div>
      <div class="hm-device-grid">
        ${devices.map(([name, d]) => {
          const openPct = ((d.opens / totalOpens) * 100).toFixed(1);
          const clickPct = ((d.clicks / totalClicks) * 100).toFixed(1);
          return `<div class="hm-device-card">
            <div class="hm-device-icon">${icons[name] || icons.other}</div>
            <div class="hm-device-name">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
            <div class="hm-device-stats">
              <div class="hm-device-stat">
                <div class="hm-device-stat-val">${openPct}%</div>
                <div class="hm-device-stat-label">Opens</div>
                <div class="hm-device-progress"><div class="hm-device-progress-fill" style="width:${openPct}%;background:var(--color-primary,#6366f1)"></div></div>
              </div>
              <div class="hm-device-stat">
                <div class="hm-device-stat-val">${clickPct}%</div>
                <div class="hm-device-stat-label">Clicks</div>
                <div class="hm-device-progress"><div class="hm-device-progress-fill" style="width:${clickPct}%;background:#22c55e"></div></div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── Geo Heatmap (table with bars) ── */
  function renderGeoHeatmap(containerId, geoData, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'Geographic Distribution' } = options;
    const maxOpens = Math.max(...geoData.map(g => g.opens), 1);

    el.innerHTML = `
      <div class="hm-grid-title">${title}</div>
      <div class="hm-geo-table">
        <div class="hm-geo-header">
          <span>Country</span><span>Opens</span><span>Clicks</span><span>CTR</span><span>Distribution</span>
        </div>
        ${geoData.map(g => {
          const ctr = g.opens > 0 ? ((g.clicks / g.opens) * 100).toFixed(1) : '0.0';
          const pct = (g.opens / maxOpens) * 100;
          return `<div class="hm-geo-row">
            <span class="hm-geo-country"><span class="hm-geo-flag">${g.code}</span> ${g.country}</span>
            <span class="hm-geo-val">${g.opens.toLocaleString()}</span>
            <span class="hm-geo-val">${g.clicks.toLocaleString()}</span>
            <span class="hm-geo-val hm-geo-ctr">${ctr}%</span>
            <span class="hm-geo-bar-cell"><div class="hm-geo-bar" style="width:${pct}%"></div></span>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── Click Zones (email scroll map) ── */
  function renderClickZones(containerId, zones, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'Click Map — Email Zones' } = options;
    if (!zones || zones.length === 0) { el.innerHTML = ''; return; }
    const maxClicks = Math.max(...zones.map(z => z.clicks), 1);

    el.innerHTML = `
      <div class="hm-grid-title">${title}</div>
      <div class="hm-click-zones">
        ${zones.map(z => {
          const pct = (z.clicks / maxClicks) * 100;
          const intensity = Math.min(pct / 100, 1);
          const bg = `rgba(99, 102, 241, ${0.08 + intensity * 0.35})`;
          const borderColor = `rgba(99, 102, 241, ${0.2 + intensity * 0.6})`;
          return `<div class="hm-click-zone" style="background:${bg};border-color:${borderColor}">
            <div class="hm-click-zone-label">${z.zone}</div>
            <div class="hm-click-zone-bar-wrap">
              <div class="hm-click-zone-bar" style="width:${pct}%"></div>
            </div>
            <div class="hm-click-zone-val">${z.clicks.toLocaleString()} clicks</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── Funnel Heatmap (stages × days) ── */
  function renderFunnelHeatmap(containerId, funnel, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'Conversion Funnel by Day', palette = 'green' } = options;
    if (!funnel || funnel.length === 0) { el.innerHTML = ''; return; }

    const days = funnel[0].days.map(d => d.day);
    const allValues = funnel.flatMap(s => s.days.map(d => d.value));
    const max = Math.max(...allValues, 1);
    const colors = PALETTES[palette] || PALETTES.green;

    el.innerHTML = `
      <div class="hm-grid-title">${title}</div>
      <div class="hm-funnel-grid">
        <div class="hm-funnel-header">
          <span class="hm-funnel-stage-label"></span>
          ${days.map(d => `<span class="hm-funnel-day">${d}</span>`).join('')}
          <span class="hm-funnel-total">Total</span>
        </div>
        ${funnel.map(s => `
          <div class="hm-funnel-row">
            <span class="hm-funnel-stage-label">${s.stage}</span>
            ${s.days.map(d => {
              const color = getColor(d.value, max, palette);
              const textColor = d.value / max > 0.5 ? '#fff' : '#334155';
              return `<span class="hm-funnel-cell" style="background:${color};color:${textColor}" title="${s.stage} on ${d.day}: ${d.value.toLocaleString()}">${d.value >= 1000 ? (d.value / 1000).toFixed(1) + 'k' : d.value}</span>`;
            }).join('')}
            <span class="hm-funnel-total-val">${s.total.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>`;
  }

  /* ── Node Performance Cards ── */
  function renderNodePerformance(containerId, nodes, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'Activity Performance' } = options;
    if (!nodes || nodes.length === 0) { el.innerHTML = `<div class="hm-grid-title">${title}</div><div style="color:var(--text-secondary);padding:12px">No activity nodes in this workflow.</div>`; return; }

    const typeIcons = {
      email: '📧', sms: '💬', push: '🔔', wait: '⏳', condition: '🔀',
      split: '🔀', webhook: '🌐', update_profile: '👤', javascript: '⚡'
    };

    el.innerHTML = `
      <div class="hm-grid-title">${title}</div>
      <div class="hm-node-grid">
        ${nodes.map(n => {
          const successRate = parseFloat(n.success_rate);
          const rateColor = successRate >= 95 ? '#22c55e' : successRate >= 80 ? '#f59e0b' : '#ef4444';
          return `<div class="hm-node-card">
            <div class="hm-node-header">
              <span class="hm-node-icon">${typeIcons[n.node_type] || '⚙️'}</span>
              <span class="hm-node-label">${n.node_label}</span>
              <span class="hm-node-type-badge">${n.node_type}</span>
            </div>
            <div class="hm-node-metrics">
              <div class="hm-node-metric">
                <div class="hm-node-metric-val">${n.processed.toLocaleString()}</div>
                <div class="hm-node-metric-label">Processed</div>
              </div>
              <div class="hm-node-metric">
                <div class="hm-node-metric-val" style="color:${rateColor}">${n.success_rate}%</div>
                <div class="hm-node-metric-label">Success</div>
              </div>
              <div class="hm-node-metric">
                <div class="hm-node-metric-val" style="color:${n.errors > 0 ? '#ef4444' : 'inherit'}">${n.errors}</div>
                <div class="hm-node-metric-label">Errors</div>
              </div>
              <div class="hm-node-metric">
                <div class="hm-node-metric-val">${n.avg_duration_ms}ms</div>
                <div class="hm-node-metric-label">Avg Time</div>
              </div>
            </div>
            <div class="hm-node-success-bar">
              <div class="hm-node-success-fill" style="width:${successRate}%;background:${rateColor}"></div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── AI Recommendations ── */
  function renderAIRecommendations(containerId, recs, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { title = 'AI-Powered Insights' } = options;

    const iconMap = {
      clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
      device: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>',
      target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
      sparkle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>',
      zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>'
    };

    const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
    const priorityBg = { high: '#fef2f2', medium: '#fffbeb', low: '#f0fdf4' };
    const priorityBorder = { high: '#fecaca', medium: '#fde68a', low: '#bbf7d0' };

    el.innerHTML = `
      <div class="hm-ai-header">
        <div class="hm-ai-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary,#6366f1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
          ${title}
        </div>
        <span class="hm-ai-badge">${recs.length} insights</span>
      </div>
      <div class="hm-ai-grid">
        ${recs.map(r => {
          const color = priorityColors[r.priority] || '#64748b';
          const bg = priorityBg[r.priority] || '#f8fafc';
          const border = priorityBorder[r.priority] || '#e2e8f0';
          return `<div class="hm-ai-card" style="border-color:${border}">
            <div class="hm-ai-card-header">
              <div class="hm-ai-card-icon" style="background:${bg};color:${color}">${iconMap[r.icon] || iconMap.sparkle}</div>
              <div class="hm-ai-card-title-wrap">
                <div class="hm-ai-card-title">${r.title}</div>
                <span class="hm-ai-priority" style="background:${bg};color:${color};border:1px solid ${border}">${r.priority}</span>
              </div>
            </div>
            <div class="hm-ai-card-body">${r.description}</div>
            <div class="hm-ai-card-footer">
              <div class="hm-ai-metric">
                <span class="hm-ai-metric-label">Key Metric</span>
                <span class="hm-ai-metric-val">${r.metric}</span>
              </div>
              <div class="hm-ai-impact">
                <span class="hm-ai-impact-label">Est. Impact</span>
                <span class="hm-ai-impact-val" style="color:${color}">${r.impact}</span>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // Expose globally
  window.HeatmapComponent = {
    renderHeatmapGrid,
    renderBarSpark,
    renderDeviceHeatmap,
    renderGeoHeatmap,
    renderClickZones,
    renderFunnelHeatmap,
    renderNodePerformance,
    renderAIRecommendations
  };
})();
