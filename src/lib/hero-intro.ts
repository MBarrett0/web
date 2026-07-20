import { gsap, CustomEase, prefersReducedMotion } from './gsap';

// Curva propia (no un ease de librería): arranca con impulso y "asienta"
// largo al final, sin rebote. Da la sensación de algo que se enfoca con calma.
const settle = CustomEase.create('settle', 'M0,0 C0.16,1 0.3,1 1,1');

export function heroIntro(): void {
  const hero = document.querySelector<HTMLElement>('#inicio');
  if (!hero || prefersReducedMotion()) return;

  const light = hero.querySelector<HTMLElement>('.hero-light');
  const content = hero.querySelector<HTMLElement>('.hero-content');

  // --- Entrada: la luz cruza y "revela" el titular a su paso ---
  const tl = gsap.timeline();
  tl.set(hero, { '--ready': 1 })
    .fromTo(
      '#inicio .sweep',
      { xPercent: -55, opacity: 0 },
      { xPercent: 55, opacity: 0.9, duration: 1.5, ease: 'power2.inOut' },
      0,
    )
    .to('#inicio .sweep', { opacity: 0, duration: 0.7, ease: 'power2.out' }, 1.05)
    .from('#inicio .orb', { opacity: 0, scale: 0.65, duration: 1.6, ease: 'power2.out', stagger: 0.18 }, 0)
    .to('#inicio .kicker', { opacity: 1, duration: 0.6 }, 0.25)
    .to('#inicio .rule', { scaleX: 1, duration: 0.9, ease: settle }, 0.25)
    .to(
      '#inicio .w',
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: settle, stagger: 0.075 },
      0.4,
    )
    .to('#inicio .lead', { opacity: 1, y: 0, duration: 0.9, ease: settle }, '-=0.7')
    .to('#inicio .ctas', { opacity: 1, y: 0, duration: 0.9, ease: settle }, '-=0.75')
    .from('.site-header', { yPercent: -100, duration: 0.7, ease: settle }, '-=0.9');

  // --- Ambiente permanente: la luz respira, lento y desfasado ---
  gsap.to('#inicio .orb-a', {
    xPercent: 7, yPercent: -6, scale: 1.12,
    duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true,
  });
  gsap.to('#inicio .orb-b', {
    xPercent: -9, yPercent: 7, scale: 1.09,
    duration: 12, ease: 'sine.inOut', repeat: -1, yoyo: true,
  });

  // --- Parallax de profundidad: solo en punteros finos (desktop) ---
  if (light && content && window.matchMedia('(pointer: fine)').matches) {
    const lx = gsap.quickTo(light, 'x', { duration: 1.3, ease: 'power3' });
    const ly = gsap.quickTo(light, 'y', { duration: 1.3, ease: 'power3' });
    const cx = gsap.quickTo(content, 'x', { duration: 1.6, ease: 'power3' });
    const cy = gsap.quickTo(content, 'y', { duration: 1.6, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      lx(nx * 42); ly(ny * 42); // la luz se mueve con el cursor
      cx(nx * -12); cy(ny * -12); // el texto, apenas al revés → planos
    });
  }
}
