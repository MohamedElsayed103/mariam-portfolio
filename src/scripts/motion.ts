// Shared motion runtime. Import from here, never from 'gsap' directly,
// so plugins are registered once and every section agrees on easing and reduced motion.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** True when the visitor asked for reduced motion. Check before any non-essential animation. */
export const reduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** House easings. Exponential ease-out everywhere; no bounce, no elastic. */
export const EASE = {
  out: 'expo.out',
  quart: 'quart.out',
  inOut: 'power3.inOut',
} as const;

gsap.defaults({ ease: EASE.out, duration: 0.9 });

let lenis: Lenis | null = null;

/** Smooth scrolling, wired into ScrollTrigger. Called once from the Base layout. */
export function initSmoothScroll(): Lenis | null {
  if (reduced || lenis) return lenis;
  lenis = new Lenis({ duration: 1.05, anchors: { offset: -68 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/**
 * Run `fn` once the element is near the viewport. Content must already be visible in CSS:
 * this only layers an entrance on top. With reduced motion, `fn` is never called.
 */
export function whenVisible(el: Element | null, fn: () => void, start = 'top 82%'): void {
  if (!el || reduced) return;
  ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });
}

/** Split an element's text into word spans (keeps it accessible via aria-label). */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent?.trim() ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  return text.split(/\s+/).map((word, i, all) => {
    const outer = document.createElement('span');
    outer.setAttribute('aria-hidden', 'true');
    outer.style.display = 'inline-block';
    outer.style.overflow = 'clip';
    outer.style.verticalAlign = 'top';
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = word;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
    return inner;
  });
}
