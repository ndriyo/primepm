---
name: frontend-design
description: >
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use this skill when the user asks to build web components, pages, or applications.
  Generates creative, polished code that avoids generic AI aesthetics.
  USE FOR: build UI, create component, design page, build app, frontend, interface, landing page,
  dashboard, form, modal, navigation, hero section, card layout, web design, visual design, CSS animation,
  interactive component, React component, HTML page, styled component.
  DO NOT USE FOR: backend logic, API routes, database queries, server-side rendering configuration.
argument-hint: Describe the component, page, or interface to build (include context about purpose and audience)
---

# Frontend Design

This skill produces distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Every output should feel genuinely designed — not generated.

## When to Use

- Building any UI component, page, or application
- When visual quality and originality matter
- Creating interfaces that need to be memorable, not just functional

## Design Thinking (Do This First)

Before writing a single line of code, commit to an aesthetic direction:

1. **Understand the context**
   - What problem does this interface solve?
   - Who uses it, and in what environment?
   - What emotional response should it evoke?

2. **Pick a BOLD aesthetic direction** — choose one and commit:
   - Brutally minimal / Swiss modernist
   - Maximalist / rich layered detail
   - Retro-futuristic / sci-fi terminal
   - Organic / natural / earthy
   - Luxury / refined / editorial
   - Playful / toy-like / expressive
   - Brutalist / raw / punk
   - Art deco / geometric / ornamental
   - Soft / pastel / dreamy
   - Industrial / utilitarian / technical

3. **Define the "one unforgettable thing"** — the single detail someone remembers after closing the tab.

4. **Choose implementation approach**: maximalist visions need elaborate code; minimalist visions need precision and restraint. Match complexity to vision.

## Implementation Guidelines

### Typography
- Choose **characterful, unexpected** display + body font pairings
- Load from Google Fonts or use @font-face
- NEVER use: Inter, Roboto, Arial, system-ui as the primary display font
- Size aggressively — headlines can be enormous, captions can be tiny
- Explore: Playfair Display, DM Serif Display, Fraunces, Instrument Serif, Syne, Space Mono, Bebas Neue, Cormorant, Cabinet Grotesk, Clash Display, General Sans, Satoshi, Plus Jakarta Sans (sparingly), Switzer, Zodiak, Editorial New

### Color & Theme
- Commit to a palette with **dominant colors + sharp accents**
- Define via CSS custom properties (`--color-*`)
- Avoid: evenly distributed neutral palettes, purple-gradient-on-white, teal + white + gray
- Use: unexpected color combinations, high contrast moments, monochromatic with one accent, inverted sections
- Vary: don't always default to dark themes OR light themes — alternate based on context

### Motion & Animation
- One orchestrated page-load sequence beats scattered micro-interactions
- Staggered reveals using `animation-delay` on sequential elements
- Scroll-triggered entrance animations where appropriate
- Hover states that surprise (scale, rotate, color shift, underline draw)
- For React: use Motion library (`motion/react`) when available
- For HTML/CSS: CSS-only keyframe animations
- Avoid: gratuitous bouncing, animations that slow task completion

### Spatial Composition
- Break the grid intentionally — asymmetry, overlap, diagonal flow
- Use generous negative space OR controlled density (not comfortable middle ground)
- Layer elements at different z-levels for depth
- Grid-breaking decorative elements that anchor the composition

### Backgrounds & Visual Atmosphere
- Never default to flat `#ffffff` or `#000000` backgrounds
- Options: gradient meshes, noise textures, geometric SVG patterns, grain overlays, layered radial gradients
- Add `backdrop-filter` blur effects for glassmorphism when appropriate
- Dramatic box-shadows that create lift and depth
- Decorative borders, dividers, and accents (not default browser styles)

## Quality Checklist

Before finishing, verify:
- [ ] Typography is distinctive and renders beautifully at all sizes
- [ ] Color palette is cohesive with clear dominant + accent hierarchy
- [ ] At least one animation or motion element adds delight
- [ ] Layout has intentional spatial composition (not default stack/grid)
- [ ] Background has atmosphere, not a flat color
- [ ] No generic AI aesthetics (Inter font, purple gradient, teal/white scheme)
- [ ] The "one unforgettable thing" is present and executed well
- [ ] Code is production-ready and functional (not just visual mockup)

## Anti-Patterns to Avoid

- Font: Inter, Roboto, Arial, system-ui as the hero font
- Color: purple-to-blue gradient on white; teal + gray; #6366f1 (Tailwind indigo default)
- Layout: centered card on plain background; standard hero-features-CTA stack
- Effects: excessive glassmorphism without purpose; drop shadows on everything
- Motion: CSS transitions on every hover; loading spinners as the only animation
- Code: inline styles everywhere; no CSS variables; magic numbers without system

## References

- [Typography Inspiration](./references/typography.md)
- [Color & Theme Patterns](./references/color-patterns.md)
- [Animation Recipes](./references/animation-recipes.md)
