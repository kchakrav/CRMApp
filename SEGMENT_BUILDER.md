# 🎯 VISUAL SEGMENT BUILDER - COMPLETE!

## ✅ Drag-and-Drop Segment Builder with Live Preview

Your segments now have a **powerful visual query builder** with drag-and-drop attributes, live preview counts, and sample results!

---

## 🎨 **WHAT YOU NOW HAVE:**

### **Visual Segment Builder:**
- 🎨 **Drag-and-drop** attribute library
- 🔍 **Visual query builder** with AND/OR logic
- 👁️ **Live preview count** of matching customers
- 📊 **Sample results** (first 10 customers)
- 📈 **Quick stats** (avg score, active count, VIP count)
- 💾 **Save & activate** segments

---

## 🚀 **HOW TO ACCESS:**

### **From Segments List:**
```
1. Go to Segments page
2. Click "+ Create Segment" OR
3. Click "🎨 Build" on any existing segment
4. Visual Builder opens!
```

### **Direct URL:**
```
http://localhost:3000/segment-builder.html
```

---

## 📦 **ATTRIBUTE LIBRARY (Left Panel):**

### **Available Attributes:**

**👤 Customer Attributes:**
- ✉️ Email (Text)
- 👤 First Name (Text)
- 👤 Last Name (Text)
- 📊 Status (Select: Active/Inactive)
- 🔄 Lifecycle Stage (Select: Lead/Customer/VIP/At Risk/Churned)
- 📈 Lead Score (Number)
- 📅 Created Date (Date)

**🛒 Order Attributes:**
- 📦 Total Orders (Number)
- 💰 Total Spent (Currency)
- 📅 Last Order Date (Date)

**⚡ Activity Attributes:**
- 📊 Total Events (Number)
- 📅 Last Activity Date (Date)

---

## 🔨 **HOW TO BUILD A SEGMENT:**

### **Method 1: Drag & Drop (Recommended)**

**Step 1:** Find attribute in left panel
```
Browse categories or use search
```

**Step 2:** Drag to query builder
```
Click and drag attribute to center area
Rule automatically created!
```

**Step 3:** Configure the rule
```
Choose operator (equals, contains, greater than, etc.)
Enter value
```

**Step 4:** Add more rules
```
Drag more attributes
Choose AND/OR logic
```

**Step 5:** See live preview
```
Preview panel shows count and samples
Updates automatically as you build
```

### **Method 2: Manual Add**

**Step 1:** Click "+ Add Condition"
```
Empty rule appears
```

**Step 2:** Configure manually
```
Choose attribute
Choose operator
Enter value
```

---

## 🎯 **EXAMPLE SEGMENTS:**

### **Example 1: VIP Customers**
```
Rule 1: Lifecycle Stage = VIP
Rule 2: Lead Score >= 80
Rule 3: Status = Active

Logic: AND (all conditions must match)
Result: ~30-50 customers
```

### **Example 2: At-Risk Customers**
```
Rule 1: Last Activity Date not in last 60 days
Rule 2: Status = Active
Rule 3: Lifecycle Stage = Customer

Logic: AND
Result: ~50-100 customers
```

### **Example 3: High-Value Buyers**
```
Rule 1: Total Spent > 500
Rule 2: Total Orders >= 5
Rule 3: Last Order Date in last 90 days

Logic: AND
Result: ~20-40 customers
```

### **Example 4: Engaged Leads**
```
Rule 1: Lifecycle Stage = Lead
OR
Rule 2: Lead Score >= 70

Logic: OR (either condition matches)
Result: ~200-400 customers
```

### **Example 5: Win-Back Campaign**
```
Rule 1: Last Order Date not in last 180 days
Rule 2: Total Orders >= 2
Rule 3: Lifecycle Stage not equals Churned

Logic: AND
Result: ~50-150 customers
```

---

## 🔍 **OPERATORS BY TYPE:**

