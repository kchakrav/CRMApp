const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get all contacts with pagination and filtering
router.get('/', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = '',
      subscription_status = '',
      engagement_score = '' 
    } = req.query;
    
    let contacts = query.all('contacts');
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(c => 
        c.email?.toLowerCase().includes(searchLower) ||
        c.first_name?.toLowerCase().includes(searchLower) ||
        c.last_name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search)
      );
    }
    
    if (status) {
      contacts = contacts.filter(c => c.status === status);
    }
    
    if (subscription_status) {
      contacts = contacts.filter(c => c.subscription_status === subscription_status);
    }
    
    if (engagement_score) {
      const score = parseInt(engagement_score);
      contacts = contacts.filter(c => c.engagement_score >= score);
    }
    
    // Sort by newest first
    contacts.sort((a, b) => (b.id || 0) - (a.id || 0));

    // Pagination
    const total = contacts.length;
    const startIndex = (page - 1) * limit;
    const paginatedContacts = contacts.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      contacts: paginatedContacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact by ID
router.get('/:id', (req, res) => {
  try {
    const contact = query.get('contacts', parseInt(req.params.id));
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new contact
router.post('/', (req, res) => {
  try {
    const {
      email,
      phone,
      first_name,
      last_name,
      status = 'active',
      
      // B2C Demographics
      date_of_birth,
      gender,
      city,
      state,
      country,
      postal_code,
      timezone = 'UTC',
      language = 'en',
      
      // B2C Preferences
      email_opt_in = false,
      sms_opt_in = false,
      push_opt_in = false,
      whatsapp_opt_in = false,
      communication_frequency = 'weekly', // daily, weekly, monthly
      preferred_channel = 'email', // email, sms, push, whatsapp
      
      // B2C Interests & Behavior
      interests = [], // ['fashion', 'sports', 'tech', 'home', 'beauty']
      product_preferences = {},
      favorite_categories = [],
      price_sensitivity = 'medium', // low, medium, high
      
      // B2C Engagement & Scoring
      subscription_status = 'subscribed', // subscribed, unsubscribed, bounced, pending
      engagement_score = 50, // 0-100
      last_purchase_date,
      total_purchases = 0,
      lifetime_value = 0,
      average_order_value = 0,
      
      // B2C Loyalty & Rewards
      loyalty_tier = 'bronze', // bronze, silver, gold, platinum
      loyalty_points = 0,
      referral_count = 0,
      
      // Marketing Attribution
      source = 'organic', // organic, paid, social, referral, email
      campaign_source,
      utm_source,
      utm_medium,
      utm_campaign,
      
      // Tags & Custom
      tags = [],
      custom_attributes = {},
      
      // Consent & Privacy
      marketing_consent = false,
      gdpr_consent = false,
      email_verified = false,
      phone_verified = false,
      
      notes = '',
      folder_id = null
    } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if email already exists
    const existing = query.all('contacts').find(c => c.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const result = query.insert('contacts', {
      // Basic Info
      email,
      phone,
      first_name,
      last_name,
      status,
      
      // Demographics
      date_of_birth,
      gender,
      city,
      state,
      country,
      postal_code,
      timezone,
      language,
      
      // Preferences
      email_opt_in,
      sms_opt_in,
      push_opt_in,
      whatsapp_opt_in,
      communication_frequency,
      preferred_channel,
      
      // Interests & Behavior
      interests,
      product_preferences,
      favorite_categories,
      price_sensitivity,
      
      // Engagement & Scoring
      subscription_status,
      engagement_score,
      last_purchase_date,
      total_purchases,
      lifetime_value,
      average_order_value,
      
      // Loyalty & Rewards
      loyalty_tier,
      loyalty_points,
      referral_count,
      
      // Attribution
      source,
      campaign_source,
      utm_source,
      utm_medium,
      utm_campaign,
      
      // Tags & Custom
      tags,
      custom_attributes,
      
      // Consent & Privacy
      marketing_consent,
      gdpr_consent,
      email_verified,
      phone_verified,
      
      notes,
      folder_id: folder_id ? parseInt(folder_id) : null,
      last_activity_at: new Date().toISOString()
    });
    
    console.log('✅ Contact created successfully:', result.record);
    res.status(201).json(result.record);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const existing = query.get('contacts', id);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    query.update('contacts', id, updates);
    const updated = query.get('contacts', id);
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = query.get('contacts', id);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    query.delete('contacts', id);
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact events
router.get('/:id/events', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { limit = 100 } = req.query;
    
    const events = query.all('contact_events', e => e.contact_id === id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching contact events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact orders
router.get('/:id/orders', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const orders = query.all('orders', o => o.contact_id === id)
      .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at));
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching contact orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Advanced search
router.post('/search', (req, res) => {
  try {
    const { filters, limit = 100 } = req.body;
    
    let contacts = query.all('contacts');
    
    if (filters) {
      if (filters.email) {
        contacts = contacts.filter(c => c.email?.toLowerCase().includes(filters.email.toLowerCase()));
      }
      if (filters.subscription_status) {
        contacts = contacts.filter(c => c.subscription_status === filters.subscription_status);
      }
      if (filters.min_engagement_score) {
        contacts = contacts.filter(c => c.engagement_score >= filters.min_engagement_score);
      }
      if (filters.loyalty_tier) {
        contacts = contacts.filter(c => c.loyalty_tier === filters.loyalty_tier);
      }
      if (filters.interests && filters.interests.length > 0) {
        contacts = contacts.filter(c => 
          filters.interests.some(interest => c.interests?.includes(interest))
        );
      }
    }
    
    res.json(contacts.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contact statistics
router.get('/:id/stats', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contact = query.get('contacts', id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const orders = query.all('orders', o => o.contact_id === id && o.status === 'completed');
    const events = query.all('contact_events', e => e.contact_id === id);
    
    const stats = {
      total_orders: orders.length,
      total_spent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      average_order_value: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0,
      last_order_date: orders.length > 0 ? orders[0].ordered_at : null,
      total_events: events.length,
      last_activity: events.length > 0 ? events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at : null
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
