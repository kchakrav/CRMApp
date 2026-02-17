const express = require('express');
const router = express.Router();
const { query } = require('../database');

// ════════════════════════════════════════════
// SEED DATA
// ════════════════════════════════════════════

function seedTemplates() {
  if (query.count('event_triggers') > 0) return;
  const tpls = [
    { name: 'OrderPlaced', description: 'Triggered when a customer completes a purchase', category: 'Commerce',
      attributes: [{ name: 'orderId', type: 'string', required: true },{ name: 'amount', type: 'number', required: true },{ name: 'currency', type: 'string', required: false },{ name: 'items', type: 'array', required: false },{ name: 'firstName', type: 'string', required: false },{ name: 'lastName', type: 'string', required: false }],
      identity_fields: ['userId','customerId'], delivery_fields: ['email','phone'],
      sample_payload: { orderId:'ORD-12345', amount:99.99, currency:'USD', items:[{name:'Widget',qty:2}], firstName:'Jane', lastName:'Doe', email:'jane@example.com', userId:'USR-001' },
      status:'active', created_by:'System' },
    { name: 'PasswordResetRequested', description: 'Triggered when a user requests a password reset', category: 'Account',
      attributes: [{ name:'resetToken',type:'string',required:true },{ name:'resetUrl',type:'string',required:true },{ name:'expiresIn',type:'number',required:false }],
      identity_fields:['userId'], delivery_fields:['email'],
      sample_payload:{ resetToken:'tok_abc123', resetUrl:'https://app.example.com/reset?token=tok_abc123', expiresIn:3600, email:'user@example.com', userId:'USR-002' },
      status:'active', created_by:'System' },
    { name: 'ShipmentDispatched', description: 'Triggered when an order is shipped', category: 'Commerce',
      attributes: [{ name:'orderId',type:'string',required:true },{ name:'trackingNumber',type:'string',required:true },{ name:'carrier',type:'string',required:true },{ name:'estimatedDelivery',type:'string',required:false },{ name:'trackingUrl',type:'string',required:false }],
      identity_fields:['userId','customerId'], delivery_fields:['email','phone'],
      sample_payload:{ orderId:'ORD-12345', trackingNumber:'TRK-789', carrier:'FedEx', estimatedDelivery:'2026-02-10', trackingUrl:'https://track.example.com/TRK-789', email:'jane@example.com', userId:'USR-001' },
      status:'active', created_by:'System' },
    { name: 'CartAbandoned', description: 'Triggered when a shopping cart is abandoned for 1 hour', category: 'Commerce',
      attributes: [{ name:'cartId',type:'string',required:true },{ name:'cartTotal',type:'number',required:true },{ name:'itemCount',type:'number',required:true },{ name:'topItem',type:'string',required:false },{ name:'cartUrl',type:'string',required:false }],
      identity_fields:['userId'], delivery_fields:['email'],
      sample_payload:{ cartId:'CRT-456', cartTotal:149.95, itemCount:3, topItem:'Premium Headphones', cartUrl:'https://shop.example.com/cart/CRT-456', email:'shopper@example.com', userId:'USR-003' },
      status:'active', created_by:'System' },
    { name: 'AccountCreated', description: 'Triggered when a new user account is created', category: 'Account',
      attributes: [{ name:'verificationUrl',type:'string',required:true },{ name:'welcomeOffer',type:'string',required:false }],
      identity_fields:['userId'], delivery_fields:['email'],
      sample_payload:{ verificationUrl:'https://app.example.com/verify?t=xyz', welcomeOffer:'WELCOME20', email:'newuser@example.com', userId:'USR-004', firstName:'Alex' },
      status:'active', created_by:'System' },
    { name: 'PaymentFailed', description: 'Triggered when a recurring payment fails', category: 'Billing',
      attributes: [{ name:'invoiceId',type:'string',required:true },{ name:'amount',type:'number',required:true },{ name:'failureReason',type:'string',required:true },{ name:'retryDate',type:'string',required:false },{ name:'updatePaymentUrl',type:'string',required:false }],
      identity_fields:['userId','customerId'], delivery_fields:['email'],
      sample_payload:{ invoiceId:'INV-789', amount:29.99, failureReason:'Card expired', retryDate:'2026-02-08', updatePaymentUrl:'https://app.example.com/billing', email:'customer@example.com', userId:'USR-005' },
      status:'active', created_by:'System' },
    { name: 'AppointmentReminder', description: 'Triggered 24 hours before an appointment', category: 'Scheduling',
      attributes: [{ name:'appointmentId',type:'string',required:true },{ name:'appointmentDate',type:'string',required:true },{ name:'appointmentTime',type:'string',required:true },{ name:'location',type:'string',required:false },{ name:'providerName',type:'string',required:false }],
      identity_fields:['userId'], delivery_fields:['email','phone','pushToken'],
      sample_payload:{ appointmentId:'APT-101', appointmentDate:'2026-02-07', appointmentTime:'10:30 AM', location:'123 Main St', providerName:'Dr. Smith', email:'patient@example.com', phone:'+15551234567', userId:'USR-006' },
      status:'active', created_by:'System' },
    { name: 'OTPRequested', description: 'Triggered when a one-time password is generated', category: 'Security',
      attributes: [{ name:'otpCode',type:'string',required:true },{ name:'expiresIn',type:'number',required:true },{ name:'action',type:'string',required:false }],
      identity_fields:['userId'], delivery_fields:['email','phone'],
      sample_payload:{ otpCode:'482901', expiresIn:300, action:'login', email:'user@example.com', phone:'+15559876543', userId:'USR-007' },
      status:'active', created_by:'System' }
  ];
  tpls.forEach(t => query.insert('event_triggers', t));
}

