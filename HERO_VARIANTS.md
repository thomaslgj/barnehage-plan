# Hero & Logo Refinement — Variants

## Overview
Two hero variants have been implemented for comparison. Both prioritize calm, confident messaging over visual clutter.

---

## VARIANT A (Current/Default)
**Simplified Logo + Refined Wordmark**

### Changes Made:
1. **Logo Icon**
   - Reduced size: 140×140px → 80×80px
   - Simplified waves: 3 waves → 2 waves
   - Thinner strokes: 4-5px → 2.5px
   - Removed decorative dots
   - More subtle colors (reduced opacity)
   - Goal: Elegant, not "wellness startup"

2. **Wordmark "flyt"**
   - Increased letter-spacing: 0.15em → 0.25em
   - Size: text-6xl sm:text-7xl
   - More breathing room and intentionality

3. **Spacing & Hierarchy**
   - Icon → Wordmark gap: mb-16 (increased from mb-8)
   - Wordmark → Headline gap: mb-16 (increased from mb-8)
   - Hero padding: pt-48/pb-48 on desktop (increased ~20%)
   - Headline is now clearly the primary focus

### Visual Balance:
```
[small refined icon]
       ↓
    (space)
       ↓
     "flyt"
       ↓
    (space)
       ↓
[HEADLINE - dominant]
       ↓
   [subtext]
       ↓
   [buttons]
```

---

## VARIANT B (Alternative/Exploratory)
**Wordmark Only**

### How to Test:
In `app/page.tsx`, comment out Variant A code and uncomment Variant B code.

### Changes:
- **No icon** — removes visual competition entirely
- **Larger wordmark**: text-7xl sm:text-8xl
- **More letter-spacing**: 0.3em
- **More vertical space**: mb-20

### Visual Balance:
```
     "flyt"
       ↓
   (big space)
       ↓
[HEADLINE - dominant]
       ↓
   [subtext]
       ↓
   [buttons]
```

### Trade-offs:
**Pros:**
- Zero visual competition
- Maximum focus on message
- Very calm and confident
- More distinct from generic startups

**Cons:**
- Loses brand icon (may need icon elsewhere for recognition)
- Slightly less "product" feel
- May feel too minimal for some contexts

---

## Design Philosophy

Both variants follow these principles:

### Hierarchy
1. **Headline** — primary emotional message
2. **Subtext** — clarifies value
3. **Wordmark** — subtle brand presence
4. **Icon** — (if present) minimal and refined

### Typography
- Letter-spacing creates calm, intentional feel
- Clean kerning, no decorative elements
- Nordic restraint

### Spacing
- "Still water, clear message"
- Generous vertical rhythm
- No tight stacking

### Colors
- Restrained green palette
- Reduced opacity for subtlety
- No gradients or heavy effects

---

## Recommendation

**Start with Variant A** as it balances brand presence with message focus.

**Test Variant B** if you want to push even further toward emotional clarity and minimalism.

Both are valid. Choose based on:
- Do you need the icon for brand recognition?
- Which feels more confident and calm to you?
- Which better supports the message?

---

## Implementation Notes

To switch between variants:
1. Open `app/page.tsx`
2. Find the hero section
3. Comment/uncomment the respective variant blocks
4. Refresh the page

No other files need modification.
