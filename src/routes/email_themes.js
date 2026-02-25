const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Preset color palettes (Adobe-style)
const THEME_PRESETS = {
  default: { name: 'Default', body: { backgroundColor: '#ffffff', viewportColor: '#f0f0f0' }, colors: { primary: '#1473E6', secondary: '#6B7280', text: '#1f2933', textMuted: '#6B7280' }, button: { backgroundColor: '#1473E6', color: '#ffffff' }, divider: { borderColor: '#E5E7EB' } },
  ocean: { name: 'Ocean', body: { backgroundColor: '#f0f9ff', viewportColor: '#e0f2fe' }, colors: { primary: '#0284c7', secondary: '#0c4a6e', text: '#0c4a6e', textMuted: '#64748b' }, button: { backgroundColor: '#0284c7', color: '#ffffff' }, divider: { borderColor: '#bae6fd' } },
  forest: { name: 'Forest', body: { backgroundColor: '#f0fdf4', viewportColor: '#dcfce7' }, colors: { primary: '#15803d', secondary: '#14532d', text: '#14532d', textMuted: '#4d7c0f' }, button: { backgroundColor: '#15803d', color: '#ffffff' }, divider: { borderColor: '#bbf7d0' } },
  sunset: { name: 'Sunset', body: { backgroundColor: '#fff7ed', viewportColor: '#ffedd5' }, colors: { primary: '#c2410c', secondary: '#9a3412', text: '#431407', textMuted: '#78716c' }, button: { backgroundColor: '#ea580c', color: '#ffffff' }, divider: { borderColor: '#fed7aa' } },
  plum: { name: 'Plum', body: { backgroundColor: '#faf5ff', viewportColor: '#f3e8ff' }, colors: { primary: '#7c3aed', secondary: '#5b21b6', text: '#3b0764', textMuted: '#6b7280' }, button: { backgroundColor: '#7c3aed', color: '#ffffff' }, divider: { borderColor: '#e9d5ff' } },
  slate: { name: 'Slate (dark)', body: { backgroundColor: '#1e293b', viewportColor: '#0f172a' }, colors: { primary: '#38bdf8', secondary: '#94a3b8', text: '#f1f5f9', textMuted: '#94a3b8' }, button: { backgroundColor: '#38bdf8', color: '#0f172a' }, divider: { borderColor: '#475569' } }
};

// Default theme structure (Adobe Journey Optimizer–style: body, colors, typography, components, variants)
const defaultTheme = () => ({
  name: '',
  description: '',
  body: {
    backgroundColor: '#ffffff',
    viewportColor: '#f0f0f0',
    padding: '24px',
    maxWidth: '640',
    widthUnit: 'px',
    align: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  colors: {
    primary: '#1473E6',
    secondary: '#6B7280',
    text: '#1f2933',
    textMuted: '#6B7280'
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSizeBase: '14px',
    headingFontFamily: 'Arial, sans-serif',
    heading1: { fontSize: '28px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
    heading2: { fontSize: '22px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' },
    heading3: { fontSize: '18px', fontFamily: 'Arial, sans-serif', fontWeight: '600' }
  },
  components: {
    button: {
      backgroundColor: '#1473E6',
      color: '#ffffff',
      borderRadius: '6px',
      padding: '12px 24px',
      fontFamily: 'Arial, sans-serif'
    },
    divider: { borderColor: '#E5E7EB', thickness: 1 },
    text: {
      color: '#1f2933',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5'
    }
  },
  variants: [] // optional: [{ name: 'Light', body?, colors?, components? }, { name: 'Dark', ... }]
});

// List all email themes
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let themes = query.all('email_themes');
    if (search) {
      const q = (search || '').toLowerCase();
      themes = themes.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }
    themes.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    res.json({ themes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get presets (for theme create/edit UI) — must be before /:id
router.get('/presets/list', (req, res) => {
  res.json({ presets: THEME_PRESETS });
});

// Get single theme
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const theme = query.get('email_themes', id);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });
    res.json(theme);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create theme
router.post('/', (req, res) => {
  try {
    const { name, description, body, colors, typography, components, variants } = req.body;
    const payload = {
      name: name || 'Untitled theme',
      description: description || '',
      body: body || defaultTheme().body,
      colors: colors || defaultTheme().colors,
      typography: typography || defaultTheme().typography,
      components: components || defaultTheme().components,
      variants: Array.isArray(variants) ? variants : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const result = query.insert('email_themes', payload);
    res.status(201).json(result.record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update theme
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = query.get('email_themes', id);
    if (!existing) return res.status(404).json({ error: 'Theme not found' });
    const { name, description, body, colors, typography, components, variants } = req.body;
    const updates = {
      ...existing,
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(body !== undefined && { body }),
      ...(colors !== undefined && { colors }),
      ...(typography !== undefined && { typography }),
      ...(components !== undefined && { components }),
      ...(variants !== undefined && { variants: Array.isArray(variants) ? variants : existing.variants || [] }),
      updated_at: new Date().toISOString()
    };
    delete updates.id;
    query.update('email_themes', id, updates);
    res.json(query.get('email_themes', id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete theme
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = query.get('email_themes', id);
    if (!existing) return res.status(404).json({ error: 'Theme not found' });
    query.delete('email_themes', id);
    res.json({ message: 'Theme deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
