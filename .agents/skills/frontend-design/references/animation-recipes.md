# Animation Recipes

## Page Load Stagger (CSS)

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stagger > * {
  opacity: 0;
  animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0.1s; }
.stagger > *:nth-child(2) { animation-delay: 0.2s; }
.stagger > *:nth-child(3) { animation-delay: 0.32s; }
.stagger > *:nth-child(4) { animation-delay: 0.46s; }
.stagger > *:nth-child(5) { animation-delay: 0.62s; }
```

## Page Load Stagger (Motion/React)

```tsx
import { motion } from 'motion/react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i} variants={item}>{i}</motion.li>)}
</motion.ul>
```

## Underline Draw on Hover (CSS)

```css
.link {
  position: relative;
  text-decoration: none;
}
.link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 1px;
  background: currentColor;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.link:hover::after { width: 100%; }
```

## Magnetic Button Effect (React)

```tsx
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

function MagneticButton({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.button>
  );
}
```

## Text Reveal (clip-path)

```css
@keyframes revealText {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}

.reveal {
  animation: revealText 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards;
}
```

## Scroll Fade-In (Intersection Observer)

```js
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.15 }
);
document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
```

```css
[data-reveal] { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
[data-reveal].visible { opacity: 1; transform: none; }
```

## Easing Reference

| Name | Value | Use |
|------|-------|-----|
| Snappy | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrance animations |
| Smooth out | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| Overshoot | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful popups |
| Sharp | `cubic-bezier(0.77, 0, 0.175, 1)` | Text reveals |
