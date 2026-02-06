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

module.exports = router;
