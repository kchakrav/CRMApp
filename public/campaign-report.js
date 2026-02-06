// Campaign Report JavaScript
const API_BASE = '/api';

let campaignId = null;
let reportData = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  campaignId = parseInt(params.get('campaignId'));
  
  if (!campaignId) {
    showToast('No campaign ID specified', 'error');
    return;
  }
  
  await loadReport();
});

// Load campaign report
async function loadReport() {
  showLoading();
  
  try {
    const response = await fetch(`${API_BASE}/campaigns/${campaignId}/report`);
    reportData = await response.json();
    
    if (!response.ok) throw new Error(reportData.error);
    
    renderReport();
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading report: ' + error.message, 'error');
  }
}

// Render complete report
function renderReport() {
  // Header
  document.getElementById('campaign-name').textContent = reportData.campaign.name;
  document.getElementById('campaign-subject').textContent = reportData.campaign.subject || 'No subject';
  
  // Metrics Grid
  renderMetrics();
  
  // Charts
  renderEngagementChart();
  renderDeviceChart();
  
  // Top Links
  renderTopLinks();
  
  // Geographic Table
  renderGeoTable();
  
  // Recipient Tables
  renderRecipientTables();
}

// Render key metrics
function renderMetrics() {
  const { metrics, rates } = reportData;
  
  const metricsHtml = `
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Sent</span>
        <span class="stat-card-icon">📧</span>
      </div>
      <div class="stat-card-value">${metrics.sent.toLocaleString()}</div>
      <div class="stat-card-label">Total recipients</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Delivered</span>
        <span class="stat-card-icon">✅</span>
      </div>
      <div class="stat-card-value">${metrics.delivered.toLocaleString()}</div>
      <div class="stat-card-label">${rates.delivery_rate}% delivery rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Opened</span>
        <span class="stat-card-icon">👁️</span>
      </div>
      <div class="stat-card-value">${metrics.opened.toLocaleString()}</div>
      <div class="stat-card-label">${rates.open_rate}% open rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Clicked</span>
        <span class="stat-card-icon">🖱️</span>
      </div>
      <div class="stat-card-value">${metrics.clicked.toLocaleString()}</div>
      <div class="stat-card-label">${rates.click_rate}% click rate (CTR)</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">CTOR</span>
        <span class="stat-card-icon">🎯</span>
      </div>
      <div class="stat-card-value">${rates.ctor}%</div>
      <div class="stat-card-label">Click-to-Open Rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Bounced</span>
        <span class="stat-card-icon">⚠️</span>
      </div>
      <div class="stat-card-value">${metrics.bounced.toLocaleString()}</div>
      <div class="stat-card-label">${rates.bounce_rate}% bounce rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Unsubscribed</span>
        <span class="stat-card-icon">👋</span>
      </div>
      <div class="stat-card-value">${metrics.unsubscribed.toLocaleString()}</div>
      <div class="stat-card-label">${rates.unsubscribe_rate}% unsub rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Converted</span>
        <span class="stat-card-icon">💎</span>
      </div>
      <div class="stat-card-value">${metrics.converted.toLocaleString()}</div>
      <div class="stat-card-label">${rates.conversion_rate}% conversion rate</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-title">Revenue</span>
        <span class="stat-card-icon">💰</span>
      </div>
      <div class="stat-card-value">$${metrics.revenue.toFixed(2)}</div>
      <div class="stat-card-label">Total generated</div>
    </div>
  `;
  
  document.getElementById('metrics-grid').innerHTML = metricsHtml;
}

