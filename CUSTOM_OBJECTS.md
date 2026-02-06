# 🗂️ CUSTOM OBJECTS & DATA INGESTION - COMPLETE!

## ✅ Create Your Own Tables, Import Data, Use in Segments

You now have a **complete custom object/table management system** with data ingestion and full integration with the segment builder!

---

## 🎯 **WHAT YOU CAN DO:**

### **1. Create Custom Objects/Tables**
- Define your own data schemas
- Add any fields you need
- Choose field types (text, number, date, select, boolean)
- Link to customers (optional)

### **2. Import Data**
- 📤 **CSV Upload** - Bulk import from CSV files
- ➕ **Manual Entry** - Add records one by one
- ✏️ **Edit Records** - Update existing data
- 🗑️ **Delete Records** - Remove data

### **3. Use in Segment Builder**
- 🎯 **Auto-loaded** - Custom objects appear in attribute library
- 🔍 **Query Builder** - Drag custom attributes to build segments
- 👁️ **Live Preview** - See matching customers instantly
- 📊 **Sample Results** - Preview who matches your criteria

---

## 🚀 **HOW TO USE:**

### **Step 1: Create a Custom Object**

```
1. Go to http://localhost:3000
2. Click "🗂️ Custom Objects" in sidebar
3. Click "+ Create Custom Object"
4. Fill in details:
   - Object Name: "purchases" (technical name)
   - Display Label: "Purchases" (what users see)
   - Description: "Customer purchase history"
5. Add fields:
   - product_name (Text)
   - purchase_amount (Number)
   - purchase_date (Date)
   - is_verified (Boolean)
6. Click "Create Object"
```

### **Step 2: Import Data**

```
1. From Custom Objects list, click "📊 View Data"
2. Click "📤 Import CSV"
3. Upload your CSV file
4. (CSV columns should match your field names)
5. Click "Import"
6. Data imported!
```

### **Step 3: Use in Segments**

```
1. Go to Segments
2. Click "+ Create Segment"
3. Visual builder opens
4. See your custom object in left panel!
5. Drag custom attributes to query builder
6. Build conditions (e.g., purchase_amount > 500)
7. See live preview of matching customers
8. Save segment!
```

---

## 📦 **CUSTOM OBJECT FEATURES:**

### **Object Definition:**
- **Name** - Technical identifier (lowercase, alphanumeric, underscores)
- **Label** - Display name (human-readable)
- **Description** - What the object represents
- **Fields** - Define your schema

### **Field Types:**
- 📝 **Text** - Strings, email, names
- 🔢 **Number** - Integers, decimals, counts
- 📅 **Date** - Dates and timestamps
- 📋 **Select** - Dropdown options
- ✓ **Boolean** - Yes/No, True/False

### **Customer Linking:**
- **Optional customer_id field** - Link records to customers
- **One-to-many** - Multiple records per customer
- **Used in segmentation** - Query across customer and custom data

---

## 📤 **DATA IMPORT OPTIONS:**

### **Option 1: CSV Upload**

**Requirements:**
- CSV file with headers
- Column names match field names
- Optional customer_id column

**Example CSV:**
```csv
customer_id,product_name,purchase_amount,purchase_date
123,Widget Pro,299.99,2026-01-15
456,Gadget Plus,149.99,2026-01-20
```

**Process:**
```
1. Click "📤 Import CSV"
2. Choose file
3. Specify customer_id column (optional)
4. Click "Import"
5. All records added instantly
```

**Benefits:**
- ✅ Bulk import (thousands of records)
- ✅ Fast and efficient
- ✅ Standard CSV format
- ✅ Auto-timestamps

### **Option 2: Manual Entry**

**Process:**
```
1. Click "+ Add Record"
2. Fill form fields
3. Link to customer (optional)
4. Click "Save"
```

**Benefits:**
- ✅ Quick single records
- ✅ Form validation
- ✅ Easy editing
- ✅ No file needed

---

## 🎨 **EXAMPLE USE CASES:**

### **Example 1: Purchase History**

**Custom Object:** "Purchases"
```
Fields:
- product_name (Text)
- purchase_amount (Number)
- purchase_date (Date)
- category (Text)
```

**Segment Query:**
```
Purchase Amount > 500
AND Purchase Date in last 90 days
```

**Result:** High-value recent buyers

---

### **Example 2: Product Ratings**

