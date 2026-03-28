# Design System Documentation: An Editorial Approach to Innovation

## 1. Overview & Creative North Star: "The Mentorship Sanctuary"

This design system is built to transcend the "standard dashboard" aesthetic. Our Creative North Star is **The Mentorship Sanctuary**—a digital environment that balances the authoritative weight of professional innovation with the soft, inviting nature of a personal growth space. 

By utilizing high-contrast typography, intentional asymmetry, and deep tonal layering, we move away from "template-style" grids. We prioritize white space as a functional element rather than a void, creating an editorial experience that feels curated and premium. The goal is to make every user feel like they are entering a high-end, private innovation lounge, not just another SaaS tool.

---

## 2. Colors

The color strategy is rooted in "Organic Professionalism." We use deep, forest-inspired greens to establish trust and maturity, punctuated by high-energy mustard accents to signal action and innovation.

### Palette Highlights
*   **Primary (`#012d1d`) & Primary-Container (`#1b4332`):** Used for structural authority and deep focus areas.
*   **Secondary (`#7d5800`) & Secondary-Container (`#ffb702`):** Reserved for moments of high-intent and primary CTAs.
*   **Tertiary (`#132b23`) & Sage Accents:** Used for subtle differentiation and mentor-related elements.

### The "No-Line" Rule
To maintain a high-end editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts.
*   **Implementation:** Place a `surface-container-lowest` card on a `surface-container-low` background. The difference in tonal value creates the edge, removing visual "noise" and making the interface feel more expansive.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers (`Lowest` to `Highest`) to create nested depth.
*   **Nesting:** An inner container should always be at least one tier higher or lower than its parent to define its importance.
*   **The Glass & Gradient Rule:** For floating navigation or top-level "announcement" cards, use Glassmorphism. Apply a semi-transparent `surface` color with a `backdrop-blur` of 16px–24px. For primary buttons, use a subtle linear gradient from `primary` to `primary-container` at a 135° angle to provide "visual soul."

---

## 3. Typography

The typography system pairs the geometric precision of **Lexend** with the humanist readability of **Manrope**.

*   **Display & Headlines (Lexend):** These are our "Voice." Large scales (e.g., `display-lg` at 3.5rem) should be used with tight letter-spacing and intentional leading to create an authoritative, editorial look.
*   **Body & Titles (Manrope):** These are our "Information." Manrope provides a friendly, approachable feel for long-form data and mentor communications.
*   **Labeling:** Use `label-md` (Lexend) in all-caps with 5% letter-spacing for "Platform Overview" or "Category" headers to create a sophisticated, archival feel.

---

## 4. Elevation & Depth

We convey hierarchy through **Tonal Layering** and **Ambient Light** rather than traditional structural lines.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. 
*   **Base:** `surface` (#f9f9f8).
*   **Content Sections:** `surface-container-low`.
*   **Interactive Cards:** `surface-container-lowest` (pure white) to create a natural "lift."

### Ambient Shadows
Shadows must be extra-diffused to mimic natural light.
*   **Token:** `shadow-soft`.
*   **Specs:** Blur: 40px–60px, Spread: -10px, Opacity: 4%–8%. 
*   **Coloring:** Shadows should never be pure black. Use a tinted version of `on-surface` (e.g., a dark, desaturated green) to keep the shadows "warm" and integrated.

### The "Ghost Border" Fallback
If a border is required for accessibility in input fields, use a **Ghost Border**. Use the `outline-variant` token at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Cards & Containers
*   **Corner Radius:** All main cards must use the `xl` radius (3rem / 48px) or `lg` (2rem / 32px).
*   **Content Spacing:** Use a minimum of `spacing-8` (2.75rem) for internal card padding to allow the content to "breathe."
*   **Glassmorphism-lite:** Apply to secondary navigation or background decorative elements. Use `surface-variant` at 60% opacity with a blur.

### Buttons
*   **Primary:** `secondary-container` background with `on-secondary-container` text. Large `xl` rounded corners.
*   **Secondary:** Ghost style (no fill) with a `primary` text label and a `shadow-soft` on hover.
*   **Action Floating:** Small circular buttons (e.g., the "Arrow" icons in the dashboard) should use a `secondary-container` fill when they represent the "Next Step."

### Inputs & Fields
*   **Styling:** Large `md` or `lg` rounded corners. Background should be `surface-container-highest` with no border. On focus, transition the background to `surface-container-lowest` and apply a `shadow-soft`.

### Decorative Background Pattern
*   **Geometric Accents:** Floating plus signs, diamonds, and circles should be rendered in `outline-variant` at 20% opacity. They should appear "randomized" but follow a loose 45-degree grid to guide the eye across the asymmetric layout.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a large card on the left balanced by two smaller cards and a floating geometric shape on the right).
*   **Do** leverage the `secondary` (Mustard) color for progress indicators and notifications to provide warmth.
*   **Do** allow icons to sit in their own "Sage Green" or "Mustard" circular containers (`999px` radius) to create a friendly, iconographic language.

### Don't:
*   **Don't** use dividers or horizontal rules. Use `spacing-12` or background color shifts instead.
*   **Don't** use standard "Material Design" shadows. If the shadow looks like a "drop shadow," it is too heavy. It should look like an "aura."
*   **Don't** crowd the interface. If a screen feels full, increase the spacing tokens and move secondary information into a nested `surface-container`.
*   **Don't** use 100% black for text. Always use `on-surface` (#191c1c) to maintain the "Sanctuary" softness.