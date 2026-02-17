/**
 * Ranking Service – evaluates and ranks qualified offers
 * Supports: priority, formula-based, and AI (auto-optimization) ranking
 */
const { query } = require('../database');

// ── Safe expression evaluator for ranking formulas ──
// Supports: offer.priority, profile.<attr>, context.<attr>, +, -, *, /, (, ), numbers
function evaluateFormula(formula, offer, profile, context) {
  try {
    // Build a flat namespace
    const ns = {};
    // offer attributes
    if (offer) {
      for (const [k, v] of Object.entries(offer)) {
        if (typeof v === 'number') ns[`offer_${k}`] = v;
      }
      // Also expose offer.attributes if present
      if (offer.attributes) {
        for (const [k, v] of Object.entries(offer.attributes)) {
          if (typeof v === 'number') ns[`offer_${k}`] = v;
        }
      }
    }
    // profile attributes
    if (profile) {
      for (const [k, v] of Object.entries(profile)) {
        if (typeof v === 'number') ns[`profile_${k}`] = v;
      }
    }
    // context attributes
    if (context) {
      for (const [k, v] of Object.entries(context)) {
        if (typeof v === 'number') ns[`context_${k}`] = v;
      }
    }

    // Replace dot-notation with underscore so "offer.priority" becomes "offer_priority"
    let expr = formula.replace(/([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/g, '$1_$2');

    // Replace variable references with values
    for (const [k, v] of Object.entries(ns)) {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), String(v));
    }

    // Only allow numbers, operators, parens, whitespace
    if (!/^[\d\s+\-*/().]+$/.test(expr)) {
      return offer.priority || 0;
    }

    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : (offer.priority || 0);
  } catch {
    return offer.priority || 0;
  }
}

// ── AI Auto-optimization: rank by historical conversion rate ──
function computeConversionScore(offer) {
  const propositions = query.all('offer_propositions', p => p.offer_id === offer.id);
  const impressions = propositions.length || 1; // avoid div/0
  const conversions = propositions.filter(p => p.status === 'converted').length;
  const clicks = propositions.filter(p => p.status === 'clicked').length;

  // Weighted score: 60% conversion rate + 40% click rate
  const convRate = conversions / impressions;
  const clickRate = clicks / impressions;
  return convRate * 0.6 + clickRate * 0.4;
}

/**
 * Rank a list of qualified offers
 * @param {Array} offers - qualified offer objects
 * @param {string} method - 'priority' | 'formula' | 'ai'
 * @param {Object} options - { formulaId, modelId, profile, context }
 * @returns {Array} sorted offers (best first)
 */
function rankOffers(offers, method = 'priority', options = {}) {
  const { formulaId, modelId, profile = {}, context = {} } = options;

  if (!offers || offers.length === 0) return [];

  switch (method) {
    case 'formula': {
      const formula = formulaId ? query.get('ranking_formulas', formulaId) : null;
      if (!formula || !formula.expression) {
        // Fallback to priority
        return [...offers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      }
      return offers.map(o => ({
        ...o,
        _score: evaluateFormula(formula.expression, o, profile, context)
      })).sort((a, b) => b._score - a._score);
    }

    case 'ai': {
      // AI auto-optimization: rank by historical performance
      return offers.map(o => ({
        ...o,
        _score: computeConversionScore(o) * 100 + (o.priority || 0) * 0.1
      })).sort((a, b) => b._score - a._score);
    }

    case 'priority':
    default:
      return [...offers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}

module.exports = { rankOffers, evaluateFormula, computeConversionScore };