// Render engagement timeline chart
function renderEngagementChart() {
  const canvas = document.getElementById('engagement-chart');
  const ctx = canvas.getContext('2d');
  const data = reportData.engagement_timeline;
  
  if (data.length === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('No engagement data yet', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const width = canvas.parentElement.clientWidth;
  const height = 250;
  canvas.width = width;
  canvas.height = height;
  
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Get max values
  const maxOpens = Math.max(...data.map(d => d.opens));
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const maxValue = Math.max(maxOpens, maxClicks);
  
  if (maxValue === 0) return;
  
  // Draw axes
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw lines
  const pointSpacing = chartWidth / (data.length - 1 || 1);
  
  // Opens line
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = padding + i * pointSpacing;
    const y = height - padding - (d.opens / maxValue) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Clicks line
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = padding + i * pointSpacing;
    const y = height - padding - (d.clicks / maxValue) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw points
  data.forEach((d, i) => {
    const x = padding + i * pointSpacing;
    
    // Opens point
    const yOpen = height - padding - (d.opens / maxValue) * chartHeight;
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(x, yOpen, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Clicks point
    const yClick = height - padding - (d.clicks / maxValue) * chartHeight;
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(x, yClick, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Y-axis labels
  ctx.fillStyle = '#6B7280';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'right';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const value = Math.round((maxValue / ySteps) * i);
    const y = height - padding - (chartHeight / ySteps) * i;
    ctx.fillText(value.toString(), padding - 10, y + 4);
  }
  
  // X-axis labels (every 6 hours)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B7280';
  data.forEach((d, i) => {
    if (i % 6 === 0 || i === data.length - 1) {
      const x = padding + i * pointSpacing;
      ctx.fillText(`${d.hour}h`, x, height - padding + 20);
    }
  });
  
  // Legend
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3B82F6';
  ctx.fillText('● Opens', width - 150, 30);
  ctx.fillStyle = '#10B981';
  ctx.fillText('● Clicks', width - 150, 50);
}

// Render device breakdown chart (pie chart)
function renderDeviceChart() {
  const canvas = document.getElementById('device-chart');
  const ctx = canvas.getContext('2d');
  const data = reportData.device_breakdown;
  
  const width = canvas.parentElement.clientWidth;
  const height = 250;
  canvas.width = width;
  canvas.height = height;
  
  const centerX = width / 2;
  const centerY = height / 2 - 20;
  const radius = Math.min(width, height) / 3;
  
  const devices = [
    { label: 'Desktop', value: data.desktop, color: '#3B82F6' },
    { label: 'Mobile', value: data.mobile, color: '#10B981' },
    { label: 'Tablet', value: data.tablet, color: '#F59E0B' },
    { label: 'Other', value: data.other, color: '#6B7280' }
  ];
  
  const total = devices.reduce((sum, d) => sum + d.value, 0);
  
  if (total === 0) {
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('No device data', centerX, centerY);
    return;
  }
  
  let startAngle = -Math.PI / 2;
  
  devices.forEach(device => {
    const sliceAngle = (device.value / total) * Math.PI * 2;
    
    // Draw slice
    ctx.fillStyle = device.color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    // Draw percentage in slice
    if (device.value > 0) {
      const midAngle = startAngle + sliceAngle / 2;
      const textX = centerX + Math.cos(midAngle) * (radius * 0.7);
      const textY = centerY + Math.sin(midAngle) * (radius * 0.7);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${((device.value / total) * 100).toFixed(0)}%`, textX, textY);
    }
    
    startAngle += sliceAngle;
  });
  
  // Draw legend
  const legendX = 20;
  const legendY = height - 60;
  
  devices.forEach((device, i) => {
    const y = legendY + i * 20;
    
    ctx.fillStyle = device.color;
    ctx.fillRect(legendX, y, 12, 12);
    
    ctx.fillStyle = '#1F2937';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${device.label}: ${device.value.toLocaleString()}`, legendX + 20, y + 10);
  });
}

// Render top links
function renderTopLinks() {
  const links = reportData.top_links;
  
  if (links.length === 0) {
    document.getElementById('top-links-container').innerHTML = '<p style="text-align: center; color: #6B7280; padding: 2rem;">No link data available</p>';
    return;
  }
  
  const html = links.map(link => `
    <div class="link-item">
      <div class="link-header">
        <span class="link-url">${link.url}</span>
        <span class="link-clicks">${link.clicks.toLocaleString()} clicks</span>
      </div>
      <div class="link-progress">
        <div class="link-progress-bar" style="width: ${link.percentage}%"></div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('top-links-container').innerHTML = html;
}

// Render geographic table
function renderGeoTable() {
  const geo = reportData.geo_breakdown;
  
  if (geo.length === 0) {
    document.getElementById('geo-table').innerHTML = '<tbody><tr><td colspan="3" style="text-align: center; padding: 2rem; color: #6B7280;">No geographic data</td></tr></tbody>';
    return;
  }
  
  const html = `
    <thead>
      <tr>
        <th>Country</th>
        <th>Opens</th>
        <th>Clicks</th>
      </tr>
    </thead>
    <tbody>
      ${geo.map(g => `
        <tr>
          <td><strong>${g.country}</strong></td>
          <td>${g.opens.toLocaleString()}</td>
          <td>${g.clicks.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  document.getElementById('geo-table').innerHTML = html;
}

// Render recipient tables
function renderRecipientTables() {
  const { recipients } = reportData;
  
  // Engaged recipients
  const engagedHtml = `
    <thead>
      <tr>
        <th>Customer</th>
        <th>Email</th>
        <th>Sent</th>
        <th>Opened</th>
        <th>Clicked</th>
        <th>Engagement</th>
      </tr>
    </thead>
    <tbody>
      ${recipients.top_engaged.length === 0 ? 
        '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No engaged recipients yet</td></tr>' :
        recipients.top_engaged.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.email}</td>
          <td>${new Date(r.sent_at).toLocaleString()}</td>
          <td>${r.opened_at ? '✅ ' + new Date(r.opened_at).toLocaleString() : '—'}</td>
          <td>${r.clicked_at ? '✅ ' + new Date(r.clicked_at).toLocaleString() : '—'}</td>
          <td>
            <span class="badge ${r.clicked_at ? 'badge-success' : 'badge-info'}">
              ${r.clicked_at ? '⭐ High' : r.opened_at ? '👍 Medium' : 'Low'}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  document.getElementById('engaged-table').innerHTML = engagedHtml;
  
  // Non-engaged recipients
  const nonEngagedHtml = `
    <thead>
      <tr>
        <th>Customer</th>
        <th>Email</th>
        <th>Sent</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${recipients.non_engaged.length === 0 ?
        '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6B7280;">All recipients engaged!</td></tr>' :
        recipients.non_engaged.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.email}</td>
          <td>${new Date(r.sent_at).toLocaleString()}</td>
          <td><span class="badge badge-secondary">No interaction</span></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  document.getElementById('non-engaged-table').innerHTML = nonEngagedHtml;
  
  // Bounced recipients
  const bouncedHtml = `
    <thead>
      <tr>
        <th>Customer</th>
        <th>Email</th>
        <th>Sent</th>
        <th>Bounce Type</th>
      </tr>
    </thead>
    <tbody>
      ${recipients.bounced.length === 0 ?
        '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6B7280;">No bounces!</td></tr>' :
        recipients.bounced.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.email}</td>
          <td>${new Date(r.sent_at).toLocaleString()}</td>
          <td><span class="badge badge-danger">${r.bounce_type}</span></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  document.getElementById('bounced-table').innerHTML = bouncedHtml;
}

// Switch tabs
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
  document.getElementById(`tab-${tab}`).style.display = 'block';
}

// Export functions (placeholder)
function exportReport() {
  showToast('PDF export coming soon!', 'info');
}

function exportCSV() {
  const { recipients } = reportData;
  
  // Create CSV content
  let csv = 'Customer Name,Email,Sent At,Opened At,Clicked At,Bounced,Engagement\n';
  
  recipients.top_engaged.forEach(r => {
    csv += `"${r.name}","${r.email}","${r.sent_at}","${r.opened_at || ''}","${r.clicked_at || ''}","${r.bounced}","${r.engagement_score}"\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign-${campaignId}-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showToast('CSV exported successfully!', 'success');
}

// Go back
function goBack() {
  window.location.href = '/?view=campaigns';
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
