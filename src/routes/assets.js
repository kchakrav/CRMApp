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

// List assets
router.get('/', (req, res) => {
  try {
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
    const { tags = '' } = req.body;
    const assetType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    const result = query.insert('assets', {
      name: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mime_type: req.file.mimetype,
      type: assetType,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
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
    const filePath = path.join(uploadsDir, asset.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    query.delete('assets', id);
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