**Custom Object:** "Product Reviews"
```
Fields:
- product_id (Number)
- rating (Number)
- review_text (Text)
- reviewed_date (Date)
```

**Segment Query:**
```
Rating >= 4
AND Reviewed Date in last 30 days
```

**Result:** Happy recent reviewers

---

### **Example 3: Event Attendance**

**Custom Object:** "Event Registrations"
```
Fields:
- event_name (Text)
- registration_date (Date)
- attended (Boolean)
- ticket_type (Text)
```

**Segment Query:**
```
Attended = Yes
AND Ticket Type = VIP
```

**Result:** VIP event attendees

---

### **Example 4: Subscription Data**

**Custom Object:** "Subscriptions"
```
Fields:
- plan_name (Text)
- subscription_amount (Number)
- renewal_date (Date)
- is_active (Boolean)
```

**Segment Query:**
```
Is Active = Yes
AND Subscription Amount > 100
AND Renewal Date in last 30 days
```

**Result:** Active premium recent renewals

---

## 🔍 **SEGMENT BUILDER INTEGRATION:**

### **How Custom Objects Appear:**

**In Attribute Library:**
```
📦 Attributes
  👤 Customer (built-in)
  🛒 Orders (built-in)
  ⚡ Activity (built-in)
  🗂️ Purchases (YOUR custom object)
  🗂️ Reviews (YOUR custom object)
```

### **Drag & Drop:**
```
Drag "Purchase Amount" from Purchases
→ Drops into query builder
→ Configure: Purchase Amount > 500
→ See live preview
→ Shows customers with purchases > $500
```

### **Live Preview:**
- Updates as you add conditions
- Shows exact count of matching customers
- Displays sample results (first 10)
- Works with custom object data

---

## 📊 **CUSTOM OBJECT MANAGEMENT:**

### **View Data:**
```
Custom Objects → Click "📊 View Data"
→ See all records in table
→ Shows all fields
→ Sortable columns
→ Edit/Delete buttons
```

### **Add Records:**
```
Click "+ Add Record"
→ Form with all fields
→ Optional customer linking
→ Save to database
```

### **Edit Records:**
```
Click "✏️ Edit" on any row
→ Pre-filled form
→ Modify any field
→ Save changes
```

### **Import CSV:**
```
Click "📤 Import CSV"
→ Choose CSV file
→ Bulk import
→ All records added
```

---

## 🎯 **TECHNICAL DETAILS:**

### **Database Storage:**
```
custom_objects table:
- Object definitions (schema)
- Fields definition
- Metadata

custom_object_data:
- Keyed by object name
- JSON arrays of records
- Each record has ID, timestamps
```

### **API Endpoints:**
```
GET    /api/custom-objects                    - List all
POST   /api/custom-objects                    - Create
GET    /api/custom-objects/:id                - Get one
PUT    /api/custom-objects/:id                - Update
DELETE /api/custom-objects/:id                - Delete

GET    /api/custom-objects/:id/data           - Get records
POST   /api/custom-objects/:id/data           - Add record
POST   /api/custom-objects/:id/import         - Import CSV
PUT    /api/custom-objects/:id/data/:recordId - Update
DELETE /api/custom-objects/:id/data/:recordId - Delete

GET    /api/segments/for-segments             - Get for builder
POST   /api/segments/preview                  - Preview with custom data
```

### **Record Structure:**
```json
{
  "id": 1234567890,
  "customer_id": 123,
  "field1": "value1",
  "field2": 100,
  "created_at": "2026-02-03T10:30:00Z",
  "updated_at": "2026-02-03T10:30:00Z"
}
```

---

## 🎨 **UI FLOW:**

### **Creating Custom Object:**
```
Dashboard
  ↓
Custom Objects (List)
  ↓ [+ Create Custom Object]
Create Custom Object (Full Page)
  ↓ [Define name, label, fields]
Save
  ↓
Custom Objects (List) ← Object created
```

### **Importing Data:**
```
Custom Objects List
  ↓ [📊 View Data]
Object Data Page
  ↓ [📤 Import CSV]
Import Modal
  ↓ [Upload file]
Data Imported ← Records added
```

### **Using in Segments:**
```
Segments List
  ↓ [+ Create Segment]
Segment Builder
  ↓ [See custom object in library]
Drag Custom Attribute
  ↓ [Configure condition]
Live Preview Updates ← Shows matching customers
```

---

## 🚀 **TRY IT NOW:**

