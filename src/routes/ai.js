const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../database');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper function to call OpenAI API
async function callOpenAI(prompt, systemMessage = 'You are a helpful marketing automation assistant.') {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
    // Return mock response if no API key
    return null;
  }
  
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
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

// Generate email subject lines
router.post('/generate-subject', async (req, res) => {
  try {
    const {
      productName,
      targetAudience,
      tone = 'professional',
      count = 5
    } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: 'productName is required' });
    }
    
    const prompt = `Generate ${count} compelling email subject lines for a marketing campaign about "${productName}" targeting ${targetAudience}. The tone should be ${tone}. Make them attention-grabbing and likely to increase open rates. Return only the subject lines, one per line, without numbering.`;
    
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

module.exports = router;
