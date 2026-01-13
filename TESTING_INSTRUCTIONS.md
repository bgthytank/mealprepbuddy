# Testing Instructions for Recipe Edit and Text Display Improvements

This document outlines the testing procedures for the recent changes to MealPrepBuddy.

## Changes to Test

1. **Recipe Editing Functionality**
2. **Recipe Name Display Improvements (Text Truncation Fix)**

---

## Prerequisites

Before testing, ensure:
- The application is running locally or deployed
- You have at least 3-5 recipes created with varying name lengths
- Some recipes should have long names (e.g., "Grandma's Super Special Italian Lasagna with Extra Cheese and Vegetables")

---

## Test 1: Recipe Editing Functionality

### Test Case 1.1: Edit Recipe Button Visibility

**Steps:**
1. Navigate to the "Recipes" tab
2. Hover over a recipe card

**Expected Result:**
- An edit button (pencil icon) should appear next to the delete button
- The edit button should be blue on hover
- Both buttons should fade in when hovering over the recipe card

**Screenshot Required:** Capture hovering state showing edit and delete buttons

---

### Test Case 1.2: Open Edit Modal

**Steps:**
1. Click the edit button on any recipe

**Expected Result:**
- A modal titled "Edit Recipe" should open
- The modal should be pre-filled with the current recipe data:
  - Title
  - Default servings
  - Notes
  - Selected tags (highlighted in black)

**Screenshot Required:** Capture the edit modal with pre-filled data

---

### Test Case 1.3: Edit Recipe Title

**Steps:**
1. Open edit modal for a recipe
2. Change the recipe title to something new (e.g., "Updated Recipe Name")
3. Click "SAVE CHANGES"

**Expected Result:**
- Modal closes
- Success notification appears: "Recipe '[new name]' updated."
- Recipe card displays the new title
- Recipe appears with new name in schedule sidebar (if it was there)

**Screenshot Required:**
- Before: Original recipe title
- After: Updated recipe title in recipe card

---

### Test Case 1.4: Edit Recipe Tags

**Steps:**
1. Open edit modal for a recipe
2. Remove one tag by clicking it (should turn from black to white)
3. Add a different tag by clicking it (should turn from white to black)
4. Click "SAVE CHANGES"

**Expected Result:**
- Modal closes
- Success notification appears
- Recipe card displays the new tags
- Old tag is removed, new tag is added

**Screenshot Required:**
- Before: Recipe with original tags
- After: Recipe with updated tags

---

### Test Case 1.5: Edit Recipe Servings and Notes

**Steps:**
1. Open edit modal for a recipe
2. Change default servings (e.g., from 4 to 6)
3. Update the notes field with new text
4. Click "SAVE CHANGES"

**Expected Result:**
- Modal closes
- Success notification appears
- Recipe card displays new servings count
- Recipe card displays updated notes (visible in recipe card description)

**Screenshot Required:**
- Before: Recipe with original servings/notes
- After: Recipe with updated servings/notes

---

### Test Case 1.6: Cancel Edit

**Steps:**
1. Open edit modal for a recipe
2. Make several changes (title, tags, servings)
3. Click "CANCEL"

**Expected Result:**
- Modal closes
- No changes are saved
- Recipe card remains unchanged
- No notification appears

---

### Test Case 1.7: Edit Validation

**Steps:**
1. Open edit modal for a recipe
2. Clear the title field completely
3. Try to click "SAVE CHANGES"

**Expected Result:**
- The "SAVE CHANGES" button should be disabled (grayed out and unclickable)
- Form should not submit

**Steps:**
1. Re-enter a title
2. Deselect all tags (so no tags are selected)
3. Try to click "SAVE CHANGES"

**Expected Result:**
- The "SAVE CHANGES" button should be disabled
- Form requires at least one tag

---

## Test 2: Recipe Name Display Improvements

### Test Case 2.1: Sidebar Recipe Name Display

**Steps:**
1. Navigate to the "Planning" tab
2. Observe the recipe list in the left sidebar (pantry)
3. Look at recipes with long names