function seedEvents() {
  if (query.count('events') > 0) return;
  // Create events from templates — lookup by name to avoid ID mismatch
  const tpls = query.all('event_triggers');
  const eventsToCreate = [
    { template_name: 'OrderPlaced', name: 'Order Placed', status: 'published', published_at: '2026-01-10T10:00:00Z' },
    { template_name: 'PasswordResetRequested', name: 'Password Reset Request', status: 'published', published_at: '2026-01-10T10:00:00Z' },
    { template_name: 'ShipmentDispatched', name: 'Shipment Dispatched', status: 'published', published_at: '2026-01-12T09:00:00Z' },
    { template_name: 'CartAbandoned', name: 'Cart Abandoned', status: 'published', published_at: '2026-01-14T08:00:00Z' },
    { template_name: 'OTPRequested', name: 'OTP Verification', status: 'published', published_at: '2026-01-15T11:00:00Z' },
    { template_name: 'AccountCreated', name: 'Welcome Email', status: 'draft', published_at: null },
    { template_name: 'PaymentFailed', name: 'Payment Retry Notice', status: 'draft', published_at: null }
  ];
  eventsToCreate.forEach(e => {
    const tpl = tpls.find(t => t.name === e.template_name);
    if (!tpl) return;
    query.insert('events', {
      name: e.name,
      template_id: tpl.id,
      template_name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      attributes: JSON.parse(JSON.stringify(tpl.attributes)),
      identity_fields: [...tpl.identity_fields],
      delivery_fields: [...tpl.delivery_fields],
      sample_payload: JSON.parse(JSON.stringify(tpl.sample_payload)),
      status: e.status,
      published_at: e.published_at,
      created_by: 'Admin'
    });
  });
}

