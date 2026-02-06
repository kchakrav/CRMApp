# ✅ Setup Checklist

Follow this checklist to get your B2C Marketing Automation Platform running:

---

## Step 1: Verify Node.js Installation

Open PowerShell and run:
```powershell
node --version
```

- [ ] Node.js version displays (should be v18.x or v20.x)
- [ ] If not installed, download from: https://nodejs.org/

---

## Step 2: Navigate to Project

```powershell
cd c:\CRMApp
```

- [ ] You're in the CRMApp directory

---

## Step 3: Install Dependencies

```powershell
npm install
```

**Wait for it to complete (1-2 minutes)**

- [ ] Packages installed successfully
- [ ] No major errors shown
- [ ] `node_modules` folder created

---

## Step 4: Initialize Database

```powershell
npm run setup
```

**This will:**
- Create SQLite database
- Create all tables
- Insert 1000 customers
- Insert 500 orders
- Insert 50 campaigns
- Insert sample data

**Expected output:**
```
🌱 Starting database seeding...
📦 Initializing database...
✅ Database initialized successfully!
📝 Seeding customers...
✅ Created 1000 customers
...
✨ Database seeding completed successfully!
```

- [ ] Database created successfully
- [ ] Sample data inserted
- [ ] `data/database.db` file exists

---

## Step 5: Start the Server

```powershell
npm start
```

**Expected output:**
```
🚀 B2C Marketing Automation Platform
=====================================
✅ Server running on http://localhost:3000
📊 Dashboard: http://localhost:3000
🔌 API: http://localhost:3000/api
```

- [ ] Server started without errors
- [ ] You see the welcome message
- [ ] Port 3000 is available

**If port 3000 is in use:**
1. Stop the server (Ctrl+C)
2. Edit `.env` file and change `PORT=3000` to `PORT=3001`
3. Run `npm start` again

---

## Step 6: Open Dashboard

Open your browser and go to:
```
http://localhost:3000
```

**You should see:**
- [ ] Dashboard loads successfully
- [ ] Sidebar navigation visible
- [ ] Stats cards showing data
- [ ] No errors in browser console (F12)

---

## Step 7: Test Features

### Test Dashboard
- [ ] Click on different navigation items
- [ ] See stats and metrics
- [ ] Data loads properly

### Test Customers
- [ ] Click "Customers" in sidebar
- [ ] See list of 1000 customers
- [ ] Table loads with customer data

### Test Campaigns
- [ ] Click "Campaigns" in sidebar
- [ ] See list of campaigns
- [ ] Metrics display properly

### Test AI Features
- [ ] Click "AI Features" in sidebar
- [ ] Try "Generate Subject Lines"
- [ ] Click "Generate" button
- [ ] See 5 subject lines appear

---

## Step 8: Test API Endpoints

Open a new PowerShell window and test:

**Test 1: Get Customers**
```powershell
curl http://localhost:3000/api/customers
```
- [ ] Returns JSON with customer data

**Test 2: Get Dashboard Metrics**
```powershell
curl http://localhost:3000/api/analytics/dashboard
```
- [ ] Returns JSON with metrics

**Test 3: Health Check**
```powershell
curl http://localhost:3000/api/health
```
- [ ] Returns `{"status":"healthy",...}`

---

## Step 9: (Optional) Add OpenAI API Key

**For real AI-powered features:**

1. Get API key from: https://platform.openai.com/api-keys
2. Open `.env` file in text editor
3. Find this line:
   ```
   # OPENAI_API_KEY=sk-your-openai-api-key-here
   ```
4. Replace with:
   ```
   OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
   ```
5. Save file
6. Restart server (Ctrl+C then `npm start`)

- [ ] API key added (if desired)
- [ ] Server restarted
- [ ] AI features return real responses

**Note:** AI features work WITHOUT API key (returns mock data)

---

## ✅ All Done!

If you checked all the boxes above, your platform is **fully operational**! 🎉

---

## 🆘 Troubleshooting

### Problem: "npm: command not found"
**Solution:** Node.js not installed. Download from nodejs.org

### Problem: Port 3000 already in use
**Solution:** Change PORT in `.env` to 3001 or another number

### Problem: Database locked error
**Solution:** Make sure only one server instance is running

### Problem: npm install fails
**Solution:** 
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

### Problem: Dashboard shows no data
**Solution:** 
1. Stop server (Ctrl+C)
2. Delete `data/database.db`
3. Run `npm run setup` again
4. Run `npm start`

### Problem: AI features say "failed"
**Solution:** This is normal without OpenAI API key. Check for message saying "Using mock data"

---

## 📚 Next Steps

1. ✅ Read `PROJECT_SUMMARY.md` for overview
2. ✅ Read `README.md` for full documentation
3. ✅ Explore the dashboard
4. ✅ Test all APIs
5. ✅ Customize the code

---

## 🎯 Quick Commands Reference

```powershell
# Development (auto-reload on changes)
npm run dev

# Stop server
Ctrl + C

# Reset database
Remove-Item data\database.db
npm run setup

# View logs (if any issues)
# Logs appear in the console where you ran npm start
```

---

**Happy coding! 🚀**
