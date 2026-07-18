import { gsap, prefersReducedMotion } from './gsap';

export function heroIntro(): void {
  if (prefersReducedMotion()) return;
  gsap
    .timeline({ defaults: { ease: 'power4.out' } })
    .from('#inicio .w', { yPercent: 115, duration: 1.1, stagger: 0.06 })
    .from('#inicio .lead, #inicio .ctas', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, '-=0.55')
    .from('.site-header', { yPercent: -100, duration: 0.6 }, '-=0.6');
}