function seedMessages() {
  if (query.count('transactional_messages') > 0) return;
  // Lookup events by name to get correct IDs
  const allEvts = query.all('events');
  const evtByName = {};
  allEvts.forEach(e => { evtByName[e.name] = e; });

  const msgDefs = [
    { name:'Order Confirmation', event_name:'Order Placed',
      channels:['email'], channel_config:{ email:{ from_name:'MyShop', from_email:'orders@myshop.com', reply_to:'support@myshop.com' }},
      recipient_mode:'profile_first', identity_field:'userId', fallback_delivery_field:'email', no_recipient_action:'drop_log',
      content:{ email:{ subject:'Your order {{event.orderId}} is confirmed!', body:'Hi {{event.firstName}},\n\nThank you for your order of ${{event.amount}}.\n\nOrder ID: {{event.orderId}}\n\nBest regards,\nMyShop Team' }},
      status:'published', version:1, published_at:'2026-01-15T10:00:00Z', created_by:'Admin',
      stats:{ received:1247, sent:1238, delivered:1220, failed:18 }},
    { name:'Password Reset', event_name:'Password Reset Request',
      channels:['email','sms'], channel_config:{ email:{ from_name:'Security', from_email:'no-reply@myapp.com', reply_to:'' }, sms:{ sender_id:'MyApp' }},
      recipient_mode:'profile_first', identity_field:'userId', fallback_delivery_field:'email', no_recipient_action:'error_queue',
      content:{ email:{ subject:'Reset your password', body:'Hi,\n\nClick here to reset: {{event.resetUrl}}\n\nThis link expires in {{event.expiresIn}} seconds.' }, sms:{ body:'Your password reset code: {{event.resetToken}}. Expires in 60 min.' }},
      status:'published', version:2, published_at:'2026-01-20T14:30:00Z', created_by:'Admin',
      stats:{ received:532, sent:530, delivered:528, failed:2 }},
    { name:'Shipment Notification', event_name:'Shipment Dispatched',
      channels:['email','push'], channel_config:{ email:{ from_name:'MyShop Shipping', from_email:'shipping@myshop.com' }, push:{ title_template:'Your order is on the way!' }},
      recipient_mode:'profile_first', identity_field:'userId', fallback_delivery_field:'email', no_recipient_action:'drop_log',
      content:{ email:{ subject:'Your order {{event.orderId}} has shipped!', body:'Shipped via {{event.carrier}}.\nTracking: {{event.trackingNumber}}' }, push:{ title:'Order shipped!', body:'Your order {{event.orderId}} is on the way via {{event.carrier}}.' }},
      status:'published', version:1, published_at:'2026-01-18T09:00:00Z', created_by:'Admin',
      stats:{ received:856, sent:850, delivered:842, failed:8 }},
    { name:'Abandoned Cart Reminder', event_name:'Cart Abandoned',
      channels:['email'], channel_config:{ email:{ from_name:'MyShop', from_email:'hello@myshop.com' }},
      recipient_mode:'profile_first', identity_field:'userId', fallback_delivery_field:'email', no_recipient_action:'drop_log',
      content:{ email:{ subject:'You left something behind!', body:'You have {{event.itemCount}} items worth ${{event.cartTotal}} in your cart.\n\nComplete your purchase: {{event.cartUrl}}' }},
      status:'draft', version:1, published_at:null, created_by:'Marketing',
      stats:{ received:0, sent:0, delivered:0, failed:0 }},
    { name:'OTP Verification', event_name:'OTP Verification',
      channels:['sms'], channel_config:{ sms:{ sender_id:'MyApp' }},
      recipient_mode:'event_only', identity_field:null, fallback_delivery_field:'phone', no_recipient_action:'error_queue',
      content:{ sms:{ body:'Your verification code is {{event.otpCode}}. Valid for {{event.expiresIn}} seconds.' }},
      status:'published', version:1, published_at:'2026-01-25T11:00:00Z', created_by:'Admin',
      stats:{ received:3421, sent:3421, delivered:3390, failed:31 }}
  ];
  msgDefs.forEach(m => {
    const evt = evtByName[m.event_name];
    const rec = { ...m, event_id: evt ? evt.id : null };
    query.insert('transactional_messages', rec);
  });
  seedEventHistory();
}

function seedEventHistory() {
  if (query.count('event_history') > 0) return;
  // Build lookup maps for dynamic IDs
  const allMsgs = query.all('transactional_messages');
  const msgByName = {};
  allMsgs.forEach(m => { msgByName[m.name] = m; });
  const evtMsgMap = {
    'Order Placed': 'Order Confirmation',
    'Password Reset Request': 'Password Reset',
    'Shipment Dispatched': 'Shipment Notification',
    'OTP Verification': 'OTP Verification',
    'Cart Abandoned': 'Abandoned Cart Reminder'
  };
  const evtNames = Object.keys(evtMsgMap);
  const channels = ['email','sms','push'];
  const emails = ['jane@example.com','john@test.com','guest@shop.com','alex@mail.com','user42@gmail.com'];
  const phones = ['+15551234567','+15559876543'];
  const errMsgs = ['','','','Invalid email address','Carrier rejected','Rate limited','Invalid push token',''];
  for (let i = 0; i < 50; i++) {
    const en = evtNames[i % evtNames.length];
    const ch = en === 'OTP Verification' ? 'sms' : channels[i % 2 === 0 ? 0 : i % 3];
    const status = i % 7 === 0 ? 'failed' : i % 11 === 0 ? 'dropped' : (i % 3 === 0 ? 'delivered' : 'sent');
    const msgName = evtMsgMap[en];
    const msg = msgByName[msgName];
    const msgId = msg ? msg.id : null;
    query.insert('event_history', {
      event_name: en, event_id: 'evt_' + (1000 + i), message_id: msgId,
      message_name: msgName,
      channel: ch, recipient: ch === 'sms' ? phones[i % phones.length] : emails[i % emails.length],
      status, error: status === 'failed' ? (errMsgs[i % errMsgs.length] || 'Unknown error') : '',
      latency_ms: Math.round(200 + Math.random() * 2800), event_payload: { sample: true },
      processed_at: new Date(Date.now() - i * 720000).toISOString()
    });
  }
}

