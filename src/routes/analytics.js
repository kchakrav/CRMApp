const express = require('express');
const router = express.Router();
const { query } = require('../database');

// Dashboard metrics
router.get('/dashboard', (req, res) => {
  try {
    const contacts = query.all('contacts');
    const workflows = query.all('workflows');
    const orders = query.all('orders');
    const metrics = query.all('workflow_metrics'); // Updated from campaign_metrics
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Contact stats (B2C)
    const contactStats = {
      total_contacts: contacts.length,
      active_contacts: contacts.filter(c => c.status === 'active').length,
      subscribed_contacts: contacts.filter(c => c.subscription_status === 'subscribed').length,
      vip_contacts: contacts.filter(c => c.loyalty_tier === 'platinum' || c.loyalty_tier === 'gold').length,
      new_contacts_30d: contacts.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
    };
    
    // Workflow stats (unified campaigns + workflows)
    const workflowStats = {
      total_campaigns: workflows.length,
      active_campaigns: workflows.filter(w => w.status === 'active').length,
      completed_campaigns: workflows.filter(w => w.status === 'completed').length
    };
    
    // Email metrics
    const totalSent = metrics.reduce((sum, m) => sum + (m.sent || 0), 0);
    const totalOpens = metrics.reduce((sum, m) => sum + (m.opened || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicked || 0), 0);
    const totalConverted = metrics.reduce((sum, m) => sum + (m.converted || 0), 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    
    // Order stats
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'pending');
    const totalOrderRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = completedOrders.length > 0 ? totalOrderRevenue / completedOrders.length : 0;
    const orders30d = completedOrders.filter(o => new Date(o.ordered_at) >= thirtyDaysAgo).length;
    const revenue30d = completedOrders
      .filter(o => new Date(o.ordered_at) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + o.total, 0);
    
    res.json({
      contacts: contactStats,
      campaigns: workflowStats, // Keep as "campaigns" for frontend compatibility
      email_metrics: {
        total_emails_sent: totalSent,
        total_opens: totalOpens,
        total_clicks: totalClicks,
        total_conversions: totalConverted,
        total_revenue: totalRevenue,
        open_rate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : 0,
        click_rate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(2) : 0,
        conversion_rate: totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(2) : 0
      },
      orders: {
        total_orders: completedOrders.length,
        total_revenue: totalOrderRevenue.toFixed(2),
        average_order_value: avgOrderValue.toFixed(2),
        orders_30d: orders30d,
        revenue_30d: revenue30d.toFixed(2)
      },
      workflows: {
        total_workflows: workflows.length,
        active_workflows: workflows.filter(w => w.status === 'active').length
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Other analytics routes
router.get('/campaigns', (req, res) => {
  try {
    const workflows = query.all('workflows');
    const metrics = query.all('workflow_metrics');

    const performance = workflows
      .filter(c => c.status === 'active' || c.status === 'completed')
      .map(c => {
        const m = metrics.find(met => met.campaign_id === c.id) || {};
        return {
          id: c.id,
          name: c.name,
          campaign_type: c.campaign_type,
          status: c.status,
          sent_at: c.sent_at,
          sent: m.sent || 0,
          opened: m.opened || 0,
          clicked: m.clicked || 0,
          converted: m.converted || 0,
          revenue: m.revenue || 0,
          open_rate: m.sent > 0 ? ((m.opened / m.sent) * 100).toFixed(2) : 0,
          click_rate: m.sent > 0 ? ((m.clicked / m.sent) * 100).toFixed(2) : 0,
          conversion_rate: m.sent > 0 ? ((m.converted / m.sent) * 100).toFixed(2) : 0
        };
      })
      .sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0))
      .slice(0, 20);
    
    res.json(performance);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/channels', (req, res) => {
  try {
    const workflows = query.all('workflows');
    const metrics = query.all('workflow_metrics');
    
    const channelMap = {};
    
    workflows.forEach(c => {
      if (!channelMap[c.campaign_type]) {
        channelMap[c.campaign_type] = {
          channel: c.campaign_type,
          campaign_count: 0,
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
          total_converted: 0,
          total_revenue: 0
        };
      }
      
      channelMap[c.campaign_type].campaign_count++;
      
      const m = metrics.find(met => met.campaign_id === c.id);
      if (m) {
        channelMap[c.campaign_type].total_sent += m.sent || 0;
        channelMap[c.campaign_type].total_opened += m.opened || 0;
        channelMap[c.campaign_type].total_clicked += m.clicked || 0;
        channelMap[c.campaign_type].total_converted += m.converted || 0;
        channelMap[c.campaign_type].total_revenue += m.revenue || 0;
      }
    });
    
    const result = Object.values(channelMap).map(ch => ({
      ...ch,
      open_rate: ch.total_sent > 0 ? ((ch.total_opened / ch.total_sent) * 100).toFixed(2) : 0,
      click_rate: ch.total_sent > 0 ? ((ch.total_clicked / ch.total_sent) * 100).toFixed(2) : 0,
      conversion_rate: ch.total_sent > 0 ? ((ch.total_converted / ch.total_sent) * 100).toFixed(2) : 0,
      total_revenue: ch.total_revenue.toFixed(2)
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue', (req, res) => {
  try {
    const { period = '30' } = req.query;
    const orders = query.all('orders');
    
    const periodDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(o => 
      new Date(o.ordered_at) >= periodDate && 
      (o.status === 'completed' || o.status === 'pending')
    );
    
    const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total, 0);
    
    res.json({
      period: `${period} days`,
      total_revenue: totalRevenue.toFixed(2),
      total_orders: recentOrders.length,
      average_order_value: recentOrders.length > 0 ? (totalRevenue / recentOrders.length).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers', (req, res) => {
  try {
    const customers = query.all('customers');
    const orders = query.all('orders');
    
    // Lifecycle distribution
    const lifecycleMap = {};
    customers.forEach(c => {
      if (c.lifecycle_stage) {
        lifecycleMap[c.lifecycle_stage] = (lifecycleMap[c.lifecycle_stage] || 0) + 1;
      }
    });
    
    const lifecycleDistribution = Object.entries(lifecycleMap).map(([stage, count]) => ({
      lifecycle_stage: stage,
      count
    }));
    
    // Top customers
    const customerOrders = {};
    orders.forEach(o => {
      if (o.customer_id) {
        if (!customerOrders[o.customer_id]) {
          customerOrders[o.customer_id] = { order_count: 0, total_spent: 0 };
        }
        if (o.status === 'completed' || o.status === 'pending') {
          customerOrders[o.customer_id].order_count++;
          customerOrders[o.customer_id].total_spent += o.total;
        }
      }
    });
    
    const topCustomers = customers
      .map(c => ({
        ...c,
        order_count: customerOrders[c.id]?.order_count || 0,
        total_spent: customerOrders[c.id]?.total_spent || 0
      }))
      .filter(c => c.order_count > 0)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);
    
    res.json({
      lifecycle_distribution: lifecycleDistribution,
      top_customers: topCustomers
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Drill-down: Contact details with trend (B2C)
router.get('/drill-down/customers', (req, res) => {
  try {
    const { period = '30', status = 'all' } = req.query;
    const contacts = query.all('contacts');
    const orders = query.all('orders');
    
    const periodDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // Filter contacts
    let filtered = contacts;
    if (status !== 'all') {
      filtered = contacts.filter(c => c.status === status);
    }
    
    // Calculate trends
    const newContacts = filtered.filter(c => new Date(c.created_at) >= periodDate);
    const previousPeriodDate = new Date(Date.now() - period * 2 * 24 * 60 * 60 * 1000);
    const previousNewContacts = filtered.filter(c => 
      new Date(c.created_at) >= previousPeriodDate && 
      new Date(c.created_at) < periodDate
    );
    
    // Contact orders
    const contactOrders = {};
    orders.forEach(o => {
      if (o.contact_id) {
        if (!contactOrders[o.contact_id]) {
          contactOrders[o.contact_id] = { order_count: 0, total_spent: 0 };
        }
        if (o.status === 'completed' || o.status === 'pending') {
          contactOrders[o.contact_id].order_count++;
          contactOrders[o.contact_id].total_spent += o.total;
        }
      }
    });
    
    // Daily breakdown for chart
    const dailyData = {};
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = 0;
    }
    
    newContacts.forEach(c => {
      const dateKey = new Date(c.created_at).toISOString().split('T')[0];
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey]++;
      }
    });
    
    // Top contacts in period
    const topContacts = filtered
      .map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        status: c.status,
        subscription_status: c.subscription_status,
        engagement_score: c.engagement_score,
        loyalty_tier: c.loyalty_tier,
        created_at: c.created_at,
        order_count: contactOrders[c.id]?.order_count || 0,
        total_spent: contactOrders[c.id]?.total_spent || 0
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 50);
    
    res.json({
      summary: {
        total: filtered.length,
        active: filtered.filter(c => c.status === 'active').length,
        inactive: filtered.filter(c => c.status === 'inactive').length,
        subscribed: filtered.filter(c => c.subscription_status === 'subscribed').length,
        vip: filtered.filter(c => c.loyalty_tier === 'platinum' || c.loyalty_tier === 'gold').length,
        new_in_period: newContacts.length,
        trend: previousNewContacts.length > 0 
          ? (((newContacts.length - previousNewContacts.length) / previousNewContacts.length) * 100).toFixed(1)
          : 0
      },
      chart_data: Object.entries(dailyData).map(([date, count]) => ({ date, count })),
      top_contacts: topContacts,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching contact drill-down:', error);
    res.status(500).json({ error: error.message });
  }
});

// Drill-down: Campaign performance details
router.get('/drill-down/campaigns', (req, res) => {
  try {
    const { period = '30', status = 'all' } = req.query;
    const workflows = query.all('workflows');
    const metrics = query.all('workflow_metrics');
    
    const periodDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // Filter campaigns
    let filtered = campaigns;
    if (status !== 'all') {
      filtered = campaigns.filter(c => c.status === status);
    }
    
    // Recent campaigns
    const recentCampaigns = filtered.filter(c => 
      c.sent_at && new Date(c.sent_at) >= periodDate
    );
    
    // Calculate aggregate metrics
    const aggregateMetrics = {
      total_sent: 0,
      total_opened: 0,
      total_clicked: 0,
      total_converted: 0,
      total_revenue: 0
    };
    
    const campaignDetails = recentCampaigns.map(c => {
      const m = metrics.find(met => met.campaign_id === c.id) || {};
      aggregateMetrics.total_sent += m.sent || 0;
      aggregateMetrics.total_opened += m.opened || 0;
      aggregateMetrics.total_clicked += m.clicked || 0;
      aggregateMetrics.total_converted += m.converted || 0;
      aggregateMetrics.total_revenue += m.revenue || 0;
      
      return {
        id: c.id,
        name: c.name,
        campaign_type: c.campaign_type,
        status: c.status,
        sent_at: c.sent_at,
        sent: m.sent || 0,
        opened: m.opened || 0,
        clicked: m.clicked || 0,
        converted: m.converted || 0,
        revenue: m.revenue || 0,
        open_rate: m.sent > 0 ? ((m.opened / m.sent) * 100).toFixed(2) : 0,
        click_rate: m.sent > 0 ? ((m.clicked / m.sent) * 100).toFixed(2) : 0,
        conversion_rate: m.sent > 0 ? ((m.converted / m.sent) * 100).toFixed(2) : 0
      };
    }).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    
    // Channel breakdown
    const channelBreakdown = {};
    recentCampaigns.forEach(c => {
      if (!channelBreakdown[c.campaign_type]) {
        channelBreakdown[c.campaign_type] = { count: 0, sent: 0, revenue: 0 };
      }
      channelBreakdown[c.campaign_type].count++;
      const m = metrics.find(met => met.campaign_id === c.id);
      if (m) {
        channelBreakdown[c.campaign_type].sent += m.sent || 0;
        channelBreakdown[c.campaign_type].revenue += m.revenue || 0;
      }
    });
    
    res.json({
      summary: {
        total_campaigns: filtered.length,
        active: filtered.filter(c => c.status === 'active').length,
        completed: filtered.filter(c => c.status === 'completed').length,
        draft: filtered.filter(c => c.status === 'draft').length,
        in_period: recentCampaigns.length,
        ...aggregateMetrics,
        avg_open_rate: aggregateMetrics.total_sent > 0 
          ? ((aggregateMetrics.total_opened / aggregateMetrics.total_sent) * 100).toFixed(2) 
          : 0,
        avg_click_rate: aggregateMetrics.total_sent > 0 
          ? ((aggregateMetrics.total_clicked / aggregateMetrics.total_sent) * 100).toFixed(2) 
          : 0
      },
      campaigns: campaignDetails,
      channel_breakdown: Object.entries(channelBreakdown).map(([type, data]) => ({
        channel: type,
        ...data
      })),
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching campaign drill-down:', error);
    res.status(500).json({ error: error.message });
  }
});

// Drill-down: Email performance details
router.get('/drill-down/email', (req, res) => {
  try {
    const { period = '30' } = req.query;
    const workflows = query.all('workflows');
    const metrics = query.all('workflow_metrics');
    const sends = query.all('campaign_sends');
    
    const periodDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // Get email campaigns
    const emailCampaigns = campaigns.filter(c => c.campaign_type === 'email');
    
    // Daily performance
    const dailyData = {};
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { sent: 0, opened: 0, clicked: 0 };
    }
    
    sends.forEach(s => {
      const sentDate = new Date(s.sent_at);
      if (sentDate >= periodDate) {
        const dateKey = sentDate.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].sent++;
          if (s.opened_at) dailyData[dateKey].opened++;
          if (s.clicked_at) dailyData[dateKey].clicked++;
        }
      }
    });
    
    // Top performing emails
    const emailPerformance = emailCampaigns
      .map(c => {
        const m = metrics.find(met => met.campaign_id === c.id) || {};
        return {
          id: c.id,
          name: c.name,
          subject: c.subject,
          sent_at: c.sent_at,
          sent: m.sent || 0,
          opened: m.opened || 0,
          clicked: m.clicked || 0,
          open_rate: m.sent > 0 ? ((m.opened / m.sent) * 100).toFixed(2) : 0,
          click_rate: m.sent > 0 ? ((m.clicked / m.sent) * 100).toFixed(2) : 0
        };
      })
      .filter(e => e.sent > 0)
      .sort((a, b) => parseFloat(b.open_rate) - parseFloat(a.open_rate))
      .slice(0, 20);
    
    // Calculate totals
    const totals = metrics.reduce((acc, m) => {
      acc.sent += m.sent || 0;
      acc.opened += m.opened || 0;
      acc.clicked += m.clicked || 0;
      acc.bounced += m.bounced || 0;
      acc.unsubscribed += m.unsubscribed || 0;
      return acc;
    }, { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });
    
    res.json({
      summary: {
        ...totals,
        open_rate: totals.sent > 0 ? ((totals.opened / totals.sent) * 100).toFixed(2) : 0,
        click_rate: totals.sent > 0 ? ((totals.clicked / totals.sent) * 100).toFixed(2) : 0,
        bounce_rate: totals.sent > 0 ? ((totals.bounced / totals.sent) * 100).toFixed(2) : 0,
        unsubscribe_rate: totals.sent > 0 ? ((totals.unsubscribed / totals.sent) * 100).toFixed(2) : 0
      },
      chart_data: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
      top_emails: emailPerformance,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching email drill-down:', error);
    res.status(500).json({ error: error.message });
  }
});

// Drill-down: Revenue details
router.get('/drill-down/revenue', (req, res) => {
  try {
    const { period = '30' } = req.query;
    const orders = query.all('orders');
    const customers = query.all('customers');
    const products = query.all('products');
    
    const periodDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    // Recent orders
    const recentOrders = orders.filter(o => 
      new Date(o.ordered_at) >= periodDate && 
      (o.status === 'completed' || o.status === 'pending')
    );
    
    // Daily revenue
    const dailyData = {};
    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { revenue: 0, orders: 0 };
    }
    
    recentOrders.forEach(o => {
      const dateKey = new Date(o.ordered_at).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].revenue += o.total;
        dailyData[dateKey].orders++;
      }
    });
    
    // Product performance
    const productSales = {};
    orders.forEach(o => {
      if (o.product_id) {
        if (!productSales[o.product_id]) {
          productSales[o.product_id] = { count: 0, revenue: 0 };
        }
        if (o.status === 'completed' || o.status === 'pending') {
          productSales[o.product_id].count++;
          productSales[o.product_id].revenue += o.total;
        }
      }
    });
    
    const topProducts = products
      .map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        orders: productSales[p.id]?.count || 0,
        revenue: productSales[p.id]?.revenue || 0
      }))
      .filter(p => p.orders > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Calculate totals
    const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = recentOrders.length > 0 ? totalRevenue / recentOrders.length : 0;
    
    // Previous period comparison
    const previousPeriodDate = new Date(Date.now() - period * 2 * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(o => 
      new Date(o.ordered_at) >= previousPeriodDate && 
      new Date(o.ordered_at) < periodDate &&
      (o.status === 'completed' || o.status === 'pending')
    );
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueTrend = previousRevenue > 0 
      ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : 0;
    
    res.json({
      summary: {
        total_revenue: totalRevenue.toFixed(2),
        total_orders: recentOrders.length,
        average_order_value: avgOrderValue.toFixed(2),
        previous_revenue: previousRevenue.toFixed(2),
        trend: revenueTrend
      },
      chart_data: Object.entries(dailyData).map(([date, data]) => ({ 
        date, 
        revenue: parseFloat(data.revenue.toFixed(2)),
        orders: data.orders 
      })),
      top_products: topProducts,
      recent_orders: recentOrders
        .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at))
        .slice(0, 20)
        .map(o => {
          const customer = customers.find(c => c.id === o.customer_id);
          const product = products.find(p => p.id === o.product_id);
          return {
            id: o.id,
            customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
            product_name: product ? product.name : 'Unknown',
            total: o.total,
            status: o.status,
            ordered_at: o.ordered_at
          };
        }),
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching revenue drill-down:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
