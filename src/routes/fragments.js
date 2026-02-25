const express = require('express');
const router = express.Router();
const { query } = require('../database');

// ── Lightweight block→HTML renderer (mirrors email_templates.js) ─────
const _PH_IMG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200"><rect fill="#f3f4f6" width="640" height="200"/><g fill="#9ca3af"><rect x="280" y="60" width="80" height="60" rx="6"/><polygon points="290,110 310,85 330,110"/><polygon points="315,110 340,75 370,110"/><circle cx="340" cy="72" r="8"/></g><text x="320" y="145" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">Image placeholder</text></svg>`)}`;

function _bHtml(b) {
  if (!b) return '';
  const s = b.style || {};
  if (b.type === 'text') {
    const css = `font-family:${s.fontFamily||'Arial,sans-serif'};font-size:${s.fontSize||'14px'};line-height:${s.lineHeight||'1.5'};font-weight:${s.fontWeight||'normal'};text-align:${s.textAlign||'left'};color:${s.color||'#1f2933'};padding:${s.padding||'0'};${s.backgroundColor?'background:'+s.backgroundColor+';':''}`;
    return `<p style="${css}">${(b.content||'').replace(/\n/g,'<br>')}</p>`;
  }
  if (b.type === 'image') {
    return `<div style="text-align:${s.textAlign||'center'};"><img src="${b.src||_PH_IMG}" alt="${b.alt||'Image'}" style="max-width:100%;display:inline-block;"></div>`;
  }
  if (b.type === 'button') {
    return `<div style="text-align:${s.textAlign||'center'};"><a href="${b.url||'#'}" style="display:inline-block;padding:${s.padding||'10px 16px'};background:${s.buttonColor||'#1473E6'};color:${s.color||'#fff'};border-radius:${s.borderRadius||'4px'};text-decoration:none;font-family:Arial,sans-serif;">${b.text||'Button'}</a></div>`;
  }
  if (b.type === 'divider') return `<hr style="border:none;border-top:${s.thickness||b.thickness||1}px solid ${s.borderColor||'#E1E1E1'};margin:8px 0;">`;
  if (b.type === 'spacer') return `<div style="height:${s.height||b.height||20}px;"></div>`;
  if (b.type === 'social') return `<div style="text-align:center;padding:8px;">Social links</div>`;
  if (b.type === 'structure') {
    const cols = b.columns || [];
    const pct = cols.length ? Math.floor(100/cols.length) : 100;
    const inner = cols.map(c => `<td style="width:${pct}%;vertical-align:top;padding:4px;">${(c.blocks||[]).map(_bHtml).join('')}</td>`).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${inner}</tr></table>`;
  }
  return '';
}
function _blocksHtml(blocks) { return (blocks||[]).map(_bHtml).join(''); }

// Get fragments (optional type filter)
router.get('/', (req, res) => {
  try {
    const type = req.query.type;
    let fragments = query.all('fragments');
    if (type) {
      fragments = fragments.filter(f => f.type === type);
    }
    res.json({ fragments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single fragment
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const fragment = query.get('fragments', id);
    if (!fragment) return res.status(404).json({ error: 'Fragment not found' });
    res.json(fragment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildVersionSnapshot(fragment) {
  return {
    version: fragment.version || 1,
    name: fragment.name,
    type: fragment.type || 'email',
    status: fragment.status || 'draft',
    blocks: fragment.blocks || [],
    html: fragment.html || '',
    published_at: new Date().toISOString()
  };
}

// Create fragment
router.post('/', (req, res) => {
  try {
    const {
      name,
      type = 'email',
      blocks = [],
      html = '',
      status = 'draft',
      version = 1,
      tags = [],
      folder = '',
      created_by = 'System',
      theme_compatible = false
    } = req.body;
    const folder_id = req.body.folder_id || null;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('fragments', {
      name,
      type,
      status,
      version,
      blocks,
      html,
      tags,
      folder,
      folder_id,
      theme_compatible: !!theme_compatible,
      created_by: created_by || 'System',
      updated_by: created_by || 'System',
      versions: []
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fragment
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('fragments', id);
    if (!existing) return res.status(404).json({ error: 'Fragment not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;
    updates.updated_by = updates.updated_by || 'System';
    const isPublishing = updates.status === 'published' && existing.status !== 'published';
    if (isPublishing) {
      const nextVersion = (existing.version || 1) + 1;
      updates.version = nextVersion;
      const versions = Array.isArray(existing.versions) ? existing.versions.slice() : [];
      versions.push(buildVersionSnapshot({
        ...existing,
        ...updates,
        version: nextVersion
      }));
      updates.versions = versions;
    }
    query.update('fragments', id, updates);
    res.json(query.get('fragments', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fragment
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('fragments', id);
    if (!existing) return res.status(404).json({ error: 'Fragment not found' });
    query.delete('fragments', id);
    res.json({ message: 'Fragment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Seed sample fragments ────────────────────────────────────────────
function seedSampleFragments() {
  const existing = query.all('fragments');
  if (existing.length > 0) return;

  const samples = [
    // ── Headers ──────────────────────────────────────────────
    {
      name: 'Brand Header',
      type: 'email',
      tags: ['header', 'brand'],
      folder: 'Headers',
      blocks: [
        { id: 'fh1', type: 'structure', variant: '2-2', columns: [
          { blocks: [{ id: 'fh1a', type: 'image', src: '', alt: 'Logo', style: { textAlign: 'left' } }] },
          { blocks: [{ id: 'fh1b', type: 'text', content: '<a href="#">Home</a> · <a href="#">Shop</a> · <a href="#">Support</a>', style: { textAlign: 'right', fontSize: '13px', padding: '12px 0', color: '#6B7280', fontFamily: 'Arial, sans-serif' } }] }
        ] },
        { id: 'fh2', type: 'divider', thickness: 1 }
      ]
    },
    {
      name: 'Centered Logo Header',
      type: 'email',
      tags: ['header', 'logo', 'centered'],
      folder: 'Headers',
      blocks: [
        { id: 'clh1', type: 'image', src: '', alt: 'Company Logo', style: { textAlign: 'center' } },
        { id: 'clh2', type: 'divider', thickness: 2, style: { borderColor: '#1473E6' } }
      ]
    },

    // ── Footers ──────────────────────────────────────────────
    {
      name: 'Standard Footer',
      type: 'email',
      tags: ['footer', 'legal'],
      folder: 'Footers',
      blocks: [
        { id: 'ff1', type: 'divider', thickness: 1 },
        { id: 'ff2', type: 'social', links: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' }, style: {} },
        { id: 'ff3', type: 'text', content: '© 2026 Your Company. All rights reserved.\n123 Main Street, Suite 100, City, State 12345\n\n<a href="#">Unsubscribe</a> · <a href="#">Preferences</a> · <a href="#">Privacy Policy</a>', style: { textAlign: 'center', fontSize: '11px', color: '#9CA3AF', lineHeight: '1.6', padding: '8px 24px', fontFamily: 'Arial, sans-serif' } }
      ]
    },
    {
      name: 'Minimal Footer',
      type: 'email',
      tags: ['footer', 'minimal'],
      folder: 'Footers',
      blocks: [
        { id: 'mf1', type: 'divider', thickness: 1, style: { borderColor: '#E5E7EB' } },
        { id: 'mf2', type: 'text', content: 'You received this email because you signed up at example.com.\n<a href="#">Unsubscribe</a> from these emails.', style: { textAlign: 'center', fontSize: '11px', color: '#9CA3AF', lineHeight: '1.5', padding: '12px 24px', fontFamily: 'Arial, sans-serif' } }
      ]
    },

    // ── Call-to-Action Blocks ────────────────────────────────
    {
      name: 'CTA Banner',
      type: 'email',
      tags: ['cta', 'banner', 'promotional'],
      folder: 'Call to Action',
      blocks: [
        { id: 'cta1', type: 'text', content: 'Ready to get started?', style: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', padding: '16px 24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'cta2', type: 'text', content: 'Join thousands of happy customers and transform your experience today.', style: { fontSize: '15px', textAlign: 'center', color: '#4B5563', padding: '0 24px 12px', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' } },
        { id: 'cta3', type: 'button', text: 'Get Started Free', url: 'https://example.com/signup', style: { textAlign: 'center', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '6px', padding: '14px 40px' } }
      ]
    },
    {
      name: 'Dual CTA',
      type: 'email',
      tags: ['cta', 'buttons'],
      folder: 'Call to Action',
      blocks: [
        { id: 'dc1', type: 'text', content: 'Choose your plan', style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', padding: '16px', fontFamily: 'Arial, sans-serif' } },
        { id: 'dc2', type: 'structure', variant: '2-2', columns: [
          { blocks: [
            { id: 'dc2a', type: 'text', content: 'Free Plan\nPerfect for getting started', style: { textAlign: 'center', fontSize: '14px', padding: '8px', fontFamily: 'Arial, sans-serif' } },
            { id: 'dc2b', type: 'button', text: 'Start Free', url: '#', style: { textAlign: 'center', buttonColor: '#6B7280', color: '#ffffff', borderRadius: '6px', padding: '10px 24px' } }
          ] },
          { blocks: [
            { id: 'dc2c', type: 'text', content: 'Pro Plan\nFor power users', style: { textAlign: 'center', fontSize: '14px', padding: '8px', fontFamily: 'Arial, sans-serif' } },
            { id: 'dc2d', type: 'button', text: 'Go Pro', url: '#', style: { textAlign: 'center', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '6px', padding: '10px 24px' } }
          ] }
        ] }
      ]
    },

    // ── Content Sections ─────────────────────────────────────
    {
      name: 'Feature Highlight — 3 Column',
      type: 'email',
      tags: ['features', 'columns', 'content'],
      folder: 'Content',
      blocks: [
        { id: 'fh3c1', type: 'text', content: 'Why choose us?', style: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', padding: '16px 24px', fontFamily: 'Arial, sans-serif' } },
        { id: 'fh3c2', type: 'structure', variant: '3-3', columns: [
          { blocks: [
            { id: 'fh3c2a', type: 'image', src: '', alt: 'Feature 1', style: { textAlign: 'center' } },
            { id: 'fh3c2b', type: 'text', content: 'Fast & Reliable\nLightning-fast performance you can count on.', style: { textAlign: 'center', fontSize: '13px', lineHeight: '1.5', padding: '8px', fontFamily: 'Arial, sans-serif' } }
          ] },
          { blocks: [
            { id: 'fh3c2c', type: 'image', src: '', alt: 'Feature 2', style: { textAlign: 'center' } },
            { id: 'fh3c2d', type: 'text', content: 'Secure\nEnterprise-grade security for your data.', style: { textAlign: 'center', fontSize: '13px', lineHeight: '1.5', padding: '8px', fontFamily: 'Arial, sans-serif' } }
          ] },
          { blocks: [
            { id: 'fh3c2e', type: 'image', src: '', alt: 'Feature 3', style: { textAlign: 'center' } },
            { id: 'fh3c2f', type: 'text', content: 'Easy to Use\nIntuitive design that anyone can use.', style: { textAlign: 'center', fontSize: '13px', lineHeight: '1.5', padding: '8px', fontFamily: 'Arial, sans-serif' } }
          ] }
        ] }
      ]
    },
    {
      name: 'Image + Text Row',
      type: 'email',
      tags: ['content', 'image-text', 'row'],
      folder: 'Content',
      blocks: [
        { id: 'itr1', type: 'structure', variant: '2-2', columns: [
          { blocks: [{ id: 'itr1a', type: 'image', src: '', alt: 'Featured image', style: { textAlign: 'center' } }] },
          { blocks: [
            { id: 'itr1b', type: 'text', content: 'Featured Article', style: { fontSize: '18px', fontWeight: 'bold', padding: '8px 0 4px', fontFamily: 'Arial, sans-serif' } },
            { id: 'itr1c', type: 'text', content: 'Discover the latest insights and best practices. Our team shares expert knowledge to help you stay ahead of the curve.', style: { fontSize: '14px', color: '#4B5563', lineHeight: '1.6', padding: '4px 0 12px', fontFamily: 'Arial, sans-serif' } },
            { id: 'itr1d', type: 'button', text: 'Read more', url: '#', style: { textAlign: 'left', buttonColor: '#1473E6', color: '#ffffff', borderRadius: '4px', padding: '8px 20px' } }
          ] }
        ] }
      ]
    },

    // ── Product / Commerce ───────────────────────────────────
    {
      name: 'Product Card — 2 Column',
      type: 'email',
      tags: ['product', 'commerce', 'grid'],
      folder: 'Commerce',
      blocks: [
        { id: 'pc1', type: 'structure', variant: '2-2', columns: [
          { blocks: [
            { id: 'pc1a', type: 'image', src: '', alt: 'Product 1', style: { textAlign: 'center' } },
            { id: 'pc1b', type: 'text', content: 'Product Name\n$49.99', style: { textAlign: 'center', fontSize: '14px', fontWeight: 'bold', padding: '8px', fontFamily: 'Arial, sans-serif' } },
            { id: 'pc1c', type: 'button', text: 'Shop Now', url: '#', style: { textAlign: 'center', buttonColor: '#059669', color: '#ffffff', borderRadius: '4px', padding: '8px 20px' } }
          ] },
          { blocks: [
            { id: 'pc1d', type: 'image', src: '', alt: 'Product 2', style: { textAlign: 'center' } },
            { id: 'pc1e', type: 'text', content: 'Product Name\n$59.99', style: { textAlign: 'center', fontSize: '14px', fontWeight: 'bold', padding: '8px', fontFamily: 'Arial, sans-serif' } },
            { id: 'pc1f', type: 'button', text: 'Shop Now', url: '#', style: { textAlign: 'center', buttonColor: '#059669', color: '#ffffff', borderRadius: '4px', padding: '8px 20px' } }
          ] }
        ] }
      ]
    },
    {
      name: 'Coupon / Promo Code',
      type: 'email',
      tags: ['coupon', 'promo', 'commerce'],
      folder: 'Commerce',
      blocks: [
        { id: 'cp1', type: 'text', content: 'EXCLUSIVE OFFER', style: { fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.15em', textAlign: 'center', color: '#7C3AED', padding: '12px 0 4px', fontFamily: 'Arial, sans-serif' } },
        { id: 'cp2', type: 'text', content: 'Save 25% on your next order', style: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', padding: '0 24px 8px', fontFamily: 'Arial, sans-serif' } },
        { id: 'cp3', type: 'text', content: 'SAVE25', style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', padding: '12px 32px', backgroundColor: '#F3F4F6', borderRadius: '8px', letterSpacing: '0.1em', fontFamily: 'monospace' } },
        { id: 'cp4', type: 'text', content: 'Valid through February 28, 2026. One use per customer.', style: { fontSize: '11px', color: '#9CA3AF', textAlign: 'center', padding: '8px', fontFamily: 'Arial, sans-serif' } },
        { id: 'cp5', type: 'button', text: 'Redeem Now', url: '#', style: { textAlign: 'center', buttonColor: '#7C3AED', color: '#ffffff', borderRadius: '6px', padding: '12px 32px' } }
      ]
    },

    // ── Testimonial ──────────────────────────────────────────
    {
      name: 'Testimonial Quote',
      type: 'email',
      tags: ['testimonial', 'quote', 'social-proof'],
      folder: 'Social Proof',
      blocks: [
        { id: 'tq1', type: 'text', content: '"This product completely changed the way we work. The team is more productive and happier than ever."', style: { fontSize: '16px', fontStyle: 'italic', textAlign: 'center', color: '#374151', lineHeight: '1.6', padding: '16px 32px', fontFamily: 'Georgia, serif' } },
        { id: 'tq2', type: 'text', content: '— Sarah Johnson, VP of Marketing at TechCorp', style: { fontSize: '13px', fontWeight: 'bold', textAlign: 'center', color: '#6B7280', padding: '0 24px 16px', fontFamily: 'Arial, sans-serif' } }
      ]
    },

    // ── Personalization ──────────────────────────────────────
    {
      name: 'Personalized Greeting',
      type: 'email',
      tags: ['personalization', 'greeting'],
      folder: 'Personalization',
      blocks: [
        { id: 'pg1', type: 'text', content: 'Hi {{contacts.first_name}},', style: { fontSize: '18px', fontWeight: 'bold', padding: '16px 24px 4px', fontFamily: 'Arial, sans-serif' } },
        { id: 'pg2', type: 'text', content: 'We hope you\'re having a great day! Here\'s what we have for you:', style: { fontSize: '15px', color: '#4B5563', lineHeight: '1.6', padding: '0 24px 12px', fontFamily: 'Arial, sans-serif' } }
      ]
    }
  ];

  samples.forEach(f => {
    const html = _blocksHtml(f.blocks);
    query.insert('fragments', {
      name: f.name,
      type: f.type,
      status: 'published',
      version: 1,
      blocks: f.blocks,
      html,
      tags: f.tags || [],
      folder: f.folder || '',
      created_by: 'System',
      updated_by: 'System',
      versions: [{
        version: 1,
        name: f.name,
        type: f.type,
        status: 'published',
        blocks: f.blocks,
        html,
        published_at: new Date().toISOString()
      }]
    });
  });

  console.log(`🧩 Seeded ${samples.length} sample fragments`);
}

module.exports = router;
module.exports.seedSampleFragments = seedSampleFragments;