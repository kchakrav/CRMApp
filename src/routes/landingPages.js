const express = require('express');
const router = express.Router();
const { query } = require('../database');

function buildVersionSnapshot(page) {
  return {
    version: page.version || 1,
    name: page.name,
    slug: page.slug || '',
    status: page.status || 'draft',
    content_blocks: page.content_blocks || [],
    html_output: page.html_output || '',
    published_at: new Date().toISOString()
  };
}

// Get landing pages
router.get('/', (req, res) => {
  try {
    const pages = query.all('landing_pages');
    res.json({ pages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single landing page
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const page = query.get('landing_pages', id);
    if (!page) return res.status(404).json({ error: 'Landing page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create landing page
router.post('/', (req, res) => {
  try {
    const {
      name,
      slug = '',
      status = 'draft',
      version = 1,
      content_blocks = [],
      html_output = '',
      body_style = null,
      tags = [],
      folder = '',
      created_by = 'System'
    } = req.body;
    const folder_id = req.body.folder_id || null;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('landing_pages', {
      name,
      slug,
      status,
      version,
      content_blocks,
      html_output,
      body_style,
      tags,
      folder,
      folder_id,
      created_by: created_by || 'System',
      updated_by: created_by || 'System',
      versions: []
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update landing page
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('landing_pages', id);
    if (!existing) return res.status(404).json({ error: 'Landing page not found' });
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

    query.update('landing_pages', id, updates);
    res.json(query.get('landing_pages', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete landing page
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('landing_pages', id);
    if (!existing) return res.status(404).json({ error: 'Landing page not found' });
    query.delete('landing_pages', id);
    res.json({ message: 'Landing page deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function seedSampleLandingPages() {
  const existing = query.all('landing_pages');
  if (existing.length > 0) return;

  const samples = [
    { name: 'Summer Sale 2026', slug: 'summer-sale-2026', status: 'published', category: 'promotional',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Summer Sale — Up to 50% Off', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Shop the hottest deals of the season before they are gone.' },
        { id: 'b3', type: 'button', text: 'Shop Now', url: '/shop/summer' }
      ] },
    { name: 'Newsletter Signup', slug: 'newsletter-signup', status: 'published', category: 'lead-gen',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Stay in the Loop', style: { textAlign: 'center', fontSize: '32px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Get exclusive offers, new arrivals, and insider tips delivered to your inbox.' },
        { id: 'b3', type: 'form', fields: ['email', 'first_name'] }
      ] },
    { name: 'Product Launch — AeroFit Pro', slug: 'aerofit-pro-launch', status: 'published', category: 'product',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Introducing AeroFit Pro', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Engineered for performance. Designed for comfort. Available now.' },
        { id: 'b3', type: 'image', src: '', alt: 'AeroFit Pro product shot' },
        { id: 'b4', type: 'button', text: 'Learn More', url: '/products/aerofit-pro' }
      ] },
    { name: 'Black Friday Early Access', slug: 'black-friday-early', status: 'draft', category: 'promotional',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Black Friday Early Access', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold', color: '#ffffff', background: '#111' } },
        { id: 'b2', type: 'text', content: 'VIP members get 24-hour early access to our biggest deals.' },
        { id: 'b3', type: 'button', text: 'Unlock Deals', url: '/black-friday' }
      ] },
    { name: 'Customer Referral Program', slug: 'refer-a-friend', status: 'published', category: 'loyalty',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Give $20, Get $20', style: { textAlign: 'center', fontSize: '32px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Share your unique link with friends. When they make their first purchase, you both earn $20.' },
        { id: 'b3', type: 'button', text: 'Start Referring', url: '/referral' }
      ] },
    { name: 'Holiday Gift Guide', slug: 'holiday-gift-guide', status: 'draft', category: 'editorial',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Holiday Gift Guide 2026', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Curated picks for everyone on your list — from stocking stuffers to show-stoppers.' },
        { id: 'b3', type: 'image', src: '', alt: 'Gift guide header' }
      ] },
    { name: 'Loyalty Rewards Hub', slug: 'loyalty-rewards', status: 'published', category: 'loyalty',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Your Rewards Dashboard', style: { textAlign: 'center', fontSize: '32px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Check your points balance, redeem rewards, and discover new ways to earn.' },
        { id: 'b3', type: 'button', text: 'View My Rewards', url: '/loyalty' }
      ] },
    { name: 'Spring Collection Preview', slug: 'spring-preview', status: 'draft', category: 'product',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Spring 2026 Preview', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Fresh colors, new silhouettes, and limited-edition collaborations.' },
        { id: 'b3', type: 'button', text: 'Preview Collection', url: '/spring-2026' }
      ] },
    { name: 'Webinar Registration — Marketing Trends', slug: 'webinar-marketing-trends', status: 'published', category: 'lead-gen',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Free Webinar: 2026 Marketing Trends', style: { textAlign: 'center', fontSize: '32px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Join our panel of experts as they break down the trends shaping digital marketing this year.' },
        { id: 'b3', type: 'form', fields: ['email', 'first_name', 'company'] }
      ] },
    { name: 'Contest — Win a $500 Gift Card', slug: 'win-gift-card', status: 'published', category: 'engagement',
      content_blocks: [
        { id: 'b1', type: 'hero', content: 'Enter to Win a $500 Gift Card', style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold' } },
        { id: 'b2', type: 'text', content: 'Tell us your favorite product and you could win big. Contest ends March 31.' },
        { id: 'b3', type: 'form', fields: ['email', 'first_name', 'favorite_product'] }
      ] }
  ];

  samples.forEach(lp => {
    query.insert('landing_pages', {
      name: lp.name,
      slug: lp.slug,
      status: lp.status,
      version: lp.status === 'published' ? 1 : 0,
      content_blocks: lp.content_blocks,
      html_output: '',
      tags: [lp.category],
      folder: '',
      created_by: 'System',
      updated_by: 'System',
      versions: [],
      sample: true
    });
  });
  console.log(`🌐 Seeded ${samples.length} sample landing pages`);
}

module.exports = router;
module.exports.seedSampleLandingPages = seedSampleLandingPages;