### **Text Operators:**
- `equals` - Exact match
- `not equals` - Not this value
- `contains` - Includes text
- `does not contain` - Doesn't include text
- `starts with` - Begins with text
- `ends with` - Ends with text
- `is empty` - No value
- `is not empty` - Has value

### **Number Operators:**
- `equals` - Exact number
- `not equals` - Not this number
- `greater than` - >
- `less than` - <
- `greater than or equal` - >=
- `less than or equal` - <=

### **Date Operators:**
- `in last (days)` - Within last N days
- `not in last (days)` - Before N days ago
- `after` - After specific date
- `before` - Before specific date

### **Select Operators:**
- `is` - Equals this option
- `is not` - Not this option

---

## 👁️ **LIVE PREVIEW:**

### **What You See:**

**Count Display:**
```
┌──────────────────┐
│ Matching Customers│
│                  │
│      1,250       │ ← Live count
│                  │
│ customers match  │
│  your criteria   │
└──────────────────┘
```

**Sample Results:**
- First 10 matching customers
- Shows: Name, Email, Lifecycle Stage, Status
- Updates as you build query

**Quick Stats:**
- Average Lead Score
- Active Customer Count
- VIP Customer Count

### **How It Works:**
- **Auto-updates** as you add/modify rules
- **Debounced** (500ms) to avoid too many requests
- **Real-time** - sees actual database data
- **Preview API** - POST `/api/segments/preview`

---

## 🔗 **AND vs OR LOGIC:**

### **AND Logic (All conditions must match):**
```
Lifecycle Stage = VIP
  AND
Lead Score >= 80
  AND  
Status = Active

Result: Only customers matching ALL three
Example: 30 customers
```

### **OR Logic (Any condition can match):**
```
Lifecycle Stage = VIP
  OR
Lead Score >= 90
  OR
Total Spent > 1000

Result: Customers matching ANY one
Example: 250 customers
```

### **Toggle Logic:**
```
Use dropdown at top of query builder:
- "All conditions (AND)"
- "Any condition (OR)"
```

---

## 💾 **SAVING SEGMENTS:**

### **Two Save Options:**

**1. Save Draft**
```
Click "💾 Save Draft"
- Saves segment
- Status: Inactive
- Can edit later
- Won't show in targeting
```

**2. Save & Activate**
```
Click "✓ Save & Activate"
- Saves segment
- Status: Active
- Ready to use immediately
- Available for campaigns
```

### **Required Fields:**
- ✅ Segment Name
- ✅ At least 1 condition/rule

---

## 🎨 **UI FEATURES:**

### **Left Panel - Attribute Library:**
- Organized by category (Customer, Orders, Activity)
- Collapsible categories
- Search functionality
- Drag any attribute to build query
- Visual icons for each attribute

### **Center - Query Builder:**
- **Segment Info** at top (name, description, type)
- **Query Builder** card
- **AND/OR logic** selector
- **Rules container** (drag & drop zone)
- **Add/Clear buttons**
- **Visual rule cards** with operators

### **Right Panel - Preview:**
- **Live count** (big number)
- **Sample results** (first 10)
- **Quick stats** (averages, counts)
- **Refresh button**

---

## ⚡ **ADVANCED FEATURES:**

### **Dynamic vs Static Segments:**

**Dynamic (Recommended):**
- Auto-updates as customers change
- Always current
- Evaluates conditions in real-time
- Best for targeting

**Static:**
- One-time snapshot
- Never changes
- Fixed list of customers
- For historical analysis

### **Complex Queries:**
- Combine attributes from different entities
- Customer data + Order data + Activity data
- Mix text, number, and date conditions
- Unlimited rules

### **Search Attributes:**
```
Type in search box (top-left)
Filter attributes by name
Find what you need quickly
```

---

## 🎯 **USE CASES:**

### **1. Segmentation:**
```
VIP Customers
High-Value Buyers
Engaged Leads
At-Risk Customers
Win-Back Opportunities
```

