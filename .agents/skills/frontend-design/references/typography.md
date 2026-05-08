# Typography Reference

## Recommended Pairings

### Editorial / Luxury
- Display: Cormorant Garamond (Italic for headlines) + Body: Jost or Switzer
- Display: Playfair Display + Body: Source Serif 4
- Display: Fraunces + Body: DM Sans

### Technical / Industrial
- Display: Space Mono + Body: IBM Plex Sans
- Display: Bebas Neue + Body: Barlow Condensed
- Display: Syne + Body: Outfit

### Contemporary / Refined
- Display: Instrument Serif + Body: Cabinet Grotesk
- Display: DM Serif Display + Body: DM Sans
- Display: Editorial New + Body: Satoshi

### Expressive / Loud
- Display: Clash Display + Body: Clash Grotesk
- Display: Anton + Body: Barlow
- Display: Abril Fatface + Body: Libre Franklin

### Soft / Organic
- Display: Gilda Display + Body: Lato
- Display: Yeseva One + Body: Josefin Sans
- Display: Libre Baskerville (Italic) + Body: Raleway

## Loading Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
```

## Type Scale System

```css
:root {
  --text-xs: clamp(0.75rem, 1.5vw, 0.875rem);
  --text-sm: clamp(0.875rem, 2vw, 1rem);
  --text-base: clamp(1rem, 2.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 3vw, 1.5rem);
  --text-xl: clamp(1.5rem, 4vw, 2rem);
  --text-2xl: clamp(2rem, 5vw, 3rem);
  --text-display: clamp(3rem, 8vw, 6rem);
  --text-hero: clamp(4rem, 12vw, 10rem);
}
```