**Expected Result:**
- Recipe names should display up to 2 lines before truncating
- Very long names (>2 lines) should end with "..." ellipsis
- Hovering over a recipe should show the full name in a tooltip

**Screenshot Required:**
- Before: If you can find an old version, show how names were truncated to 1 line
- After: Show long recipe names displaying 2 lines in the sidebar

**Test Recipe Names:**
- "Grandma's Super Special Italian Lasagna with Extra Cheese"
- "Mom's Famous Slow-Cooked Beef Stew with Vegetables and Herbs"
- "Quick Easy Weeknight Chicken Stir Fry"

---

### Test Case 2.2: Schedule Grid Recipe Name Display (Desktop)

**Steps:**
1. Add recipes with long names to the weekly schedule
2. View the schedule grid on a desktop browser (wide screen)
3. Observe how recipe names are displayed in each day's cell

**Expected Result:**
- Recipe names should display up to 3 lines before truncating
- Very long names (>3 lines) should end with "..." ellipsis
- Hovering over a recipe in the schedule should show the full name in a tooltip
- Text should be readable and not cramped

**Screenshot Required:**
- Before: If possible, show old version with 2-line limit
- After: Show long recipe names displaying 3 lines in schedule cells

**Desktop Test (Wide Screen - 1920x1080 or larger):**
- Add multiple long-named recipes to the schedule
- Verify they display properly without excessive truncation
- Verify grid doesn't break layout

---

### Test Case 2.3: Schedule Grid Recipe Name Display (Mobile/Narrow)

**Steps:**
1. Resize browser window to mobile width (< 768px)
2. OR use browser dev tools to simulate mobile device
3. View the schedule grid
4. Observe recipe name display

**Expected Result:**
- Schedule grid should be horizontally scrollable on narrow screens
- Recipe names should still display up to 3 lines
- Text should remain legible
- Layout should not break

**Screenshot Required:**
- Mobile view showing schedule with long recipe names
- Demonstrate horizontal scroll if needed

---

### Test Case 2.4: Tooltip Functionality

**Steps:**
1. Find a recipe with a name longer than 3 lines
2. Add it to the schedule
3. Hover your mouse cursor over the recipe name in the schedule grid
4. Also hover over the recipe name in the sidebar

**Expected Result:**
- A browser tooltip should appear showing the full recipe name
- Tooltip should appear in both the sidebar and schedule grid
- Tooltip should be readable and not cut off

**Screenshot Required:**
- Capture tooltip appearing on hover (both sidebar and schedule)

---

### Test Case 2.5: Responsive Grid Width

**Steps:**
1. View the schedule on various screen sizes:
   - Small laptop (1366x768)
   - Large desktop (1920x1080)
   - Ultra-wide (2560x1440)
2. Observe the schedule grid width

**Expected Result:**
- On small screens: Grid should be scrollable horizontally (min-width: 900px)
- On medium screens: Grid should fit nicely with adequate spacing
- On large screens: Grid should not exceed 1600px width and be centered
- Recipe cells should have adequate space for names

**Screenshot Required:**
- Show schedule on different screen sizes demonstrating responsive behavior

---

## Test 3: Integration Testing

### Test Case 3.1: Edit Recipe Then View in Schedule

**Steps:**
1. Add a recipe to the weekly schedule
2. Go to "Recipes" tab
3. Edit the recipe name to something longer
4. Return to "Planning" tab

**Expected Result:**
- The updated recipe name appears in the schedule grid
- The new name displays properly with the improved truncation rules
- Tooltip shows full new name on hover

---

### Test Case 3.2: Multiple Long Names in One Week

**Steps:**
1. Create 7 recipes with very long names
2. Add one to each day of the week
3. View the entire week in the schedule grid

**Expected Result:**
- All 7 recipes display their names properly
- No layout breaking
- Each name shows up to 3 lines
- Schedule remains visually organized and readable

**Screenshot Required:**
- Full week view with all 7 long-named recipes