### **2. Targeting:**
```
Campaign targeting
Email list building
Personalization groups
A/B test audiences
```

### **3. Analysis:**
```
Customer cohorts
Behavior analysis
Trend identification
Performance tracking
```

---

## 📊 **PREVIEW API:**

### **Endpoint:**
```
POST /api/segments/preview
```

### **Request Body:**
```json
{
  "conditions": {
    "logic": "AND",
    "rules": [
      {
        "entity": "customer",
        "attribute": "lifecycle_stage",
        "operator": "equals",
        "value": "vip"
      },
      {
        "entity": "customer",
        "attribute": "lead_score",
        "operator": "greater_than",
        "value": "80"
      }
    ]
  }
}
```

### **Response:**
```json
{
  "count": 42,
  "samples": [
    {
      "id": 123,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "lifecycle_stage": "vip",
      "lead_score": 95,
      "status": "active",
      "created_at": "2025-01-15T10:30:00Z"
    }
    // ... 9 more
  ]
}
```

---

## 🚀 **TRY IT NOW:**

# **http://localhost:3000**

### **Quick Start:**

**1. Go to Segments:**
```
Click "Segments" in sidebar
```

**2. Click "+ Create Segment":**
```
Opens visual builder automatically
```

**3. Drag "Lifecycle Stage":**
```
From Customer category
Drops into query builder
```

**4. Configure Rule:**
```
Operator: "is"
Value: "VIP"
```

**5. See Preview:**
```
Right panel shows count
Sample VIP customers appear
```

**6. Add More Rules:**
```
Drag "Lead Score"
Operator: "greater than"
Value: "80"
```

**7. Choose Logic:**
```
Select "AND" from dropdown
Preview updates automatically
```

**8. Save:**
```
Enter segment name
Click "Save & Activate"
```

**Done!** Your segment is ready to use! 🎉

---

## 🎨 **VISUAL LAYOUT:**

```
┌──────────────────────────────────────────────────────────┐
│  [← Back]  New Segment              [Save] [Activate]   │
├─────────┬───────────────────────────────┬────────────────┤
│         │                               │                │
│ 📦      │  Segment Info                 │  👁️ Preview   │
│ Attrs   │  Name: ____________          │                │
│         │  Desc: ____________          │  Count:  1,250 │
│ 👤 Cust │                               │                │
│  Email  │  🔍 Build Query              │  Samples:      │
│  Name   │                               │  • John Doe    │
│  Status │  Logic: [AND ▼]              │  • Jane Smith  │
│  Score  │                               │  • ...         │
│         │  Rules:                       │                │
│ 🛒 Ord  │  ┌─────────────────────────┐ │  Stats:        │
│  Total  │  │ Lifecycle = VIP         │ │  Avg: 85       │
│  Spent  │  │ Score > 80              │ │  Active: 90%   │
│  Date   │  └─────────────────────────┘ │                │
│         │                               │                │
│ ⚡ Act   │  [+ Add] [Clear]             │  [🔄 Refresh]  │
│  Events │                               │                │
└─────────┴───────────────────────────────┴────────────────┘
```

---

## ✅ **WHAT'S COMPLETE:**

✅ Visual drag-and-drop builder  
✅ Attribute library (3 categories, 12 attributes)  
✅ Query builder with rules  
✅ AND/OR logic selector  
✅ 20+ operators (text, number, date, select)  
✅ Live preview count  
✅ Sample results (first 10)  
✅ Quick stats  
✅ Backend preview API  
✅ Save & activate functionality  
✅ Edit existing segments  
✅ Professional UI  
✅ Responsive design  

---

## 🎊 **READY TO USE!**

Your visual segment builder is complete and ready to create powerful customer segments!

**Access it now:**
1. **http://localhost:3000**
2. **Click "Segments"**
3. **Click "+ Create Segment"**
4. **Build visual queries!** 🎨

---

**Build sophisticated segments with drag-and-drop ease!** 🚀✨
