# Color & Theme Patterns

## Palette Archetypes

### Monochromatic + One Accent
```css
:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --border: #2a2a2a;
  --text: #f0ede8;
  --text-muted: #7a7772;
  --accent: #e8c547;   /* single vivid accent */
}
```

### Warm Editorial
```css
:root {
  --bg: #faf7f2;
  --surface: #f0ebe2;
  --border: #d4c9b8;
  --text: #1c1814;
  --text-muted: #7a6e62;
  --accent: #c4391a;
}
```

### Cold Industrial
```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --accent: #00d4ff;
}
```

### Earthy Organic
```css
:root {
  --bg: #1a1612;
  --surface: #241f18;
  --border: #3d3428;
  --text: #e8e0d0;
  --text-muted: #9a8e7a;
  --accent: #8bc34a;
}
```

### Luxury Inverted
```css
:root {
  --bg: #f8f4ee;
  --surface: #ffffff;
  --border: #e0d8cc;
  --text: #1a1614;
  --text-muted: #6b5e52;
  --accent: #2d1b69;
}
```

## Gradient Meshes (Background Effects)

```css
/* Subtle warm mesh */
background: 
  radial-gradient(ellipse at 20% 50%, rgba(255, 200, 100, 0.15) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, rgba(255, 100, 80, 0.1) 0%, transparent 40%),
  radial-gradient(ellipse at 60% 80%, rgba(100, 80, 255, 0.08) 0%, transparent 50%),
  #0a0a0a;

/* Cool tech mesh */
background:
  radial-gradient(ellipse at 10% 30%, rgba(0, 212, 255, 0.12) 0%, transparent 45%),
  radial-gradient(ellipse at 90% 70%, rgba(0, 100, 255, 0.08) 0%, transparent 45%),
  #0d1117;
```

## Noise Texture Overlay

```css
/* Add grain/noise texture as pseudo-element */
.noise::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.4;
}
```

## Anti-Patterns
- `#6366f1` (Tailwind indigo) as accent
- Purple → blue gradient on white
- `#14b8a6` teal as primary color  
- Flat white or flat black backgrounds without any atmosphere
- Equal visual weight across all colors (no clear hierarchy)