---

## Browser Compatibility Testing

Test on the following browsers (if possible):
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**For each browser, verify:**
- Edit button appears correctly
- Edit modal opens and functions
- Recipe names display with proper truncation
- Tooltips work on hover
- No console errors

---

## Performance Testing

### Test Case P.1: Large Recipe List

**Steps:**
1. Create 50+ recipes
2. Navigate to Recipes tab
3. Open edit modal for various recipes

**Expected Result:**
- No lag when opening edit modal
- Modal loads instantly with recipe data
- Recipe list scrolls smoothly

---

### Test Case P.2: Schedule with Many Recipes

**Steps:**
1. Fill the entire week with recipes (7 dinners)
2. Edit multiple recipes with long names
3. View the schedule

**Expected Result:**
- Schedule renders quickly
- No performance degradation
- Smooth scrolling

---

## Accessibility Testing

### Test Case A.1: Keyboard Navigation

**Steps:**
1. Use Tab key to navigate to recipe cards
2. Press Tab to reach edit button
3. Press Enter to open modal
4. Use Tab to navigate form fields
5. Press Enter on "SAVE CHANGES"

**Expected Result:**
- All interactive elements are keyboard accessible
- Focus indicators are visible
- Modal can be closed with Escape key
- Form can be submitted with keyboard

---

### Test Case A.2: Screen Reader

**Steps:**
1. Use a screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to recipe cards
3. Listen to recipe name announcements

**Expected Result:**
- Recipe names are announced fully (not truncated)
- Edit button is announced as "Edit recipe"
- Modal title is announced when opened
- Form labels are properly announced

---

## Bug Testing

### Potential Issues to Watch For:

1. **Edit Modal Issues:**
   - [ ] Modal doesn't close after saving
   - [ ] Changes don't reflect immediately
   - [ ] Tag selection doesn't work
   - [ ] Validation allows empty title

2. **Text Display Issues:**
   - [ ] Text overflows container
   - [ ] Ellipsis doesn't appear
   - [ ] Tooltip doesn't show
   - [ ] Layout breaks on mobile

3. **Integration Issues:**
   - [ ] Edited recipe doesn't update in schedule
   - [ ] Recipe disappears after edit
   - [ ] Tags lost after edit
   - [ ] Server errors on save

---

## Success Criteria

The testing is successful if:

1. ✅ All recipe edit operations work correctly
2. ✅ Recipe names display more fully than before
3. ✅ No layout breaking on any screen size
4. ✅ Tooltips work correctly
5. ✅ No console errors
6. ✅ Performance is acceptable
7. ✅ Changes persist across page refreshes
8. ✅ No regressions in existing functionality

---

## Screenshot Checklist

Required screenshots for documentation:

### Recipe Editing:
- [ ] Recipe card with edit button visible (hover state)
- [ ] Edit modal with pre-filled data
- [ ] Before/after edit: Changed recipe title
- [ ] Before/after edit: Changed recipe tags
- [ ] Before/after edit: Changed servings/notes

### Text Display:
- [ ] Sidebar with long recipe names (2 lines visible)
- [ ] Schedule grid with long recipe names (3 lines visible)
- [ ] Tooltip showing full recipe name
- [ ] Mobile view with responsive layout
- [ ] Desktop view showing grid max-width

### Integration:
- [ ] Full week schedule with multiple long-named recipes
- [ ] Edited recipe appearing correctly in schedule

---

## Reporting Issues

If you find any bugs, please report with:
- **Description**: What went wrong
- **Steps to reproduce**: Exact steps to recreate the issue
- **Expected vs Actual**: What should happen vs what did happen
- **Screenshot**: Visual evidence of the issue
- **Browser/Device**: What you were using
- **Console errors**: Any errors in browser console

---

## Notes

- Test data should include recipes with varying name lengths (short, medium, long, very long)
- Test on both fresh data and after editing
- Clear browser cache if issues occur
- Check both Light and Dark mode if applicable
- Verify changes work after page refresh (data persistence)
