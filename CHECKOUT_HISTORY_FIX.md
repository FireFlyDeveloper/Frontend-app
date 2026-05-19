#Fix Checkout History Page Syntax Errors

## Problem Summary

TypeScript compilation errors in `CheckoutHistoryPage.tsx`:
- Line 186: `CardContent` has no closing tag
- Line 334: Unexpected `})}` token
- Line 379: Expected JSX closing tag

## Root Cause

Nexus added return handling logic (handleQuickSelect, handleReturnAll) but introduced JSX structure error:

**File**: `src/routes/pages/inventory/CheckoutHistoryPage.tsx`
**Commit**: 476e846 (Nexus modification)

The issue: A `</div>` closing tag at line 330 is inside the `.map()` callback instead of after it. This breaks the parent-child JSX hierarchy.

**Broken structure:**
```tsx
<div> {/* Parent div */}
  {items.map(() => {
    return (
      <div>
        {/* ... */}
        </div>  {/* ❌ WRONG: Should not be here! */}
      </div>
    )
  })}
  {/* More JSX after */}
</div>
```

**Correct structure:**
```tsx
<div> {/* Parent div */}
  {items.map(() => {
    return (
      <div>
        {/* ... */}
      </div>  {/* ✅ Only close the item div */}
    )
  })}
  </div>  {/* ✅ Close the parent div AFTER map finishes */}
  {/* More JSX after */}
</div>
```

## Fix Required

Move `</div>` from line 330 (inside map) to after line 334 (after map callback).

## Task Created

Bugfix task queued: `007-fix-checkout-history-syntax.json`
- Priority: HIGH
- Target file: CheckoutHistoryPage.tsx
- Deliverables: Fixed JSX structure, TypeScript compiles

## Status

- ✅ AllFoldersView successfully pushed to GitHub
- ✅ DocumentManagerPage fixed
- ⚠️ CheckoutHistoryPage needs syntax fix
- ⏳ Nexus task queued, will process in next cron cycle

## Next Steps

1. Wait for cron to process task 007 (next 5 min)
2. Nexus will fix JSX syntax  
3. Verify TypeScript builds without errors
4. Git push Backend changes when ready

**Estimated fix time**: ~10 minutes (next cron run)