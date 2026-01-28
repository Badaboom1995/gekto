# Implementation Plan: Feature Modifications

## Overview
Three features to implement:
1. Add new "Consoles" category
2. Remove search functionality from header
3. Make chip in hero section 3D

---

## Task 1: Add New "Consoles" Category

### Current State
- HomePage.tsx has a hardcoded `categories` array with 6 categories
- Categories are displayed in a grid in the "Browse by Category" section
- Each category has: id, name, icon, count
- Current categories: Home Computers, Business Systems, Gaming Consoles, Accessories, Software, Restoration Parts

### Implementation
1. **Modify HomePage.tsx (line 47-54)**
   - Add new category object: `{ id: 7, name: 'Consoles', icon: '🕹️', count: 45 }`
   - Note: Will need to adjust grid layout (currently 6 columns)

2. **Update HomePage.css (line 168)**
   - Change `.categories-grid` from `grid-template-columns: repeat(6, 1fr)` to `repeat(7, 1fr)`
   - Update responsive breakpoints to handle new column count

3. **Update responsive styles**
   - Adjust 1024px breakpoint: from 3 columns to appropriate number
   - Adjust 768px breakpoint: from 2 columns to appropriate number
   - Adjust 480px breakpoint: maintain single column

---

## Task 2: Remove Search from Header

### Current State
- Header component in App.tsx (lines 47-85)
- Has a search icon button in header-actions (line 64-69)
- HeroBanner component (lines 87-102) has a separate search bar below the banner title

### Implementation
1. **Modify App.tsx**
   - Remove search button from Header component (lines 64-69)
   - Remove the search icon SVG

2. **No CSS changes needed**
   - Icon button styling remains for cart and profile
   - Layout will naturally adjust with flexbox

---

## Task 3: Make Chip in Hero Section 3D

### Current Implementation
- Chip is a rectangular element with floating animation (lines 105-157 in HomePage.css)
- Uses 2D transforms (translateY)
- Has glass-morphism styling with backdrop-filter and gradient

### 3D Approach Options
1. **CSS 3D Transforms** (Recommended)
   - Add `perspective` to parent
   - Use `transform: rotateX()`, `rotateY()`, `rotateZ()`
   - Replace 2D float animation with 3D rotation
   - Add `transform-style: preserve-3d`

2. **Key Changes**
   - Update `.floating-chip` animation to use 3D rotations instead of translateY
   - Change perspective for depth effect
   - Optionally add shadow updates to match 3D orientation

### Implementation Details
1. **Modify HomePage.tsx** (lines 97-109)
   - Add wrapper for 3D perspective (already have `.floating-chip`)

2. **Modify HomePage.css**
   - Replace `.floating-chip` animation (lines 112-119)
   - Update `@keyframes float` to include `rotateX()`, `rotateY()`
   - Add `transform-style: preserve-3d` to parent
   - Add `perspective` property

---

## Files to Modify
1. `/Users/alexey/projects/gekto/test-app/src/pages/HomePage.tsx`
2. `/Users/alexey/projects/gekto/test-app/src/pages/HomePage.css`
3. `/Users/alexey/projects/gekto/test-app/src/App.tsx`

## Testing Checklist
- [ ] New "Consoles" category appears in 6-column grid on desktop
- [ ] Responsive breakpoints work properly with 7 categories
- [ ] Search icon is removed from header
- [ ] Header layout still looks balanced
- [ ] Chip in hero section rotates in 3D
- [ ] 3D animation looks smooth and realistic
- [ ] Mobile responsiveness maintained for all changes