// Initialize
seedTemplates();
seedEvents();
seedMessages();
seedEventHistory();

// ════════════════════════════════════════════
// 1. EVENT TEMPLATES (blueprints)
// ════════════════════════════════════════════
router.get('/templates', (req, res) => {
  try {
    let tpls = query.all('event_triggers');
    if (req.query.status) tpls = tpls.filter(t => t.status === req.query.status);
    // Attach linked event count
    tpls = tpls.map(t => {
      const evts = query.all('events', e => e.template_id === t.id);
      return { ...t, event_count: evts.length };
    });
    res.json({ templates: tpls });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/templates/:id', (req, res) => {
  try {
    const t = query.get('event_triggers', parseInt(req.params.id));
    if (!t) return res.status(404).json({ error: 'Template not found' });
    res.json(t);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/templates', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = query.insert('event_triggers', {
      name, description: req.body.description || '', category: req.body.category || 'Custom',
      attributes: req.body.attributes || [], identity_fields: req.body.identity_fields || [],
      delivery_fields: req.body.delivery_fields || [], sample_payload: req.body.sample_payload || {},
      status: req.body.status || 'active', created_by: req.body.created_by || 'System'
    });
    res.status(201).json(result.record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/templates/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!query.get('event_triggers', id)) return res.status(404).json({ error: 'Template not found' });
    const u = { ...req.body }; delete u.id; delete u.created_at;
    query.update('event_triggers', id, u);
    res.json(query.get('event_triggers', id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// Disable template — hides from new event creation, existing events keep working
router.post('/templates/:id/disable', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tpl = query.get('event_triggers', id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });
    query.update('event_triggers', id, { status: 'inactive' });
    res.json({ message: 'Template disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Enable template
router.post('/templates/:id/enable', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tpl = query.get('event_triggers', id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });
    query.update('event_triggers', id, { status: 'active' });
    res.json({ message: 'Template enabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete template — NOT allowed, use disable instead
router.delete('/templates/:id', (req, res) => {
  res.status(400).json({ error: 'Templates cannot be deleted. Use disable instead to prevent new events from using this template.' });
});

// Legacy /events endpoints removed — use /templates and /event-instances instead

// ════════════════════════════════════════════
// 2. EVENTS (instances created from templates)
// ════════════════════════════════════════════
router.get('/event-instances', (req, res) => {
  try {
    let evts = query.all('events');
    if (req.query.status) evts = evts.filter(e => e.status === req.query.status);
    // Attach linked message count
    evts = evts.map(e => {
      const msgs = query.all('transactional_messages', m => m.event_id === e.id);
      return { ...e, message_count: msgs.length, published_message_count: msgs.filter(m => m.status === 'published').length };
    });
    res.json({ events: evts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/event-instances/:id', (req, res) => {
  try {
    const evt = query.get('events', parseInt(req.params.id));
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    const msgs = query.all('transactional_messages', m => m.event_id === evt.id);
    res.json({ ...evt, messages: msgs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create event — from template or from scratch
router.post('/event-instances', (req, res) => {
  try {
    const { name, template_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    let eventData = {
      name,
      template_id: null,
      template_name: null,
      description: req.body.description || '',
      category: req.body.category || 'Custom',
      attributes: req.body.attributes || [],
      identity_fields: req.body.identity_fields || [],
      delivery_fields: req.body.delivery_fields || [],
      sample_payload: req.body.sample_payload || {},
      status: 'draft',
      published_at: null,
      created_by: req.body.created_by || 'Admin'
    };

    // If template_id provided, inherit from template
    if (template_id) {
      const tpl = query.get('event_triggers', template_id);
      if (!tpl) return res.status(404).json({ error: 'Template not found' });
      if (tpl.status === 'inactive') return res.status(400).json({ error: 'This template is disabled and cannot be used for new events' });
      eventData.template_id = tpl.id;
      eventData.template_name = tpl.name;
      eventData.description = req.body.description || tpl.description;
      eventData.category = req.body.category || tpl.category;
      eventData.attributes = req.body.attributes || JSON.parse(JSON.stringify(tpl.attributes));
      eventData.identity_fields = req.body.identity_fields || [...tpl.identity_fields];
      eventData.delivery_fields = req.body.delivery_fields || [...tpl.delivery_fields];
      eventData.sample_payload = req.body.sample_payload || JSON.parse(JSON.stringify(tpl.sample_payload));
    }

    const result = query.insert('events', eventData);
    res.status(201).json(result.record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update event — BLOCKED if published (must unpublish first)
router.put('/event-instances/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const evt = query.get('events', id);
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    if (evt.status === 'published') {
      return res.status(400).json({ error: 'Cannot edit a published event. Unpublish it first, then make your changes and republish.' });
    }
    const u = { ...req.body }; delete u.id; delete u.created_at; delete u.status; delete u.published_at;
    query.update('events', id, u);
    res.json(query.get('events', id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Publish event
router.post('/event-instances/:id/publish', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const evt = query.get('events', id);
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    // Validate has at least one identity or delivery field
    if ((!evt.identity_fields || evt.identity_fields.length === 0) && (!evt.delivery_fields || evt.delivery_fields.length === 0)) {
      return res.status(400).json({ error: 'Event must have at least one identity or delivery field to be published' });
    }
    query.update('events', id, { status: 'published', published_at: new Date().toISOString() });
    res.json({ message: 'Event published' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Unpublish event — BLOCKED if any linked message is published
router.post('/event-instances/:id/unpublish', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const evt = query.get('events', id);
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    // Check for published messages
    const pubMsgs = query.all('transactional_messages', m => m.event_id === id && m.status === 'published');
    if (pubMsgs.length > 0) {
      return res.status(400).json({
        error: 'Cannot unpublish: ' + pubMsgs.length + ' published message(s) are linked to this event. Unpublish them first.',
        published_messages: pubMsgs.map(m => ({ id: m.id, name: m.name }))
      });
    }
    query.update('events', id, { status: 'draft', published_at: null });
    res.json({ message: 'Event unpublished' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete event — BLOCKED if any messages linked
router.delete('/event-instances/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!query.get('events', id)) return res.status(404).json({ error: 'Event not found' });
    const msgs = query.all('transactional_messages', m => m.event_id === id);
    if (msgs.length > 0) return res.status(400).json({ error: 'Cannot delete: ' + msgs.length + ' message(s) are linked. Delete them first.' });
    query.delete('events', id);
    res.json({ message: 'Event deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// 3. EVENT MESSAGES (linked to events)
// ════════════════════════════════════════════
router.get('/messages', (req, res) => {
  try {
    let msgs = query.all('transactional_messages');
    if (req.query.status) msgs = msgs.filter(m => m.status === req.query.status);
    if (req.query.event_id) msgs = msgs.filter(m => m.event_id === parseInt(req.query.event_id));
    res.json({ messages: msgs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/messages/:id', (req, res) => {
  try {
    const msg = query.get('transactional_messages', parseInt(req.params.id));
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create message — event_id must point to a published event
router.post('/messages', (req, res) => {
  try {
    const { name, event_id } = req.body;
    if (!name || !event_id) return res.status(400).json({ error: 'name and event_id are required' });
    const evt = query.get('events', event_id);
    if (!evt) return res.status(404).json({ error: 'Event not found' });
    if (evt.status !== 'published') return res.status(400).json({ error: 'Event must be in published state to create a message' });
    const result = query.insert('transactional_messages', {
      name, event_id, event_name: req.body.event_name || evt.name,
      channels: req.body.channels || [], channel_config: req.body.channel_config || {},
      recipient_mode: req.body.recipient_mode || 'profile_first',
      identity_field: req.body.identity_field || null,
      fallback_delivery_field: req.body.fallback_delivery_field || null,
      no_recipient_action: req.body.no_recipient_action || 'drop_log',
      content: req.body.content || {},
      status: 'draft', version: 1, published_at: null,
      created_by: req.body.created_by || 'System',
      stats: { received: 0, sent: 0, delivered: 0, failed: 0 }
    });
    res.status(201).json(result.record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/messages/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!query.get('transactional_messages', id)) return res.status(404).json({ error: 'Message not found' });
    const u = { ...req.body }; delete u.id; delete u.created_at;
    query.update('transactional_messages', id, u);
    res.json(query.get('transactional_messages', id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Publish message — event must be published
router.post('/messages/:id/publish', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msg = query.get('transactional_messages', id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const evt = query.get('events', msg.event_id);
    if (!evt || evt.status !== 'published') return res.status(400).json({ error: 'Cannot publish: the linked event is not in published state' });
    query.update('transactional_messages', id, { status: 'published', published_at: new Date().toISOString(), version: (msg.version || 1) + 1 });
    res.json({ message: 'Message published', version: (msg.version || 1) + 1 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Unpublish (disable) message
router.post('/messages/:id/disable', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msg = query.get('transactional_messages', id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    query.update('transactional_messages', id, { status: 'draft' });
    res.json({ message: 'Message unpublished' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/messages/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msg = query.get('transactional_messages', id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.status === 'published') return res.status(400).json({ error: 'Cannot delete a published message. Unpublish it first.' });
    query.delete('transactional_messages', id);
    res.json({ message: 'Message deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Message report
router.get('/messages/:id/report', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msg = query.get('transactional_messages', id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const logs = query.all('event_history', l => l.message_id === id);
    const stats = msg.stats || { received: 0, sent: 0, delivered: 0, failed: 0 };
    const timeline = [];
    for (let h = 0; h < 24; h++) {
      const decay = Math.exp(-0.08 * h);
      timeline.push({ hour: h,
        received: Math.round((stats.received / 24) * decay * (0.6 + Math.random() * 0.8)),
        sent: Math.round((stats.sent / 24) * decay * (0.6 + Math.random() * 0.8)),
        failed: Math.round((stats.failed / 24) * decay * (0.3 + Math.random() * 1.4)) });
    }
    res.json({
      message: { id: msg.id, name: msg.name, event_name: msg.event_name, channels: msg.channels, status: msg.status, version: msg.version, published_at: msg.published_at },
      stats, rates: { delivery_rate: stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0', failure_rate: stats.received > 0 ? ((stats.failed / stats.received) * 100).toFixed(1) : '0' },
      timeline, recent_logs: logs.slice(-30).reverse()
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// 4. EVENT HISTORY & DASHBOARD
// ════════════════════════════════════════════
router.get('/history', (req, res) => {
  try {
    let logs = query.all('event_history');
    if (req.query.event_name) logs = logs.filter(l => l.event_name === req.query.event_name);
    if (req.query.status) logs = logs.filter(l => l.status === req.query.status);
    if (req.query.channel) logs = logs.filter(l => l.channel === req.query.channel);
    if (req.query.message_id) logs = logs.filter(l => l.message_id === parseInt(req.query.message_id));
    logs.sort((a, b) => new Date(b.processed_at || b.created_at) - new Date(a.processed_at || a.created_at));
    const page = parseInt(req.query.page) || 1, limit = parseInt(req.query.limit) || 50, offset = (page - 1) * limit;
    res.json({ logs: logs.slice(offset, offset + limit), total: logs.length, page, limit, pages: Math.ceil(logs.length / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard', (req, res) => {
  try {
    const allLogs = query.all('event_history');
    const allMsgs = query.all('transactional_messages');
    const allEvts = query.all('events');
    const totalReceived = allLogs.length;
    const totalSent = allLogs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
    const totalDelivered = allLogs.filter(l => l.status === 'delivered').length;
    const totalFailed = allLogs.filter(l => l.status === 'failed').length;
    const totalDropped = allLogs.filter(l => l.status === 'dropped').length;
    const avgLatency = allLogs.length > 0 ? Math.round(allLogs.reduce((s, l) => s + (l.latency_ms || 0), 0) / allLogs.length) : 0;
    res.json({
      overview: {
        total_received: totalReceived, total_sent: totalSent, total_delivered: totalDelivered,
        total_failed: totalFailed, total_dropped: totalDropped, avg_latency_ms: avgLatency,
        active_messages: allMsgs.filter(m => m.status === 'published').length, total_messages: allMsgs.length,
        published_events: allEvts.filter(e => e.status === 'published').length, total_events: allEvts.length,
        total_templates: query.count('event_triggers')
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
