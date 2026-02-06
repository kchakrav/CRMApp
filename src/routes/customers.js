const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Get all customers with pagination and filtering
router.get('/', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = '',
      lifecycle_stage = '' 
    } = req.query;
    
    let customers = query.all('customers');
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.email?.toLowerCase().includes(searchLower) ||
        c.first_name?.toLowerCase().includes(searchLower) ||
        c.last_name?.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      customers = customers.filter(c => c.status === status);
    }
    
    if (lifecycle_stage) {
      customers = customers.filter(c => c.lifecycle_stage === lifecycle_stage);
    }
    
    // Pagination
    const total = customers.length;
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = customers.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      customers: paginatedCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
router.get('/:id', (req, res) => {
  try {
    const customer = query.get('customers', parseInt(req.params.id));
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new customer
router.post('/', (req, res) => {
  try {
    const {
      email,
      phone,
      first_name,
      last_name,
      status = 'active',
      timezone = 'UTC',
      language = 'en',
      country,
      tags = [],
      custom_properties = {},
      lifecycle_stage,
      marketing_consent = true
    } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if email already exists
    const existing = query.all('customers').find(c => c.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const result = query.insert('customers', {
      email,
      phone,
      first_name,
      last_name,
      status,
      timezone,
      language,
      country,
      tags,
      custom_properties,
      lifecycle_stage,
      marketing_consent,
      lead_score: 0,
      email_verified: false,
      phone_verified: false,
      gdpr_consent: false,
      last_activity_at: new Date().toISOString()
    });
    
    res.status(201).json(result.record);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const existing = query.get('customers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    query.update('customers', id, updates);
    const updated = query.get('customers', id);
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const existing = query.get('customers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    query.delete('customers', id);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer events
router.get('/:id/events', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { limit = 100 } = req.query;
    
    const events = query.all('customer_events', e => e.customer_id === id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching customer events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer orders
router.get('/:id/orders', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const orders = query.all('orders', o => o.customer_id === id)
      .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at));
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Advanced search
router.post('/search', (req, res) => {
  try {
    const { filters, limit = 100 } = req.body;
    
    let customers = query.all('customers');
    
    if (filters) {
      if (filters.email) {
        customers = customers.filter(c => c.email?.toLowerCase().includes(filters.email.toLowerCase()));
      }
      if (filters.lifecycle_stage) {
        customers = customers.filter(c => c.lifecycle_stage === filters.lifecycle_stage);
      }
      if (filters.min_lead_score) {
        customers = customers.filter(c => c.lead_score >= filters.min_lead_score);
      }
    }
    
    res.json(customers.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
