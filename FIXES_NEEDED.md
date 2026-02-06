# 🔧 COMPREHENSIVE FIX PLAN

## Issues to Fix:

### 1. **Orchestration Canvas - Drag & Drop Not Working**
**Problem**: Activities are marked draggable but don't drop onto canvas
**Solution**: 
- Verify event listeners are properly attached
- Fix canvas scroll/zoom offset calculations
- Add visual feedback during drag
- Test with console logging

### 2. **Filters Don't Match Adobe Campaign Style**
**Problem**: Current filters are in side panels, Adobe has inline compact filters
**Solution**:
- Remove filter panels
- Add inline filter controls above tables (search bar, dropdown filters)
- Match Adobe's compact horizontal filter bar
- See Adobe screenshot for exact layout

### 3. **Profiles Import/Export Missing**
**Problem**: Tabs exist but no functionality
**Solution**:
- Add Import modal with CSV upload
- Add Export modal with format selection (CSV, Excel)
- Implement CSV parsing and data import
- Implement data export functionality

### 4. **Segment Builder - Missing AND/OR Between Conditions**
**Problem**: Multiple rules without logical operators
**Solution**:
- Add AND/OR toggle buttons between each condition group
- Allow switching between AND/OR logic
- Visual connectors showing the logic flow
- Update query generation to include operators

### 5. **Segment Builder - No SQL Statement Display**
**Problem**: Can't see the generated SQL
**Solution**:
- Add SQL preview panel at bottom of builder
- Generate SQL in real-time as conditions change
- Show formatted SQL with syntax highlighting
- Copy SQL button

---

## Implementation Order:

1. Fix filters (most visible issue across all pages)
2. Add AND/OR operators to Segment Builder  
3. Add SQL display to Segment Builder
4. Fix Orchestration drag-and-drop
5. Add Import/Export to Profiles

Let's start!