# **http://localhost:3000**

### **Quick Test:**

**1. Create Custom Object:**
```
1. Click "🗂️ Custom Objects"
2. Click "+ Create Custom Object"
3. Name: "purchases"
4. Label: "Purchases"
5. Add field: "amount" (Number)
6. Add field: "date" (Date)
7. Click "Create Object"
```

**2. Add Sample Data:**
```
1. Click "📊 View Data" on your object
2. Click "+ Add Record"
3. Customer ID: 1
4. Amount: 599
5. Date: (today)
6. Click "Save"
```

**3. Use in Segment:**
```
1. Go to Segments
2. Click "+ Create Segment"
3. See "🗂️ Purchases" in left panel!
4. Drag "Amount" to query builder
5. Configure: Amount > 500
6. See preview count update!
```

---

## 💡 **EXAMPLE CUSTOM OBJECTS:**

### **1. Purchases**
```
Fields:
- product_id (Number)
- product_name (Text)
- amount (Number)
- purchase_date (Date)
- payment_method (Text)
```

### **2. Support Tickets**
```
Fields:
- ticket_number (Text)
- priority (Select: Low/Medium/High)
- status (Text)
- created_date (Date)
- resolved (Boolean)
```

### **3. Webinar Attendance**
```
Fields:
- webinar_title (Text)
- registration_date (Date)
- attended (Boolean)
- engagement_score (Number)
```

### **4. Survey Responses**
```
Fields:
- survey_name (Text)
- response_date (Date)
- nps_score (Number)
- would_recommend (Boolean)
```

### **5. App Usage**
```
Fields:
- feature_name (Text)
- usage_count (Number)
- last_used_date (Date)
- is_power_user (Boolean)
```

---

## 🎯 **SEGMENT QUERIES WITH CUSTOM OBJECTS:**

### **Query 1: Recent High-Value Buyers**
```
Customer: Status = Active
AND
Purchases: Amount > 500
AND
Purchases: Purchase Date in last 90 days
```

### **Query 2: Support-Heavy Customers**
```
Support Tickets: Total Tickets > 5
AND
Support Tickets: Priority = High
```

### **Query 3: Engaged Webinar Attendees**
```
Webinar: Attended = Yes
AND
Webinar: Engagement Score > 70
```

### **Query 4: Happy Customers (NPS)**
```
Survey: NPS Score >= 9
AND
Survey: Response Date in last 30 days
```

---

## ✅ **WHAT'S COMPLETE:**

✅ Custom Objects CRUD UI  
✅ Full API for object management  
✅ Field definition system (5 types)  
✅ CSV bulk import  
✅ Manual record entry  
✅ Edit/Delete records  
✅ View data in tables  
✅ Customer linking  
✅ Segment builder integration  
✅ Dynamic attribute loading  
✅ Preview API with custom data  
✅ Live count and samples  

---

## 🔥 **KEY BENEFITS:**

### **For You:**
✅ **Unlimited flexibility** - Create any data structure  
✅ **No code changes** - All through UI  
✅ **Easy import** - CSV upload support  
✅ **Full CRUD** - Complete data management  
✅ **Segment integration** - Use immediately in targeting  

### **For Your Business:**
✅ **Custom tracking** - Track what matters to you  
✅ **Rich segmentation** - Query across all data  
✅ **Better targeting** - More precise campaigns  
✅ **Scalable** - Add objects as you grow  
✅ **Flexible** - Adapt to changing needs  

---

## 📚 **DOCUMENTATION:**

### **Files Created:**
```
Frontend:
  public/object-data.html         - Data management UI
  public/object-data.js           - Data management logic
  Updated: segment-builder.js     - Dynamic loading

Backend:
  src/routes/customObjects.js     - Complete API
  Updated: segments.js            - Custom object support

Database:
  custom_objects table            - Object schemas
  custom_object_data object       - All records
```

---

## 🎊 **READY TO USE:**

# **http://localhost:3000**

### **Complete Flow:**

**1. Create Object:**
```
🗂️ Custom Objects → + Create → Define fields → Save
```

**2. Add Data:**
```
📊 View Data → + Add Record OR 📤 Import CSV
```

**3. Use in Segments:**
```
🎯 Segments → + Create → Drag custom attributes → Build query → Save
```

---

**Your platform now supports unlimited custom data structures!** 🗂️🚀

**Create custom objects and use them in segments right now!** ✨
