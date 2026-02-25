const express = require('express');
const router = express.Router();
const { query } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({ storage });

// Minimal 1x1 PNG for local placeholders
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Ensure placeholder image files exist for assets that use /uploads/ and have no file yet
function ensurePlaceholderFiles() {
  const assets = query.all('assets') || [];
  const localImages = assets.filter(a => a.type === 'image' && (a.url || '').toString().startsWith('/uploads/'));
  if (localImages.length === 0) return;
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  localImages.forEach(a => {
    const name = a.filename || a.name || path.basename((a.url || '').split('?')[0]);
    if (!name) return;
    const filePath = path.join(uploadsDir, name);
    if (fs.existsSync(filePath)) return;
    try {
      const buf = name.toLowerCase().endsWith('.svg') ? MINIMAL_SVG : MINIMAL_PNG;
      fs.writeFileSync(filePath, buf);
    } catch (err) {
      console.warn('[assets] Could not write placeholder:', name, err.message);
    }
  });
}

// List assets
router.get('/', (req, res) => {
  try {
    ensurePlaceholderFiles();
    const { type, search } = req.query;
    let assets = query.all('assets');
    if (type) assets = assets.filter(a => a.type === type);
    if (search) {
      const s = String(search).toLowerCase();
      assets = assets.filter(a => (a.name || '').toLowerCase().includes(s));
    }
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload asset
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const { tags = '', folder_id = null } = req.body;
    const assetType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    const result = query.insert('assets', {
      name: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mime_type: req.file.mimetype,
      type: assetType,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      folder_id: folder_id ? parseInt(folder_id, 10) : null
    });
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete asset
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const asset = query.get('assets', id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const url = (asset.url || '').toString();
    if (url.startsWith('/uploads/') && asset.filename) {
      const filePath = path.join(uploadsDir, asset.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    query.delete('assets', id);
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsplash image URLs for real retail/product photos (thumbnails ~400x300)
const U = (id, w = 400, h = 300) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// Real retail/product photos for sample assets
const SAMPLE_IMAGE_URLS = {
  'hero-banner-summer.jpg': U('1523380676191-269aec4be0f6'), // summer retail
  'logo-dark.png': U('1560343090-973472a481a2'), // fashion
  'logo-light.png': U('1560343090-973472a481a2'),
  'product-lineup.jpg': U('1441986300917-64674bd600d8'), // store/products
  'holiday-promo-banner.jpg': U('1483985988705-9d350bfef407'), // shopping
  'customer-testimonial-bg.jpg': U('1556742049-0cfed4f6a45d'), // lifestyle
  'email-footer-social.png': U('1611162616475-46bce2dd1591'), // social
  'onboarding-welcome.gif': U('1556742049-0cfed4f6a45d'),
  'flash-sale-badge.png': U('1607082348824-4e8e4a8c'), // sale
  'newsletter-header.jpg': U('1556742049-0cfed4f6a45d'),
  'mobile-app-screenshot.png': U('1512941937669-90a1b58e7e9c'), // mobile/tech
  'sneakers-product.jpg': U('1542291026-7eec264c27ff'), // sneakers
  'tshirt-product.jpg': U('1521572163474-6864f9cf17ab'), // t-shirt
  'coffee-product.jpg': U('1509042239860-f550ce710b93'), // coffee
  'watch-product.jpg': U('1523279708476-eee4a2f95c'), // watch
  'headphones-product.jpg': U('1505740420928-5e560c06d30e'), // headphones
  'bag-product.jpg': U('1591561954557-26941169b3e1'), // bag
};

const MINIMAL_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
  'utf8'
);

function seedSampleAssets() {
  const existing = query.all('assets');
  const existingByName = new Map((existing || []).map(a => [a.name, a]));

  const samples = [
    { name: 'hero-banner-summer.jpg', type: 'image', mime_type: 'image/jpeg', size: 245000, tags: 'banner,summer,hero' },
    { name: 'logo-dark.png', type: 'image', mime_type: 'image/png', size: 18500, tags: 'logo,brand' },
    { name: 'logo-light.png', type: 'image', mime_type: 'image/png', size: 17200, tags: 'logo,brand' },
    { name: 'sneakers-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 156000, tags: 'shoes,sneakers,retail' },
    { name: 'tshirt-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 142000, tags: 'apparel,tshirt,retail' },
    { name: 'coffee-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 138000, tags: 'coffee,retail,beverage' },
    { name: 'product-lineup.jpg', type: 'image', mime_type: 'image/jpeg', size: 320000, tags: 'product,catalog' },
    { name: 'holiday-promo-banner.jpg', type: 'image', mime_type: 'image/jpeg', size: 198000, tags: 'banner,holiday,promo' },
    { name: 'customer-testimonial-bg.jpg', type: 'image', mime_type: 'image/jpeg', size: 275000, tags: 'background,testimonial' },
    { name: 'email-footer-social.png', type: 'image', mime_type: 'image/png', size: 12400, tags: 'footer,social,email' },
    { name: 'brand-guidelines-2026.pdf', type: 'file', mime_type: 'application/pdf', size: 4500000, tags: 'brand,guidelines,document', url: '/uploads/brand-guidelines-2026.pdf' },
    { name: 'product-catalog-spring.pdf', type: 'file', mime_type: 'application/pdf', size: 8200000, tags: 'catalog,product,spring', url: '/uploads/product-catalog-spring.pdf' },
    { name: 'onboarding-welcome.gif', type: 'image', mime_type: 'image/gif', size: 156000, tags: 'onboarding,welcome,animated' },
    { name: 'flash-sale-badge.png', type: 'image', mime_type: 'image/png', size: 8900, tags: 'badge,sale,overlay' },
    { name: 'watch-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 125000, tags: 'watch,retail,accessories' },
    { name: 'headphones-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 132000, tags: 'headphones,electronics,retail' },
    { name: 'bag-product.jpg', type: 'image', mime_type: 'image/jpeg', size: 148000, tags: 'bag,accessories,retail' },
    { name: 'loyalty-rewards-icon.svg', type: 'image', mime_type: 'image/svg+xml', size: 3200, tags: 'icon,loyalty,rewards', url: '/uploads/loyalty-rewards-icon.svg' },
    { name: 'newsletter-header.jpg', type: 'image', mime_type: 'image/jpeg', size: 142000, tags: 'newsletter,header,email' },
    { name: 'terms-and-conditions.pdf', type: 'file', mime_type: 'application/pdf', size: 1200000, tags: 'legal,terms,document', url: '/uploads/terms-and-conditions.pdf' },
    { name: 'mobile-app-screenshot.png', type: 'image', mime_type: 'image/png', size: 385000, tags: 'mobile,app,screenshot' }
  ];

  let inserted = 0;
  let updated = 0;
  samples.forEach(a => {
    const url = a.url || (SAMPLE_IMAGE_URLS[a.name] || null);
    if (!url && a.type === 'image') return;
    const finalUrl = url || '/uploads/' + a.name;
    const existingAsset = existingByName.get(a.name);
    if (existingAsset) {
      query.update('assets', existingAsset.id, {
        url: finalUrl,
        size: a.size,
        mime_type: a.mime_type,
        type: a.type,
        tags: a.tags,
        sample: true
      });
      updated++;
      return;
    }
    query.insert('assets', {
      name: a.name,
      filename: a.filename || a.name,
      url: finalUrl,
      size: a.size,
      mime_type: a.mime_type,
      type: a.type,
      tags: a.tags,
      sample: true
    });
    inserted++;
    if (a.type === 'image' && finalUrl.startsWith('/uploads/')) {
      const filePath = path.join(uploadsDir, a.name);
      try {
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const buf = (a.name || '').toLowerCase().endsWith('.svg') ? MINIMAL_SVG : MINIMAL_PNG;
        fs.writeFileSync(filePath, buf);
      } catch (err) {
        console.warn(`Could not write placeholder for ${a.name}:`, err.message);
      }
    }
  });
  if (inserted > 0 || updated > 0) {
    console.log(`📸 Sample assets: ${inserted} inserted, ${updated} updated (real retail images from Unsplash)`);
  }
}

module.exports = router;
module.exports.seedSampleAssets = seedSampleAssets;
module.exports.ensurePlaceholderFiles = ensurePlaceholderFiles;
