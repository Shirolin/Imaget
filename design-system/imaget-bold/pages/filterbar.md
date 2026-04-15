# Filterbar Page Overrides

> **PROJECT:** Imaget Bold
> **Generated:** 2026-04-15 13:54:24
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content
- **Sections:** 1. Intro (Vertical), 2. The Journey (Horizontal Track), 3. Detail Reveal, 4. Vertical Footer

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Continuous palette transition. Chapter colors. Progress bar #000000.

### Component Overrides

- Avoid: Desktop-first causing mobile issues
- Avoid: No feedback during loading
- Avoid: Override system gestures

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus
- Responsive: Start with mobile styles then add breakpoints
- Feedback: Show spinner/skeleton for operations > 300ms
- Touch: Avoid horizontal swipe on main content
- CTA Placement: Floating Sticky CTA or End of Horizontal Track
