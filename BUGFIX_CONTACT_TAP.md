# Bug Fix: Contact Tap Navigation

## Issue
Tapping a contact card in the Contacts screen did not open the Contact Detail view.

## Root Cause
The contact cards were using a `<button>` element with nested child elements. The nested elements (avatar image, text content, tags) were capturing click events and preventing them from bubbling up to the button's onClick handler.

## Solution
Changed the implementation from:
- `<button>` with onClick handler
- Nested divs capturing events

To:
- `<div>` with onClick handler and `cursor-pointer` class
- Added `pointer-events-none` to the inner content container
- Added `e.stopPropagation()` to prevent event bubbling

## Changes Made

### File: `src/screens/NewContactsScreen.tsx`

**Before:**
```tsx
<button
  onClick={() => onSelectContact(contact.id)}
  className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:scale-98 transition-transform"
>
  <div className="flex items-center gap-3">
    {/* content */}
  </div>
</button>
```

**After:**
```tsx
<div
  onClick={(e) => {
    e.stopPropagation();
    onSelectContact(contact.id);
  }}
  className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:scale-98 transition-transform cursor-pointer"
>
  <div className="flex items-center gap-3 pointer-events-none">
    {/* content */}
  </div>
</div>
```

## Key Changes:
1. **Element Type**: Changed from `<button>` to `<div>` with `cursor-pointer`
2. **Pointer Events**: Added `pointer-events-none` to inner content container to ensure all clicks go to parent
3. **Event Handling**: Added `e.stopPropagation()` to prevent bubbling
4. **Accessibility**: Maintained visual feedback with `active:scale-98` transition

## Testing
- ✅ Contact cards are now clickable
- ✅ Navigation to Contact Detail screen works correctly
- ✅ Visual feedback (scale animation) still works
- ✅ All nested elements (avatar, name, title, tags) properly allow clicks through
- ✅ Project builds without errors

## Status
**FIXED** - Contact tap navigation now works as expected.
