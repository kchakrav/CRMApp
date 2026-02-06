# 🚀 Quick Start Guide

## Prerequisites

You only need **Node.js** installed on your computer.

**Check if you have Node.js:**
```powershell
node --version
```

If you see a version number (like v18.x.x or v20.x.x), you're good to go!

**If you don't have Node.js:**
Download and install from: https://nodejs.org/ (choose the LTS version)

---

## Installation Steps

### 1. Open PowerShell in the CRMApp folder

```powershell
cd c:\CRMApp
```

### 2. Install dependencies

```powershell
npm install
```

This will install all required packages. It might take 1-2 minutes.

### 3. Initialize database and add sample data

```powershell
npm run setup
```

This command will:
- Create the SQLite database
- Create all tables
- Insert 1000 customers
- Insert 500 orders
- Insert 50 campaigns
- Insert 2000+ events
- Create segments, workflows, and more!

### 4. Start the server

```powershell
npm start
```

You should see:
```
🚀 B2C Marketing Automation Platform
=====================================
✅ Server running on http://localhost:3000
📊 Dashboard: http://localhost:3000
🔌 API: http://localhost:3000/api
```

### 5. Open your browser

Go to: **http://localhost:3000**

---

## What You'll See

The dashboard shows:
- **📊 Dashboard** - Overview with key metrics
- **👥 Customers** - Customer list with 1000 sample customers
- **📧 Campaigns** - Email campaigns with performance metrics
- **⚙️ Workflows** - Automation workflows
- **🎯 Segments** - Customer segments
- **📈 Analytics** - Detailed analytics and reports
- **🤖 AI Features** - AI-powered features (works with or without OpenAI API key)

---

## Using AI Features

AI features work in two modes:

### Without OpenAI API Key (Default)
- Returns mock/sample data
- Perfect for testing and demo
- No cost, works immediately

### With OpenAI API Key (Optional)
1. Get an API key from: https://platform.openai.com/api-keys
2. Open `.env` file in CRMApp folder
3. Replace this line:
   ```
   # OPENAI_API_KEY=sk-your-openai-api-key-here
   ```
   With your actual key:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
4. Restart the server

---

## Testing the APIs

You can test the APIs using:
- **Browser** - Go to http://localhost:3000/api
- **Postman** - Import and test endpoints
- **Thunder Client** (VS Code extension)
- **cURL** - Command line

### Example API Calls:

**Get all customers:**
```powershell
curl http://localhost:3000/api/customers
```

**Get dashboard metrics:**
```powershell
curl http://localhost:3000/api/analytics/dashboard
```

**Generate AI subject lines:**
```powershell
curl -X POST http://localhost:3000/api/ai/generate-subject `
  -H "Content-Type: application/json" `
  -d '{"productName":"Summer Sale","targetAudience":"Women 25-45","tone":"excited"}'
```

---

## Development Mode (Auto-reload)

For development with automatic restart on file changes:

```powershell
npm run dev
```

This uses `nodemon` which watches for file changes and restarts the server automatically.

---

## Stopping the Server

Press `Ctrl + C` in the PowerShell window where the server is running.

---

## Re-seeding Database

If you want to reset the database with fresh sample data:

```powershell
# Stop the server first (Ctrl+C)

# Delete the database
Remove-Item data\database.db

# Re-seed
npm run setup

# Start server
npm start
```

---

## Project Structure

```
CRMApp/
├── src/
│   ├── index.js           # Main server
│   ├── database.js        # Database setup
│   ├── seed.js            # Sample data
│   └── routes/            # API routes
│       ├── customers.js
│       ├── campaigns.js
│       ├── workflows.js
│       ├── segments.js
│       ├── analytics.js
│       └── ai.js
├── public/
│   ├── index.html         # Dashboard
│   ├── style.css          # Styles
│   └── app.js             # Frontend logic
├── data/
│   └── database.db        # SQLite database
├── .env                   # Configuration
├── package.json
└── README.md
```

---

## Troubleshooting

### Port 3000 already in use

Change the port in `.env`:
```
PORT=3001
```

### npm command not found

Node.js is not installed or not in PATH. Download and install from nodejs.org

### Database is locked

Only one process can write to SQLite at a time. Make sure you're not running multiple servers or have the database open in another program.

### AI features return mock data

This is normal! Either:
1. You haven't added an OpenAI API key (it will show a message)
2. Or your API key is invalid

Mock data is perfectly fine for testing and demos.

---

## Next Steps

1. ✅ Explore the dashboard
2. ✅ Try the AI features
3. ✅ Test the APIs
4. ✅ Customize the sample data
5. ✅ Add your own features

---

## Need Help?

- Check the main README.md for full documentation
- API documentation: http://localhost:3000/api
- All endpoints are listed in the README.md

---

**Enjoy building with your B2C Marketing Automation Platform! 🎉**
