---
paths:
  - "**/*.tsx"
  - "**/*.ts"
  - "**/*.css"
---
> This file extends [common/performance.md](../common/performance.md) with web-specific performance content.

# Web Performance Rules

## Core Web Vitals Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| FCP | < 1.5s *(Kanōn)* |
| TBT | < 200ms |

## Bundle Budget *(Kanōn)*

| Page Type | JS Budget (gzipped) | CSS Budget |
|-----------|---------------------|------------|
| Landing page | < 150kb | < 30kb |
| App page | < 300kb | < 50kb |
| Microsite | < 80kb | < 15kb |

## Loading Strategy

1. Inline critical above-the-fold CSS where justified
2. Preload the hero image and primary font only
3. Defer non-critical CSS or JS
4. Dynamically import heavy libraries

```js
const gsapModule = await import('gsap');
const { ScrollTrigger } = await import('gsap/ScrollTrigger');
```

## Image Optimization

- Explicit `width` and `height`
- `loading="eager"` plus `fetchpriority="high"` for hero media only
- `loading="lazy"` for below-the-fold assets
- Prefer AVIF or WebP with fallbacks
- Never ship source images far beyond rendered size

## Font Loading

- Max two font families unless there is a clear exception
- `font-display: swap`
- Subset where possible
- Preload only the truly critical weight/style

## Animation Performance

- Animate compositor-friendly properties only
- Use `will-change` narrowly and remove it when done
- Prefer CSS for simple transitions
- Use `requestAnimationFrame` or established animation libraries for JS motion
- Avoid scroll handler churn; use IntersectionObserver or well-behaved libraries

## Performance Checklist

- [ ] All images have explicit dimensions
- [ ] No accidental render-blocking resources
- [ ] No layout shifts from dynamic content
- [ ] Motion stays on compositor-friendly properties
- [ ] Third-party scripts load async/defer and only when needed

## Sources

- Core Web Vitals: Google, "Web Vitals", web.dev, https://web.dev/articles/vitals
- Performance budgets: Alex Russell, "Can You Afford It?: Real-world Web Performance Budgets", 2017, https://infrequently.org/2017/10/can-you-afford-it-real-world-web-performance-budgets/
- Critical CSS: Google, "Extract critical CSS", web.dev, https://web.dev/articles/extract-critical-css
- Preload: W3C, "Preload", https://www.w3.org/TR/preload/
- Dynamic import(): Ecma International, ECMAScript Language Specification, https://tc39.es/ecma262/
- Lazy loading and fetch priority: WHATWG, HTML Living Standard, https://html.spec.whatwg.org/multipage/
- AVIF: Alliance for Open Media, AV1 Image File Format (AVIF), https://aomediacodec.github.io/av1-avif/
- WebP: IETF, RFC 9649, 2024, https://www.rfc-editor.org/rfc/rfc9649
- font-display: W3C, "CSS Fonts Module Level 4", https://www.w3.org/TR/css-fonts-4/
- Compositor-only properties: Paul Lewis, "Stick to Compositor-Only Properties and Manage Layer Count", web.dev, 2015, https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
- will-change: W3C, "CSS Will Change Module Level 1", https://www.w3.org/TR/css-will-change-1/
- requestAnimationFrame: WHATWG, HTML Living Standard, "Animation frames", https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames
- IntersectionObserver: W3C, "Intersection Observer", https://www.w3.org/TR/intersection-observer/
- Layout shifts: Google, "Cumulative Layout Shift", web.dev, https://web.dev/articles/cls
