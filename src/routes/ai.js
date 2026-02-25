const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db, query } = require('../database');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper function to call OpenAI API
async function callOpenAI(prompt, systemMessage = 'You are a helpful marketing automation assistant.', maxTokens = 500) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
    // Return mock response if no API key
    return null;
  }
  
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return null;
  }
}

// Brand alignment: evaluate email content against brand guidelines (Adobe Journey Optimizer–style)
router.post('/brand-alignment', async (req, res) => {
  try {
    const { brandId, subject = '', preheader = '', bodyText = '' } = req.body;
    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }
    const brand = query.get('brands', parseInt(brandId, 10));
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    const brandName = brand.name || 'Brand';
    const guidelines = brand.brand_guidelines || {};
    const communicationStyle = guidelines.communication_style || 'Professional and clear';
    const messagingStandards = guidelines.messaging_standards || 'Concise, benefit-focused, with clear CTAs';
    const legalNote = brand.legal?.company_name ? `Legal/compliance: use company name "${brand.legal.company_name}" where required.` : '';
    const colors = brand.colors ? `Brand colors: primary ${brand.colors.primary || 'N/A'}, text ${brand.colors.text || 'N/A'}.` : '';

    const systemMsg = 'You are a brand compliance expert. Evaluate email content against brand guidelines. Respond with valid JSON only, no markdown or extra text.';
    const prompt = `Brand: ${brandName}
Communication style: ${communicationStyle}
Messaging standards: ${messagingStandards}
${legalNote}
${colors}

Email content to evaluate:
Subject: ${subject}
Preheader: ${preheader}
Body text:
${bodyText.slice(0, 4000)}

Return a single JSON object with this exact structure:
{
  "overallScore": <0-100>,
  "writingStyle": {
    "score": <0-100>,
    "items": [
      { "category": "Brand communication style"|"Brand messaging standards"|"Legal compliance", "guideline": "short label", "status": "pass"|"warning"|"fail", "feedback": "one sentence" }
    ]
  },
  "visualContent": {
    "score": <0-100>,
    "items": [
      { "category": "Photography/imagery"|"Usage guidelines"|"Icon/illustration", "guideline": "short label", "status": "pass"|"warning"|"fail", "feedback": "one sentence" }
    ]
  },
  "overallQuality": {
    "score": <0-100>,
    "items": [
      { "category": "CTA effectiveness"|"Subject line"|"Readability"|"Spam check"|"Content cohesiveness"|"Proofreading", "guideline": "short label", "status": "pass"|"warning"|"fail", "feedback": "one sentence" }
    ]
  }
}
Include 2-5 items per section. Base visualContent on body text cues (e.g. image/CTA mentions). Use "pass" for good alignment, "warning" for minor issues, "fail" for clear violations.`;

    const raw = await callOpenAI(prompt, systemMsg, 1400);
    let data;
    if (raw) {
      const cleaned = raw.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
      try {
        data = JSON.parse(cleaned);
      } catch (_) {
        data = null;
      }
    }
    if (!data || typeof data.overallScore !== 'number') {
      data = {
        overallScore: 75,
        writingStyle: { score: 75, items: [{ category: 'Brand messaging standards', guideline: 'Tone', status: 'pass', feedback: 'Content matches a professional tone.' }, { category: 'Legal compliance', guideline: 'Company identity', status: 'warning', feedback: 'Ensure legal footer and company name are present when sending.' }] },
        visualContent: { score: 70, items: [{ category: 'Usage guidelines', guideline: 'Imagery', status: 'warning', feedback: 'Verify images align with brand when you add them.' }] },
        overallQuality: { score: 78, items: [{ category: 'Subject line', guideline: 'Clarity', status: 'pass', feedback: 'Subject is clear.' }, { category: 'Readability', guideline: 'Length', status: 'pass', feedback: 'Body text is readable.' }] },
        source: 'mock'
      };
    } else {
      data.source = 'openai';
      data.brandName = brandName;
    }
    res.json(data);
  } catch (error) {
    console.error('Brand alignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate email subject lines (optionally analyze email content for better suggestions)
router.post('/generate-subject', async (req, res) => {
  try {
    const {
      productName,
      targetAudience,
      contentSummary,
      tone = 'professional',
      count = 5
    } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: 'productName is required' });
    }
    
    const contentSection = contentSummary && contentSummary.trim()
      ? `\n\nAnalyze this email body content and suggest subject lines that match the message, offer, and tone of the email. Do not repeat the same phrases; instead create subject lines that intrigue and complement the content.\n\nEmail content summary:\n"${contentSummary.trim()}"\n\n`
      : '\n\n';
    const prompt = `Generate ${count} compelling email subject lines for a marketing campaign about "${productName}" targeting ${targetAudience}. The tone should be ${tone}.${contentSection}Make subject lines attention-grabbing and likely to increase open rates. Return only the subject lines, one per line, without numbering.`;
    
    const result = await callOpenAI(prompt, 'You are an expert email marketing copywriter.');
    
    if (result) {
      const subjects = result.split('\n').filter(s => s.trim()).slice(0, count);
      res.json({
        subjects,
        source: 'openai',
        product: productName,
        audience: targetAudience,
        tone
      });
    } else {
      // Return mock data if API not available
      const mockSubjects = [
        `${productName} - Limited Time Offer Inside!`,
        `You Won't Believe These ${productName} Deals`,
        `Exclusive: ${productName} Just For You`,
        `Last Chance: ${productName} Sale Ends Soon`,
        `Transform Your Life with ${productName}`
      ];
      res.json({
        subjects: mockSubjects.slice(0, count),
        source: 'mock',
        message: 'Using mock data. Add OPENAI_API_KEY to .env for real AI generation.',
        product: productName,
        audience: targetAudience,
        tone
      });
    }
  } catch (error) {
    console.error('Error generating subject lines:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate / refine SMS message
router.post('/generate-sms', async (req, res) => {
  try {
    const { prompt, tone = 'professional', length = 'short', language = 'English', currentMessage = '', action = 'generate' } = req.body;
    if (!prompt && action === 'generate') return res.status(400).json({ error: 'prompt is required' });

    const toneGuide = { professional: 'professional and polished', friendly: 'warm and conversational', casual: 'casual and relaxed', urgent: 'urgent and action-oriented', playful: 'playful and fun', formal: 'formal and authoritative' };
    const lengthGuide = { short: 'under 100 characters', medium: 'around 120-150 characters', long: 'up to 160 characters (one SMS segment)' };
    const toneDesc = toneGuide[tone] || tone;
    const lenDesc = lengthGuide[length] || length;

    let aiPrompt;
    if (action === 'refine' && currentMessage) {
      aiPrompt = `Refine the following SMS marketing message. Keep the same intent but make it ${toneDesc}. Target length: ${lenDesc}. Language: ${language}.\n\nOriginal message:\n"${currentMessage}"\n\nAdditional instructions: ${prompt || 'Improve clarity and impact.'}\n\nReturn exactly 3 refined variations, one per line, without numbering or quotes.`;
    } else {
      aiPrompt = `Write an SMS marketing message about: "${prompt}". Tone: ${toneDesc}. Target length: ${lenDesc}. Language: ${language}. It should be compelling and include a clear call-to-action. Do not use hashtags. Return exactly 3 message variations, one per line, without numbering or quotes.`;
    }

    const result = await callOpenAI(aiPrompt, 'You are an expert SMS marketing copywriter. Write concise, high-converting SMS messages.');

    if (result) {
      const messages = result.split('\n').filter(s => s.trim()).slice(0, 3);
      res.json({ messages, source: 'openai', action, tone, length });
    } else {
      const base = prompt || 'your product';
      const mocks = {
        professional: [`Hi {{first_name}}, ${base} is now available. Explore our latest collection and save 20%. Shop now: {{short_url}}`, `{{first_name}}, don't miss our exclusive ${base} offer. Limited availability. Details: {{short_url}}`, `Important update for you, {{first_name}}: ${base} just launched. Claim your early-access discount: {{short_url}}`],
        friendly: [`Hey {{first_name}}! We thought you'd love ${base}. Check it out and grab 20% off today: {{short_url}}`, `{{first_name}}, guess what? ${base} is here! We saved one for you. Take a peek: {{short_url}}`, `Good news, {{first_name}}! ${base} just dropped and it's awesome. Don't miss out: {{short_url}}`],
        casual: [`Yo {{first_name}}! ${base} just dropped. Check it out: {{short_url}}`, `{{first_name}} - ${base} is live. Pretty cool stuff: {{short_url}}`, `New drop alert: ${base}. Thought you should know: {{short_url}}`],
        urgent: [`LAST CHANCE {{first_name}}! ${base} ends tonight. Act now: {{short_url}}`, `{{first_name}}, only hours left to get ${base} at 30% off. Don't wait: {{short_url}}`, `HURRY: ${base} is almost sold out. Secure yours: {{short_url}}`],
        playful: [`Psst, {{first_name}}... ${base} is calling your name! Answer here: {{short_url}}`, `{{first_name}}, we made something you'll LOVE: ${base}. Spoil yourself: {{short_url}}`, `Plot twist: ${base} just got even better. The surprise: {{short_url}}`],
        formal: [`Dear {{first_name}}, we are pleased to announce ${base}. Learn more: {{short_url}}`, `{{first_name}}, we invite you to discover our latest ${base} offering. Details: {{short_url}}`, `Please be advised: ${base} is now available for your consideration. Review: {{short_url}}`]
      };
      const msgs = mocks[tone] || mocks.professional;
      res.json({ messages: msgs, source: 'mock', message: 'Using mock data. Add OPENAI_API_KEY for real AI.', action, tone, length });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate / refine Push notification
router.post('/generate-push', async (req, res) => {
  try {
    const { prompt, tone = 'professional', language = 'English', currentTitle = '', currentBody = '', action = 'generate' } = req.body;
    if (!prompt && action === 'generate') return res.status(400).json({ error: 'prompt is required' });

    const toneGuide = { professional: 'professional and polished', friendly: 'warm and conversational', casual: 'casual and relaxed', urgent: 'urgent and action-oriented', playful: 'playful and fun', formal: 'formal and authoritative' };
    const toneDesc = toneGuide[tone] || tone;

    let aiPrompt;
    if (action === 'refine' && (currentTitle || currentBody)) {
      aiPrompt = `Refine this push notification. Tone: ${toneDesc}. Language: ${language}.\n\nCurrent title: "${currentTitle}"\nCurrent body: "${currentBody}"\nInstructions: ${prompt || 'Improve engagement.'}\n\nReturn exactly 3 variations. Each variation on its own line in the format: TITLE | BODY\nTitle max 50 chars, body max 150 chars. No numbering.`;
    } else {
      aiPrompt = `Write a push notification about: "${prompt}". Tone: ${toneDesc}. Language: ${language}.\n\nReturn exactly 3 variations. Each variation on its own line in format: TITLE | BODY\nTitle max 50 chars, body max 150 chars. No numbering.`;
    }

    const result = await callOpenAI(aiPrompt, 'You are an expert mobile push notification copywriter.');

    if (result) {
      const notifications = result.split('\n').filter(s => s.trim() && s.includes('|')).slice(0, 3).map(line => {
        const parts = line.split('|').map(p => p.trim());
        return { title: parts[0] || '', body: parts[1] || '' };
      });
      res.json({ notifications, source: 'openai', action, tone });
    } else {
      const base = prompt || 'your product';
      const mocks = {
        professional: [{ title: 'New from us', body: `{{first_name}}, ${base} is now available. Explore and save 20% today.` }, { title: 'Exclusive offer', body: `${base} — limited-time pricing for valued customers like you.` }, { title: 'Just launched', body: `${base} is here. Be among the first to experience it.` }],
        friendly: [{ title: 'Hey, check this out!', body: `{{first_name}}, we think you'll love ${base}. Come take a look!` }, { title: 'Something new for you', body: `${base} just landed and it's pretty great. Tap to see!` }, { title: "You're gonna love this", body: `${base} is live! We saved the best for you.` }],
        urgent: [{ title: "Don't miss out!", body: `{{first_name}}, ${base} ends soon. Act now before it's gone!` }, { title: 'Last chance!', body: `Only hours left for ${base}. Don't wait — tap now.` }, { title: 'Hurry!', body: `${base} is almost sold out. Secure yours right now.` }],
        casual: [{ title: 'New drop', body: `${base} is live. Check it out when you get a sec.` }, { title: 'FYI', body: `${base} just dropped. Thought you should know.` }, { title: 'Quick heads up', body: `${base} is here. Pretty cool stuff inside.` }],
        playful: [{ title: 'Surprise!', body: `${base} is calling your name, {{first_name}}. Answer it!` }, { title: 'Plot twist', body: `${base} just got even better. Tap to see the surprise.` }, { title: 'Guess what?', body: `We made something you'll LOVE. Hint: it's ${base}.` }],
        formal: [{ title: 'Important update', body: `We are pleased to announce ${base}. Tap for details.` }, { title: 'New announcement', body: `${base} is now available. Review the details at your convenience.` }, { title: 'Official notice', body: `${base} has launched. We invite you to explore.` }]
      };
      const notifs = mocks[tone] || mocks.professional;
      res.json({ notifications: notifs, source: 'mock', message: 'Using mock data. Add OPENAI_API_KEY for real AI.', action, tone });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict customer churn
router.post('/predict-churn', async (req, res) => {
  try {
    const { customer_id } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    
    // Get customer data
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get customer's order history
    const orders = db.prepare(`
      SELECT COUNT(*) as order_count, 
             MAX(ordered_at) as last_order_date,
             AVG(total) as avg_order_value,
             SUM(total) as lifetime_value
      FROM orders 
      WHERE customer_id = ? AND status IN ('completed', 'pending')
    `).get(customer_id);
    
    // Get engagement metrics
    const engagement = db.prepare(`
      SELECT COUNT(*) as event_count,
             MAX(created_at) as last_activity
      FROM customer_events
      WHERE customer_id = ?
    `).get(customer_id);
    
    // Simple churn prediction logic (in production, use ML model)
    const daysSinceLastOrder = orders.last_order_date 
      ? Math.floor((Date.now() - new Date(orders.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const daysSinceLastActivity = engagement.last_activity
      ? Math.floor((Date.now() - new Date(engagement.last_activity).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    let churnRisk = 0;
    let riskLevel = 'low';
    let recommendation = '';
    
    if (daysSinceLastOrder > 90 || daysSinceLastActivity > 60) {
      churnRisk = 0.85;
      riskLevel = 'high';
      recommendation = 'Send win-back campaign with special discount. Customer has been inactive for extended period.';
    } else if (daysSinceLastOrder > 60 || daysSinceLastActivity > 30) {
      churnRisk = 0.55;
      riskLevel = 'medium';
      recommendation = 'Re-engagement campaign recommended. Show new products or personalized offers.';
    } else if (daysSinceLastOrder > 30) {
      churnRisk = 0.25;
      riskLevel = 'low';
      recommendation = 'Customer is moderately active. Continue regular engagement campaigns.';
    } else {
      churnRisk = 0.10;
      riskLevel = 'very_low';
      recommendation = 'Customer is highly engaged. Focus on upselling and loyalty rewards.';
    }
    
    // Store prediction
    db.prepare(`
      INSERT INTO ai_predictions (customer_id, prediction_type, prediction_value, confidence_score, model_version)
      VALUES (?, 'churn_risk', ?, ?, 'v1.0')
    `).run(customer_id, JSON.stringify({ risk_level: riskLevel, score: churnRisk }), churnRisk);
    
    res.json({
      customer_id,
      churn_risk: churnRisk,
      risk_level: riskLevel,
      recommendation,
      factors: {
        days_since_last_order: daysSinceLastOrder,
        days_since_last_activity: daysSinceLastActivity,
        total_orders: orders.order_count,
        lifetime_value: parseFloat(orders.lifetime_value || 0).toFixed(2)
      },
      model_version: 'v1.0'
    });
  } catch (error) {
    console.error('Error predicting churn:', error);
    res.status(500).json({ error: error.message });
  }
});

// Product recommendations
router.post('/recommend-products', async (req, res) => {
  try {
    const { customer_id, limit = 5 } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    
    // Get customer's purchase history
    const purchasedProducts = db.prepare(`
      SELECT DISTINCT json_extract(value, '$.product_id') as product_id
      FROM orders o, json_each(o.order_items)
      WHERE o.customer_id = ? AND o.status IN ('completed', 'pending')
    `).all(customer_id);
    
    const purchasedIds = purchasedProducts.map(p => p.product_id).filter(Boolean);
    
    // Get products customer hasn't purchased (simple recommendation)
    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];
    
    if (purchasedIds.length > 0) {
      query += ` AND id NOT IN (${purchasedIds.map(() => '?').join(',')})`;
      params.push(...purchasedIds);
    }
    
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(limit);
    
    const recommendations = db.prepare(query).all(...params);
    
    const parsed = recommendations.map(product => ({
      ...product,
      metadata: JSON.parse(product.metadata || '{}'),
      is_active: !!product.is_active,
      recommendation_reason: 'Based on your browsing history and similar customers'
    }));
    
    res.json({
      customer_id,
      recommendations: parsed,
      algorithm: 'collaborative_filtering_v1'
    });
  } catch (error) {
    console.error('Error generating product recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Optimize send time
router.post('/optimize-send-time', async (req, res) => {
  try {
    const { customer_id } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    
    // Get customer's email open patterns
    const openPatterns = db.prepare(`
      SELECT 
        strftime('%H', opened_at) as hour,
        strftime('%w', opened_at) as day_of_week,
        COUNT(*) as open_count
      FROM campaign_sends
      WHERE customer_id = ? AND opened_at IS NOT NULL
      GROUP BY hour, day_of_week
      ORDER BY open_count DESC
      LIMIT 1
    `).get(customer_id);
    
    let bestTime = {
      hour: 10,
      day_of_week: 2, // Tuesday
      timezone: 'UTC'
    };
    
    let confidence = 0.5;
    
    if (openPatterns && openPatterns.open_count > 3) {
      bestTime.hour = parseInt(openPatterns.hour);
      bestTime.day_of_week = parseInt(openPatterns.day_of_week);
      confidence = Math.min(0.95, 0.5 + (openPatterns.open_count * 0.05));
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    res.json({
      customer_id,
      best_send_time: bestTime,
      best_day: dayNames[bestTime.day_of_week],
      best_hour: `${bestTime.hour}:00`,
      confidence_score: confidence,
      recommendation: `Send emails on ${dayNames[bestTime.day_of_week]} at ${bestTime.hour}:00 for best engagement`,
      based_on_opens: openPatterns ? openPatterns.open_count : 0
    });
  } catch (error) {
    console.error('Error optimizing send time:', error);
    res.status(500).json({ error: error.message });
  }
});

// Next best action
router.post('/next-action', async (req, res) => {
  try {
    const { customer_id } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get customer behavior
    const orders = db.prepare(`
      SELECT COUNT(*) as order_count, MAX(ordered_at) as last_order
      FROM orders WHERE customer_id = ? AND status IN ('completed', 'pending')
    `).get(customer_id);
    
    const events = db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM customer_events
      WHERE customer_id = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY event_type
    `).all(customer_id);
    
    // Determine next best action
    let action = '';
    let confidence = 0;
    let reasoning = '';
    let suggestedContent = {};
    
    const daysSinceOrder = orders.last_order 
      ? Math.floor((Date.now() - new Date(orders.last_order).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (orders.order_count === 0) {
      action = 'send_first_purchase_incentive';
      confidence = 0.85;
      reasoning = 'Customer has never purchased. Offer first-time buyer discount.';
      suggestedContent = {
        subject: 'Welcome! Here\'s 15% Off Your First Order',
        discount: '15%',
        cta: 'Shop Now'
      };
    } else if (daysSinceOrder > 60) {
      action = 'send_winback_campaign';
      confidence = 0.78;
      reasoning = 'Customer hasn\'t purchased in over 60 days. Time for re-engagement.';
      suggestedContent = {
        subject: 'We Miss You! Come Back for 20% Off',
        discount: '20%',
        cta: 'Redeem Offer'
      };
    } else if (customer.lifecycle_stage === 'vip') {
      action = 'send_vip_exclusive';
      confidence = 0.92;
      reasoning = 'VIP customer. Offer exclusive early access or special rewards.';
      suggestedContent = {
        subject: 'VIP Exclusive: Early Access to New Collection',
        benefit: 'Early Access',
        cta: 'Shop VIP Collection'
      };
    } else if (daysSinceOrder < 7) {
      action = 'send_cross_sell';
      confidence = 0.70;
      reasoning = 'Recent purchase. Recommend complementary products.';
      suggestedContent = {
        subject: 'Complete Your Look - Perfect Additions',
        type: 'product_recommendations',
        cta: 'See Recommendations'
      };
    } else {
      action = 'send_general_promotion';
      confidence = 0.60;
      reasoning = 'Maintain engagement with regular promotional content.';
      suggestedContent = {
        subject: 'New Arrivals You\'ll Love',
        type: 'new_products',
        cta: 'Shop New Arrivals'
      };
    }
    
    res.json({
      customer_id,
      next_action: action,
      confidence,
      reasoning,
      suggested_content: suggestedContent,
      customer_context: {
        lifecycle_stage: customer.lifecycle_stage,
        total_orders: orders.order_count,
        days_since_last_order: daysSinceOrder,
        recent_activity: events.length
      }
    });
  } catch (error) {
    console.error('Error determining next action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-segment customers using AI
router.post('/auto-segment', async (req, res) => {
  try {
    const { num_segments = 5 } = req.body;
    
    // Get customer data for clustering
    const customers = db.prepare(`
      SELECT 
        c.id,
        c.lead_score,
        c.lifecycle_stage,
        COALESCE(COUNT(DISTINCT o.id), 0) as order_count,
        COALESCE(SUM(o.total), 0) as lifetime_value,
        COALESCE(MAX(o.ordered_at), c.created_at) as last_purchase
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status IN ('completed', 'pending')
      GROUP BY c.id
      LIMIT 1000
    `).all();
    
    // Simple segmentation logic (in production, use k-means clustering)
    const segments = [
      {
        name: 'High-Value VIPs',
        description: 'Customers with high lifetime value and frequent purchases',
        criteria: { min_lifetime_value: 500, min_orders: 5 },
        count: 0
      },
      {
        name: 'Regular Buyers',
        description: 'Consistent customers with moderate purchase frequency',
        criteria: { min_lifetime_value: 100, min_orders: 2 },
        count: 0
      },
      {
        name: 'One-Time Buyers',
        description: 'Customers who made a single purchase',
        criteria: { max_orders: 1, min_orders: 1 },
        count: 0
      },
      {
        name: 'At-Risk Churners',
        description: 'Previously active customers showing signs of churn',
        criteria: { days_since_purchase: 90 },
        count: 0
      },
      {
        name: 'Leads (Never Purchased)',
        description: 'Engaged leads who haven\'t made a purchase yet',
        criteria: { max_orders: 0 },
        count: 0
      }
    ];
    
    // Count customers in each segment
    customers.forEach(customer => {
      const daysSincePurchase = customer.last_purchase
        ? Math.floor((Date.now() - new Date(customer.last_purchase).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (customer.lifetime_value >= 500 && customer.order_count >= 5) {
        segments[0].count++;
      } else if (customer.lifetime_value >= 100 && customer.order_count >= 2) {
        segments[1].count++;
      } else if (customer.order_count === 1) {
        segments[2].count++;
      } else if (customer.order_count > 0 && daysSincePurchase > 90) {
        segments[3].count++;
      } else {
        segments[4].count++;
      }
    });
    
    res.json({
      segments: segments.slice(0, num_segments),
      total_customers_analyzed: customers.length,
      algorithm: 'rule_based_clustering_v1',
      recommendation: 'Create targeted campaigns for each segment based on their characteristics'
    });
  } catch (error) {
    console.error('Error auto-segmenting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate email content
router.post('/generate-content', async (req, res) => {
  try {
    const {
      campaign_type,
      product_name,
      target_audience,
      tone = 'professional',
      length = 'medium'
    } = req.body;
    
    if (!campaign_type || !product_name) {
      return res.status(400).json({ error: 'campaign_type and product_name are required' });
    }
    
    const prompt = `Write ${length} email body content for a ${campaign_type} campaign about "${product_name}" targeting ${target_audience}. Use a ${tone} tone. Include a compelling hook, benefits, and a clear call-to-action. Format in HTML.`;
    
    const result = await callOpenAI(prompt, 'You are an expert email marketing copywriter.');
    
    if (result) {
      res.json({
        content_html: result,
        source: 'openai',
        campaign_type,
        product_name
      });
    } else {
      const mockContent = `
        <h2>Introducing ${product_name}</h2>
        <p>Dear valued customer,</p>
        <p>We're excited to share something special with you. Our ${product_name} is designed specifically for ${target_audience} like you.</p>
        <h3>Why you'll love it:</h3>
        <ul>
          <li>Premium quality and design</li>
          <li>Exclusive benefits for our customers</li>
          <li>Limited time special offer</li>
        </ul>
        <p><strong>Ready to experience ${product_name}?</strong></p>
        <p><a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Shop Now</a></p>
        <p>Best regards,<br>Your Marketing Team</p>
      `;
      
      res.json({
        content_html: mockContent,
        source: 'mock',
        message: 'Using mock data. Add OPENAI_API_KEY to .env for real AI generation.',
        campaign_type,
        product_name
      });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── AI-powered workflow flow suggestion ───────────────────────
const VALID_NODE_TYPES = {
  // Flow
  entry: { category: 'flow', desc: 'Start of workflow' },
  exit: { category: 'flow', desc: 'End of workflow' },
  // Targeting
  segment: { category: 'targeting', desc: 'Filter by segment' },
  filter: { category: 'targeting', desc: 'Custom conditions' },
  exclude: { category: 'targeting', desc: 'Exclude contacts' },
  split: { category: 'targeting', desc: 'Segment population / A/B split' },
  query: { category: 'targeting', desc: 'Build target query' },
  build_audience: { category: 'targeting', desc: 'Use audience or query' },
  deduplication: { category: 'targeting', desc: 'Remove duplicates' },
  enrichment: { category: 'targeting', desc: 'Add data fields' },
  save_audience: { category: 'targeting', desc: 'Save results' },
  // Flow control
  wait: { category: 'flow_control', desc: 'Delay execution' },
  condition: { category: 'flow_control', desc: 'If/else branching' },
  scheduler: { category: 'flow_control', desc: 'Run on schedule' },
  fork: { category: 'flow_control', desc: 'Parallel branches' },
  // Channels
  email: { category: 'channels', desc: 'Send email' },
  sms: { category: 'channels', desc: 'Send SMS' },
  push: { category: 'channels', desc: 'Push notification' },
  webhook: { category: 'channels', desc: 'HTTP callback' },
  // Tracking
  goal: { category: 'tracking', desc: 'Track conversion goal' }
};

router.post('/suggest-flow', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    const nodeTypeList = Object.entries(VALID_NODE_TYPES)
      .map(([type, info]) => `  ${type} (${info.category}) — ${info.desc}`)
      .join('\n');

    const prompt = `Design a marketing automation workflow based on this brief:

Name: "${name}"
${description ? `Description: "${description}"` : ''}

Available node types:
${nodeTypeList}

Return a JSON array of workflow nodes. Each node must have:
- "type": one of the listed node types above (use exact type key)
- "name": a short descriptive label for this step (5 words max)
- "config": an object with relevant settings, for example:
  - wait nodes: { "wait_time": <number>, "wait_unit": "hours"|"days" }
  - email nodes: { "subject": "<subject line>" }
  - sms nodes: { "message": "<sms text>" }
  - condition nodes: { "condition_type": "<what to check>", "time_window": <days> }
  - segment/filter nodes: { "action": "include"|"exclude", "criteria": "<description>" }
  - split nodes: { "split_ratio": 50 }
  - goal nodes: { "goal_type": "<conversion event>" }

Rules:
- Always start with an "entry" node and end with an "exit" node
- Use 5-12 nodes total for a practical flow
- Include appropriate wait times between messages (hours or days)
- Use conditions to branch based on user behavior
- Pick channels (email, sms, push) that make sense for the use case
- Nodes are connected sequentially (top to bottom) — the array order IS the flow order

Return ONLY a valid JSON array, no explanation or markdown.`;

    const result = await callOpenAI(prompt, 
      'You are a marketing automation architect. You design highly effective customer journey workflows. Return only valid JSON arrays — no markdown, no explanation, no code fences.');

    let flow = null;

    if (result) {
      try {
        // Strip any markdown code fences the LLM might add
        const cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        flow = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[AI] Failed to parse flow JSON:', parseErr.message, '\nRaw:', result);
      }
    }

    if (flow && Array.isArray(flow)) {
      // Validate & sanitize each node
      const sanitized = flow
        .filter(n => n && n.type)
        .map(n => {
          const typeDef = VALID_NODE_TYPES[n.type];
          if (!typeDef) {
            // Try to map close matches
            const lower = (n.type || '').toLowerCase().replace(/[^a-z_]/g, '');
            const match = Object.keys(VALID_NODE_TYPES).find(k => k === lower);
            if (match) {
              n.type = match;
            } else {
              return null; // Unknown type, skip
            }
          }
          return {
            type: n.type,
            category: VALID_NODE_TYPES[n.type]?.category || 'flow',
            name: String(n.name || n.type).slice(0, 40),
            config: n.config && typeof n.config === 'object' ? n.config : {}
          };
        })
        .filter(Boolean);

      // Ensure it starts with entry and ends with exit
      if (sanitized.length > 0 && sanitized[0].type !== 'entry') {
        sanitized.unshift({ type: 'entry', category: 'flow', name: 'Entry Point', config: {} });
      }
      if (sanitized.length > 0 && sanitized[sanitized.length - 1].type !== 'exit') {
        sanitized.push({ type: 'exit', category: 'flow', name: 'Exit', config: {} });
      }

      return res.json({ flow: sanitized, source: 'openai' });
    }

    // ── Mock fallback: generate a sensible flow from keywords ──
    const lowerName = (name + ' ' + (description || '')).toLowerCase();
    let mockFlow;

    if (/welcome|onboard|sign.?up|new.?sub/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'New Subscriber', config: {} },
        { type: 'email', category: 'channels', name: 'Welcome Email', config: { subject: `Welcome to ${name}!` } },
        { type: 'wait', category: 'flow_control', name: 'Wait 1 Day', config: { wait_time: 1, wait_unit: 'days' } },
        { type: 'email', category: 'channels', name: 'Getting Started Guide', config: { subject: 'Getting started — quick tips' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Made Purchase?', config: { condition_type: 'purchased', time_window: 7 } },
        { type: 'email', category: 'channels', name: 'First Purchase Offer', config: { subject: '20% off your first order' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/cart|abandon|recover/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Cart Abandoned', config: {} },
        { type: 'wait', category: 'flow_control', name: 'Wait 1 Hour', config: { wait_time: 1, wait_unit: 'hours' } },
        { type: 'email', category: 'channels', name: 'Cart Reminder', config: { subject: 'You left items in your cart!' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 24 Hours', config: { wait_time: 24, wait_unit: 'hours' } },
        { type: 'condition', category: 'flow_control', name: 'Still No Purchase?', config: { condition_type: 'purchased', time_window: 1 } },
        { type: 'email', category: 'channels', name: 'Discount Incentive', config: { subject: '10% off to complete your order' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 48 Hours', config: { wait_time: 48, wait_unit: 'hours' } },
        { type: 'email', category: 'channels', name: 'Final Reminder', config: { subject: 'Last chance — cart expiring soon' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/win.?back|re.?engage|inactive|churn/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Inactive Customer', config: {} },
        { type: 'filter', category: 'targeting', name: 'Filter Inactive 60d+', config: { filter_field: 'last_purchase_date', operator: 'greater_than', filter_value: '60' } },
        { type: 'email', category: 'channels', name: 'We Miss You', config: { subject: 'We miss you — come back!' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Opened Email?', config: { condition_type: 'email_opened', time_window: 3 } },
        { type: 'email', category: 'channels', name: '25% Off Comeback', config: { subject: '25% off — welcome back!' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 7 Days', config: { wait_time: 7, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Converted?', config: { condition_type: 'purchased', time_window: 7 } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/vip|loyal|reward|exclusive/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'VIP Campaign Start', config: {} },
        { type: 'segment', category: 'targeting', name: 'VIP Segment', config: { action: 'include', criteria: 'VIP customers' } },
        { type: 'email', category: 'channels', name: 'Exclusive VIP Offer', config: { subject: 'Exclusive offer just for you' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 2 Days', config: { wait_time: 2, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Opened Email?', config: { condition_type: 'email_opened', time_window: 2 } },
        { type: 'email', category: 'channels', name: 'Follow-up Reminder', config: { subject: 'Don\'t miss your VIP deal' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/sale|promo|discount|flash|black.?friday|holiday/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Campaign Start', config: {} },
        { type: 'segment', category: 'targeting', name: 'Active Subscribers', config: { action: 'include', criteria: 'Engaged contacts' } },
        { type: 'split', category: 'targeting', name: 'A/B Test', config: { split_ratio: 50 } },
        { type: 'email', category: 'channels', name: 'Promo Email', config: { subject: `${name} — Don't miss out!` } },
        { type: 'wait', category: 'flow_control', name: 'Wait 1 Day', config: { wait_time: 1, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Opened?', config: { condition_type: 'email_opened', time_window: 1 } },
        { type: 'sms', category: 'channels', name: 'SMS Reminder', config: { message: `Last chance! ${name} ends soon. Shop now.` } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/birthday|anniversary|milestone/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Milestone Trigger', config: {} },
        { type: 'email', category: 'channels', name: 'Happy Birthday Email', config: { subject: `Happy Birthday! Here's a gift for you` } },
        { type: 'wait', category: 'flow_control', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Used Gift?', config: { condition_type: 'purchased', time_window: 3 } },
        { type: 'sms', category: 'channels', name: 'Reminder SMS', config: { message: 'Your birthday gift is waiting! Redeem before it expires.' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/nurture|drip|education|series/i.test(lowerName)) {
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Lead Enters Nurture', config: {} },
        { type: 'email', category: 'channels', name: 'Intro Email', config: { subject: `Discover what ${name} can do` } },
        { type: 'wait', category: 'flow_control', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Opened Intro?', config: { condition_type: 'email_opened', time_window: 3 } },
        { type: 'email', category: 'channels', name: 'Deep Dive Email', config: { subject: 'How customers succeed with us' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 4 Days', config: { wait_time: 4, wait_unit: 'days' } },
        { type: 'email', category: 'channels', name: 'Social Proof Email', config: { subject: 'See what others are saying' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 3 Days', config: { wait_time: 3, wait_unit: 'days' } },
        { type: 'email', category: 'channels', name: 'CTA Email', config: { subject: 'Ready to get started?' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else if (/multi.?channel|full.?funnel|mixed|showcase|demo|email.*sms.*push|all.?channels/i.test(lowerName)) {
      // Rich mix: targeting (segment, filter, exclude), split, channels (email, sms, push), wait, condition, goal
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Campaign Trigger', config: {} },
        { type: 'segment', category: 'targeting', name: 'Target Segment', config: { action: 'include', criteria: 'Active subscribers' } },
        { type: 'filter', category: 'targeting', name: 'Filter Opt-ins', config: { filter_field: 'email_opt_in', operator: 'equals', filter_value: 'true' } },
        { type: 'exclude', category: 'targeting', name: 'Exclude Converted', config: { action: 'exclude', criteria: 'Already purchased in last 30 days' } },
        { type: 'split', category: 'targeting', name: 'A/B Test Subject', config: { split_ratio: 50 } },
        { type: 'email', category: 'channels', name: 'Main Email', config: { subject: `${name} — personalized for you` } },
        { type: 'wait', category: 'flow_control', name: 'Wait 1 Day', config: { wait_time: 1, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Opened or Clicked?', config: { condition_type: 'email_opened', time_window: 1 } },
        { type: 'sms', category: 'channels', name: 'SMS Follow-up', config: { message: 'You might have missed our last message. Check it out — offer inside!' } },
        { type: 'wait', category: 'flow_control', name: 'Wait 2 Days', config: { wait_time: 2, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Converted?', config: { condition_type: 'purchased', time_window: 2 } },
        { type: 'push', category: 'channels', name: 'Push Reminder', config: {} },
        { type: 'goal', category: 'tracking', name: 'Track Conversion', config: { goal_type: 'purchase' } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    } else {
      // Generic flow based on name
      mockFlow = [
        { type: 'entry', category: 'flow', name: 'Campaign Start', config: {} },
        { type: 'segment', category: 'targeting', name: 'Target Audience', config: { action: 'include', criteria: description || 'Matching contacts' } },
        { type: 'email', category: 'channels', name: `${name} Email`, config: { subject: name } },
        { type: 'wait', category: 'flow_control', name: 'Wait 2 Days', config: { wait_time: 2, wait_unit: 'days' } },
        { type: 'condition', category: 'flow_control', name: 'Engaged?', config: { condition_type: 'email_opened', time_window: 2 } },
        { type: 'email', category: 'channels', name: 'Follow-up Email', config: { subject: `Reminder: ${name}` } },
        { type: 'exit', category: 'flow', name: 'Exit', config: {} }
      ];
    }

    res.json({
      flow: mockFlow,
      source: 'mock',
      message: 'Using intelligent mock. Add OPENAI_API_KEY for full AI generation.'
    });
  } catch (error) {
    console.error('Error suggesting flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── AI-powered workflow optimization ──────────────────────────
router.post('/optimize-flow', async (req, res) => {
  try {
    const { name, description, nodes: currentNodes, connections: currentConnections } = req.body;

    if (!currentNodes || currentNodes.length === 0) {
      return res.status(400).json({ error: 'No nodes on canvas to optimize' });
    }

    // Build a readable summary of the current flow
    const nodesSummary = currentNodes.map((n, i) => {
      const config = n.config || {};
      let detail = '';
      if (n.type === 'wait' && config.wait_time) detail = ` (${config.wait_time} ${config.wait_unit || 'hours'})`;
      if (n.type === 'email' && config.subject) detail = ` (subject: "${config.subject}")`;
      if (n.type === 'sms' && config.message) detail = ` (msg: "${config.message.slice(0, 40)}")`;
      if (n.type === 'condition' && config.condition_type) detail = ` (check: ${config.condition_type})`;
      if (n.type === 'split' && config.split_ratio) detail = ` (${config.split_ratio}/${100 - config.split_ratio})`;
      return `  ${i + 1}. [${n.type}] "${n.name}"${detail}`;
    }).join('\n');

    const connectionsSummary = (currentConnections || []).map(c => {
      const fromNode = currentNodes.find(n => n.id === c.from);
      const toNode = currentNodes.find(n => n.id === c.to);
      return `  ${fromNode?.name || c.from} → ${toNode?.name || c.to}`;
    }).join('\n');

    const prompt = `Analyze this marketing automation workflow and provide optimization recommendations.

Workflow: "${name || 'Untitled'}"${description ? `\nDescription: "${description}"` : ''}

Current nodes (${currentNodes.length}):
${nodesSummary}

Current connections:
${connectionsSummary || '  (none)'}

Provide your analysis as a JSON object with these fields:
- "issues": array of objects, each with "severity" ("critical"|"warning"|"info"), "message" (short description), and "suggestion" (what to do)
- "score": number 1-100 rating the flow quality
- "improved_flow": an optimized version as a JSON array of nodes, each with "type", "name", "config" (same format as suggest-flow). Only include this if you have meaningful improvements. Keep existing good nodes but improve ordering, add missing nodes, fix timing, etc.

Available node types: entry, exit, segment, filter, exclude, split, query, build_audience, deduplication, enrichment, save_audience, wait, condition, scheduler, fork, email, sms, push, webhook, goal, alert

Best practices to check:
- Must start with entry and end with exit
- Wait nodes between consecutive channel sends (min 1h, recommended 24h for emails)
- Conditions after channel sends to check engagement
- A/B testing for message optimization
- Goal tracking for conversion measurement
- Exclude nodes to prevent over-messaging
- Appropriate timing for the campaign type

Return ONLY valid JSON, no markdown or explanation.`;

    const result = await callOpenAI(prompt,
      'You are a marketing automation optimization expert. Analyze workflows and provide actionable improvement suggestions. Return only valid JSON — no markdown, no code fences.');

    let analysis = null;
    if (result) {
      try {
        const cleaned = result.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
        analysis = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[AI] Failed to parse optimization JSON:', parseErr.message);
      }
    }

    if (analysis) {
      // Validate improved_flow if present
      if (analysis.improved_flow && Array.isArray(analysis.improved_flow)) {
        analysis.improved_flow = analysis.improved_flow
          .filter(n => n && n.type && VALID_NODE_TYPES[n.type])
          .map(n => ({
            type: n.type,
            category: VALID_NODE_TYPES[n.type]?.category || 'flow',
            name: String(n.name || n.type).slice(0, 40),
            config: n.config && typeof n.config === 'object' ? n.config : {}
          }));
        // Ensure entry/exit
        if (analysis.improved_flow.length > 0 && analysis.improved_flow[0].type !== 'entry') {
          analysis.improved_flow.unshift({ type: 'entry', category: 'flow', name: 'Entry Point', config: {} });
        }
        if (analysis.improved_flow.length > 0 && analysis.improved_flow[analysis.improved_flow.length - 1].type !== 'exit') {
          analysis.improved_flow.push({ type: 'exit', category: 'flow', name: 'Exit', config: {} });
        }
      }
      return res.json({ ...analysis, source: 'openai' });
    }

    // ── Mock fallback: rule-based analysis ──
    const issues = [];
    let score = 70;
    const nodeTypes = currentNodes.map(n => n.type);

    // Check for entry/exit
    if (!nodeTypes.includes('entry')) {
      issues.push({ severity: 'critical', message: 'Missing Entry node', suggestion: 'Add an Entry node at the start of your flow' });
      score -= 15;
    }
    if (!nodeTypes.includes('exit')) {
      issues.push({ severity: 'warning', message: 'Missing Exit node', suggestion: 'Add an Exit node to cleanly end the flow' });
      score -= 5;
    }

    // Check for consecutive channel sends without waits
    for (let i = 0; i < currentNodes.length - 1; i++) {
      const curr = currentNodes[i];
      const next = currentNodes[i + 1];
      const channelTypes = ['email', 'sms', 'push', 'direct_mail'];
      if (channelTypes.includes(curr.type) && channelTypes.includes(next.type)) {
        issues.push({
          severity: 'critical',
          message: `Back-to-back sends: "${curr.name}" → "${next.name}"`,
          suggestion: 'Add a Wait node (min 24h for email, 1h for SMS) between consecutive messages to avoid overwhelming recipients'
        });
        score -= 10;
      }
    }

    // Check for missing conditions after sends
    const channelNodes = currentNodes.filter(n => ['email', 'sms', 'push'].includes(n.type));
    const conditionNodes = currentNodes.filter(n => n.type === 'condition');
    if (channelNodes.length > 1 && conditionNodes.length === 0) {
      issues.push({
        severity: 'warning',
        message: 'No engagement checks',
        suggestion: 'Add Condition nodes after sends to check opens/clicks and branch accordingly'
      });
      score -= 10;
    }

    // Check for A/B testing
    if (channelNodes.length >= 2 && !nodeTypes.includes('split') && !nodeTypes.includes('random')) {
      issues.push({
        severity: 'info',
        message: 'No A/B testing',
        suggestion: 'Add a Split node before your key message to test different versions and improve performance'
      });
      score -= 5;
    }

    // Check for goal tracking
    if (!nodeTypes.includes('goal')) {
      issues.push({
        severity: 'info',
        message: 'No goal tracking',
        suggestion: 'Add a Goal node to measure conversion rates and ROI'
      });
      score -= 5;
    }

    // Check for targeting
    if (!nodeTypes.includes('segment') && !nodeTypes.includes('filter') && !nodeTypes.includes('query')) {
      issues.push({
        severity: 'warning',
        message: 'No audience targeting',
        suggestion: 'Add a Segment or Filter node after Entry to target the right audience'
      });
      score -= 10;
    }

    // Check wait durations
    const waitNodes = currentNodes.filter(n => n.type === 'wait');
    waitNodes.forEach(w => {
      const cfg = w.config || {};
      const hours = cfg.wait_unit === 'days' ? (cfg.wait_time || 0) * 24 : (cfg.wait_time || 0);
      if (hours < 1) {
        issues.push({
          severity: 'warning',
          message: `Very short wait: "${w.name}"`,
          suggestion: 'Wait times under 1 hour can trigger spam filters. Consider at least 1h for SMS, 24h for email.'
        });
      }
    });

    // Check for exclusion
    if (channelNodes.length > 2 && !nodeTypes.includes('exclude')) {
      issues.push({
        severity: 'info',
        message: 'No exclusion rules',
        suggestion: 'Add an Exclude node to suppress contacts who have already converted or unsubscribed'
      });
    }

    // Build improved flow if there are critical issues
    let improved_flow = null;
    if (issues.some(i => i.severity === 'critical') && currentNodes.length >= 2) {
      improved_flow = [];
      for (let i = 0; i < currentNodes.length; i++) {
        const n = currentNodes[i];
        improved_flow.push({
          type: n.type,
          category: VALID_NODE_TYPES[n.type]?.category || n.category || 'flow',
          name: n.name,
          config: n.config || {}
        });
        // Insert wait between consecutive channel sends
        const next = currentNodes[i + 1];
        const channelTypes = ['email', 'sms', 'push', 'direct_mail'];
        if (next && channelTypes.includes(n.type) && channelTypes.includes(next.type)) {
          improved_flow.push({
            type: 'wait',
            category: 'flow_control',
            name: n.type === 'sms' ? 'Wait 2 Hours' : 'Wait 1 Day',
            config: { wait_time: n.type === 'sms' ? 2 : 1, wait_unit: n.type === 'sms' ? 'hours' : 'days' }
          });
          // Add engagement check
          improved_flow.push({
            type: 'condition',
            category: 'flow_control',
            name: `Check ${n.type === 'email' ? 'Opened' : 'Engaged'}`,
            config: { condition_type: n.type === 'email' ? 'email_opened' : 'engaged', time_window: 1 }
          });
        }
      }
      // Add goal if missing
      if (!nodeTypes.includes('goal')) {
        const exitIdx = improved_flow.findIndex(n => n.type === 'exit');
        if (exitIdx > 0) {
          improved_flow.splice(exitIdx, 0, { type: 'goal', category: 'tracking', name: 'Track Conversion', config: {} });
        }
      }
    }

    score = Math.max(10, Math.min(100, score));

    if (issues.length === 0) {
      issues.push({ severity: 'info', message: 'Flow looks good!', suggestion: 'No major issues found. Consider A/B testing your key messages for continuous improvement.' });
      score = 85;
    }

    res.json({
      issues,
      score,
      improved_flow,
      source: 'mock',
      message: 'Rule-based analysis. Add OPENAI_API_KEY for deeper AI optimization.'
    });
  } catch (error) {
    console.error('Error optimizing flow:', error);
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════
// AI AGENT CHAT — Application-aware assistant
// ══════════════════════════════════════════════════════

const APP_KNOWLEDGE = `You are an AI assistant for a B2C Marketing Automation Platform. The application has these features:

NAVIGATION (sidebar):
- Dashboard: overview metrics, charts, KPIs
- Explorer: folder-based navigation of all entities (Adobe-style tree browser)
- Campaign Management → Workflows (orchestration canvas), Deliveries (email/SMS/push)
- Event Messaging → Events & Messages (transactional), Event History
- Content Management → Content Templates, Asset Library, Landing Pages, Fragments, Brands
- Customer Management → Profiles (Contacts), Audiences, Subscription Services, Predefined Filters
- Offer Decisioning → Offers, Placements, Collections, Decision Rules; Strategy Setup (Selection Strategies, Ranking Formulas, AI Models); Configuration (Item Catalog, Context Data); Decisions, Offer Analytics
- Data & Configuration → Segments, Custom Objects, Enumerations, Query Service, Analytics, AI Features, API Documentation

ALL FEATURES (comprehensive):

1. DASHBOARD: KPI cards (contacts, active workflows, email performance, revenue), trend charts, drill-down links. Navigate to Dashboard from sidebar.

2. EXPLORER: Adobe-style folder tree. Browse all entities by folder. Drag-and-drop items between folders. Entity cards with type icons. Create folders, rename, delete. Supports all entity types.

3. CONTACTS (Profiles): Full B2C profile management. Fields: name, email, phone, city, country, lead_score, lifecycle_stage, subscription status, interests, engagement level, LTV, loyalty tier. CRUD operations, advanced search, filters (status, subscription, engagement, lifecycle). Contact detail shows events timeline, order history, stats (total orders, spend, avg order value). Import/export contacts.

4. SEGMENTS: Rule-based audience builder. Segment Builder UI with: attribute library (customer + custom object fields), drag-and-drop attributes, AND/OR logic between rules, type-aware operators (text: equals/contains/starts_with, number: greater_than/less_than/between, date: before/after/between, boolean: is_true/is_false, select: in/not_in). Preview with count, sample results, stats. SQL preview. Distribution analysis by attribute. Status lifecycle: draft, active, archived. Base entity: customer or custom objects.

5. AUDIENCES: Segment-based audience definitions. Include/exclude segments with custom filters ($eq, $gte, $lte, $contains, etc.). Estimate member count. CSV import of contacts. CRUD operations.

6. WORKFLOWS: Three types — Broadcast (one-time campaigns), Automated (trigger-based journeys), Recurring (scheduled). CRUD, activate/pause/complete/archive. Each workflow links to an orchestration canvas. Report with metrics (targeted, sent, opens, clicks, bounces, conversions, revenue). Heatmap visualization. Templates available.

7. WORKFLOW ORCHESTRATION: Visual drag-and-drop canvas for building customer journeys. 30+ activity types in categories:
   - Entry/Exit: Entry, Exit, Stop
   - Targeting: Query, Build Audience, Segment, Filter, Exclude, Combine, Deduplication, Enrichment, Incremental Query, Reconciliation, Save Audience, Split, Change Dimension, Change Data Source
   - Flow Control: Scheduler, Wait, Condition, Random Split, Fork, Jump, External Signal
   - Intelligence: Alert, Offer Decision, A/B Test
   - Channels: Email, SMS, Push, Direct Mail, Webhook
   Canvas features: pan/zoom, auto-layout, connections, toolbar (start/stop/restart/zoom/fit/layout), properties panel for node config. AI assistant for flow suggestions and optimization. Execution with visual feedback.

8. DELIVERIES: Multi-channel message sending (Email, SMS, Push). 5-step wizard: Properties (name, channel, scheduling, STO, wave sending) → Audience (segment/audience targeting) → Content (email designer, SMS/push editor) → Review & Proof (send test emails) → Summary. Features:
   - Send Time Optimization (STO): AI-powered per-recipient timing, models (Engagement History, Open Time Prediction, Click Time Prediction, Timezone-Aware), delivery window (6-72h)
   - Wave Sending: split audience into 2-5 waves at intervals (15min-24h), ramp types (linear, exponential, front-loaded, equal)
   - A/B Testing: two content variants, split percentage, winner rules (open rate, click rate), guardrails
   - Personalization: merge fields from contact profile, conditional content
   - Offer Blocks: embed decisioning offers in email content
   - Brevo/SMTP Integration: real email sending via Brevo (Sendinblue) or simulation mode
   - Report: sent/delivered/opened/clicked/bounced/unsubscribed/converted/revenue metrics, engagement timeline chart, device breakdown, top links, geographic breakdown, recipient lists (engaged/non-engaged/bounced)
   - Heatmap: visual click/engagement heatmap on email content with AI recommendations
   - Proof: send test emails before full send
   - Export: PDF and CSV report export

9. TRANSACTIONAL MESSAGING: Event-driven real-time messages. Three components:
   - Event Templates: define event schemas with attributes (name, type), identity fields, delivery config. Enable/disable. Create events from templates.
   - Event Instances: specific events created from templates. Publish/unpublish. Linked to messages.
   - Event Messages: multi-channel (email, SMS, push) messages triggered by events. Recipient modes (event data, audience). Publish/unpublish lifecycle. Report with metrics. Dashboard KPIs: events received, messages sent, delivered, failed, active messages, avg latency.
   - Event History: log of all triggered events with filters (event type, status, channel).

10. CONTENT TEMPLATES: Reusable email templates. Block-based editor. Create, edit, duplicate, delete. Import HTML or ZIP (with asset extraction). Categories and folder support.

11. FRAGMENTS: Reusable content blocks that can be inserted into email designs. Create, edit, delete. Versioning support. Search by name.

12. BRANDS: Brand configuration entities. Define brand properties (name, logo, colors, etc.) for consistent branding across deliveries.

13. LANDING PAGES: Web landing pages. Create with name, slug (URL path), content, status. CRUD operations. Used for campaign destinations.

14. ASSET LIBRARY: File/image management. Upload assets (images, files). Filter by type (image/file). Search by name. Delete assets. Assets stored in /uploads directory. Used across email designer, templates, and content.

15. EMAIL DESIGNER: Full drag-and-drop visual email editor. Components: Text, Image, Button, Divider, Spacer, HTML, Columns, Social Links, Offers. Left rail tabs: Components, Fragments, Structure, Links, Asset Library, Conditional content. Canvas with Design/Preview tabs. Device preview (Desktop/Tablet/Mobile). Properties panel for subject, preheader, language. AI panel for content generation (subject, preheader, body, button text, image suggestions). Toolbar: zoom, device preview, simulate, preview, undo/redo, save. More menu: reset, save as fragment, import HTML, code editor, change design, save as template, export HTML, validate. Inline formatting toolbar (bold, italic, underline, font size, alignment). Personalization with schema tree. Code editor for raw HTML.

16. CUSTOM OBJECTS: User-defined data entities. Create with name, label, fields (text, number, boolean, date, select/enum). Relationships (1:N, N:1, N:N) between objects and contacts. DDL/SQL import to create objects from SQL CREATE TABLE statements. Data management: add/edit/delete records, CSV bulk import. UI Builder: design custom record layouts with drag-and-drop, draft/publish workflow, version history with restore. ER Diagram shows all objects and relationships.

17. ENUMERATIONS: Dropdown value lists. System enumerations (predefined) and custom enumerations. Each has values with key, label, and optional color. Used in segment builder, custom object fields, forms.

18. QUERY SERVICE: Two modes — Structured Query Builder (pick table, add filters, select columns, aggregates) and SQL Mode (write raw SQL-like queries). Schema explorer shows all tables and fields. Execute queries and view results. Supports JOINs, GROUP BY, aggregates (COUNT, SUM, AVG, MIN, MAX).

19. ANALYTICS: Dashboard with KPIs, trend charts, and drill-down pages. Drill-downs: Customers (lifecycle breakdown, top customers, trends), Campaigns (workflow performance), Email (open/click/conversion rates), Revenue (by period, products). Channel-level analytics (email vs SMS vs push performance comparison).

20. AI FEATURES: Multiple AI-powered capabilities:
    - Subject Line Generation: generate compelling email subject lines for any product/audience/tone
    - SMS/Push Composition: generate/refine SMS and push notification text with tone and length options
    - Churn Prediction: predict churn risk per customer based on order history and engagement patterns, with recommendations
    - Product Recommendations: suggest products customer hasn't purchased
    - Send Time Optimization: compute best send time per customer from open patterns
    - Next Best Action: determine optimal next marketing action per customer (first purchase incentive, win-back, VIP exclusive, cross-sell, general promo)
    - Auto-Segmentation: automatically cluster customers into segments (High-Value VIPs, Regular Buyers, One-Time Buyers, At-Risk Churners, Leads)
    - Content Generation: generate email body content with AI
    - Workflow Flow Suggestion: AI-generated workflow structures from description
    - Workflow Optimization: analyze and improve existing workflow flows with scoring and suggestions
    - AI Agent Chat: conversational assistant that answers questions about the platform, queries live data, provides navigation help

21. HEATMAPS: Visual engagement heatmaps for deliveries and workflows. Shows click/open patterns overlaid on email content. AI-powered recommendations for improving engagement. Available from delivery and workflow reports. Aggregate heatmap across all deliveries.

22. ER DIAGRAM: Entity-Relationship diagram viewer. Shows all database tables, fields, and relationships. Toggle layers: Core tables, Decisioning tables. Toggle attributes/relationships visibility. Crow's foot notation for relationship cardinality (1:N, N:1, N:N). Dynamic display of custom attributes from Item Catalog. Fullscreen mode with scrolling. Export: PNG image, PDF, SVG, print.

23. FOLDER SYSTEM: Adobe-style hierarchical folder organization. Entity types: Profiles & Targets, Campaign Management, Content Management, Offer Decisioning, Data & Segments. Create/rename/delete folders. Move items between folders via drag-and-drop. Folder tree sidebar on listing pages. Breadcrumb navigation. Explorer view for browsing.

24. SUBSCRIPTION SERVICES: Manage subscription lists. Create services with name and description. Track subscriber counts. Used for managing opt-in/opt-out preferences.

25. PREDEFINED FILTERS: Saved filter configurations for reuse across the platform. Create with name, entity type, and filter conditions. Apply to listing pages for quick filtering.

26. API DOCUMENTATION: Built-in OpenAPI/Swagger documentation at /api endpoint. Lists all available API endpoints with descriptions.

27. BREVO (EMAIL PROVIDER) INTEGRATION: Configure Brevo (Sendinblue) SMTP for real email delivery. Toggle enabled/disabled. View connection status. Configure API key and sender details. Falls back to simulation mode when disabled.

COMMON TASKS:
- Create delivery: Campaign Management → Deliveries → + Create Delivery → 5-step wizard (Properties, Audience, Content, Review, Summary)
- Create workflow: Campaign Management → Workflows → + Create → fill form → Open Orchestration → drag-and-drop activities on canvas
- Create segment: Data & Configuration → Segments → + Create Segment → add conditions with segment builder → preview → save
- Create audience: Customer Management → Audiences → + Create → include/exclude segments → add filters → estimate
- Create contact: Customer Management → Profiles → + Create Contact → fill profile fields
- Create content template: Content Management → Content Templates → + Create → design with email designer
- Create fragment: Content Management → Fragments → + Create → build reusable content block
- Upload asset: Content Management → Asset Library → Upload → select file
- Create custom object: Data & Configuration → Custom Objects → + Create (or Import DDL) → define fields and relationships
- Create enumeration: Data & Configuration → Enumerations → + Create → add key/label/color values
- Run query: Data & Configuration → Query Service → build query (structured or SQL) → execute
- View analytics: Data & Configuration → Analytics → view dashboard KPIs → drill down
- View ER diagram: Data & Configuration → Custom Objects → ER Diagram button → toggle layers
- Create transactional template: Event Messaging → Events & Messages → Event Templates tab → + Create → define attributes
- Create event message: Event Messaging → Events & Messages → Messages tab → + Create → configure channel and content
- Create offer: Offer Decisioning → Offers → + Create → set type, priority, eligibility (all/rule/audience), capping rules, representations per placement, custom attributes
- Create placement: Offer Decisioning → Placements → + Create → set name, channel (email/web/mobile), content type, dimensions
- Create collection: Offer Decisioning → Collections → + Create → static (pick offers) or dynamic (tags + attribute conditions with live preview)
- Create decision rule: Offer Decisioning → Decision Rules → + Create → add conditions using segment-builder UI with per-condition AND/OR logic
- Create ranking formula: Offer Decisioning → Ranking Formulas → + Create → write expression in IDE-like editor with variable insertion and testing
- Create strategy: Offer Decisioning → Selection Strategies → + Create → pick collection + eligibility + ranking method (priority/formula/AI model)
- Create decision: Offer Decisioning → Decisions → + Create → add placements, assign strategies per placement, set fallback offers, configure arbitration
- Run simulation: Inside a Decision → click Simulate → specify profile count, context data → view proposed offers with scores
- View heatmap: Go to delivery/workflow report → click Heatmap button
- Create folder: Use Explorer or folder tree sidebar on any listing page
- Configure email provider: Settings → Email Provider → configure Brevo API key and sender

TERMINOLOGY:
- Contact/Profile = a B2C customer record with demographics, engagement data, lifecycle stage, loyalty tier
- Delivery = a message sent to an audience via email, SMS, or push (like a campaign send)
- Workflow = an automated customer journey (broadcast, automated, or recurring). Contains an orchestration canvas.
- Orchestration = the visual drag-and-drop canvas where you build workflow logic with connected activity nodes
- Segment = a filtered subset of contacts based on rules (AND/OR conditions on profile attributes)
- Audience = a defined target group based on included/excluded segments plus custom filters
- Content Template = a reusable email design that can be applied to deliveries
- Fragment = a reusable content block (header, footer, etc.) insertable into email designs
- Brand = a configuration entity defining brand identity (name, logo, colors) for consistent messaging
- Landing Page = a web page with a URL slug used as a campaign destination
- Asset = an uploaded file (image or document) available across the email designer and content
- Custom Object = a user-defined data entity with custom fields and relationships to other objects/contacts
- Enumeration = a dropdown value list (system or custom) with key, label, and color for each value
- Predefined Filter = a saved filter configuration for quick reuse on listing pages
- Subscription Service = an opt-in list for managing subscriber preferences
- Event Template = a schema definition for transactional events with attributes and delivery config
- Event Instance = a specific event created from a template, can be published to receive triggers
- Event Message = a transactional message (email/SMS/push) triggered by an event
- Offer = a personalized content piece with priority, eligibility, advanced capping, and representations per placement
- Placement = a named slot where an offer appears (channel: email/web/mobile, content type: HTML/image/text/JSON)
- Collection Qualifier = a tag/label for grouping offers (e.g., "Summer Sale", "VIP Only")
- Collection = a group of offers — static (manually selected) or dynamic (auto-populated by tag match and/or attribute conditions)
- Decision Rule = a reusable eligibility rule built with segment-builder conditions (supports mixed AND/OR per condition)
- Selection Strategy = collection (which offers) + eligibility constraint (rule or audience) + ranking method (priority, formula, or AI)
- Ranking Formula = custom math expression scoring offers using offer/profile/context variables (e.g., "offer.priority * 0.6 + profile.engagement_score * 0.4")
- AI Ranking Model = ML model predicting best offer per user (CTR, conversion, revenue optimization)
- Decision = a policy combining placements + strategies per placement + fallback offers + arbitration settings
- Arbitration = resolving competing offers: method (Priority/Weighted/AI), deduplication, tiebreak (Random/Recent/Least Shown), suppression window, global limit
- Item Catalog = extensible schema for offers with custom attributes (text/number/boolean/date/url/enum/json/asset)
- Context Schema = runtime context variables for decisioning (e.g., page_category, device_type, time_of_day)
- Advanced Capping = multi-rule frequency caps per offer — event type (impression/click/conversion/any), cap count (fixed or expression), period (hourly/daily/weekly/monthly/lifetime/custom), granular reset
- Content Experimentation = A/B testing on strategies within a decision with traffic split and confidence threshold
- Simulation = test a decision against sample profiles with context data to preview selected offers with scores
- Proposition = log of which offer was proposed to which contact, on which placement, with what score
- Offer Analytics = performance metrics for decisions and offers (impressions, clicks, conversions, CTR)
- STO = Send Time Optimization (AI-powered per-recipient send timing using engagement history)
- Wave Sending = splitting audience into multiple waves sent at intervals for controlled rollout
- Heatmap = visual overlay showing click/engagement patterns on email content
- ER Diagram = entity-relationship diagram showing all database tables, fields, and relationships with crow's foot notation
- Query Service = built-in query tool with SQL mode and structured query builder for ad-hoc data analysis

OFFER DECISIONING — DETAILED GUIDE:

1. ITEM CATALOG: Navigate to Offers → "Item Catalog" tab. Define custom attributes (name, type, description) that extend all offers. Types: text, number, boolean, date, url, enum, json, asset. These appear as fields on every offer form and can be used in dynamic collection filters and ranking formulas.

2. OFFERS: Create at Offers → + Create. Set type (personalized/fallback), priority (1-100, higher = preferred), eligibility (all visitors / decision rule / audience-based with AND/OR logic), representations per placement, advanced capping rules (multiple rules stacking), and custom attribute values from the Item Catalog. Status lifecycle: draft → submitted → approved → live → archived. Only approved/live offers enter decisioning.

3. PLACEMENTS: Create at Placements → + Create. Define name, channel (email/web/mobile), content type (HTML/image/text/JSON), and optional dimensions. Placements define WHERE offers appear.

4. COLLECTION QUALIFIERS: Tags tab under Collections. Create labels like "Summer Sale", "VIP Only". Assign to offers. Used by dynamic collections.

5. COLLECTIONS: Create at Collections → + Create. Static = manually pick offers. Dynamic = auto-include offers matching selected tags and/or attribute conditions (e.g., discount_percentage > 20). Live preview panel shows matching offers with count.

6. DECISION RULES: Create at Decision Rules → + Create. Segment-builder-style UI with conditions (entity/attribute/operator/value). Supports per-condition AND/OR connectors for mixed logic like "(A AND B) OR (C AND D)". AND binds tighter than OR. Reusable across offers and strategies.

7. SELECTION STRATEGIES: Create at Strategies → + Create. Combine: collection (offer pool) + eligibility constraint (optional rule or audience filter) + ranking method. Ranking methods: Priority (by offer.priority field), Formula (custom expression), AI Model (ML-based scoring).

8. RANKING FORMULAS: Create at Strategies → Ranking Formulas tab. IDE-like editor with variable insertion sidebar. Variables organized by category: Offer (priority, cost, custom attributes), Profile (engagement_score, lifetime_value, purchase_count, age), Context (from context schema). Test panel for real-time score computation. Example: "offer.priority * 0.6 + profile.engagement_score * 0.4" — for offer with priority=80 and engagement=90, score = 48+36 = 84.

9. AI RANKING MODELS: Strategies → AI Models tab. Pre-configured ML models (CTR Prediction, Conversion Prediction, Revenue Optimization) with status and endpoint. Engine calls model with offer+profile+context and uses returned score.

10. DECISIONS: Create at Decisions → + Create. Add placements, assign strategies and fallback offers per placement. Configure arbitration: method (Priority Order/Weighted Score/AI-Optimized), deduplication (on/off), tiebreak (Random/Most Recent/Least Shown), suppression window (hours), global offer limit. Multi-item return per placement.

11. SIMULATION: Inside a Decision → Simulate button. Specify profile count and context data values. Engine runs full pipeline: collection → eligibility → capping → ranking → arbitration. Results show selected offers per placement with scores and reasons.

12. CONTEXT DATA: Strategies → Context Data tab. Define runtime variables (name, type, description) available in ranking formulas and eligibility evaluation. Examples: page_category (string), device_type (string), cart_value (number).

13. EXPERIMENTATION: Within a Decision, enable A/B testing on strategies per placement. Configure traffic split and confidence threshold. Track variant performance.

14. APPROVAL WORKFLOW: Offers lifecycle: Draft → Submitted → Approved → Live → Archived. Only approved/live offers are eligible for decisioning.

SAMPLE END-TO-END FLOW:
1. Define Item Catalog attributes (e.g., discount_percentage, product_category)
2. Create Placements (e.g., "Homepage Banner", "Email Hero")
3. Create Collection Qualifiers/tags (e.g., "Summer Sale")
4. Create Offers with priority, eligibility, capping, representations, tags, custom attributes
5. Create Collections (e.g., dynamic "Summer Deals" = offers tagged "Summer Sale" with discount > 15)
6. Create Decision Rules (e.g., "Engaged Users" = purchase_count > 2 AND days_since_last_purchase < 30)
7. Create Ranking Formula (e.g., "offer.priority * 0.5 + offer.discount_percentage * 0.3 + profile.engagement_score * 0.2")
8. Create Selection Strategy (collection + rule + formula)
9. Create Decision (placements + strategies + fallback + arbitration)
10. Simulate to verify, then set Live

Answer questions helpfully. If asked about data, provide what you can from context. Keep responses concise but complete.`;

router.post('/agent-chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const { query: dbQuery } = require('../database');
    let dataContext = '';

    // Detect data-related questions and fetch live data
    const lower = message.toLowerCase();

    // ── Detect entity + optional status filter ──────────────
    const entityMap = {
      contacts:             { table: 'contacts',             aliases: /\bcontacts?\b|\bprofiles?\b|\bcustomers?\b/ },
      workflows:            { table: 'workflows',            aliases: /\bworkflows?\b|\bjourneys?\b|\bautomations?\b/ },
      deliveries:           { table: 'deliveries',           aliases: /\bdeliveri(?:es|y)\b|\bcampaigns?\b|\bsends?\b/ },
      segments:             { table: 'segments',             aliases: /\bsegments?\b/ },
      audiences:            { table: 'audiences',            aliases: /\baudiences?\b/ },
      content_templates:    { table: 'content_templates',    aliases: /\bcontent.?templates?\b|\bemail.?templates?\b/ },
      landing_pages:        { table: 'landing_pages',        aliases: /\blanding.?pages?\b/ },
      fragments:            { table: 'fragments',            aliases: /\bfragments?\b/ },
      brands:               { table: 'brands',               aliases: /\bbrands?\b/ },
      assets:               { table: 'assets',               aliases: /\bassets?\b/ },
      subscription_services:{ table: 'subscription_services',aliases: /\bsubscription.?services?\b|\bsubscriptions?\b/ },
      predefined_filters:   { table: 'predefined_filters',   aliases: /\bpredefined.?filters?\b/ },
      custom_objects:        { table: 'custom_objects',        aliases: /\bcustom.?objects?\b/ },
      enumerations:         { table: 'enumerations',         aliases: /\benumerations?\b|\benums?\b/ },
      products:             { table: 'products',             aliases: /\bproducts?\b/ },
      orders:               { table: 'orders',               aliases: /\borders?\b/ },
      transactional_messages:{ table: 'transactional_messages',aliases: /\btransactional.?messages?\b|\bevent.?messages?\b/ },
      event_triggers:       { table: 'event_triggers',       aliases: /\bevent.?templates?\b|\bevent.?triggers?\b/ },
      events:               { table: 'events',               aliases: /\bevent.?instances?\b/ },
      offers:               { table: 'offers',               aliases: /\boffers?\b/ },
      placements:           { table: 'placements',           aliases: /\bplacements?\b/ },
      collections:          { table: 'collections',          aliases: /\bcollections?\b/ },
      decision_rules:       { table: 'decision_rules',       aliases: /\bdecision.?rules?\b|\beligibility.?rules?\b/ },
      ranking_formulas:     { table: 'ranking_formulas',     aliases: /\branking.?formulas?\b/ },
      selection_strategies: { table: 'selection_strategies',  aliases: /\bselection.?strateg(?:y|ies)\b|\bstrateg(?:y|ies)\b/ },
      ranking_ai_models:    { table: 'ranking_ai_models',    aliases: /\bai.?models?\b|\branking.?models?\b/ },
      catalog_schema:       { table: 'catalog_schema',       aliases: /\bcatalog.?schema\b|\bitem.?catalog\b/ },
      context_schema:       { table: 'context_schema',       aliases: /\bcontext.?schema\b|\bcontext.?data\b/ },
      experiments:          { table: 'experiments',          aliases: /\bexperiments?\b/ },
      decisions:            { table: 'decisions',            aliases: /\bdecisions?\b/ },
      folders:              { table: 'folders',              aliases: /\bfolders?\b/ }
    };

    // Use word-boundary regex for status detection (prevents "live" matching inside "deliveries")
    const statusWords = ['draft','active','live','paused','stopped','completed','finished',
      'sent','sending','scheduled','archived','approved','pending','inactive','running','error','failed'];
    const detectedStatus = statusWords.find(s => new RegExp('\\b' + s + '\\b').test(lower));
    let detectedEntity = null;
    for (const [key, cfg] of Object.entries(entityMap)) {
      if (cfg.aliases.test(lower)) { detectedEntity = key; break; }
    }

    // ── Detect property/feature-based queries ──────────────
    const propertyQueries = [
      { pattern: /\bwave\s*send|\bwave.enabled|\bwaves?\b/i, field: 'wave_enabled', label: 'wave sending', filterFn: r => r.wave_enabled === true || r.wave_enabled === 1 || r.wave_enabled === 'true' },
      { pattern: /\bsto\b|\bsend.time.optim/i, field: 'sto_enabled', label: 'Send Time Optimization (STO)', filterFn: r => r.sto_enabled === true || r.sto_enabled === 1 || r.sto_enabled === 'true' },
      { pattern: /\ba\/?b.test|\bsplit.test/i, field: 'ab_testing', label: 'A/B testing', filterFn: r => r.ab_testing_enabled === true || r.ab_testing_enabled === 1 },
      { pattern: /\bemail\b/i, field: 'channel', label: 'Email channel', filterFn: r => (r.channel || '').toLowerCase() === 'email', skipIfEntity: true },
      { pattern: /\bsms\b/i, field: 'channel', label: 'SMS channel', filterFn: r => (r.channel || '').toLowerCase() === 'sms', skipIfEntity: true },
      { pattern: /\bpush\b/i, field: 'channel', label: 'Push channel', filterFn: r => (r.channel || '').toLowerCase() === 'push', skipIfEntity: true }
    ];

    let detectedProperty = null;
    for (const pq of propertyQueries) {
      if (pq.pattern.test(lower)) {
        if (pq.skipIfEntity && !detectedEntity) continue;
        detectedProperty = pq;
        break;
      }
    }

    // Build rich data context for the detected entity
    if (detectedEntity) {
      const all = dbQuery.all(entityMap[detectedEntity].table);

      if (detectedProperty) {
        // Property-based filter (e.g., "deliveries with wave sending enabled")
        const filtered = all.filter(detectedProperty.filterFn);
        dataContext += `\n\n${detectedEntity} with ${detectedProperty.label} enabled: ${filtered.length} out of ${all.length} total.`;
        const sample = filtered.slice(0, 15).map(r => {
          const o = { id: r.id, name: r.name || r.label || r.first_name || ('ID ' + r.id), status: r.status };
          if (r.channel) o.channel = r.channel;
          if (r.type) o.type = r.type;
          if (r[detectedProperty.field] !== undefined) o[detectedProperty.field] = r[detectedProperty.field];
          return o;
        });
        dataContext += ` Items: ${JSON.stringify(sample)}`;
      } else if (detectedStatus) {
        // Status-based filter (e.g., "offers in draft status")
        const filtered = all.filter(r => (r.status || '').toLowerCase() === detectedStatus);
        dataContext += `\n\n${detectedEntity} with status "${detectedStatus}": ${filtered.length} out of ${all.length} total.`;
        const sample = filtered.slice(0, 15).map(r => {
          const o = { id: r.id, name: r.name || r.label || r.first_name || ('ID ' + r.id), status: r.status };
          if (r.channel) o.channel = r.channel;
          if (r.type) o.type = r.type;
          if (r.priority !== undefined) o.priority = r.priority;
          if (r.email) o.email = r.email;
          return o;
        });
        dataContext += ` Items: ${JSON.stringify(sample)}`;
      } else {
        // General entity query — provide status breakdown
        const byStatus = {};
        all.forEach(r => { const s = r.status || 'unknown'; byStatus[s] = (byStatus[s] || 0) + 1; });
        dataContext += `\n\n${detectedEntity}: ${all.length} total. By status: ${JSON.stringify(byStatus)}.`;
        // Also include feature flags summary for deliveries
        if (detectedEntity === 'deliveries') {
          const stoCount = all.filter(r => r.sto_enabled).length;
          const waveCount = all.filter(r => r.wave_enabled).length;
          dataContext += ` STO enabled: ${stoCount}. Wave sending enabled: ${waveCount}.`;
        }
        // Enrich offer data with decisioning fields
        if (detectedEntity === 'offers') {
          const byType = {};
          all.forEach(r => { const t = r.type || 'unknown'; byType[t] = (byType[t] || 0) + 1; });
          dataContext += ` By type: ${JSON.stringify(byType)}.`;
          const avgPriority = all.length > 0 ? (all.reduce((s, r) => s + (r.priority || 0), 0) / all.length).toFixed(1) : 0;
          dataContext += ` Average priority: ${avgPriority}.`;
        }
        // Enrich catalog_schema with attribute details
        if (detectedEntity === 'catalog_schema') {
          const attrDetails = all.map(r => ({ name: r.name, type: r.type, description: r.description }));
          dataContext += ` Attributes: ${JSON.stringify(attrDetails)}.`;
        }
        // Enrich ranking_formulas with expressions
        if (detectedEntity === 'ranking_formulas') {
          const formulaDetails = all.map(r => ({ id: r.id, name: r.name, expression: r.expression, status: r.status }));
          dataContext += ` Formulas: ${JSON.stringify(formulaDetails)}.`;
        }
        // Enrich selection_strategies with method info
        if (detectedEntity === 'selection_strategies') {
          const stratDetails = all.map(r => ({ id: r.id, name: r.name, ranking_method: r.ranking_method, collection_id: r.collection_id, status: r.status }));
          dataContext += ` Strategies: ${JSON.stringify(stratDetails)}.`;
        }
        const sample = all.slice(-10).map(r => {
          const o = { id: r.id, name: r.name || r.label || r.first_name || ('ID ' + r.id), status: r.status };
          if (r.channel) o.channel = r.channel;
          if (r.type) o.type = r.type;
          if (r.priority !== undefined) o.priority = r.priority;
          if (r.expression) o.expression = r.expression;
          if (r.ranking_method) o.ranking_method = r.ranking_method;
          if (r.collection_id) o.collection_id = r.collection_id;
          return o;
        });
        dataContext += ` Recent: ${JSON.stringify(sample)}`;
      }
    }

    // If no specific entity but asking for counts, provide all
    if (!detectedEntity && /how many|count|total|number of/i.test(lower)) {
      const counts = {};
      for (const [key, cfg] of Object.entries(entityMap)) {
        if (key === 'folders') continue;
        counts[key] = dbQuery.count(cfg.table);
      }
      dataContext += `\n\nAll entity counts: ${JSON.stringify(counts)}`;
    }

    // ── STO insights query (system-wide send time data) ──────────
    if (/\bsto\b|send.time.optim/i.test(lower) && /system|best|optimal|peak|when|data|insight|recommend|hour|day|time|on email|on sms|on push|by channel/i.test(lower)) {
      // Compute STO insights inline (same logic as the /sto-insights endpoint)
      const allDels = dbQuery.all('deliveries');
      if (allDels.length > 0) {
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        function _stoInsight(dels, chName) {
          if (!dels.length) return null;
          let tSent=0,tOpens=0,tClicks=0;
          dels.forEach(d=>{tSent+=d.sent||0;tOpens+=d.opens||0;tClicks+=d.clicks||0;});
          const hT=new Array(24).fill(0), dT=new Array(7).fill(0);
          for(let di=0;di<7;di++) for(let hi=0;hi<24;hi++){
            let os=0; dels.forEach(d=>{
              const seed=d.id*7+31; const rng=i=>{const x=Math.sin(seed+i)*10000;return x-Math.floor(x);};
              const pm=(hi>=9&&hi<=11)?2.5:(hi>=14&&hi<=16)?2.0:(hi>=19&&hi<=21)?1.8:(hi<6||hi>22)?0.2:1.0;
              const dm=(di===1||di===2)?1.4:(di>=5)?0.5:1.0;
              os+=Math.round((d.opens||0)/168*pm*dm*(0.6+rng(di*24+hi)*0.8));
            }); hT[hi]+=os; dT[di]+=os;
          }
          const topH=hT.map((v,i)=>({h:i,v})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>(x.h<10?'0':'')+x.h+':00');
          const topD=dT.map((v,i)=>({d:days[i],v})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.d);
          const worstH=hT.map((v,i)=>({h:i,v})).sort((a,b)=>a.v-b.v).slice(0,3).map(x=>(x.h<10?'0':'')+x.h+':00');
          const stoC=dels.filter(d=>d.sto_enabled).length;
          return{channel:chName,count:dels.length,sent:tSent,opens:tOpens,clicks:tClicks,
            avgOR:tSent>0?((tOpens/tSent)*100).toFixed(1):'0',
            bestHours:topH,bestDays:topD,avoidHours:worstH,stoAdoption:stoC};
        }
        const chGroups={email:[],sms:[],push:[]};
        allDels.forEach(d=>{const c=(d.channel||'email').toLowerCase();if(chGroups[c])chGroups[c].push(d);});
        
        // Determine which channel user is asking about
        let targetCh = 'all';
        if (/\bemail\b/i.test(lower)) targetCh = 'email';
        else if (/\bsms\b/i.test(lower)) targetCh = 'sms';
        else if (/\bpush\b/i.test(lower)) targetCh = 'push';
        
        const overall = _stoInsight(allDels, 'all');
        const byChannel = {};
        for (const [ch, dels] of Object.entries(chGroups)) {
          const ins = _stoInsight(dels, ch);
          if (ins) byChannel[ch] = ins;
        }
        
        const target = targetCh !== 'all' && byChannel[targetCh] ? byChannel[targetCh] : overall;
        const chLabel = targetCh === 'all' ? 'all channels' : targetCh.toUpperCase();
        
        dataContext += `\n\nSYSTEM STO INSIGHTS for ${chLabel} (based on ${target.count} deliveries, ${target.sent.toLocaleString()} messages sent):`;
        dataContext += `\n- Best send hours: ${target.bestHours.join(', ')}`;
        dataContext += `\n- Best send days: ${target.bestDays.join(', ')}`;
        dataContext += `\n- Avoid hours: ${target.avoidHours.join(', ')}`;
        dataContext += `\n- Avg open rate: ${target.avgOR}%`;
        dataContext += `\n- STO adoption: ${target.stoAdoption} of ${target.count} deliveries use STO`;
        if (Object.keys(byChannel).length > 0) {
          dataContext += '\n- By channel: ' + Object.entries(byChannel).map(([ch, d]) =>
            `${ch.toUpperCase()}: ${d.count} deliveries, best hours ${d.bestHours.join('/')}, best days ${d.bestDays.join('/')}, ${d.avgOR}% open rate`
          ).join('; ');
        }
        dataContext += '\nProvide this data in a well-formatted response with the actual numbers. Do NOT give a generic description of what STO is.';
      }
    }

    // Extra context for contacts when searching by name/email
    if (/contact/i.test(lower) && /find|search|look up|named|called/i.test(lower)) {
      const contacts = dbQuery.all('contacts').slice(0, 10).map(c => ({
        id: c.id, name: `${c.first_name} ${c.last_name}`, email: c.email, status: c.status
      }));
      dataContext += `\n\nSample contacts: ${JSON.stringify(contacts)}`;
    }

    // Try OpenAI
    const messages = [
      { role: 'system', content: APP_KNOWLEDGE + dataContext },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    let answer = null;
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
      try {
        const response = await axios.post(OPENAI_API_URL, {
          model: 'gpt-5.2',
          messages,
          temperature: 0.7,
          max_tokens: 800
        }, {
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
        });
        answer = response.data.choices[0].message.content;
      } catch (e) {
        console.error('[AI Agent] OpenAI error:', e.response?.status, e.response?.data?.error?.message || e.message);
      }
    }

    if (!answer) {
      answer = generateMockAgentResponse(message, lower, dbQuery);
    }

    res.json({ message: answer, source: answer && OPENAI_API_KEY ? 'openai' : 'mock' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateMockAgentResponse(message, lower, dbQuery) {
  // ── Entity + Status detection (reuse for data queries) ──
  const entityMap = {
    contacts:             { table: 'contacts',             label: 'Contacts',              aliases: /\bcontacts?\b|\bprofiles?\b|\bcustomers?\b/ },
    workflows:            { table: 'workflows',            label: 'Workflows',             aliases: /\bworkflows?\b|\bjourneys?\b|\bautomations?\b/ },
    deliveries:           { table: 'deliveries',           label: 'Deliveries',            aliases: /\bdeliveri(?:es|y)\b|\bcampaigns?\b|\bsends?\b/ },
    segments:             { table: 'segments',             label: 'Segments',              aliases: /\bsegments?\b/ },
    audiences:            { table: 'audiences',            label: 'Audiences',             aliases: /\baudiences?\b/ },
    content_templates:    { table: 'content_templates',    label: 'Content Templates',     aliases: /\bcontent.?templates?\b|\bemail.?templates?\b/ },
    landing_pages:        { table: 'landing_pages',        label: 'Landing Pages',         aliases: /\blanding.?pages?\b/ },
    fragments:            { table: 'fragments',            label: 'Fragments',             aliases: /\bfragments?\b/ },
    brands:               { table: 'brands',               label: 'Brands',                aliases: /\bbrands?\b/ },
    assets:               { table: 'assets',               label: 'Assets',                aliases: /\bassets?\b/ },
    subscription_services:{ table: 'subscription_services',label: 'Subscription Services', aliases: /\bsubscription.?services?\b|\bsubscriptions?\b/ },
    predefined_filters:   { table: 'predefined_filters',   label: 'Predefined Filters',    aliases: /\bpredefined.?filters?\b/ },
    custom_objects:       { table: 'custom_objects',        label: 'Custom Objects',        aliases: /\bcustom.?objects?\b/ },
    enumerations:         { table: 'enumerations',         label: 'Enumerations',          aliases: /\benumerations?\b|\benums?\b/ },
    products:             { table: 'products',             label: 'Products',              aliases: /\bproducts?\b/ },
    orders:               { table: 'orders',               label: 'Orders',                aliases: /\borders?\b/ },
    transactional_messages:{ table: 'transactional_messages',label: 'Transactional Messages',aliases: /\btransactional.?messages?\b|\bevent.?messages?\b/ },
    event_triggers:       { table: 'event_triggers',       label: 'Event Templates',       aliases: /\bevent.?templates?\b|\bevent.?triggers?\b/ },
    events:               { table: 'events',               label: 'Event Instances',       aliases: /\bevent.?instances?\b/ },
    offers:               { table: 'offers',               label: 'Offers',                aliases: /\boffers?\b/ },
    placements:           { table: 'placements',           label: 'Placements',            aliases: /\bplacements?\b/ },
    collections:          { table: 'collections',          label: 'Collections',           aliases: /\bcollections?\b/ },
    decision_rules:       { table: 'decision_rules',       label: 'Decision Rules',        aliases: /\bdecision.?rules?\b|\beligibility.?rules?\b/ },
    ranking_formulas:     { table: 'ranking_formulas',     label: 'Ranking Formulas',      aliases: /\branking.?formulas?\b/ },
    selection_strategies: { table: 'selection_strategies',  label: 'Selection Strategies',  aliases: /\bselection.?strateg(?:y|ies)\b|\bstrateg(?:y|ies)\b/ },
    ranking_ai_models:    { table: 'ranking_ai_models',    label: 'AI Ranking Models',     aliases: /\bai.?models?\b|\branking.?models?\b/ },
    catalog_schema:       { table: 'catalog_schema',       label: 'Catalog Schema',        aliases: /\bcatalog.?schema\b|\bitem.?catalog\b/ },
    context_schema:       { table: 'context_schema',       label: 'Context Schema',        aliases: /\bcontext.?schema\b|\bcontext.?data\b/ },
    experiments:          { table: 'experiments',          label: 'Experiments',           aliases: /\bexperiments?\b/ },
    decisions:            { table: 'decisions',            label: 'Decisions',             aliases: /\bdecisions?\b/ }
  };

  const statusWords = ['draft','active','live','paused','stopped','completed','finished',
    'sent','sending','scheduled','archived','approved','pending','inactive','running','error','failed'];
  const detectedStatus = statusWords.find(s => new RegExp('\\b' + s + '\\b').test(lower));
  let detectedEntity = null;
  for (const [key, cfg] of Object.entries(entityMap)) {
    if (cfg.aliases.test(lower)) { detectedEntity = key; break; }
  }

  // ── Property/feature-based queries ──────────────────
  const propertyQueries = [
    { pattern: /\bwave\s*send|\bwave.enabled|\bwaves?\b/i, label: 'wave sending', filterFn: r => r.wave_enabled === true || r.wave_enabled === 1 || r.wave_enabled === 'true' },
    { pattern: /\bsto\b|\bsend.time.optim/i, label: 'Send Time Optimization (STO)', filterFn: r => r.sto_enabled === true || r.sto_enabled === 1 || r.sto_enabled === 'true' },
    { pattern: /\ba\/?b.test|\bsplit.test/i, label: 'A/B testing', filterFn: r => r.ab_testing_enabled === true || r.ab_testing_enabled === 1 }
  ];
  let detectedProperty = null;
  for (const pq of propertyQueries) {
    if (pq.pattern.test(lower)) { detectedProperty = pq; break; }
  }

  // Navigation questions
  if (/where.*(create|make|new).*(delivery|email|campaign)/i.test(lower))
    return 'To create a new delivery, go to **Campaign Management → Deliveries** in the left sidebar, then click the **"+ Create Delivery"** button. You\'ll be guided through a 5-step wizard: Properties, Audience, Content, Review & Proof, and Summary.';
  if (/where.*(create|make|new).*(workflow|journey|automation)/i.test(lower))
    return 'To create a workflow, go to **Campaign Management → Workflows** in the left sidebar, then click **"+ Create"**. Fill in the name and details, then click **"Open Orchestration"** to open the visual canvas where you can drag and drop nodes to build your customer journey.';
  if (/where.*(create|make|new).*(segment)/i.test(lower) && !/audience/i.test(lower))
    return 'To create a segment, go to **Data & Configuration → Segments** in the left sidebar, then click **"+ Create Segment"**. Use the segment builder to add conditions with AND/OR logic, preview results, then save.';
  if (/where.*(create|make|new).*(offer)/i.test(lower))
    return 'To create an offer, go to **Offer Decisioning → Offers** in the left sidebar, then click **"+ Create Offer"**.\n\n**Steps:**\n1. **Name & Type:** Enter a name and choose Personalized (normal) or Fallback (guaranteed backup).\n2. **Priority:** Set a numeric priority (1-100). Higher values = more preferred in ranking.\n3. **Eligibility:** Choose "All visitors", a **Decision Rule** (reusable condition set), or **Audience-based** (specific segments with AND/OR logic).\n4. **Representations:** For each placement, add the offer content (HTML, image URL, text, or JSON).\n5. **Advanced Capping:** Add frequency cap rules — event type (impression/click/conversion), cap count, time period (hourly/daily/weekly/monthly/lifetime/custom).\n6. **Custom Attributes:** If the Item Catalog has attributes defined, fill in the values.\n7. **Dates:** Optionally set start/end dates.\n8. **Save** and submit for approval when ready.';
  if (/where.*(create|make|new).*(placement)/i.test(lower))
    return 'To create a placement, go to **Offer Decisioning → Placements** in the left sidebar, then click **"+ Create Placement"**.\n\n- **Name:** A descriptive name (e.g., "Homepage Hero Banner").\n- **Channel:** Email, Web, or Mobile.\n- **Content Type:** HTML, Image, Text, or JSON.\n- **Dimensions:** Optional width/height constraints.\n\nPlacements define WHERE offers appear. Offers have representations FOR specific placements.';
  if (/where.*(create|make|new).*(collection)/i.test(lower))
    return 'To create a collection, go to **Offer Decisioning → Collections** in the left sidebar, then click **"+ Create Collection"**.\n\n- **Static:** Manually select specific offers to include.\n- **Dynamic:** Choose tags (collection qualifiers) and/or attribute-based conditions (using Item Catalog attributes). A live preview shows matching offers with count in real time.\n\nExample: A "Summer Deals" dynamic collection matching tag "Summer Sale" with discount_percentage > 15.';
  if (/where.*(create|make|new).*(decision.?rule|eligibility.?rule)/i.test(lower))
    return 'To create a decision rule, go to **Offer Decisioning → Decision Rules** in the left sidebar, then click **"+ Create Rule"**.\n\nThe UI uses a **segment-builder-style** interface:\n1. Add conditions with Entity (profile/activity/system), Attribute, Operator, and Value.\n2. Each condition has its own **AND/OR connector** to the next — supporting mixed logic like "(A AND B) OR (C AND D)".\n3. AND binds tighter than OR in evaluation.\n\nRules are reusable across multiple offers and selection strategies.';
  if (/where.*(create|make|new).*(ranking.?formula)/i.test(lower))
    return 'To create a ranking formula, go to **Offer Decisioning → Strategies** and click the **"Ranking Formulas"** tab, then **"+ Create Formula"**.\n\nThe editor is an **IDE-like interface** where you:\n1. Write a mathematical expression in the code editor.\n2. Insert variables from the sidebar: Offer attributes (priority, cost, custom attrs), Profile attributes (engagement_score, lifetime_value), Context data (page_category, etc.).\n3. Test the formula with sample values in the **Test Panel** to see computed scores.\n\nExample: `offer.priority * 0.6 + profile.engagement_score * 0.4`';
  if (/where.*(create|make|new).*(strateg)/i.test(lower))
    return 'To create a selection strategy, go to **Offer Decisioning → Strategies** in the left sidebar, then click **"+ Create Strategy"**.\n\nConfigure three parts:\n1. **Collection:** Which pool of offers to consider.\n2. **Eligibility Constraint:** Optionally apply a decision rule or audience-based filter.\n3. **Ranking Method:** Priority (by offer.priority), Formula (custom expression), or AI Model (ML-based scoring).\n\nStrategies are then assigned to placements within a Decision.';
  if (/where.*(create|make|new).*(decision)(?!.*rule)/i.test(lower))
    return 'To create a decision, go to **Offer Decisioning → Decisions** in the left sidebar, then click **"+ Create Decision"**.\n\n**Steps:**\n1. Set name and description.\n2. **Add Placements:** For each placement, assign selection strategies and a fallback offer.\n3. **Arbitration:** Configure method (Priority Order/Weighted Score/AI-Optimized), deduplication, tiebreak rule, suppression window, and global offer limit.\n4. **Simulate** to test before going live.\n5. Set start/end dates and activate.';
  if (/where.*(heatmap|heat map)/i.test(lower))
    return 'Heatmaps are available from delivery and workflow reports. Go to **Deliveries** or **Workflows**, click on any item\'s action menu and select **"Heatmap"**, or open the report and click the **"Heatmap"** button in the header.';

  // Feature questions - STO with data when asking about system/best/optimal
  if (/\bsto\b|send.time.optim/i.test(lower) && /system|best|optimal|peak|when|data|insight|recommend|hour|day|on email|on sms|on push|by channel/i.test(lower)) {
    const allDels = dbQuery.all('deliveries');
    if (allDels.length > 0) {
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      function _mockSto(dels) {
        const hT=new Array(24).fill(0), dT=new Array(7).fill(0);
        let tS=0,tO=0;
        dels.forEach(d=>{tS+=d.sent||0;tO+=d.opens||0;});
        for(let di=0;di<7;di++) for(let hi=0;hi<24;hi++){
          let os=0; dels.forEach(d=>{
            const seed=d.id*7+31;const rng=i=>{const x=Math.sin(seed+i)*10000;return x-Math.floor(x);};
            const pm=(hi>=9&&hi<=11)?2.5:(hi>=14&&hi<=16)?2.0:(hi>=19&&hi<=21)?1.8:(hi<6||hi>22)?0.2:1.0;
            const dm=(di===1||di===2)?1.4:(di>=5)?0.5:1.0;
            os+=Math.round((d.opens||0)/168*pm*dm*(0.6+rng(di*24+hi)*0.8));
          }); hT[hi]+=os; dT[di]+=os;
        }
        const topH=hT.map((v,i)=>({h:i,v})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>(x.h<10?'0':'')+x.h+':00');
        const topD=dT.map((v,i)=>({d:days[i],v})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.d);
        const worstH=hT.map((v,i)=>({h:i,v})).sort((a,b)=>a.v-b.v).slice(0,3).map(x=>(x.h<10?'0':'')+x.h+':00');
        return{count:dels.length,sent:tS,opens:tO,or:tS>0?((tO/tS)*100).toFixed(1):'0',topH,topD,worstH,sto:dels.filter(d=>d.sto_enabled).length};
      }
      let targetCh = 'all';
      if (/\bemail\b/i.test(lower)) targetCh = 'email';
      else if (/\bsms\b/i.test(lower)) targetCh = 'sms';
      else if (/\bpush\b/i.test(lower)) targetCh = 'push';
      
      const chDels = targetCh !== 'all' ? allDels.filter(d => (d.channel||'').toLowerCase() === targetCh) : allDels;
      const s = _mockSto(chDels.length ? chDels : allDels);
      const chLabel = targetCh !== 'all' ? targetCh.toUpperCase() : 'all channels';
      
      let resp = `**System STO Insights — ${chLabel}**\n_Based on ${s.count} deliveries, ${s.sent.toLocaleString()} messages sent_\n\n`;
      resp += `📊 **Peak Send Hours:** ${s.topH.join(', ')}\n`;
      resp += `📅 **Best Days:** ${s.topD.join(', ')}\n`;
      resp += `🚫 **Avoid Sending:** ${s.worstH.join(', ')}\n`;
      resp += `📈 **Avg Open Rate:** ${s.or}%\n`;
      resp += `⚡ **STO Adoption:** ${s.sto} of ${s.count} deliveries use STO\n`;

      // Add channel breakdown if asking about all
      if (targetCh === 'all') {
        const chGroups = {email:[],sms:[],push:[]};
        allDels.forEach(d=>{const c=(d.channel||'email').toLowerCase();if(chGroups[c])chGroups[c].push(d);});
        resp += '\n**By Channel:**\n';
        for (const [ch, dels] of Object.entries(chGroups)) {
          if (!dels.length) continue;
          const cs = _mockSto(dels);
          resp += `- **${ch.toUpperCase()}** (${cs.count}): Peak hours ${cs.topH.join(', ')}, best days ${cs.topD.join(', ')}, ${cs.or}% open rate\n`;
        }
      }
      resp += '\n💡 Enable STO in the delivery wizard\'s Properties step to automatically use these optimal times.';
      return resp;
    }
  }
  if (/what.*(\bsto\b|send time optimization)/i.test(lower) && !/system|best|optimal|peak|when|data|insight|hour|day|on email|on sms|on push|by channel/i.test(lower))
    return '**Send Time Optimization (STO)** uses AI to determine the optimal send time for each recipient based on their engagement patterns. Enable it in the delivery wizard\'s Properties step. You can choose from models like Engagement History, Open Time Prediction, Click Time Prediction, or Timezone-Aware, and set a delivery window (6–72 hours).\n\nAsk me **"what is the system STO on email?"** to see actual peak hours and best days based on your delivery data.';
  if (/what.*(wave|wave sending)/i.test(lower))
    return '**Wave Sending** splits your audience into multiple waves sent at intervals. This helps manage server load and lets you monitor early results before full rollout. Configure it in the delivery wizard: choose number of waves (2–5), interval (15min to 24h), first wave size (5–50%), and ramp type (linear, exponential, front-loaded, or equal split).';
  if (/what.*(arbitration)/i.test(lower))
    return '**Arbitration** controls how competing offers are resolved across placements in a decision. Settings include: **Method** (Priority Order, Weighted Score, AI-Optimized), **Deduplication** (prevent same offer in multiple placements), **Tiebreak Rule** (Random, Most Recent, Least Shown), **Suppression Window** (skip recently shown offers), and **Global Offer Limit**. Configure it in the Decision form\'s Arbitration section.';

  // Offer Decisioning — detailed "what is" answers
  if (/\b(?:what|how|explain|tell)\b.*(item.?catalog|catalog.?schema)/i.test(lower))
    return '**Item Catalog** is the extensible schema system for offers. Navigate to **Offer Decisioning → Offers → "Item Catalog"** tab.\n\nHere you define **custom attributes** that extend the base offer object:\n- **Types supported:** Text, Number, Boolean, Date, URL, Enum, JSON, Asset\n- Each attribute has a name, type, and optional description\n- Once defined, attributes appear as editable fields on **every offer** creation/edit form\n\n**Examples:**\n- "discount_percentage" (Number) — used in ranking formulas and collection filters\n- "product_category" (Enum: Electronics, Fashion, Home) — used for dynamic collections\n- "terms_url" (URL) — link to offer terms\n- "featured" (Boolean) — flag for featured offers\n\nCustom attributes are stored with the offer and can be referenced in **ranking formulas** (e.g., `offer.discount_percentage * 0.3`) and **dynamic collection** attribute conditions.';

  if (/\b(?:what|how|explain|tell)\b.*(ranking.?formula|offer.?formula)/i.test(lower) && !/where|create|make|new|how many|count|total|number of|list|show/i.test(lower))
    return '**Ranking Formulas** are custom mathematical expressions used to score and rank offers. Find them at **Offer Decisioning → Strategies → "Ranking Formulas"** tab.\n\n**How they work:**\nFor each eligible offer, the formula is evaluated by substituting actual values of offer attributes, profile data, and context data. The resulting numeric score determines the ranking — **highest score wins**.\n\n**Available variables:**\n- **Offer:** `offer.priority`, `offer.cost`, plus any Item Catalog attributes (e.g., `offer.discount_percentage`)\n- **Profile:** `profile.engagement_score`, `profile.lifetime_value`, `profile.purchase_count`, `profile.age`\n- **Context:** `context.page_category`, `context.device_type`, `context.time_of_day` (from Context Schema)\n\n**Example formulas:**\n- `offer.priority * 0.6 + profile.engagement_score * 0.4` — blends offer priority with user engagement\n- `offer.priority * (1 + context.urgency_factor)` — boosts by runtime urgency\n- `(profile.lifetime_value > 500 ? 2 : 1) * offer.priority` — VIP customers get doubled scores\n\n**Score calculation example:** offer.priority=80, profile.engagement_score=90 → formula `offer.priority * 0.6 + profile.engagement_score * 0.4` → score = 48 + 36 = **84**\n\nThe editor has an **IDE-like interface** with syntax highlighting, variable insertion sidebar, and a **Test Panel** for real-time score computation.';

  if (/\b(?:what|how|explain|tell)\b.*(advanced.?capping|frequency.?cap|capping.?rule)/i.test(lower))
    return '**Advanced Capping** provides multi-rule frequency caps per offer. Configure it when creating/editing an offer under the **"Advanced Capping"** section.\n\n**Each capping rule specifies:**\n- **Event Type:** Impression, Click, Conversion, or Any interaction\n- **Cap Count:** Fixed number (e.g., 5) or expression-based (e.g., `offer.priority * 10`)\n- **Time Period:** Per Hour, Per Day, Per Week, Per Month, Lifetime, or Custom\n- **Custom Period:** "Every N days/weeks/months" with granular reset\n\n**How it works:**\n- Multiple rules can stack on a single offer — **all rules must be satisfied** for the offer to remain eligible\n- The engine checks proposition logs and event counts against each rule\'s cap\n- Example: "Max 3 impressions per day" + "Max 1 click per week" + "Max 10 impressions lifetime"\n\n**Expression-based caps** allow dynamic limits: `offer.priority * 10` means a priority-80 offer gets an 800-impression lifetime cap.';

  if (/\b(?:what|how|explain|tell)\b.*(selection.?strateg|offer.?strateg)/i.test(lower) && !/where|create|make|new|how many|count|total|number of|list|show/i.test(lower))
    return '**Selection Strategies** define how offers are selected and ranked for a placement. Create them at **Offer Decisioning → Strategies → + Create Strategy**.\n\n**Three components:**\n1. **Collection:** Which pool of offers to consider (static or dynamic collection)\n2. **Eligibility Constraint:** Optional filter — a Decision Rule (condition-based) or Audience-based (specific segments)\n3. **Ranking Method:**\n   - **Priority:** Rank by `offer.priority` field (higher = better). Simple and deterministic.\n   - **Formula:** Use a custom Ranking Formula expression. References offer, profile, and context variables.\n   - **AI Model:** Use an AI Ranking Model that predicts CTR, conversion, or revenue per offer.\n\nStrategies are then assigned to **placements within a Decision**. Multiple strategies can be assigned to the same placement, and you can run **A/B experiments** between them.';

  if (/\b(?:what|how|explain|tell)\b.*(decision.?rule|eligibility.?rule)/i.test(lower) && !/where|create|make|new|how many|count|total|number of|list|show/i.test(lower))
    return '**Decision Rules** are reusable eligibility conditions for offers. Create them at **Offer Decisioning → Decision Rules → + Create Rule**.\n\n**UI Features:**\n- **Segment-builder-style** interface with visual condition cards\n- Each condition specifies: Entity (profile/activity/system), Attribute (e.g., age, city, purchase_count), Operator (equals, not_equals, greater_than, less_than, contains, between, in, etc.), and Value(s)\n- **Per-condition AND/OR connectors:** Each condition can have its own logic connector, supporting mixed patterns like "(A AND B) OR (C AND D)"\n- AND binds tighter than OR in evaluation\n\n**Type-aware inputs:** The value input adapts to the attribute type — date pickers for dates, dropdowns for enums, number fields for numeric attributes.\n\n**Usage:** Assign rules to offer eligibility or as constraints in selection strategies. Rules are reusable across multiple offers.';

  if (/\b(?:what|how|explain|tell)\b.*(placement)/i.test(lower) && !/where|create|make|new|how many|count|total|number of|list|show/i.test(lower))
    return '**Placements** define the slots where offers appear. Create them at **Offer Decisioning → Placements → + Create Placement**.\n\n**Properties:**\n- **Name:** Descriptive identifier (e.g., "Homepage Hero Banner", "Email Sidebar Offer", "Mobile App Card")\n- **Channel:** Email, Web, or Mobile\n- **Content Type:** HTML, Image, Text, or JSON\n- **Dimensions:** Optional width/height constraints for visual placements\n\n**How placements work:**\n- Offers have **representations** for specific placements (the actual content to display)\n- Decisions assign **strategies** to placements to determine which offer appears where\n- Each placement in a decision can have its own strategies, fallback offer, and multi-item return count';

  if (/\b(?:what|how|explain|tell)\b.*(collection(?!.*qualifier))/i.test(lower) && !/where|create|make|new|how many|count|total|number of|list|show/i.test(lower) && !/qualifier|tag/i.test(lower))
    return '**Collections** group offers into pools for selection strategies. Create them at **Offer Decisioning → Collections → + Create**.\n\n**Two types:**\n- **Static:** Manually select specific offers to include\n- **Dynamic:** Auto-populate based on **tag filters** and/or **attribute conditions**\n\n**Dynamic collections features:**\n- Select one or more Collection Qualifiers (tags) — offers matching those tags are included\n- Add attribute-based conditions using Item Catalog attributes (e.g., `discount_percentage > 20 AND product_category = Electronics`)\n- **Live preview panel** shows matching offers with count in real time as you adjust filters\n\n**Example:** A "Summer Deals" dynamic collection includes all offers tagged "Summer Sale" with discount_percentage > 15.';

  if (/\b(?:what|how|explain|tell)\b.*(collection.?qualifier|offer.?tag)/i.test(lower))
    return '**Collection Qualifiers** (also called tags) are labels used to group and categorize offers. Manage them at **Offer Decisioning → Collections → "Collection Qualifiers"** tab.\n\n- Create tags like "Summer Sale", "VIP Only", "Electronics", "Free Shipping"\n- Assign tags to offers when creating or editing them\n- Tags are used by **dynamic collections** to auto-include matching offers\n- An offer can have multiple tags, and a collection can filter by multiple tags';

  if (/\b(?:what|how|explain|tell)\b.*(simulation|simulate|test.?decision)/i.test(lower))
    return '**Simulation** lets you test a decision policy before going live. Access it from a **Decision detail page → "Simulate" button**.\n\n**How to use:**\n1. Specify the number of **test profiles** (1-100)\n2. Provide **context data values** (from Context Schema) to test different scenarios (e.g., page_category="deals", device_type="mobile")\n3. Click **Run Simulation**\n\n**What happens:**\nThe engine runs the full decisioning pipeline:\n- Collection filtering → Eligibility evaluation → Capping check → Ranking → Arbitration\n\n**Results show:**\n- For each placement: selected offer(s) with name, score, ranking method used, and selection reason\n- Helps verify correct offer selection, ranking accuracy, and capping behavior before activating the decision';

  if (/\b(?:what|how|explain|tell)\b.*(context.?data|context.?schema)/i.test(lower) && !/where|create/i.test(lower))
    return '**Context Data** (Context Schema) defines runtime variables available during offer decisioning. Manage it at **Offer Decisioning → Strategies → "Context Data"** tab.\n\n**Each context attribute has:**\n- **Name:** Variable identifier (e.g., `page_category`, `device_type`, `time_of_day`, `cart_value`)\n- **Type:** String, Number, or Boolean\n- **Description:** What the variable represents\n\n**Usage:**\n- Referenced in **ranking formulas** (e.g., `offer.priority * (1 + context.urgency_factor)`)\n- Available during **eligibility evaluation** for context-aware decisions\n- Passed as input during **simulation** and **real-time decisioning API calls**\n\nThis allows offers to be ranked differently based on where/when/how the user is interacting.';

  if (/\b(?:what|how|explain|tell)\b.*(content.?experiment|a.?b.?test.*strateg|experiment.*decision)/i.test(lower))
    return '**Content Experimentation** enables A/B testing on selection strategies within a decision.\n\n**How it works:**\n1. Within a Decision, when assigning strategies to a placement, enable A/B testing\n2. Configure **traffic split** between variants (e.g., 50/50, 70/30)\n3. Each variant uses a different selection strategy\n4. Track performance by CTR, conversion rate, or revenue\n5. Set a **confidence threshold** for declaring a winner\n\n**Use case:** Test whether "Priority-based" ranking outperforms a "Custom Formula" for the same collection of offers on the same placement.';

  if (/\b(?:what|how|explain|tell)\b.*(ai.?rank|ai.?model.*rank|ranking.*ai|ml.*rank)/i.test(lower))
    return '**AI Ranking Models** are machine learning models that predict the best offer for each user. Manage them at **Offer Decisioning → Strategies → "AI Models"** tab.\n\n**Model types:**\n- **CTR Prediction:** Predicts click-through rate per offer\n- **Conversion Prediction:** Predicts purchase/conversion probability\n- **Revenue Optimization:** Maximizes expected revenue per interaction\n\n**Properties:** Name, type, status (training/active/archived), endpoint URL.\n\n**How it works:** When used as the ranking method in a selection strategy, the engine sends offer + profile + context data to the model endpoint. The model returns a score per offer, which determines the ranking.';

  if (/\b(?:what|how|explain|tell)\b.*(offer.?priority|priority.*offer)/i.test(lower) && !/where|create/i.test(lower))
    return '**Offer Priority** is a numeric value (1-100) set on each offer that determines its default ranking order. Higher values mean the offer is preferred.\n\n**How it\'s used:**\n- When a selection strategy uses **Priority ranking**, offers are sorted by this field (highest first)\n- In **ranking formulas**, priority is available as `offer.priority` — e.g., `offer.priority * 0.6 + profile.engagement_score * 0.4`\n- In **expression-based capping**, you can reference it: `offer.priority * 10` for dynamic cap limits\n- Priority 80 offer beats priority 50 in priority-based ranking\n\nSet priority when creating/editing an offer.';

  if (/\b(?:what|how|explain|tell)\b.*(approval.?workflow|status.?lifecycle|offer.?lifecycle|approval.*process)/i.test(lower))
    return '**Offer Approval Workflow** follows a status lifecycle:\n\n1. **Draft** — Being edited, not eligible for decisioning\n2. **Submitted** — Sent for review/approval\n3. **Approved** — Reviewed and ready to be activated\n4. **Live** — Actively participating in decisioning\n5. **Archived** — Deactivated, no longer eligible\n\nOnly offers in **"approved"** or **"live"** status are included in the decisioning engine. Change status from the offer detail page or listing actions.';

  if (/sample.*(flow|walkthrough|end.to.end|e2e|tutorial)|how.*offer.*decisioning.*work|explain.*offer.*decisioning|offer.*decisioning.*(flow|process|step)/i.test(lower))
    return '**End-to-End Offer Decisioning Flow:**\n\n**Step 1 — Item Catalog:** Define custom attributes (e.g., `discount_percentage` as Number, `product_category` as Enum). Go to Offers → Item Catalog tab.\n\n**Step 2 — Placements:** Create slots like "Homepage Banner" (web/HTML), "Email Hero" (email/HTML). Go to Placements → + Create.\n\n**Step 3 — Tags:** Create Collection Qualifiers like "Summer Sale", "Premium". Go to Collections → Qualifiers tab.\n\n**Step 4 — Offers:** Create offers with priority, eligibility (all/rule/audience), representations per placement, capping rules, tags, and custom attribute values. Submit for approval → set to Live.\n\n**Step 5 — Collections:** Create a dynamic collection "Summer Deals" = offers tagged "Summer Sale" with discount > 15%. Preview shows matching offers.\n\n**Step 6 — Decision Rules:** Create "Engaged Users" rule: `purchase_count > 2 AND days_since_last_purchase < 30`.\n\n**Step 7 — Ranking Formula:** Create expression: `offer.priority * 0.5 + offer.discount_percentage * 0.3 + profile.engagement_score * 0.2`.\n\n**Step 8 — Selection Strategy:** Combine "Summer Deals" collection + "Engaged Users" rule + ranking formula.\n\n**Step 9 — Decision:** Add "Homepage Banner" placement with the strategy and a fallback offer. Configure arbitration (deduplication on, Priority Order).\n\n**Step 10 — Simulate:** Test with 10 profiles and context data to verify offer selection.\n\n**Step 11 — Go Live:** Activate the decision and reference its ID in templates or API calls.';

  if (/how.*(eligib|who.*see|target.*offer|offer.*target)/i.test(lower) && !/where|create/i.test(lower))
    return '**Offer Eligibility** determines which contacts can see an offer. Configure it when creating/editing an offer.\n\n**Three modes:**\n1. **All Visitors:** No restriction — everyone is eligible\n2. **Decision Rule:** Apply a reusable rule with conditions (e.g., age > 25 AND city = "New York"). Rules use the segment-builder UI with per-condition AND/OR logic.\n3. **Audience-based:** Select specific segments/audiences. Choose AND (all must match) or OR (any can match).\n\n**Evaluation order in decisioning:**\nCollection filtering → **Eligibility check** → Capping check → Ranking\n\nOffers that fail eligibility are excluded before ranking.';

  // ── Non-decisioning feature answers ─────────────────
  if (/\b(?:what|how|explain|tell)\b.*(email.?designer|email.?editor)/i.test(lower))
    return '**Email Designer** is a full drag-and-drop visual editor for creating emails. Access it from the Content step of the delivery wizard.\n\n**Components:** Text, Image, Button, Divider, Spacer, HTML, Columns, Social Links, Offer Decisioning blocks.\n**Left Rail Tabs:** Components, Fragments, Structure, Links, Asset Library, Conditional Content.\n**Canvas:** Design and Preview tabs with device preview (Desktop/Tablet/Mobile).\n**AI Panel:** Generate subject lines, preheader, body text, button text, image suggestions.\n**Toolbar:** Zoom, device preview, simulate, preview, undo/redo, save.\n**More Menu:** Reset, save as fragment, import HTML, code editor, change design, save as template, export HTML, validate & preview.\n**Inline Formatting:** Bold, italic, underline, font size, alignment, personalization tokens.\n**Personalization:** Insert merge fields from contact profile via schema tree.';

  if (/\b(?:what|how|explain|tell)\b.*(orchestration|canvas)/i.test(lower))
    return '**Orchestration Canvas** is a visual drag-and-drop workflow builder. Access it from any workflow by clicking "Open Orchestration".\n\n**30+ Activity Types:**\n- **Entry/Exit:** Entry, Exit, Stop\n- **Targeting:** Query, Build Audience, Segment, Filter, Exclude, Combine, Deduplication, Enrichment, Incremental Query, Reconciliation, Save Audience, Split, Change Dimension, Change Data Source\n- **Flow Control:** Scheduler, Wait, Condition, Random Split, Fork, Jump, External Signal\n- **Intelligence:** Alert, Offer Decision, A/B Test\n- **Channels:** Email, SMS, Push, Direct Mail, Webhook\n\n**Canvas Features:** Pan/zoom, auto-layout, drag connections between nodes, toolbar (start/stop/restart/zoom/fit/layout), properties panel for node configuration.\n**AI Assistant:** Suggest workflow flows and optimize existing workflows.';

  if (/\b(?:what|how|explain|tell)\b.*(transactional|event.?messag)/i.test(lower) && !/where|create|list|show|how many|count|total|number of/i.test(lower))
    return '**Transactional Messaging** enables event-driven real-time messages. Navigate to **Event Messaging → Events & Messages**.\n\n**Three components:**\n1. **Event Templates:** Define event schemas with attributes (name, type), identity fields, and delivery config. Enable/disable templates.\n2. **Event Instances:** Specific events created from templates. Publish to start receiving triggers.\n3. **Event Messages:** Multi-channel (email, SMS, push) messages triggered by events. Configure recipient mode and content. Publish/unpublish lifecycle.\n\n**Dashboard KPIs:** Events received, messages sent, delivered, failed, active messages, avg latency.\n**Event History:** Log of all triggered events with filters (event type, status, channel).\n\n**Flow:** Create Event Template → Create Event Instance → Create Event Message → Publish → Events trigger messages automatically.';

  if (/where.*(create|make|new).*(transactional|event.?template|event.?message)/i.test(lower))
    return 'To set up transactional messaging:\n\n1. Go to **Event Messaging → Events & Messages**\n2. **Event Templates tab** → + Create → define attributes (name, type), identity fields, delivery config\n3. **Events tab** → Create Event from a template → Publish it\n4. **Messages tab** → + Create Message → select event, configure channel (email/SMS/push), content, recipient mode → Publish\n\nOnce published, events trigger messages automatically.';

  if (/\b(?:what|how|explain|tell)\b.*(content.?template)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Content Templates** are reusable email designs. Navigate to **Content Management → Content Templates**.\n\n- Create templates with the block-based email editor\n- **Duplicate** existing templates for quick variations\n- **Import** HTML files or ZIP archives (with automatic asset extraction)\n- Organize with folders\n- Apply templates when creating email deliveries to start from a pre-designed layout';

  if (/\b(?:what|how|explain|tell)\b.*(fragment)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Fragments** are reusable content blocks (headers, footers, signatures, etc.) that can be inserted into email designs. Navigate to **Content Management → Fragments**.\n\n- Create fragments with the content editor\n- Search by name\n- Version support\n- Insert into emails via the Email Designer\'s "Fragments" tab in the left rail\n- Update a fragment once and it reflects everywhere it\'s used';

  if (/\b(?:what|how|explain|tell)\b.*(brand)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Brands** define brand identity for consistent messaging across all deliveries. Navigate to **Content Management → Brands**.\n\n- Configure brand properties: name, logo, colors, fonts\n- Apply brand settings to deliveries and templates\n- Maintain brand consistency across email, SMS, and push channels';

  if (/\b(?:what|how|explain|tell)\b.*(landing.?page)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Landing Pages** are web pages used as campaign destinations. Navigate to **Content Management → Landing Pages**.\n\n- Create with name, URL slug, and content\n- Status management (draft/published)\n- Link from email buttons and CTAs\n- Track visits for campaign performance';

  if (/\b(?:what|how|explain|tell)\b.*(asset.?library|asset.?management|upload.*asset)/i.test(lower))
    return '**Asset Library** manages all files and images. Navigate to **Content Management → Asset Library**.\n\n- **Upload** images and documents\n- **Filter** by type (image/file)\n- **Search** by name\n- **Delete** unused assets\n- Assets are available across the Email Designer, content templates, and offer representations\n- Stored in the /uploads directory';

  if (/\b(?:what|how|explain|tell)\b.*(custom.?object)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Custom Objects** are user-defined data entities for extending the data model. Navigate to **Data & Configuration → Custom Objects**.\n\n**Features:**\n- Define objects with custom fields (text, number, boolean, date, select/enum)\n- **Relationships:** 1:N, N:1, N:N between objects and with contacts\n- **DDL Import:** Create objects from SQL CREATE TABLE statements\n- **Data Management:** Add/edit/delete records, bulk CSV import\n- **UI Builder:** Design custom record layouts with drag-and-drop, draft/publish workflow, version history with restore\n- **ER Diagram:** Visual entity-relationship diagram showing all objects and relationships with crow\'s foot notation\n\nCustom object fields are available in the Segment Builder for targeting.';

  if (/\b(?:what|how|explain|tell)\b.*(enumeration|enum)/i.test(lower) && !/where|create|how many|count|total|number of|list|show/i.test(lower))
    return '**Enumerations** are dropdown value lists used across the platform. Navigate to **Data & Configuration → Enumerations**.\n\n- **System enumerations:** Predefined (e.g., lifecycle stages, subscription statuses)\n- **Custom enumerations:** User-defined for custom fields\n- Each value has: **key** (internal), **label** (display), and optional **color**\n- Used in: segment builder conditions, custom object select fields, forms\n- CRUD operations on enumerations and their values';

  if (/\b(?:what|how|explain|tell)\b.*(query.?service|sql.?mode|query.?builder)/i.test(lower))
    return '**Query Service** provides ad-hoc data querying. Navigate to **Data & Configuration → Query Service**.\n\n**Two modes:**\n1. **Structured Query Builder:** Pick a table → add filters → select columns → add aggregates (COUNT, SUM, AVG, MIN, MAX) → execute\n2. **SQL Mode:** Write raw SQL-like queries directly\n\n**Features:**\n- Schema explorer showing all tables and their fields\n- Supports JOINs between tables\n- GROUP BY and aggregate functions\n- Results displayed in a table\n- Useful for ad-hoc analysis and data exploration';

  if (/\b(?:what|how|explain|tell)\b.*(analytics|dashboard.?metric|kpi)/i.test(lower) && !/where|create|sto/i.test(lower))
    return '**Analytics** provides comprehensive business intelligence. Navigate to **Data & Configuration → Analytics** or the **Dashboard**.\n\n**Dashboard:** KPI cards (total contacts, active workflows, email performance, revenue), trend charts, quick-action links.\n**Drill-downs:**\n- **Customers:** Lifecycle breakdown, top customers by LTV, engagement trends\n- **Campaigns:** Workflow performance metrics (targeted, sent, opens, clicks, conversions)\n- **Email:** Open rates, click rates, CTOR, conversion rates\n- **Revenue:** Revenue by period, product performance\n**Channel Analytics:** Compare email vs SMS vs push performance side by side.';

  if (/\b(?:what|how|explain|tell)\b.*(heatmap)/i.test(lower))
    return '**Heatmaps** show visual click/engagement patterns overlaid on email content. Available from delivery and workflow reports.\n\n**How to access:**\n- Go to any **Delivery** or **Workflow** → open the report or select "Heatmap" from actions\n- **Aggregate heatmap** available across all deliveries\n\n**Features:**\n- Visual overlay showing click density on email areas\n- AI-powered recommendations for improving engagement\n- Identify most/least clicked regions\n- Optimize future email layouts based on engagement data';

  if (/\b(?:what|how|explain|tell)\b.*(er.?diagram|entity.?relationship)/i.test(lower))
    return '**ER Diagram** provides a visual entity-relationship diagram of the data model. Access it from **Custom Objects → ER Diagram** button.\n\n**Features:**\n- Shows all database tables with their fields\n- **Toggle layers:** Core tables, Decisioning tables (separate checkbox)\n- **Crow\'s foot notation** for relationship cardinality (1:N, N:1, N:N)\n- **Dynamic attributes:** Custom attributes from Item Catalog appear on the Offers entity\n- Toggle attributes and relationships visibility\n- **Fullscreen mode** with scrolling\n- **Export:** PNG image, PDF, SVG, or Print';

  if (/\b(?:what|how|explain|tell)\b.*(explorer)/i.test(lower) && !/where|create/i.test(lower))
    return '**Explorer** provides Adobe-style folder-based navigation of all entities. Access it from the sidebar.\n\n**Features:**\n- Folder tree showing hierarchical organization\n- Browse entities by folder (campaigns, content, offers, data, etc.)\n- Entity cards with type icons and status\n- Drag-and-drop items between folders\n- Create, rename, delete folders\n- Quick navigation to any entity in the system';

  if (/\b(?:what|how|explain|tell)\b.*(subscription.?service)/i.test(lower))
    return '**Subscription Services** manage opt-in/opt-out lists. Navigate to **Customer Management → Subscription Services**.\n\n- Create services with name and description\n- Track subscriber counts\n- Used for managing email/SMS/push opt-in preferences\n- Contacts can be subscribed/unsubscribed from services';

  if (/\b(?:what|how|explain|tell)\b.*(predefined.?filter)/i.test(lower))
    return '**Predefined Filters** are saved filter configurations for quick reuse. Navigate to **Customer Management → Predefined Filters**.\n\n- Create with name, entity type, and filter conditions\n- Apply to listing pages for quick filtering\n- Share common filter configurations across the team';

  if (/\b(?:what|how|explain|tell)\b.*(brevo|email.?provider|smtp|email.?integration)/i.test(lower))
    return '**Brevo (Email Provider) Integration** enables real email delivery via Brevo (Sendinblue) SMTP.\n\n**Configuration:**\n- Go to delivery settings → Email Provider\n- Configure Brevo API key and sender details\n- Toggle enabled/disabled\n- View connection status\n\n**Modes:**\n- **Enabled:** Sends real emails through Brevo SMTP\n- **Disabled/Paused:** Simulates sending (logs delivery without actual email)\n\nWhen no provider is configured, the system runs in simulation mode — all metrics are generated but no actual emails are sent.';

  if (/\b(?:what|how|explain|tell)\b.*(ai.?feature|ai.?capabilit|ai.?tool|what.*can.*ai)/i.test(lower))
    return '**AI Features** provide intelligent automation across the platform. Navigate to **Data & Configuration → AI Features**.\n\n**Capabilities:**\n- **Subject Line Generation:** Generate compelling subject lines for any product/audience/tone\n- **SMS/Push Composition:** Generate and refine multi-channel messages with tone/length options\n- **Churn Prediction:** Predict churn risk per customer with engagement-based factors and recommendations\n- **Product Recommendations:** Suggest products based on purchase history\n- **Send Time Optimization (STO):** Compute optimal send time per recipient from open patterns\n- **Next Best Action:** Determine the optimal next marketing action (incentive, win-back, VIP, cross-sell)\n- **Auto-Segmentation:** Cluster customers into segments (VIPs, Regular, One-Time, At-Risk, Leads)\n- **Content Generation:** AI-written email body content\n- **Workflow Suggestion:** Generate workflow structures from natural language descriptions\n- **Workflow Optimization:** Analyze and score existing workflows with improvement suggestions\n- **AI Agent Chat:** Conversational assistant answering questions about the platform and querying live data';

  if (/\b(?:what|how|explain|tell)\b.*(churn.?predict|predict.?churn)/i.test(lower))
    return '**Churn Prediction** uses AI to assess customer churn risk. Access via **AI Features → Churn Prediction** or the API.\n\n**How it works:**\n- Analyzes days since last order and last activity\n- Factors: order count, lifetime value, engagement recency\n- **Risk levels:** Very Low (<10%), Low (~25%), Medium (~55%), High (~85%)\n- Returns actionable recommendations (continue engagement, re-engage, win-back campaign)\n- Predictions stored in ai_predictions table for tracking';

  if (/\b(?:what|how|explain|tell)\b.*(next.?best.?action|nba)/i.test(lower))
    return '**Next Best Action** determines the optimal next marketing action for a customer. Access via **AI Features** or the API.\n\n**Actions determined by customer behavior:**\n- **First Purchase Incentive:** For customers who never purchased (15% off)\n- **Win-back Campaign:** For inactive 60+ days (20% off)\n- **VIP Exclusive:** For VIP customers (early access, special rewards)\n- **Cross-Sell:** For recent purchasers (complementary products)\n- **General Promotion:** For maintaining regular engagement\n\nReturns action, confidence score, reasoning, and suggested content (subject, CTA, discount).';

  if (/\b(?:what|how|explain|tell)\b.*(auto.?segment|ai.?segment)/i.test(lower))
    return '**Auto-Segmentation** uses AI to automatically cluster customers into meaningful segments. Access via **AI Features** or the API.\n\n**Generated segments:**\n1. **High-Value VIPs** — High lifetime value, frequent purchases\n2. **Regular Buyers** — Moderate purchase frequency\n3. **One-Time Buyers** — Single purchase\n4. **At-Risk Churners** — Previously active, now inactive 90+ days\n5. **Leads** — Engaged but never purchased\n\nReturns segment names, descriptions, criteria, and customer counts. Use these to create targeted campaigns.';

  if (/\b(?:what|how|explain|tell)\b.*(delivery.?report|campaign.?report|email.?report)/i.test(lower))
    return '**Delivery/Campaign Reports** provide detailed performance analytics. Access from any delivery → "Report" action.\n\n**Metrics:** Sent, Delivered, Opened, Clicked, CTOR (click-to-open rate), Bounced, Unsubscribed, Converted, Revenue.\n**Charts:** Engagement timeline (opens/clicks over time), device breakdown (desktop/mobile/tablet).\n**Top Links:** Most-clicked URLs with progress bars.\n**Geographic:** Performance by region.\n**Recipients:** Tabs for Engaged, Non-Engaged, and Bounced contacts.\n**Export:** Download as PDF or CSV.\n\nAlso available: aggregate heatmap showing click patterns on email content.';

  if (/where.*(create|make|new).*(contact|profile)/i.test(lower))
    return 'To create a contact, go to **Customer Management → Profiles** in the left sidebar, then click **"+ Create Contact"**. Fill in profile fields: name, email, phone, city, country, lifecycle stage, interests, etc.';
  if (/where.*(create|make|new).*(audience)/i.test(lower))
    return 'To create an audience, go to **Customer Management → Audiences** in the left sidebar, then click **"+ Create"**. Include/exclude segments, add custom filters, and estimate the member count.';
  if (/where.*(create|make|new).*(content.?template|email.?template)/i.test(lower))
    return 'To create a content template, go to **Content Management → Content Templates** in the left sidebar, then click **"+ Create"**. Design your template with the email editor, or import HTML/ZIP.';
  if (/where.*(create|make|new).*(fragment)/i.test(lower))
    return 'To create a fragment, go to **Content Management → Fragments** in the left sidebar, then click **"+ Create"**. Build your reusable content block, then insert it into email designs via the Fragments tab.';
  if (/where.*(create|make|new).*(custom.?object)/i.test(lower))
    return 'To create a custom object, go to **Data & Configuration → Custom Objects** in the left sidebar, then click **"+ Create"** (or **"Import DDL"** to create from SQL). Define fields (text, number, boolean, date, select) and relationships to other objects or contacts.';
  if (/where.*(create|make|new).*(enumeration|enum)/i.test(lower))
    return 'To create an enumeration, go to **Data & Configuration → Enumerations** in the left sidebar, then click **"+ Create"**. Add values with key, label, and optional color.';
  if (/where.*(upload|add).*(asset|image|file)/i.test(lower))
    return 'To upload an asset, go to **Content Management → Asset Library** in the left sidebar, then click **"Upload"**. Select an image or file. Assets are then available across the email designer and templates.';
  if (/where.*(run|execute|build).*(query|sql)/i.test(lower))
    return 'To run a query, go to **Data & Configuration → Query Service** in the left sidebar. Choose **Structured Query** (visual builder) or **SQL Mode** (write SQL directly), then click Execute to see results.';
  if (/where.*(view|open|see).*(er.?diagram|entity.?relationship)/i.test(lower))
    return 'To view the ER Diagram, go to **Data & Configuration → Custom Objects** and click the **"ER Diagram"** button. Toggle layers (Core, Decisioning), attributes, and relationships. Supports fullscreen mode and export (PNG, PDF, SVG, Print).';
  if (/where.*(view|see|open).*(analytics|dashboard)/i.test(lower))
    return 'To view analytics, go to the **Dashboard** (first item in sidebar) for KPIs and charts, or go to **Data & Configuration → Analytics** for detailed drill-downs (Customers, Campaigns, Email, Revenue, Channels).';

  // ── Data queries — property-based (wave, STO, etc.) ────
  if (detectedEntity && detectedProperty) {
    const cfg = entityMap[detectedEntity];
    const all = dbQuery.all(cfg.table);
    const filtered = all.filter(detectedProperty.filterFn);
    if (filtered.length === 0) {
      return `There are **no ${cfg.label.toLowerCase()}** with ${detectedProperty.label} enabled. Total ${cfg.label.toLowerCase()}: ${all.length}.`;
    }
    const list = filtered.slice(0, 15).map(r => {
      let line = `- **${r.name || r.label || (r.first_name ? r.first_name + ' ' + r.last_name : 'ID ' + r.id)}**`;
      if (r.channel) line += ` (${r.channel})`;
      if (r.status) line += ` — Status: ${r.status}`;
      return line;
    }).join('\n');
    const more = filtered.length > 15 ? `\n\n...and ${filtered.length - 15} more.` : '';
    return `Found **${filtered.length}** ${cfg.label.toLowerCase()} with **${detectedProperty.label}** enabled (out of ${all.length} total):\n\n${list}${more}`;
  }

  // ── Data queries — entity + status filter ─────────────
  if (detectedEntity && detectedStatus) {
    const cfg = entityMap[detectedEntity];
    const all = dbQuery.all(cfg.table);
    const filtered = all.filter(r => (r.status || '').toLowerCase() === detectedStatus);
    if (filtered.length === 0) {
      return `There are **no ${cfg.label.toLowerCase()}** with status **"${detectedStatus}"**. Total ${cfg.label.toLowerCase()}: ${all.length}.`;
    }
    const list = filtered.slice(0, 15).map(r => {
      let line = `- **${r.name || r.label || (r.first_name ? r.first_name + ' ' + r.last_name : 'ID ' + r.id)}**`;
      if (r.channel) line += ` (${r.channel})`;
      if (r.type) line += ` — Type: ${r.type}`;
      if (r.priority !== undefined) line += ` — Priority: ${r.priority}`;
      return line;
    }).join('\n');
    const more = filtered.length > 15 ? `\n\n...and ${filtered.length - 15} more.` : '';
    return `Found **${filtered.length}** ${cfg.label.toLowerCase()} in **"${detectedStatus}"** status (out of ${all.length} total):\n\n${list}${more}`;
  }

  if (detectedEntity && /how many|count|total|number of|show|list|all/i.test(lower)) {
    const cfg = entityMap[detectedEntity];
    const all = dbQuery.all(cfg.table);
    const byStatus = {};
    all.forEach(r => { const s = r.status || 'unknown'; byStatus[s] = (byStatus[s] || 0) + 1; });
    const statusBreakdown = Object.entries(byStatus).map(([s, c]) => `- **${s}:** ${c}`).join('\n');
    return `You have **${all.length} ${cfg.label.toLowerCase()}** in total.\n\n**By status:**\n${statusBreakdown}`;
  }

  if (/how many|count|total|number of/i.test(lower)) {
    const lines = [];
    for (const [, cfg] of Object.entries(entityMap)) {
      lines.push(`- **${cfg.label}:** ${dbQuery.count(cfg.table)}`);
    }
    return `Here are the current counts:\n\n${lines.join('\n')}`;
  }

  // ── Entity listing without count keywords ─────────────
  if (detectedEntity && /recent|latest|last|status|list|show/i.test(lower)) {
    const cfg = entityMap[detectedEntity];
    const items = dbQuery.all(cfg.table).slice(-10);
    if (items.length === 0) return `No ${cfg.label.toLowerCase()} found in the system.`;
    const list = items.map(r => {
      let line = `- **${r.name || r.label || (r.first_name ? r.first_name + ' ' + r.last_name : 'ID ' + r.id)}** — Status: ${r.status || 'n/a'}`;
      if (r.channel) line += `, Channel: ${r.channel}`;
      if (r.sent) line += `, Sent: ${Number(r.sent).toLocaleString()}`;
      if (r.priority !== undefined) line += `, Priority: ${r.priority}`;
      if (r.type && !r.channel) line += `, Type: ${r.type}`;
      if (r.expression) line += `, Expression: \`${r.expression}\``;
      if (r.ranking_method) line += `, Ranking: ${r.ranking_method}`;
      if (r.eligibility_type) line += `, Eligibility: ${r.eligibility_type}`;
      return line;
    }).join('\n');
    return `Here are recent ${cfg.label.toLowerCase()}:\n\n${list}`;
  }

  // General help
  if (/help|what can you do|capabilities/i.test(lower))
    return 'I\'m your AI assistant for the Marketing Automation Platform. I can help with **every feature** in the system:\n\n- **Navigation:** "Where do I create a delivery?", "Where do I upload assets?", "How do I run a query?"\n- **Campaigns:** "What is the orchestration canvas?", "How do I set up A/B testing?", "Explain wave sending"\n- **Content:** "What is the email designer?", "How do fragments work?", "What are content templates?"\n- **Offer Decisioning:** "What is the Item Catalog?", "How do ranking formulas work?", "Explain the end-to-end offer decisioning flow"\n- **Transactional:** "What is transactional messaging?", "How do event templates work?"\n- **Data:** "How many offers are in draft status?", "List ranking formulas", "Show custom objects", "Show audiences"\n- **Analytics:** "What are the dashboard KPIs?", "How do delivery reports work?", "What are heatmaps?"\n- **AI Features:** "What AI features are available?", "How does churn prediction work?", "What is auto-segmentation?"\n- **Data Model:** "What is the ER diagram?", "How do custom objects work?", "What are enumerations?"\n- **Infrastructure:** "How does Brevo integration work?", "What is the query service?"\n\nAsk me anything — features, navigation, data queries, how-tos, or explanations!';

  if (/a\/?b test|split test/i.test(lower))
    return 'To set up **A/B testing** on a delivery, go to the delivery wizard and look for the A/B Testing toggle. When enabled, you can:\n\n1. Create two content variants (A and B)\n2. Set the split percentage (e.g., 50/50)\n3. Choose the winner rule (open rate, click rate, etc.)\n4. Optionally add weighted metrics and guardrails\n\nThe system will send each variant to a portion of your audience and determine the winner automatically.';

  if (/folder|organize|explorer/i.test(lower))
    return 'The **Folder System** lets you organize all entities hierarchically (like Adobe Campaign). You can:\n\n- **Explorer view:** Browse all folders and their contents\n- **Create folders:** Right-click in the folder tree → "New folder"\n- **Move items:** Drag and drop between folders\n- **Folder column:** Enable the "Folder" column in any listing page via the column selector\n- **Form picker:** When creating/editing any entity, use the folder dropdown to assign it\n\nDefault folder categories include Profiles & Targets, Campaign Management, Content Management, Offer Decisioning, and Data & Segments.';

  // Fallback
  return 'I can help with **every feature** in the Marketing Automation Platform. Try asking:\n\n**Campaigns & Deliveries:** "Where do I create a delivery?", "What is the orchestration canvas?", "How does STO work?"\n**Content:** "What is the email designer?", "How do fragments work?", "Where do I upload assets?"\n**Offer Decisioning:** "Explain the end-to-end offer decisioning flow", "What are ranking formulas?", "How does advanced capping work?"\n**Transactional:** "What is transactional messaging?", "How do event templates work?"\n**Data & Analytics:** "How many workflows are active?", "Show all offers", "What are the dashboard KPIs?"\n**Data Model:** "What are custom objects?", "What is the ER diagram?", "How do enumerations work?"\n**AI Features:** "What AI features are available?", "How does churn prediction work?"\n**Infrastructure:** "How does Brevo integration work?", "What is the query service?"\n\nFeel free to ask anything!';
}

module.exports = router;
