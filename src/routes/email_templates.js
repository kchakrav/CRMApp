const express = require('express');
const router = express.Router();
const { query } = require('../database');

// ── Lightweight server-side block→HTML renderer ──────────────────────
const _PH_IMG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200"><rect fill="#f3f4f6" width="640" height="200"/><g fill="#9ca3af"><rect x="280" y="60" width="80" height="60" rx="6"/><polygon points="290,110 310,85 330,110"/><polygon points="315,110 340,75 370,110"/><circle cx="340" cy="72" r="8"/></g><text x="320" y="145" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">Image placeholder</text></svg>`)}`;

function _blockToHtml(block) {
  if (!block) return '';
  const s = block.style || {};
  if (block.type === 'text') {
    const css = `font-family:${s.fontFamily||'Arial,sans-serif'};font-size:${s.fontSize||'14px'};line-height:${s.lineHeight||'1.5'};font-weight:${s.fontWeight||'normal'};text-align:${s.textAlign||'left'};color:${s.color||'#1f2933'};padding:${s.padding||'0'};${s.backgroundColor?'background:'+s.backgroundColor+';':''}${s.letterSpacing?'letter-spacing:'+s.letterSpacing+';':''}`;
    return `<p style="${css}">${(block.content||'').replace(/\n/g,'<br>')}</p>`;
  }
  if (block.type === 'image') {
    const src = block.src || _PH_IMG;
    const align = s.textAlign || 'center';
    return `<div style="text-align:${align};"><img src="${src}" alt="${block.alt||'Image'}" style="max-width:100%;display:inline-block;"></div>`;
  }
  if (block.type === 'button') {
    const align = s.textAlign || 'center';
    return `<div style="text-align:${align};"><a href="${block.url||'#'}" style="display:inline-block;padding:${s.padding||'10px 16px'};background:${s.buttonColor||'#1473E6'};color:${s.color||'#fff'};border-radius:${s.borderRadius||'4px'};text-decoration:none;font-family:Arial,sans-serif;">${block.text||'Button'}</a></div>`;
  }
  if (block.type === 'divider') {
    return `<hr style="border:none;border-top:${s.thickness||block.thickness||1}px solid ${s.borderColor||'#E1E1E1'};margin:8px 0;">`;
  }
  if (block.type === 'spacer') {
    return `<div style="height:${s.height||block.height||20}px;"></div>`;
  }
  if (block.type === 'social') {
    return `<div style="text-align:center;padding:8px;">Social links</div>`;
  }
  if (block.type === 'structure') {
    const cols = block.columns || [];
    const pct = cols.length ? Math.floor(100/cols.length) : 100;
    const inner = cols.map(col =>
      `<td style="width:${pct}%;vertical-align:top;padding:4px;">${(col.blocks||[]).map(_blockToHtml).join('')}</td>`
    ).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${inner}</tr></table>`;
  }
  return '';
}

function blocksToHtml(blocks) {
  return `<div style="max-width:640px;margin:0 auto;padding:24px;background:#ffffff;">${(blocks||[]).map(_blockToHtml).join('')}</div>`;
}

// Get email/content templates (optionally filter by channel or type)
router.get('/', (req, res) => {
  try {
    const { channel, status, search } = req.query;
    let templates = query.all('content_templates');

    if (channel) {
      templates = templates.filter(t => t.channel === channel || t.type === channel);
    }
    if (status) {
      templates = templates.filter(t => t.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      templates = templates.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    // Sort by updated_at descending
    templates.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = query.get('content_templates', id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', (req, res) => {
  try {
    const {
      name,
      description = '',
      channel = 'email',
      category = 'custom',
      subject = '',
      blocks = [],
      html = '',
      status = 'draft',
      created_by = 'System',
      sample = false
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('content_templates', {
      name,
      description,
      type: channel,
      channel: channel,
      category,
      subject,
      blocks,
      html,
      status,
      sample: !!sample,
      created_by: created_by || 'System',
      updated_by: created_by || 'System'
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('content_templates', id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    query.update('content_templates', id, updates);
    res.json(query.get('content_templates', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate template
router.post('/:id/duplicate', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('content_templates', id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    const copy = {
      name: `Copy of ${existing.name}`,
      description: existing.description || '',
      type: existing.type || 'email',
      channel: existing.channel || 'email',
      category: existing.category || 'custom',
      subject: existing.subject || '',
      blocks: existing.blocks || [],
      html: existing.html || '',
      status: 'draft',
      sample: false,
      created_by: req.body.created_by || 'System',
      updated_by: req.body.created_by || 'System'
    };
    const result = query.insert('content_templates', copy);
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('content_templates', id);
    if (!existing) return res.status(404).json({ error: 'Template not found' });
    query.delete('content_templates', id);
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed sample templates (called at startup if table is empty)
function seedSampleTemplates() {
  const existing = query.all('content_templates');
  const hasSamples = existing.some(t => t.sample && t.html);
  if (hasSamples) return;
  // Remove old samples without HTML so we can re-seed them
  existing.filter(t => t.sample && !t.html).forEach(t => {
    try { query.delete('content_templates', t.id); } catch(e) { /* ignore */ }
  });

  const samples = [
    {
      name: 'Welcome Email',
      description: 'Welcome new subscribers with your brand story and key benefits',
      category: 'onboarding',
      subject: 'Welcome to {{contacts.first_name}}! Let\'s get started',
      blocks: [
        { id: 'b1', type: 'image', src: '', alt: 'Brand hero image', style: { textAlign: 'center' } },
        { id: 'b2', type: 'text', content: 'Hi {{contacts.first_name}},\n\nWelcome aboard! We\'re thrilled to have you join our community. Here\'s what you can look forward to:', style: { fontSize: '16px', lineHeight: '1.6', textAlign: 'center', padding: '16px 24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'structure', variant: '3-3', columns: [
          { blocks: [{ id: 'b3a', type: 'text', content: '🎁\nExclusive Offers', style: { textAlign: 'center', fontSize: '14px', padding: '12px' } }] },
          { blocks: [{ id: 'b3b', type: 'text', content: '📦\nFree Shipping', style: { textAlign: 'center', fontSize: '14px', padding: '12px' } }] },
          { blocks: [{ id: 'b3c', type: 'text', content: '⭐\nLoyalty Rewards', style: { textAlign: 'center', fontSize: '14px', padding: '12px' } }] }
        ] },
        { id: 'b4', type: 'button', text: 'Start Shopping', url: 'https://example.com/shop', style: { textAlign: 'center', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '6px', padding: '12px 32px' } },
        { id: 'b5', type: 'divider', thickness: 1 },
        { id: 'b6', type: 'text', content: 'Need help getting started? Just reply to this email — we\'re here for you!', style: { fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '8px 24px' } }
      ]
    },
    {
      name: 'Promotional Sale',
      description: 'Drive sales with a time-limited promotional offer',
      category: 'promotional',
      subject: '🔥 {{contacts.first_name}}, Don\'t miss our biggest sale!',
      blocks: [
        { id: 'b1', type: 'image', src: '', alt: 'Sale banner', style: { textAlign: 'center' } },
        { id: 'b2', type: 'text', content: 'UP TO 50% OFF', style: { fontSize: '36px', fontWeight: 'bold', textAlign: 'center', color: '#DC2626', padding: '16px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'text', content: 'Our biggest sale of the season is here. Shop your favorites at unbeatable prices — but hurry, this offer ends soon!', style: { fontSize: '16px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' } },
        { id: 'b4', type: 'structure', variant: '2-2', columns: [
          { blocks: [
            { id: 'b4a', type: 'image', src: '', alt: 'Product 1', style: { textAlign: 'center' } },
            { id: 'b4b', type: 'text', content: 'Best Sellers\nStarting at $29', style: { textAlign: 'center', fontSize: '14px', padding: '8px' } }
          ] },
          { blocks: [
            { id: 'b4c', type: 'image', src: '', alt: 'Product 2', style: { textAlign: 'center' } },
            { id: 'b4d', type: 'text', content: 'New Arrivals\nStarting at $39', style: { textAlign: 'center', fontSize: '14px', padding: '8px' } }
          ] }
        ] },
        { id: 'b5', type: 'button', text: 'Shop the Sale', url: 'https://example.com/sale', style: { textAlign: 'center', buttonColor: '#DC2626', color: '#ffffff', borderRadius: '6px', padding: '14px 40px' } },
        { id: 'b6', type: 'text', content: 'Offer valid through this weekend. Terms apply.', style: { fontSize: '11px', color: '#9CA3AF', textAlign: 'center', padding: '12px' } }
      ]
    },
    {
      name: 'Monthly Newsletter',
      description: 'Keep subscribers engaged with curated content and updates',
      category: 'newsletter',
      subject: 'Your monthly update from us, {{contacts.first_name}}',
      blocks: [
        { id: 'b1', type: 'image', src: '', alt: 'Newsletter header', style: { textAlign: 'center' } },
        { id: 'b2', type: 'text', content: 'MONTHLY NEWSLETTER', style: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', textAlign: 'center', color: '#6B7280', padding: '16px 0 4px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'text', content: 'What\'s New This Month', style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', padding: '0 24px 16px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b4', type: 'divider', thickness: 1 },
        { id: 'b5', type: 'text', content: 'Feature Story\n\nDiscover our latest collection designed with sustainability in mind. Each piece tells a story of craftsmanship and care for our planet.', style: { fontSize: '15px', lineHeight: '1.6', padding: '16px 24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b6', type: 'button', text: 'Read More', url: 'https://example.com/blog', style: { textAlign: 'left', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '4px', padding: '10px 24px' } },
        { id: 'b7', type: 'divider', thickness: 1 },
        { id: 'b8', type: 'structure', variant: '2-2', columns: [
          { blocks: [
            { id: 'b8a', type: 'image', src: '', alt: 'Article 1', style: { textAlign: 'center' } },
            { id: 'b8b', type: 'text', content: 'Trending Now\nSee what\'s popular this season', style: { fontSize: '14px', padding: '8px' } }
          ] },
          { blocks: [
            { id: 'b8c', type: 'image', src: '', alt: 'Article 2', style: { textAlign: 'center' } },
            { id: 'b8d', type: 'text', content: 'Tips & Tricks\nMake the most of your purchase', style: { fontSize: '14px', padding: '8px' } }
          ] }
        ] },
        { id: 'b9', type: 'social', links: { facebook: '#', twitter: '#', linkedin: '#' }, style: {} }
      ]
    },
    {
      name: 'Cart Abandonment',
      description: 'Recover lost sales by reminding customers about items in their cart',
      category: 'transactional',
      subject: '{{contacts.first_name}}, you left something behind!',
      blocks: [
        { id: 'b1', type: 'text', content: 'Forgot something?', style: { fontSize: '28px', fontWeight: 'bold', textAlign: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b2', type: 'text', content: 'Hi {{contacts.first_name}},\n\nWe noticed you left some items in your cart. They\'re still waiting for you!', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'image', src: '', alt: 'Cart items preview', style: { textAlign: 'center' } },
        { id: 'b4', type: 'button', text: 'Complete Your Order', url: 'https://example.com/cart', style: { textAlign: 'center', buttonColor: '#059669', color: '#ffffff', borderRadius: '6px', padding: '14px 36px' } },
        { id: 'b5', type: 'spacer', height: 20 },
        { id: 'b6', type: 'text', content: 'Need help? Our support team is ready to assist.', style: { fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '8px 24px' } }
      ]
    },
    {
      name: 'Event Invitation',
      description: 'Invite contacts to webinars, launches, or in-person events',
      category: 'event',
      subject: 'You\'re invited: Join us for an exclusive event',
      blocks: [
        { id: 'b1', type: 'image', src: '', alt: 'Event banner', style: { textAlign: 'center' } },
        { id: 'b2', type: 'text', content: 'YOU\'RE INVITED', style: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.15em', textAlign: 'center', color: '#7C3AED', padding: '16px 0 4px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'text', content: 'Product Launch Event 2026', style: { fontSize: '28px', fontWeight: 'bold', textAlign: 'center', padding: '0 24px 8px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b4', type: 'text', content: '📅 March 15, 2026 · 2:00 PM EST\n📍 Virtual Event — Link will be sent after RSVP', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.8', fontFamily: 'Arial, sans-serif' } },
        { id: 'b5', type: 'text', content: 'Be the first to see our newest innovations, hear from industry experts, and get exclusive early access.', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', color: '#4B5563', fontFamily: 'Arial, sans-serif' } },
        { id: 'b6', type: 'button', text: 'RSVP Now', url: 'https://example.com/rsvp', style: { textAlign: 'center', buttonColor: '#7C3AED', color: '#ffffff', borderRadius: '6px', padding: '14px 40px' } },
        { id: 'b7', type: 'text', content: 'Can\'t make it? We\'ll send you the recording after the event.', style: { fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '12px 24px' } }
      ]
    },
    {
      name: 'Feedback Request',
      description: 'Collect customer feedback and reviews after purchase or interaction',
      category: 'transactional',
      subject: '{{contacts.first_name}}, how did we do?',
      blocks: [
        { id: 'b1', type: 'text', content: 'We\'d love your feedback', style: { fontSize: '26px', fontWeight: 'bold', textAlign: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b2', type: 'text', content: 'Hi {{contacts.first_name}},\n\nThank you for your recent purchase! We\'d love to hear about your experience.', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'text', content: 'How would you rate your experience?\n\n⭐⭐⭐⭐⭐', style: { fontSize: '20px', textAlign: 'center', padding: '16px 24px' } },
        { id: 'b4', type: 'button', text: 'Leave a Review', url: 'https://example.com/review', style: { textAlign: 'center', buttonColor: '#F59E0B', color: '#ffffff', borderRadius: '6px', padding: '12px 32px' } },
        { id: 'b5', type: 'text', content: 'Your feedback helps us improve and serve you better. Thank you!', style: { fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '12px 24px' } }
      ]
    },
    {
      name: 'Re-engagement',
      description: 'Win back inactive contacts with a compelling offer',
      category: 'retention',
      subject: 'We miss you, {{contacts.first_name}}! Come back for 20% off',
      blocks: [
        { id: 'b1', type: 'text', content: 'We miss you!', style: { fontSize: '32px', fontWeight: 'bold', textAlign: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'b2', type: 'text', content: 'Hi {{contacts.first_name}},\n\nIt\'s been a while since your last visit. We\'ve been busy adding new products and improving your experience.', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'text', content: 'Here\'s 20% off your next order', style: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', color: '#059669', padding: '16px' } },
        { id: 'b4', type: 'text', content: 'Use code: COMEBACK20', style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', padding: '8px', backgroundColor: '#F3F4F6', borderRadius: '8px' } },
        { id: 'b5', type: 'button', text: 'Shop Now', url: 'https://example.com/shop', style: { textAlign: 'center', buttonColor: '#059669', color: '#ffffff', borderRadius: '6px', padding: '14px 36px' } },
        { id: 'b6', type: 'text', content: 'Offer valid for 7 days. One use per customer.', style: { fontSize: '11px', color: '#9CA3AF', textAlign: 'center', padding: '12px' } }
      ]
    },
    {
      name: 'Order Confirmation',
      description: 'Confirm order details and set expectations for delivery',
      category: 'transactional',
      subject: 'Order confirmed! Thanks, {{contacts.first_name}}',
      blocks: [
        { id: 'b1', type: 'text', content: '✅ Order Confirmed', style: { fontSize: '28px', fontWeight: 'bold', textAlign: 'center', padding: '24px', color: '#059669', fontFamily: 'Arial, sans-serif' } },
        { id: 'b2', type: 'text', content: 'Hi {{contacts.first_name}},\n\nThank you for your order! Here\'s a summary of what you purchased.', style: { fontSize: '15px', textAlign: 'center', padding: '8px 24px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' } },
        { id: 'b3', type: 'divider', thickness: 1 },
        { id: 'b4', type: 'text', content: 'Order #12345\nPlaced on: February 6, 2026\n\nItem 1 — $49.99\nItem 2 — $29.99\n\nSubtotal: $79.98\nShipping: Free\nTotal: $79.98', style: { fontSize: '14px', padding: '16px 24px', lineHeight: '1.8', fontFamily: 'monospace' } },
        { id: 'b5', type: 'divider', thickness: 1 },
        { id: 'b6', type: 'button', text: 'Track Your Order', url: 'https://example.com/track', style: { textAlign: 'center', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '6px', padding: '12px 32px' } },
        { id: 'b7', type: 'text', content: 'Questions about your order? Contact us anytime.', style: { fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '8px 24px' } }
      ]
    }
  ];

  samples.forEach(template => {
    query.insert('content_templates', {
      name: template.name,
      description: template.description,
      type: 'email',
      channel: 'email',
      category: template.category,
      subject: template.subject,
      blocks: template.blocks,
      html: blocksToHtml(template.blocks),
      status: 'published',
      sample: true,
      created_by: 'System',
      updated_by: 'System'
    });
  });

  console.log(`📝 Seeded ${samples.length} sample content templates`);
}

module.exports = router;
module.exports.seedSampleTemplates = seedSampleTemplates;