# 🎨 Campaign Orchestration - Quick Visual Reference

## At a Glance

### **What is it?**
A visual drag-and-drop canvas to design multi-step campaign flows with targeting, channels, and automation logic.

---

## 🚀 Quick Start (30 seconds)

```
1. http://localhost:3000
2. Campaigns → Click "🎨 Orchestrate" button
3. Drag "Entry Point" to canvas
4. Drag "Email" to canvas  
5. Connect them (output → input)
6. Click "Save"
7. Click "Execute"
8. Done!
```

---

## 📦 Activity Cheat Sheet

### Entry & Exit
```
▶️ Entry Point  - Start (REQUIRED)
🏁 Exit        - End
```

### Targeting
```
👥 Segment     - Filter by segment
🔍 Filter      - Custom conditions
🚫 Exclude     - Exclude customers
```

### Flow Control
```
⏱️ Wait        - Delay (5 min, 2 days, etc.)
🔀 A/B Split   - Test variations (50/50)
❓ Condition   - If/else branching
🎲 Random      - Random routing
```

### Channels
```
📧 Email       - Send email
💬 SMS         - Send text message
📱 Push        - Push notification
🔗 Webhook     - HTTP callback
```

### Actions
```
🏷️ Update Tag   - Add/remove tags
✏️ Update Field - Modify data
➕ Add Segment  - Add to segment
📊 Score        - Update lead score
```

### Analytics
```
📍 Track Event  - Log custom event
🎯 Goal         - Track conversion
```

---

## 🎬 Common Patterns

### Pattern 1: Simple Blast
```
Entry → Email → Exit
```

### Pattern 2: Targeted Campaign
```
Entry → Segment (VIP) → Email → Exit
```

### Pattern 3: Drip Series
```
Entry → Email 1 → Wait (2 days) → Email 2 → Wait (3 days) → Email 3 → Exit
```

### Pattern 4: A/B Test
```
Entry → A/B Split → Email A (Subject 1)
                 ↘ Email B (Subject 2)
                    → Exit
```

### Pattern 5: Smart Follow-up
```
Entry → Email → Wait (24h) → Condition (Opened?)
                              ├─ YES → Email (Thank you)
                              └─ NO → SMS (Reminder)
                                 → Exit
```

---

## 🎯 How to Connect Nodes

### Step-by-Step:
```
1. Click and hold OUTPUT dot (right side of node)
2. Drag to INPUT dot (left side of target node)
3. Release mouse
4. Connection created! ✓
```

### Visual:
```
┌─────────┐          ┌─────────┐
│ Node A  │─────────▶│ Node B  │
└─────────┘          └─────────┘
     ↑                    ↑
   Output              Input
   (Right)             (Left)
```

---

## ⚙️ Toolbar Quick Reference

```
➕  Zoom In
➖  Zoom Out
⊙   Reset View
📐  Auto Layout (organize nodes)
🗑️  Delete Selected
📋  Duplicate Selected
↶   Undo
↷   Redo
```

---

## 🤖 AI Assistant Quick Ask

### Common Questions:
```
"How do I build a welcome series?"
"What's the best timing between emails?"
"How do A/B splits work?"
"Should I add a wait node?"
"How do I target VIP customers?"
```

### Quick Actions:
```
💡 Suggest Flow    - Get AI-recommended flow
⚡ Optimize        - Get optimization tips
```

---

## ✅ Before Execute Checklist

```
✓ Has Entry node
✓ All nodes connected
✓ No orphaned nodes
✓ Wait nodes between emails (24h min)
✓ Targeting configured
✓ Channel content ready
✓ Validated successfully
```

---

## 🎨 Node Color Guide

```
🟢 Green    - Entry/Exit
🔵 Blue     - Targeting (Segment, Filter)
🟡 Yellow   - Flow Control (Wait, Split)
🔴 Pink     - Channels (Email, SMS)
🟣 Purple   - Actions (Tags, Fields)
🔷 Cyan     - Analytics (Track, Goal)
```

---

## 💡 Pro Tips

### Tip 1: Always Use Wait Nodes
```
❌ Email 1 → Email 2 → Email 3  (Too fast!)
✅ Email 1 → Wait (2d) → Email 2 → Wait (3d) → Email 3
```

### Tip 2: Start Simple
```
First: Entry → Email → Exit
Then add: Targeting, Wait, A/B Test
```

### Tip 3: Test Before Full Send
```
1. Create orchestration
2. Validate
3. Test with small segment first
4. Then run full campaign
```

### Tip 4: Use AI Suggestions
```
1. Click "💡 Suggest Flow"
2. Review AI recommendation
3. Implement or adapt
```

### Tip 5: Name Nodes Clearly
```
❌ "Email"
✅ "Welcome Email - Day 1"
✅ "Cart Reminder with 10% Off"
```

---

## 🔥 Example Flows

### Welcome Series (3 emails)
```
Entry
  ↓
Segment (New Customers)
  ↓
Email (Welcome + Getting Started)
  ↓
Wait (2 days)
  ↓
Email (Product Highlights)
  ↓
Wait (3 days)
  ↓
Email (Special Discount - 20% Off)
  ↓
Goal (Track First Purchase)
  ↓
Exit
```

### Cart Abandonment
```
Entry
  ↓
Filter (Cart Abandoned)
  ↓
Email (You Left Items...)
  ↓
Wait (1 hour)
  ↓
Condition (Opened Email?)
  ├─ YES → Wait (24h) → Email (10% Discount)
  └─ NO → Wait (24h) → SMS (Urgent: Cart Expiring!)
     ↓
Track Event (Recovery Attempt)
  ↓
Exit
```

### VIP Exclusive Offer
```
Entry
  ↓
Segment (VIP Customers)
  ↓
Filter (Active in last 30 days)
  ↓
A/B Split (50/50)
  ├─ A → Email (Exclusive Early Access)
  └─ B → Email (VIP Private Sale)
     ↓
Track Event (VIP Engagement)
  ↓
Wait (3 days)
  ↓
Condition (Made Purchase?)
  ├─ YES → Update Tag (VIP Buyer) → Exit
  └─ NO → Email (Last Chance!) → Exit
```

---

## 🎯 Keyboard Shortcuts (Future)

```
Delete     - Delete selected node
Ctrl+Z     - Undo
Ctrl+Y     - Redo
Ctrl+D     - Duplicate
Ctrl+S     - Save
Space+Drag - Pan canvas
```

---

## 📊 Execution Results

### What You See:
```
✅ Executed at: 2026-02-03 10:30 AM
✅ Audience count: 1,250 customers
✅ Sent count: 987 customers
✅ Execution log:
   - Entry: Starting with 1,250 customers
   - Segment: Filtered to 1,100 customers (VIP)
   - Filter: Filtered to 987 customers (active)
   - Email: Sent to 987 customers
   - Completed: Sent to 987 customers
```

---

## 🚀 **ACCESS NOW:**

# **http://localhost:3000**

```
1. Campaigns tab
2. Any campaign row
3. Click "🎨 Orchestrate"
4. Canvas opens!
```

---

## 📖 Full Documentation

See **ORCHESTRATION_GUIDE.md** for complete details!

---

**Happy orchestrating!** 🎨✨
