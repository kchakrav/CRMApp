# B2C Marketing Automation Platform

A complete marketing automation solution with AI-first approach, built with Node.js and SQLite.

## 🚀 Features

### Core Features
- ✅ **Customer Management** - Complete customer profiles with custom properties
- ✅ **Campaign Management** - Email campaigns with templates and scheduling
- ✅ **Marketing Automation** - Workflow engine with triggers and conditions
- ✅ **Customer Segmentation** - Dynamic and static segments
- ✅ **Analytics Dashboard** - Real-time metrics and reporting
- ✅ **E-commerce Integration** - Orders, products, and abandoned cart tracking
- ✅ **Event Tracking** - Customer behavior tracking and activity logs
- ✅ **Loyalty Programs** - Points and rewards management

### AI-Powered Features
- 🤖 **AI Content Generation** - Generate email subject lines and content
- 🤖 **Churn Prediction** - Predict customer churn risk
- 🤖 **Smart Segmentation** - AI-powered customer segmentation
- 🤖 **Send Time Optimization** - Best time to send emails per customer
- 🤖 **Product Recommendations** - Personalized product suggestions
- 🤖 **Next Best Action** - AI recommends next marketing action

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- That's it! No database server installation required.

## 🛠️ Installation

### 1. Clone or Download the Project

```bash
cd CRMApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example file
copy .env.example .env

# Edit .env and add your API keys (optional for basic features)
# OpenAI key is only needed for AI features
```

### 4. Initialize Database and Seed Sample Data

```bash
npm run setup
```

This will:
- Create the SQLite database
- Create all tables
- Insert 1000+ sample customers
- Insert sample campaigns, orders, and events

### 5. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 6. Open Your Browser

```
http://localhost:3000
```

## 📚 API Documentation

### Authentication

```bash
POST /api/auth/register
POST /api/auth/login
```

### Customers

```bash
GET    /api/customers              # List all customers
POST   /api/customers              # Create customer
GET    /api/customers/:id          # Get customer by ID
PUT    /api/customers/:id          # Update customer
DELETE /api/customers/:id          # Delete customer
GET    /api/customers/:id/events   # Get customer events
GET    /api/customers/:id/orders   # Get customer orders
POST   /api/customers/search       # Advanced search
```

### Campaigns

```bash
GET    /api/campaigns              # List campaigns
POST   /api/campaigns              # Create campaign
GET    /api/campaigns/:id          # Get campaign
PUT    /api/campaigns/:id          # Update campaign
DELETE /api/campaigns/:id          # Delete campaign
POST   /api/campaigns/:id/send     # Send campaign
GET    /api/campaigns/:id/metrics  # Get campaign metrics
```

### Workflows

```bash
GET    /api/workflows              # List workflows
POST   /api/workflows              # Create workflow
GET    /api/workflows/:id          # Get workflow
PUT    /api/workflows/:id          # Update workflow
POST   /api/workflows/:id/activate # Activate workflow
POST   /api/workflows/:id/pause    # Pause workflow
```

### Analytics

```bash
GET    /api/analytics/dashboard    # Dashboard metrics
GET    /api/analytics/revenue      # Revenue analytics
GET    /api/analytics/customers    # Customer analytics
GET    /api/analytics/campaigns    # Campaign performance
```

### AI Features

```bash
POST   /api/ai/generate-subject    # Generate email subjects
POST   /api/ai/predict-churn       # Predict churn risk
POST   /api/ai/recommend-products  # Product recommendations
POST   /api/ai/optimize-send-time  # Best send time
POST   /api/ai/next-action         # Next best action
```

### Segments

```bash
GET    /api/segments               # List segments
POST   /api/segments               # Create segment
GET    /api/segments/:id/customers # Get customers in segment
```

## 🎯 Example API Usage

### Create a Customer

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### Create a Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2026",
    "campaign_type": "email",
    "subject_line": "50% Off Summer Collection!",
    "content_html": "<h1>Summer Sale</h1><p>Get 50% off!</p>"
  }'
```

### Generate AI Subject Lines

```bash
curl -X POST http://localhost:3000/api/ai/generate-subject \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Summer Collection",
    "targetAudience": "Women 25-45",
    "tone": "excited"
  }'
```

## 📁 Project Structure

```
CRMApp/
├── src/
│   ├── index.js              # Main Express server
│   ├── database.js           # SQLite setup & schema
│   ├── seed.js               # Sample data generator
│   ├── routes/
│   │   ├── customers.js      # Customer routes
│   │   ├── campaigns.js      # Campaign routes
│   │   ├── workflows.js      # Workflow routes
│   │   ├── analytics.js      # Analytics routes
│   │   ├── segments.js       # Segmentation routes
│   │   └── ai.js             # AI features routes
│   ├── services/
│   │   ├── email.service.js  # Email service
│   │   ├── workflow.service.js # Workflow engine
│   │   └── ai.service.js     # AI service
│   └── utils/
│       └── helpers.js        # Utility functions
├── public/
│   ├── index.html            # Dashboard UI
│   ├── style.css             # Styles
│   └── app.js                # Frontend JavaScript
├── data/
│   └── database.db           # SQLite database (auto-created)
├── .env                      # Environment variables
├── package.json
└── README.md
```

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- **customers** - Customer profiles and data
- **customer_events** - Behavioral tracking
- **campaigns** - Email campaigns
- **campaign_sends** - Individual send records
- **workflows** - Automation workflows
- **workflow_executions** - Workflow runs
- **segments** - Customer segments
- **orders** - E-commerce orders
- **products** - Product catalog
- **loyalty_points** - Loyalty program data
- **templates** - Email templates
- **forms** - Lead capture forms

## 🤖 AI Features Setup

To use AI features, you need an OpenAI API key:

1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Add it to your `.env` file:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

AI features will work without the key but will return mock data.

## 🚀 Deployment

### Local Testing
The app is ready to use locally. Just run `npm start` and access at http://localhost:3000

### Deploy to Production (Future)
When ready for production, you can deploy to:
- **Railway.app** (Easiest)
- **Render.com**
- **Heroku**
- **AWS EC2 / Digital Ocean**

## 📊 Sample Data

The seeding script creates:
- 1000 customers with realistic data
- 50 email campaigns
- 500 orders with products
- 2000+ customer events
- 10 customer segments
- 5 active workflows

## 🔧 Troubleshooting

### Database locked error
SQLite allows only one writer at a time. This is normal for development. In production, consider PostgreSQL.

### Port already in use
Change the PORT in `.env` file to use a different port.

### AI features not working
Make sure you've added your OPENAI_API_KEY to the `.env` file.

## 📝 License

MIT License - Feel free to use this for learning and commercial projects.

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your needs!

## 📧 Support

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ using Node.js, Express, SQLite, and OpenAI**
