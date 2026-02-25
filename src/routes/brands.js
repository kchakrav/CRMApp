const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let brands = query.all('brands');
    if (search) {
      const s = String(search).toLowerCase();
      brands = brands.filter(b =>
        (b.name || '').toLowerCase().includes(s) ||
        (b.domain || '').toLowerCase().includes(s)
      );
    }
    res.json({ brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const brand = query.get('brands', parseInt(req.params.id));
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required' });
    const data = { ...req.body };
    delete data.id;
    data.status = data.status || 'active';
    data.email = data.email || {};
    data.landing_pages = data.landing_pages || {};
    data.social = data.social || {};
    data.legal = data.legal || {};
    data.colors = data.colors || {};
    const result = query.insert('brands', data);
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = query.get('brands', id);
    if (!existing) return res.status(404).json({ error: 'Brand not found' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;
    query.update('brands', id, updates);
    res.json(query.get('brands', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!query.get('brands', id)) return res.status(404).json({ error: 'Brand not found' });
    query.delete('brands', id);
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function seedSampleBrands() {
  const existing = query.all('brands');
  if (existing.length > 0) return;

  const samples = [
    {
      name: 'Acme Global',
      description: 'Primary brand for all consumer-facing communications',
      logo_url: '/uploads/logo-dark.png',
      website_url: 'https://www.acme.com',
      status: 'active',
      is_default: true,
      email: {
        from_email: 'hello@acme.com',
        from_name: 'Acme',
        reply_to_email: 'support@acme.com',
        reply_to_name: 'Acme Support',
        bcc_email: 'archive@acme.com',
        email_header: '<div style="text-align:center;padding:20px"><img src="/uploads/logo-dark.png" alt="Acme" height="40"></div>',
        email_footer: '<div style="text-align:center;padding:20px;color:#888;font-size:12px"><p>Acme Inc. | 100 Market Street, San Francisco, CA 94105</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://acme.com/privacy">Privacy Policy</a></p></div>'
      },
      landing_pages: {
        default_url: 'https://www.acme.com',
        mirror_page_url: 'https://mirror.acme.com',
        unsubscription_url: 'https://www.acme.com/unsubscribe',
        favicon_url: 'https://www.acme.com/favicon.ico'
      },
      social: {
        facebook: 'https://facebook.com/acme',
        instagram: 'https://instagram.com/acme',
        twitter: 'https://x.com/acme',
        linkedin: 'https://linkedin.com/company/acme',
        youtube: 'https://youtube.com/@acme',
        tiktok: ''
      },
      legal: {
        company_name: 'Acme Inc.',
        address_line1: '100 Market Street',
        address_line2: 'Suite 400',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        phone: '+1 (415) 555-0100',
        privacy_policy_url: 'https://acme.com/privacy',
        terms_url: 'https://acme.com/terms',
        copyright_text: '© 2026 Acme Inc. All rights reserved.'
      },
      colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', text: '#1f2937', background: '#ffffff' },
      typography: { heading_font: 'Inter, sans-serif', body_font: 'Inter, sans-serif' }
    },
    {
      name: 'Luxe by Acme',
      description: 'Premium luxury sub-brand for VIP and high-value segments',
      logo_url: '',
      website_url: 'https://luxe.acme.com',
      status: 'active',
      is_default: false,
      email: {
        from_email: 'concierge@luxe.acme.com',
        from_name: 'Luxe by Acme',
        reply_to_email: 'vip@luxe.acme.com',
        reply_to_name: 'Luxe Concierge',
        bcc_email: '',
        email_header: '<div style="text-align:center;padding:24px;background:#1a1a2e;color:#d4af37"><h2 style="margin:0;font-family:Georgia,serif;letter-spacing:3px">LUXE</h2></div>',
        email_footer: '<div style="text-align:center;padding:24px;background:#1a1a2e;color:#aaa;font-size:11px"><p>Luxe by Acme | Exclusive Member Communications</p><p><a href="{{unsubscribe_url}}" style="color:#d4af37">Manage Preferences</a></p></div>'
      },
      landing_pages: {
        default_url: 'https://luxe.acme.com',
        mirror_page_url: 'https://mirror.luxe.acme.com',
        unsubscription_url: 'https://luxe.acme.com/preferences',
        favicon_url: ''
      },
      social: {
        facebook: '',
        instagram: 'https://instagram.com/luxebyacme',
        twitter: '',
        linkedin: '',
        youtube: '',
        tiktok: ''
      },
      legal: {
        company_name: 'Acme Inc. — Luxe Division',
        address_line1: '100 Market Street',
        address_line2: 'Penthouse Suite',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        phone: '+1 (415) 555-0200',
        privacy_policy_url: 'https://luxe.acme.com/privacy',
        terms_url: 'https://luxe.acme.com/terms',
        copyright_text: '© 2026 Luxe by Acme. All rights reserved.'
      },
      colors: { primary: '#7c3aed', secondary: '#1a1a2e', accent: '#d4af37', text: '#f8f8f2', background: '#0d0d1a' },
      typography: { heading_font: 'Georgia, serif', body_font: 'Garamond, serif' }
    },
    {
      name: 'Acme Outlet',
      description: 'Value-driven brand for promotional and clearance campaigns',
      logo_url: '',
      website_url: 'https://outlet.acme.com',
      status: 'active',
      is_default: false,
      email: {
        from_email: 'deals@outlet.acme.com',
        from_name: 'Acme Outlet',
        reply_to_email: 'deals@outlet.acme.com',
        reply_to_name: 'Acme Outlet Deals',
        bcc_email: '',
        email_header: '',
        email_footer: '<div style="text-align:center;padding:16px;font-size:11px;color:#888"><p>Acme Outlet | Deals that deliver</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p></div>'
      },
      landing_pages: {
        default_url: 'https://outlet.acme.com',
        mirror_page_url: '',
        unsubscription_url: 'https://outlet.acme.com/unsubscribe',
        favicon_url: ''
      },
      social: {
        facebook: 'https://facebook.com/acmeoutlet',
        instagram: 'https://instagram.com/acmeoutlet',
        twitter: '',
        linkedin: '',
        youtube: '',
        tiktok: 'https://tiktok.com/@acmeoutlet'
      },
      legal: {
        company_name: 'Acme Inc.',
        address_line1: '100 Market Street',
        address_line2: '',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        phone: '+1 (415) 555-0300',
        privacy_policy_url: 'https://acme.com/privacy',
        terms_url: 'https://acme.com/terms',
        copyright_text: '© 2026 Acme Inc.'
      },
      colors: { primary: '#dc2626', secondary: '#991b1b', accent: '#fbbf24', text: '#111827', background: '#ffffff' },
      typography: { heading_font: 'Inter, sans-serif', body_font: 'Inter, sans-serif' }
    },
    {
      name: 'Acme Sport',
      description: 'Athletic and active lifestyle brand',
      logo_url: '',
      website_url: 'https://sport.acme.com',
      status: 'active',
      is_default: false,
      email: {
        from_email: 'team@sport.acme.com',
        from_name: 'Acme Sport',
        reply_to_email: 'team@sport.acme.com',
        reply_to_name: 'Acme Sport Team',
        bcc_email: '',
        email_header: '',
        email_footer: ''
      },
      landing_pages: {
        default_url: 'https://sport.acme.com',
        mirror_page_url: '',
        unsubscription_url: 'https://sport.acme.com/unsubscribe',
        favicon_url: ''
      },
      social: {
        facebook: 'https://facebook.com/acmesport',
        instagram: 'https://instagram.com/acmesport',
        twitter: 'https://x.com/acmesport',
        linkedin: '',
        youtube: 'https://youtube.com/@acmesport',
        tiktok: 'https://tiktok.com/@acmesport'
      },
      legal: {
        company_name: 'Acme Inc. — Sport Division',
        address_line1: '200 Olympic Blvd',
        address_line2: '',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90064',
        country: 'United States',
        phone: '+1 (310) 555-0400',
        privacy_policy_url: 'https://sport.acme.com/privacy',
        terms_url: 'https://sport.acme.com/terms',
        copyright_text: '© 2026 Acme Sport.'
      },
      colors: { primary: '#059669', secondary: '#065f46', accent: '#10b981', text: '#ffffff', background: '#064e3b' },
      typography: { heading_font: 'Montserrat, sans-serif', body_font: 'Open Sans, sans-serif' }
    },
    {
      name: 'Acme Kids & Family',
      description: 'Family-oriented brand for children and parents',
      logo_url: '',
      website_url: 'https://kids.acme.com',
      status: 'draft',
      is_default: false,
      email: {
        from_email: 'fun@kids.acme.com',
        from_name: 'Acme Kids',
        reply_to_email: 'family@kids.acme.com',
        reply_to_name: 'Acme Family Team',
        bcc_email: '',
        email_header: '',
        email_footer: ''
      },
      landing_pages: {
        default_url: 'https://kids.acme.com',
        mirror_page_url: '',
        unsubscription_url: 'https://kids.acme.com/unsubscribe',
        favicon_url: ''
      },
      social: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '', tiktok: '' },
      legal: {
        company_name: 'Acme Inc.',
        address_line1: '100 Market Street',
        address_line2: '',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        phone: '',
        privacy_policy_url: 'https://acme.com/privacy',
        terms_url: 'https://acme.com/terms',
        copyright_text: '© 2026 Acme Inc.'
      },
      colors: { primary: '#f97316', secondary: '#c2410c', accent: '#a3e635', text: '#1f2937', background: '#fffbeb' },
      typography: { heading_font: 'Nunito, sans-serif', body_font: 'Nunito, sans-serif' }
    },
    {
      name: 'Acme Business',
      description: 'B2B corporate communications and enterprise solutions',
      logo_url: '',
      website_url: 'https://business.acme.com',
      status: 'active',
      is_default: false,
      email: {
        from_email: 'solutions@business.acme.com',
        from_name: 'Acme Business Solutions',
        reply_to_email: 'enterprise@business.acme.com',
        reply_to_name: 'Enterprise Team',
        bcc_email: 'crm-archive@business.acme.com',
        email_header: '',
        email_footer: '<div style="text-align:center;padding:20px;font-size:11px;color:#64748b"><p>Acme Business Solutions | Enterprise-grade marketing</p><p><a href="{{unsubscribe_url}}">Manage Subscriptions</a> | <a href="https://business.acme.com/privacy">Privacy</a></p></div>'
      },
      landing_pages: {
        default_url: 'https://business.acme.com',
        mirror_page_url: '',
        unsubscription_url: 'https://business.acme.com/preferences',
        favicon_url: ''
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: 'https://x.com/acmebusiness',
        linkedin: 'https://linkedin.com/company/acme-business',
        youtube: '',
        tiktok: ''
      },
      legal: {
        company_name: 'Acme Business Solutions, LLC',
        address_line1: '500 Enterprise Way',
        address_line2: 'Floor 12',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        phone: '+1 (212) 555-0600',
        privacy_policy_url: 'https://business.acme.com/privacy',
        terms_url: 'https://business.acme.com/terms',
        copyright_text: '© 2026 Acme Business Solutions, LLC.'
      },
      colors: { primary: '#0f172a', secondary: '#334155', accent: '#3b82f6', text: '#f8fafc', background: '#0f172a' },
      typography: { heading_font: 'Inter, sans-serif', body_font: 'Inter, sans-serif' }
    }
  ];

  samples.forEach(b => {
    query.insert('brands', { ...b, sample: true });
  });
  console.log(`🏷️  Seeded ${samples.length} sample brands`);
}

module.exports = router;
module.exports.seedSampleBrands = seedSampleBrands;
