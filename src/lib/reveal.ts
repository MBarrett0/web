import { gsap, prefersReducedMotion } from './gsap';

export function initReveals(): void {
  document.documentElement.dataset.gsap = 'ready';
  if (prefersReducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 28,
      autoAlpha: 0,
      duration: 0.9,
      delay: Number(el.dataset.revealDelay ?? 0),
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}
