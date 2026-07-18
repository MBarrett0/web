# Landing de Servicios de Desarrollo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One-pager estático en Astro con simulaciones premium (GSAP + React islands + three.js) para vender servicios de desarrollo a PyMEs, desplegado en GitHub Pages.

**Architecture:** Astro `output: 'static'` genera todo como HTML/CSS; React solo como islands en 2 simulaciones (comparador antes/después y laptop 3D con React Three Fiber); GSAP + ScrollTrigger como módulo global compartido para reveals y showcases pasivos. Content Collections para caso de éxito y FAQ.

**Tech Stack:** Astro 5, React 19, GSAP 3 (ScrollTrigger), three.js + @react-three/fiber 9 + drei 10, Playwright, GitHub Pages (withastro/action).

**Spec:** `docs/superpowers/specs/2026-07-18-landing-dev-services-design.md`

## Global Constraints

- **Deploy:** GitHub Pages, repo `MBarrett0/web` → `site: 'https://mbarrett0.github.io'`, `base: '/web'` en `astro.config.mjs`. Todo link/asset debe funcionar bajo `/web/`.
- **100% responsive** (mobile-first). El 3D corre completo en todos los dispositivos con calidad adaptativa — no fallback 2D por dispositivo.
- **Nunca** estética "hecho con IA": sin blobs 3D vacíos, sin stock photos, sin SaaS genérico.
- **Sin "cells"**: nada de cajas uniformes repetidas como estructura de layout.
- **Sin cookie-cutter grids**: nada de grillas de columnas iguales para servicios/features — layouts editoriales/asimétricos.
- **Gradientes solo con propósito**, nunca de empapelado.
- **Floating glass cards: PROHIBIDO sin aprobación explícita del usuario.**
- **Copy sin clichés**, voseo rioplatense. El copy es reemplazable: vive centralizado en `src/data/copy.ts`, colecciones de contenido, o constantes marcadas al tope de cada isla.
- **Interacción pasiva**: simulaciones manejadas por scroll/hover; nunca exigir drag ni "operar" widgets.
- `prefers-reduced-motion`: estados finales estáticos. **El contenido nunca se oculta por CSS** — los estados iniciales ocultos los setea GSAP en runtime (sin JS todo es visible).
- Fallback estático prolijo solo si no hay WebGL.
- Tipografía **Satoshi** (Fontshare) self-hosteada woff2 en `src/assets/fonts/`.
- **Commits sin trailers de atribución** (regla del usuario: nada de `Co-Authored-By` ni menciones a Claude/IA en nada visible en GitHub).
- Tests Playwright corren contra el build de producción (`npm run build && npm run preview`) para validar el base path real.

---

### Task 1: Scaffold, sistema de diseño base, shell del sitio y Playwright

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `playwright.config.ts`
- Create: `src/assets/fonts/Satoshi-Variable.woff2` (descarga de Fontshare)
- Create: `src/styles/global.css`, `src/data/copy.ts`
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Create: `src/pages/index.astro`
- Test: `tests/01-shell.spec.ts`

**Interfaces:**
- Produces: tokens CSS (`--bg`, `--surface`, `--line`, `--text`, `--muted`, `--accent`, `--accent-2`, `--ok`, `--bad`, `--font`), clases globales `.container`, `.kicker`, `.btn`, `.btn-primary`, `.btn-ghost`; `copy` exportado de `src/data/copy.ts`; secciones placeholder con ids `inicio, servicios, automatizacion, whatsapp, turnos, web, caso, proceso, planes, faq, contacto` que las tareas siguientes reemplazan una a una.

- [ ] **Step 1: package.json, configs**

`package.json`:
```json
{
  "name": "web",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "playwright test"
  },
  "dependencies": {
    "astro": "^5.12.0",
    "@astrojs/react": "^4.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "gsap": "^3.13.0",
    "three": "^0.178.0",
    "@react-three/fiber": "^9.2.0",
    "@react-three/drei": "^10.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/three": "^0.178.0",
    "typescript": "^5.5.4"
  }
}
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://mbarrett0.github.io',
  base: '/web',
  integrations: [react()],
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "react" },
  "include": ["src", "tests", ".astro/types.d.ts"],
  "exclude": ["dist"]
}
```

`playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/web/',
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
```

- [ ] **Step 2: Instalar dependencias y navegador de test**

Run: `npm install && npx playwright install chromium`
Expected: instala sin errores (warnings de peer deps aceptables).

- [ ] **Step 3: Descargar Satoshi**

```bash
mkdir -p src/assets/fonts .font-tmp
curl -L "https://api.fontshare.com/v2/fonts/download/satoshi" -o .font-tmp/satoshi.zip
unzip -o .font-tmp/satoshi.zip -d .font-tmp
find .font-tmp -name "Satoshi-Variable.woff2" -exec cp {} src/assets/fonts/ \;
rm -rf .font-tmp
ls -la src/assets/fonts/
```
Expected: `Satoshi-Variable.woff2` presente (~40-80 KB). Si la estructura del zip cambió, ubicarlo con `find` y copiar el variable woff2 (no los estáticos).

- [ ] **Step 4: Estilos globales**

`src/styles/global.css`:
```css
@font-face {
  font-family: 'Satoshi';
  src: url('../assets/fonts/Satoshi-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; }
:root {
  --bg: #0a0b10; --surface: #12141d; --line: #222639;
  --text: #f2f3f8; --muted: #98a0b6;
  --accent: #8a7cff; --accent-2: #4fd1ff;
  --ok: #4ade80; --bad: #ff6b6b;
  --font: 'Satoshi', system-ui, sans-serif;
}
html { scroll-behavior: smooth; scroll-padding-top: 4.5rem; }
body {
  background: var(--bg); color: var(--text);
  font-family: var(--font); line-height: 1.55;
  -webkit-font-smoothing: antialiased; overflow-x: hidden;
}
img, svg, canvas { max-width: 100%; display: block; }
a { color: inherit; }
.container { width: min(1120px, 100% - 2.5rem); margin-inline: auto; }
section { padding-block: clamp(4rem, 10vh, 7.5rem); }
h1, h2, h3 { line-height: 1.08; font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.9rem, 4.5vw, 3rem); }
.kicker {
  color: var(--accent); font-size: 0.85rem; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
}
.section-head { max-width: 40rem; margin-bottom: clamp(2rem, 5vh, 3.5rem); }
.section-head p { color: var(--muted); margin-top: 0.8rem; }
.btn {
  display: inline-block; padding: 0.8rem 1.6rem; border-radius: 0.55rem;
  font-weight: 600; text-decoration: none;
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.btn:hover { transform: translateY(-2px); }
.btn-primary { background: var(--text); color: var(--bg); }
.btn-ghost { border: 1px solid var(--line); color: var(--text); }
.micro-cta { margin-top: 2.2rem; color: var(--muted); }
.micro-cta a { color: var(--text); font-weight: 600; text-decoration-color: var(--accent); text-underline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 5: Copy centralizado**

`src/data/copy.ts` (todo el copy editable del sitio; el usuario lo reemplaza acá):
```ts
// COPY DEL SITIO — editar acá. Voseo, sin clichés, lenguaje llano.
export const copy = {
  brand: 'NOMBRE', // placeholder de marca hasta que el usuario la defina
  hero: {
    kicker: 'Desarrollo de software para negocios reales',
    title: 'Tu negocio atiende solo, incluso cuando vos no llegás.',
    lead: 'Automatizo la atención, las reservas y los turnos de tu negocio, y creo la página que lo sostiene. Vos seguís con lo tuyo; el sistema responde por vos.',
    ctaPrimary: 'Contame tu caso',
    ctaSecondary: 'Ver cómo funciona',
  },
  services: [
    { num: '01', anchor: '#automatizacion', title: 'Automatización de servicios', line: 'Consultas respondidas, recordatorios enviados y datos cargados sin que nadie tenga que acordarse.', demo: 'Ver la diferencia' },
    { num: '02', anchor: '#whatsapp', title: 'Reservas por WhatsApp', line: 'Tus clientes reservan por donde ya te escriben. Sin apps nuevas: el turno queda agendado en la misma conversación.', demo: 'Ver una reserva real' },
    { num: '03', anchor: '#turnos', title: 'Gestión de turnos', line: 'Confirmaciones, recordatorios y cancelaciones resueltas solas, sin llamadas ni cuaderno.', demo: 'Ver la agenda en acción' },
    { num: '04', anchor: '#web', title: 'Creación de páginas web', line: 'Una web que trabaja, no que decora: pensada para que te encuentren, te entiendan y te escriban.', demo: 'Ver un sitio vivo' },
  ],
  process: {
    title: 'Cómo trabajamos',
    sub: 'Cuatro pasos, sin vueltas. En cada uno sabés qué te toca a vos y qué me toca a mí.',
    steps: [
      { t: 'Contás tu caso', you: 'Me escribís qué te está sacando tiempo.', me: 'Te respondo con qué conviene automatizar y qué no vale la pena.' },
      { t: 'Definimos el alcance', you: 'Elegís qué resolver primero.', me: 'Te paso una propuesta cerrada: qué incluye, cuánto demora y cuánto sale.' },
      { t: 'Desarrollo', you: 'Seguís trabajando normal.', me: 'Armo todo y te muestro avances para ajustar temprano.' },
      { t: 'Lanzamiento', you: 'Lo usás con clientes reales.', me: 'Quedo cerca el primer tiempo para ajustar lo que aparezca.' },
    ],
  },
  plans: {
    title: 'Tres puntos de partida',
    sub: 'Cada propuesta se cotiza según tu caso: no hay precios de lista porque no hay dos negocios iguales.',
    items: [
      { name: 'Presencia', who: 'Para el negocio que hoy no aparece en Google o depende de Instagram.', includes: ['Página web completa', 'Dominio y hosting configurados', 'Formulario de contacto que llega a tu mail', 'Textos trabajados con vos'], service: 'Creación de página web' },
      { name: 'Atención automática', who: 'Para el que pierde consultas por no llegar a responder.', includes: ['Respuestas automáticas por WhatsApp', 'Reservas dentro de la conversación', 'Recordatorios a clientes', 'Sin cambiar tu número'], service: 'Reservas por WhatsApp' },
      { name: 'Operación completa', who: 'Para el que quiere el circuito entero andando solo.', includes: ['Web + WhatsApp + agenda integrados', 'Gestión de turnos con reasignación', 'Panel simple para ver todo', 'Soporte el primer tiempo'], service: 'Automatización de servicios' },
    ],
    cta: 'Pedir propuesta',
  },
  contact: {
    title: 'Contame tu caso',
    sub: 'Sin compromiso: leés mi respuesta y decidís. Si tu caso no lo puedo resolver bien, también te lo digo.',
    email: 'matias.barretto@gmail.com',
    services: ['Creación de página web', 'Reservas por WhatsApp', 'Gestión de turnos', 'Automatización de servicios', 'Todavía no sé / un combo'],
  },
  footer: { note: 'Desarrollo de software a medida · Uruguay' },
} as const;
```

- [ ] **Step 6: Layout, Header, Footer, index**

`src/layouts/Base.astro`:
```astro
---
import '../styles/global.css';
import satoshi from '../assets/fonts/Satoshi-Variable.woff2?url';
interface Props { title: string; description: string; }
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preload" href={satoshi} as="font" type="font/woff2" crossorigin />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/components/Header.astro`:
```astro
---
import { copy } from '../data/copy';
const links = [
  ['#servicios', 'Servicios'],
  ['#caso', 'Caso real'],
  ['#planes', 'Planes'],
  ['#faq', 'FAQ'],
];
---
<header class="site-header">
  <div class="container bar">
    <a class="logo" href="#inicio">{copy.brand}<span>*</span></a>
    <nav aria-label="principal">
      {links.map(([href, label]) => <a href={href}>{label}</a>)}
    </nav>
    <a class="btn btn-primary" href="#contacto">{copy.hero.ctaPrimary}</a>
  </div>
</header>
<style>
  .site-header {
    position: fixed; inset-inline: 0; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 0.7rem; }
  .logo { font-weight: 900; font-size: 1.1rem; text-decoration: none; letter-spacing: -0.02em; }
  .logo span { color: var(--accent); }
  nav { display: flex; gap: 1.4rem; }
  nav a { text-decoration: none; color: var(--muted); font-size: 0.92rem; }
  nav a:hover { color: var(--text); }
  .btn { padding: 0.55rem 1.05rem; font-size: 0.9rem; }
  @media (max-width: 760px) { nav { display: none; } }
</style>
```

`src/components/Footer.astro`:
```astro
---
import { copy } from '../data/copy';
---
<footer>
  <div class="container row">
    <span class="logo">{copy.brand}<span class="star">*</span></span>
    <p>{copy.footer.note}</p>
  </div>
</footer>
<style>
  footer { border-top: 1px solid var(--line); padding-block: 2rem; }
  .row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center; }
  .logo { font-weight: 900; }
  .star { color: var(--accent); }
  p { color: var(--muted); font-size: 0.9rem; }
</style>
```

`src/pages/index.astro` (skeleton — las tareas 3–12 reemplazan cada placeholder):
```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---
<Base
  title="Automatización, reservas y webs para tu negocio"
  description="Automatizo la atención, las reservas por WhatsApp y los turnos de tu negocio, y creo la página web que lo sostiene."
>
  <Header />
  <main>
    <section id="inicio"></section>
    <section id="servicios"></section>
    <section id="automatizacion"></section>
    <section id="whatsapp"></section>
    <section id="turnos"></section>
    <section id="web"></section>
    <section id="caso"></section>
    <section id="proceso"></section>
    <section id="planes"></section>
    <section id="faq"></section>
    <section id="contacto"></section>
  </main>
  <Footer />
</Base>
```

- [ ] **Step 7: Test que falla**

`tests/01-shell.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const SECTIONS = ['inicio','servicios','automatizacion','whatsapp','turnos','web','caso','proceso','planes','faq','contacto'];

test('shell: carga bajo /web/ con las 11 secciones, header sticky y CTA', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/web/');
  await expect(page).toHaveTitle(/negocio/i);
  for (const id of SECTIONS) await expect(page.locator(`#${id}`)).toBeAttached();
  await expect(page.locator('header .btn-primary')).toBeVisible();
  await expect(page.locator('footer')).toBeAttached();
  expect(errors).toEqual([]);
});
```

Run: `npx playwright test tests/01-shell.spec.ts`
Expected: FAIL antes de crear los archivos del Step 6 (o si algo del scaffold está roto); PASS después. Si escribiste todo antes de correr, el test valida el conjunto — correrlo y verificar PASS.

- [ ] **Step 8: Verificar y commitear**

Run: `npx playwright test tests/01-shell.spec.ts`
Expected: `1 passed`

```bash
git add -A
git commit -m "feat: scaffold Astro + shell del sitio, tokens, Satoshi y Playwright"
```

---

### Task 2: Módulo GSAP compartido + sistema de reveals

**Files:**
- Create: `src/lib/gsap.ts`, `src/lib/reveal.ts`
- Modify: `src/pages/index.astro` (agregar script global)
- Test: `tests/02-reveal.spec.ts`

**Interfaces:**
- Produces: `import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'` — único punto de import de GSAP en TODO el proyecto (Astro scripts e islas React por igual). Atributo `data-reveal` (+ opcional `data-reveal-delay="0.2"`) en cualquier elemento lo hace aparecer con fade/slide al entrar al viewport. `document.documentElement.dataset.gsap === 'ready'` cuando el sistema inicializó.

- [ ] **Step 1: Test que falla**

`tests/02-reveal.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('gsap inicializa y marca el documento', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('html')).toHaveAttribute('data-gsap', 'ready');
});

test('con reduced motion el contenido queda visible sin animar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await expect(page.locator('html')).toHaveAttribute('data-gsap', 'ready');
  // nada debe quedar con opacity 0 (los estados ocultos solo los setea GSAP al animar)
  const hidden = await page.locator('[data-reveal]').evaluateAll(
    (els) => els.filter((el) => getComputedStyle(el).opacity === '0').length,
  );
  expect(hidden).toBe(0);
});
```

Run: `npx playwright test tests/02-reveal.spec.ts`
Expected: FAIL — `data-gsap` no existe.

- [ ] **Step 2: Implementar**

`src/lib/gsap.ts`:
```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

`src/lib/reveal.ts`:
```ts
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
```

En `src/pages/index.astro`, agregar antes de `</Base>` (después de `<Footer />`):
```astro
<script>
  import { initReveals } from '../lib/reveal';
  initReveals();
</script>
```

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/02-reveal.spec.ts`
Expected: `2 passed`

```bash
git add -A
git commit -m "feat: módulo gsap compartido y sistema de reveals por scroll"
```

---

### Task 3: Hero con reveal cinético de tipografía

**Files:**
- Create: `src/components/Hero.astro`, `src/lib/hero-intro.ts`
- Modify: `src/pages/index.astro` (reemplazar `<section id="inicio">`)
- Test: `tests/03-hero.spec.ts`

**Interfaces:**
- Consumes: `copy.hero` de `src/data/copy.ts`; `gsap`/`prefersReducedMotion` de `src/lib/gsap.ts`.
- Produces: sección `#inicio` con h1 dividido en spans `.wm > .w` (split server-side, sin SplitText), CTAs a `#contacto` y `#automatizacion`.

- [ ] **Step 1: Test que falla**

`tests/03-hero.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('hero: titular spliteado, CTAs correctos y visible tras la intro', async ({ page }) => {
  await page.goto('/web/');
  const h1 = page.locator('#inicio h1');
  await expect(h1).toBeAttached();
  expect(await page.locator('#inicio .w').count()).toBeGreaterThan(3);
  await expect(page.locator('#inicio a[href="#contacto"]')).toBeVisible();
  await expect(page.locator('#inicio a[href="#automatizacion"]')).toBeVisible();
  // tras la intro las palabras quedan en su lugar (yPercent 0)
  await page.waitForTimeout(2600);
  const y = await page.locator('#inicio .w').first().evaluate((el) => getComputedStyle(el).transform);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(y);
});
```

Run: `npx playwright test tests/03-hero.spec.ts`
Expected: FAIL — la sección está vacía.

- [ ] **Step 2: Implementar**

`src/lib/hero-intro.ts`:
```ts
import { gsap, prefersReducedMotion } from './gsap';

export function heroIntro(): void {
  if (prefersReducedMotion()) return;
  gsap
    .timeline({ defaults: { ease: 'power4.out' } })
    .from('#inicio .w', { yPercent: 115, duration: 1.1, stagger: 0.06 })
    .from('#inicio .lead, #inicio .ctas', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, '-=0.55')
    .from('.site-header', { yPercent: -100, duration: 0.6 }, '-=0.6');
}
```

`src/components/Hero.astro`:
```astro
---
import { copy } from '../data/copy';
const words = copy.hero.title.split(' ');
---
<section id="inicio" class="hero">
  <div class="container">
    <p class="kicker">{copy.hero.kicker}</p>
    <h1 aria-label={copy.hero.title}>
      {words.map((w) => (
        <span class="wm" aria-hidden="true"><span class="w">{w}</span></span>
      ))}
    </h1>
    <p class="lead">{copy.hero.lead}</p>
    <div class="ctas">
      <a class="btn btn-primary" href="#contacto">{copy.hero.ctaPrimary}</a>
      <a class="btn btn-ghost" href="#automatizacion">{copy.hero.ctaSecondary}</a>
    </div>
  </div>
  <div class="glow" aria-hidden="true"></div>
</section>
<script>
  import { heroIntro } from '../lib/hero-intro';
  heroIntro();
</script>
<style>
  .hero {
    min-height: 100svh; display: flex; align-items: center;
    position: relative; padding-top: 5rem; overflow: hidden;
  }
  h1 {
    font-size: clamp(2.5rem, 7.5vw, 5.2rem); font-weight: 800;
    max-width: 16ch; margin-top: 1.1rem;
  }
  .wm { display: inline-block; overflow: hidden; vertical-align: bottom; margin-right: 0.26em; }
  .w { display: inline-block; }
  .lead { color: var(--muted); font-size: clamp(1.05rem, 2vw, 1.25rem); max-width: 34rem; margin-top: 1.4rem; }
  .ctas { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 2.2rem; }
  .glow {
    position: absolute; inset: auto -20% -40% -20%; height: 70%;
    background: radial-gradient(ellipse at 30% 100%, rgb(138 124 255 / 0.13), transparent 60%);
    pointer-events: none;
  }
</style>
```

En `index.astro`: importar `Hero` en el frontmatter y reemplazar `<section id="inicio"></section>` por `<Hero />`.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/03-hero.spec.ts`
Expected: `1 passed`

```bash
git add -A
git commit -m "feat: hero con reveal cinético de tipografía"
```

---

### Task 4: Sección Servicios (índice editorial 01–04)

**Files:**
- Create: `src/components/Services.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/04-services.spec.ts`

**Interfaces:**
- Consumes: `copy.services`, sistema `data-reveal` de Task 2.
- Produces: sección `#servicios` con 4 filas editoriales que anclan a `#automatizacion`, `#whatsapp`, `#turnos`, `#web`.

- [ ] **Step 1: Test que falla**

`tests/04-services.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('servicios: 4 filas con anclas a sus demos', async ({ page }) => {
  await page.goto('/web/');
  const rows = page.locator('#servicios .svc');
  await expect(rows).toHaveCount(4);
  for (const anchor of ['#automatizacion', '#whatsapp', '#turnos', '#web'])
    await expect(page.locator(`#servicios a[href="${anchor}"]`)).toBeAttached();
});
```

Run: `npx playwright test tests/04-services.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/Services.astro` (filas asimétricas con indentación creciente — no grid de cards):
```astro
---
import { copy } from '../data/copy';
---
<section id="servicios">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Qué hago</p>
      <h2>Cuatro maneras de sacarte trabajo de encima</h2>
    </div>
    <ol class="list">
      {copy.services.map((s, i) => (
        <li class="svc" style={`--indent:${i}`} data-reveal data-reveal-delay={String(i * 0.08)}>
          <span class="num">{s.num}</span>
          <div class="body">
            <h3>{s.title}</h3>
            <p>{s.line}</p>
            <a href={s.anchor}>{s.demo} ↓</a>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>
<style>
  .list { list-style: none; padding: 0; }
  .svc {
    display: flex; gap: clamp(1rem, 4vw, 2.5rem); align-items: baseline;
    padding-block: clamp(1.6rem, 4vh, 2.6rem);
    border-top: 1px solid var(--line);
    margin-left: calc(var(--indent) * clamp(0rem, 3vw, 3.5rem));
  }
  .svc:last-child { border-bottom: 1px solid var(--line); }
  .num { color: var(--accent); font-weight: 700; font-size: 0.95rem; letter-spacing: 0.08em; }
  h3 { font-size: clamp(1.35rem, 3vw, 1.9rem); }
  .body p { color: var(--muted); max-width: 34rem; margin-top: 0.5rem; }
  .body a {
    display: inline-block; margin-top: 0.8rem; font-weight: 600; text-decoration: none;
    color: var(--text); border-bottom: 1px solid var(--accent);
  }
  @media (max-width: 640px) { .svc { margin-left: 0; flex-direction: column; gap: 0.4rem; } }
</style>
```

En `index.astro`: importar `Services` y reemplazar el placeholder `#servicios`.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/04-services.spec.ts` → `1 passed`

```bash
git add -A
git commit -m "feat: índice editorial de servicios"
```

---

### Task 5: Isla React — Comparador antes/después (automatización)

**Files:**
- Create: `src/components/sims/BeforeAfter.tsx`, `src/components/sims/before-after.css`
- Create: `src/components/SectionCta.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/05-before-after.spec.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `prefersReducedMotion` de `src/lib/gsap.ts`.
- Produces: `<BeforeAfter client:visible />` — sección `#automatizacion` con wrapper alto (`.ba-wrap`, 280vh) y panel sticky; los mensajes `.ba-msg` ganan la clase `ok` al avanzar el scroll. `SectionCta.astro` (props `{ question?: string }`) reutilizable por Tasks 6, 7, 8.

- [ ] **Step 1: Test que falla**

`tests/05-before-after.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('antes/después: los mensajes pasan a resueltos con el scroll', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#automatizacion').scrollIntoViewIfNeeded();
  await expect(page.locator('.ba-msg').first()).toBeVisible();
  await expect(page.locator('.ba-msg.ok')).toHaveCount(0);
  await page.evaluate(() => {
    const wrap = document.querySelector<HTMLElement>('.ba-wrap')!;
    window.scrollTo(0, wrap.offsetTop + wrap.offsetHeight - window.innerHeight);
  });
  await expect(page.locator('.ba-msg.ok')).toHaveCount(4, { timeout: 8000 });
});

test('antes/después: con reduced motion se ve el estado final', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#automatizacion').scrollIntoViewIfNeeded();
  await expect(page.locator('.ba-msg.ok')).toHaveCount(4);
});
```

Run: `npx playwright test tests/05-before-after.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/SectionCta.astro`:
```astro
---
interface Props { question?: string; }
const { question = '¿Esto le serviría a tu negocio?' } = Astro.props;
---
<p class="micro-cta" data-reveal>
  {question} <a href="#contacto">Contame tu caso →</a>
</p>
```

`src/components/sims/before-after.css`:
```css
.ba-wrap { height: 280vh; }
.ba-wrap.static { height: auto; }
.ba-panel {
  position: sticky; top: 0; min-height: 100svh;
  display: flex; flex-direction: column; justify-content: center;
  padding-block: 5.5rem 3rem;
}
.ba-titles { position: relative; min-height: 4.2em; max-width: 40rem; }
.ba-titles h2 { position: absolute; inset-inline: 0; top: 0; }
.ba-title-after { opacity: 0; visibility: hidden; }
.ba-grid { display: flex; gap: clamp(1.5rem, 5vw, 4rem); align-items: flex-start; margin-top: 1rem; flex-wrap: wrap; }
.ba-msgs { flex: 1 1 20rem; display: flex; flex-direction: column; gap: 0.8rem; }
.ba-msg {
  background: var(--surface); border: 1px solid var(--line);
  border-left: 3px solid var(--bad);
  border-radius: 0.6rem; padding: 0.9rem 1.1rem;
  transition: border-color 0.4s ease;
}
.ba-msg .from { font-weight: 700; font-size: 0.9rem; }
.ba-msg .text { color: var(--muted); font-size: 0.95rem; margin-top: 0.15rem; }
.ba-msg .badge { display: inline-block; margin-top: 0.55rem; font-size: 0.78rem; font-weight: 600; color: var(--bad); }
.ba-msg.ok { border-left-color: var(--ok); }
.ba-msg.ok .badge { color: var(--ok); }
.ba-stats { flex: 0 1 16rem; display: flex; flex-direction: column; gap: 1.6rem; }
.ba-stat .val { font-size: clamp(2.2rem, 6vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.ba-stat .lbl { color: var(--muted); font-size: 0.9rem; }
```

`src/components/sims/BeforeAfter.tsx`:
```tsx
import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import './before-after.css';

// COPY DE LA SIMULACIÓN — editable
const MSGS = [
  { from: 'Carla', text: '¿Tenés lugar para mañana a la tarde?', bad: 'Sin responder · hace 2 h', ok: 'Respondida al instante · turno confirmado' },
  { from: 'Diego', text: '¿Cuánto sale el servicio completo?', bad: 'Sin responder · hace 3 h', ok: 'Respondida al instante · precio enviado' },
  { from: 'Llamada perdida', text: 'Número desconocido, no dejó mensaje', bad: 'Perdida · sin devolución', ok: 'Derivada a WhatsApp · atendida' },
  { from: 'Romina', text: 'Necesito cancelar el turno del jueves', bad: 'Sin leer · el turno quedó bloqueado', ok: 'Cancelado y reasignado a la lista de espera' },
];

export default function BeforeAfter() {
  const root = useRef<HTMLElement>(null);
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context((self) => {
      const msgs = self.selector!('.ba-msg') as HTMLElement[];
      const badges = self.selector!('.ba-msg .badge') as HTMLElement[];
      const timeEl = self.selector!('.ba-time')[0] as HTMLElement;
      const lostEl = self.selector!('.ba-lost')[0] as HTMLElement;
      const counters = { t: 180, lost: 5 };
      const fmt = (m: number) => (m >= 60 ? `${Math.round(m / 60)} h` : m >= 1 ? `${Math.round(m)} min` : '10 s');

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.to('.ba-title-before', { autoAlpha: 0, y: -14, duration: 0.6 }, 0.15)
        .to('.ba-title-after', { autoAlpha: 1, y: 0, duration: 0.6 }, 0.25);
      msgs.forEach((el, i) => {
        const at = 0.35 + i * 0.14;
        tl.set(el, { className: 'ba-msg ok' }, at);
        tl.set(badges[i], { textContent: MSGS[i].ok }, at);
      });
      tl.to(counters, {
        t: 0.16, lost: 0, duration: 0.55, ease: 'none',
        onUpdate() {
          timeEl.textContent = fmt(counters.t);
          lostEl.textContent = String(Math.round(counters.lost));
        },
      }, 0.35);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="automatizacion" ref={root}>
      <div className={`ba-wrap${reduced ? ' static' : ''}`}>
        <div className="ba-panel">
          <div className="container">
            <p className="kicker">Automatización de servicios</p>
            <div className="ba-titles">
              <h2 className="ba-title-before">Así se ve un martes sin automatizar.</h2>
              <h2 className="ba-title-after" style={reduced ? { opacity: 1, visibility: 'visible' } : undefined}>
                El mismo martes, automatizado.
              </h2>
            </div>
            <div className="ba-grid">
              <div className="ba-msgs">
                {MSGS.map((m) => (
                  <div key={m.from + m.text} className={`ba-msg${reduced ? ' ok' : ''}`}>
                    <p className="from">{m.from}</p>
                    <p className="text">{m.text}</p>
                    <span className="badge">{reduced ? m.ok : m.bad}</span>
                  </div>
                ))}
              </div>
              <div className="ba-stats">
                <div className="ba-stat">
                  <p className="val ba-time">{reduced ? '10 s' : '3 h'}</p>
                  <p className="lbl">Tiempo de respuesta promedio</p>
                </div>
                <div className="ba-stat">
                  <p className="val ba-lost">{reduced ? '0' : '5'}</p>
                  <p className="lbl">Consultas perdidas hoy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

En `index.astro`: importar `BeforeAfter` y `SectionCta`; reemplazar el placeholder por:
```astro
<BeforeAfter client:visible={{ rootMargin: '600px' }} />
```
(El `SectionCta` para esta sección va dentro de la sección siguiente si hiciera falta; para no romper el sticky, colocarlo al inicio de `#whatsapp` en Task 6.)

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/05-before-after.spec.ts` → `2 passed`

```bash
git add -A
git commit -m "feat: simulación antes/después de automatización (isla React, scrub por scroll)"
```

---

### Task 6: Showcase — Reservas por WhatsApp

**Files:**
- Create: `src/components/WhatsAppShowcase.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/06-whatsapp.spec.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `prefersReducedMotion`; `SectionCta.astro` de Task 5.
- Produces: sección `#whatsapp` con mockup de teléfono hecho a mano; la conversación (`.wa-msg`) se reproduce sola al entrar en viewport y se reinicia al re-entrar.

- [ ] **Step 1: Test que falla**

`tests/06-whatsapp.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('whatsapp: la conversación se reproduce sola al entrar en viewport', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  const last = page.locator('#whatsapp .wa-msg').last();
  await expect(last).toBeVisible({ timeout: 15000 });
  const op = await last.evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);
});

test('whatsapp: sin JS-animación (reduced motion) todo el chat es visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  for (const msg of await page.locator('#whatsapp .wa-msg').all()) await expect(msg).toBeVisible();
});
```

Run: `npx playwright test tests/06-whatsapp.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/WhatsAppShowcase.astro`:
```astro
---
import SectionCta from './SectionCta.astro';
---
<section id="whatsapp">
  <div class="container layout">
    <div class="side">
      <div class="section-head" data-reveal>
        <p class="kicker">Reservas por WhatsApp</p>
        <h2>El turno se agenda en la misma conversación.</h2>
        <p>Tu cliente escribe como siempre. El sistema responde al instante, ofrece horarios reales y confirma. Vos no tocás nada.</p>
      </div>
      <SectionCta question="¿Tus clientes ya te escriben por WhatsApp?" />
    </div>
    <div class="wa-phone" data-reveal aria-label="Demostración de una reserva por WhatsApp">
      <div class="wa-top"><span class="wa-avatar"></span><span>Estética Nova</span><span class="wa-status">en línea</span></div>
      <div class="wa-chat">
        <p class="wa-msg user">¡Hola! ¿Tenés lugar el jueves?</p>
        <p class="wa-typing" aria-hidden="true"><span></span><span></span><span></span></p>
        <p class="wa-msg bot">¡Hola! Sí — el jueves tengo <strong>10:30</strong>, <strong>15:00</strong> y <strong>18:30</strong>. ¿Cuál te queda mejor?</p>
        <p class="wa-msg user">15:00 👌</p>
        <p class="wa-msg bot card">✓ <strong>Turno confirmado</strong><br />Jueves · 15:00<br /><small>Te llega un recordatorio el miércoles.</small></p>
      </div>
    </div>
  </div>
</section>
<script>
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

  if (!prefersReducedMotion()) {
    const msgs = gsap.utils.toArray<HTMLElement>('#whatsapp .wa-msg');
    const typing = document.querySelector<HTMLElement>('#whatsapp .wa-typing')!;
    gsap.set(msgs, { autoAlpha: 0, y: 14 });
    gsap.set(typing, { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    tl.to(msgs[0], { autoAlpha: 1, y: 0, duration: 0.45 }, 0.3)
      .to(typing, { autoAlpha: 1, duration: 0.2 }, '+=0.5')
      .to(typing, { autoAlpha: 0, duration: 0.2 }, '+=1.1')
      .to(msgs[1], { autoAlpha: 1, y: 0, duration: 0.45 }, '<')
      .to(msgs[2], { autoAlpha: 1, y: 0, duration: 0.45 }, '+=1.0')
      .to(typing, { autoAlpha: 1, duration: 0.2 }, '+=0.4')
      .to(typing, { autoAlpha: 0, duration: 0.2 }, '+=0.9')
      .to(msgs[3], { autoAlpha: 1, y: 0, duration: 0.45 }, '<');

    ScrollTrigger.create({
      trigger: '#whatsapp .wa-phone',
      start: 'top 70%',
      onEnter: () => tl.restart(),
      onEnterBack: () => tl.restart(),
    });
  }
</script>
<style>
  .layout { display: flex; gap: clamp(2rem, 6vw, 5rem); align-items: center; flex-wrap: wrap; }
  .side { flex: 1 1 22rem; }
  .wa-phone {
    flex: 0 1 21rem; margin-inline: auto;
    background: #0b141a; border: 1px solid var(--line); border-radius: 1.6rem;
    overflow: hidden; box-shadow: 0 30px 60px rgb(0 0 0 / 0.45);
    width: min(21rem, 100%);
  }
  .wa-top {
    display: flex; align-items: center; gap: 0.6rem;
    background: #1f2c33; padding: 0.8rem 1rem; font-weight: 600; font-size: 0.95rem;
  }
  .wa-avatar { width: 1.9rem; height: 1.9rem; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-2)); }
  .wa-status { margin-left: auto; font-weight: 400; font-size: 0.75rem; color: #8fa6ae; }
  .wa-chat { padding: 1.1rem 0.9rem 1.4rem; display: flex; flex-direction: column; gap: 0.6rem; min-height: 21rem; }
  .wa-msg { max-width: 85%; padding: 0.55rem 0.8rem; border-radius: 0.7rem; font-size: 0.92rem; line-height: 1.4; }
  .wa-msg.user { align-self: flex-end; background: #005c4b; border-bottom-right-radius: 0.15rem; }
  .wa-msg.bot { align-self: flex-start; background: #1f2c33; border-bottom-left-radius: 0.15rem; }
  .wa-msg.card { border: 1px solid #2a3942; }
  .wa-msg small { color: #8fa6ae; }
  .wa-typing { align-self: flex-start; background: #1f2c33; border-radius: 0.7rem; padding: 0.6rem 0.8rem; display: flex; gap: 0.25rem; }
  .wa-typing span { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: #8fa6ae; animation: blink 1.2s infinite; }
  .wa-typing span:nth-child(2) { animation-delay: 0.2s; }
  .wa-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
</style>
```

Nota: los colores del mockup imitan la UI de WhatsApp (es un mockup de producto hecho a mano, permitido por el spec; no es screenshot ni stock).

En `index.astro`: importar `WhatsAppShowcase` y reemplazar el placeholder.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/06-whatsapp.spec.ts` → `2 passed`

```bash
git add -A
git commit -m "feat: showcase de reservas por WhatsApp con conversación auto-reproducida"
```

---

### Task 7: Showcase — Gestión de turnos

**Files:**
- Create: `src/components/TurnosShowcase.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/07-turnos.spec.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `prefersReducedMotion`; `SectionCta.astro`.
- Produces: sección `#turnos` — agenda que se llena sola: chips `.tn-chip` aparecen, una se cancela (`.cancelled`) y se reasigna, toast de recordatorio.

- [ ] **Step 1: Test que falla**

`tests/07-turnos.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('turnos: la agenda se llena sola y reasigna una cancelación', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#turnos .tn-board').scrollIntoViewIfNeeded();
  await expect(page.locator('#turnos .tn-chip').last()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#turnos .tn-toast')).toBeVisible({ timeout: 15000 });
});

test('turnos: con reduced motion la agenda se ve completa', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#turnos .tn-board').scrollIntoViewIfNeeded();
  for (const chip of await page.locator('#turnos .tn-chip').all()) await expect(chip).toBeVisible();
});
```

Run: `npx playwright test tests/07-turnos.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/TurnosShowcase.astro`:
```astro
---
import SectionCta from './SectionCta.astro';
const days = [
  { d: 'Jueves', slots: [
    { h: '10:00', who: 'Carla M.', src: 'desde WhatsApp' },
    { h: '15:00', who: 'Diego P.', src: 'desde la web' },
  ]},
  { d: 'Viernes', slots: [
    { h: '11:30', who: 'Romina S.', src: 'desde WhatsApp', cancels: true, replacement: 'Lucía F. · lista de espera' },
    { h: '17:00', who: 'Martín A.', src: 'desde WhatsApp' },
  ]},
];
---
<section id="turnos">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Gestión de turnos</p>
      <h2>La agenda se ordena sola.</h2>
      <p>Cada reserva entra a la agenda al instante. Si alguien cancela, el lugar se ofrece solo a la lista de espera. Los recordatorios salen sin que nadie se acuerde.</p>
    </div>
    <div class="tn-board" data-reveal aria-label="Demostración de agenda automática">
      {days.map((day) => (
        <div class="tn-day">
          <p class="tn-dayname">{day.d}</p>
          {day.slots.map((s) => (
            <div class="tn-slot">
              <span class="tn-hour">{s.h}</span>
              <span class="tn-chip" data-cancels={s.cancels ? 'true' : undefined}>
                <strong>{s.who}</strong> <small>{s.src}</small>
              </span>
              {s.replacement && (
                <span class="tn-chip tn-replacement"><strong>{s.replacement}</strong> <small>reasignado</small></span>
              )}
            </div>
          ))}
        </div>
      ))}
      <p class="tn-toast">✓ Recordatorios de mañana enviados a 4 clientes</p>
    </div>
    <SectionCta question="¿Seguís anotando turnos a mano?" />
  </div>
</section>
<script>
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

  if (!prefersReducedMotion()) {
    const chips = gsap.utils.toArray<HTMLElement>('#turnos .tn-chip:not(.tn-replacement)');
    const cancelChip = document.querySelector<HTMLElement>('#turnos .tn-chip[data-cancels]')!;
    const replacement = document.querySelector<HTMLElement>('#turnos .tn-replacement')!;
    const toast = document.querySelector<HTMLElement>('#turnos .tn-toast')!;
    gsap.set(chips, { autoAlpha: 0, scale: 0.85, transformOrigin: 'left center' });
    gsap.set([replacement, toast], { autoAlpha: 0, y: 10 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'back.out(1.6)' } });
    tl.add(() => cancelChip.classList.remove('cancelled'), 0) // limpia el estado al hacer restart
      .to(chips, { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.55 }, 0.3)
      .add(() => cancelChip.classList.add('cancelled'), '+=0.7')
      .to(cancelChip, { autoAlpha: 0.35, duration: 0.3 }, '<')
      .to(replacement, { autoAlpha: 1, y: 0, duration: 0.5 }, '+=0.5')
      .to(toast, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '+=0.6');

    ScrollTrigger.create({
      trigger: '#turnos .tn-board',
      start: 'top 70%',
      onEnter: () => tl.restart(),
      onEnterBack: () => tl.restart(),
    });
  }
</script>
<style>
  .tn-board {
    background: var(--surface); border: 1px solid var(--line); border-radius: 0.9rem;
    padding: clamp(1.2rem, 3vw, 2rem); max-width: 46rem;
  }
  .tn-day + .tn-day { margin-top: 1.2rem; }
  .tn-dayname { font-weight: 700; margin-bottom: 0.5rem; }
  .tn-slot { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; padding-block: 0.45rem; border-top: 1px dashed var(--line); }
  .tn-hour { color: var(--muted); font-size: 0.85rem; min-width: 3.2rem; }
  .tn-chip {
    background: rgb(138 124 255 / 0.12); border: 1px solid rgb(138 124 255 / 0.4);
    border-radius: 2rem; padding: 0.3rem 0.85rem; font-size: 0.88rem;
  }
  .tn-chip small { color: var(--muted); margin-left: 0.3rem; }
  .tn-chip.cancelled { text-decoration: line-through; border-color: var(--bad); background: rgb(255 107 107 / 0.1); }
  .tn-replacement { background: rgb(74 222 128 / 0.1); border-color: rgb(74 222 128 / 0.45); }
  .tn-toast {
    margin-top: 1.3rem; display: inline-block; background: rgb(74 222 128 / 0.1);
    border: 1px solid rgb(74 222 128 / 0.4); color: var(--ok);
    border-radius: 0.55rem; padding: 0.5rem 0.9rem; font-size: 0.88rem; font-weight: 600;
  }
</style>
```

En `index.astro`: importar `TurnosShowcase` y reemplazar el placeholder.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/07-turnos.spec.ts` → `2 passed`

```bash
git add -A
git commit -m "feat: showcase de gestión de turnos con agenda auto-organizada"
```

---

### Task 8: Isla React — Laptop 3D (creación de páginas web)

**Files:**
- Create: `src/components/sims/Laptop3D.tsx`, `src/components/sims/laptop3d.css`
- Modify: `src/pages/index.astro`
- Test: `tests/08-laptop3d.spec.ts`

**Interfaces:**
- Consumes: three/@react-three/fiber/@react-three/drei; `SectionCta.astro`.
- Produces: sección `#web` con `<Laptop3D client:only="react" />` — canvas WebGL con laptop 3D construida de primitivas (sin GLTF externo), mini-sitio vivo vía `<Html transform>`, parallax por mouse (desktop) y por scroll (touch), DPR clamp + `PerformanceMonitor`, `frameloop` pausado fuera de viewport, fallback CSS si no hay WebGL.

- [ ] **Step 1: Test que falla**

`tests/08-laptop3d.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('laptop 3d: el canvas WebGL monta al llegar a la sección', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#web').scrollIntoViewIfNeeded();
  await expect(page.locator('#web canvas')).toBeVisible({ timeout: 20000 });
});

test('laptop 3d: sin WebGL se muestra el fallback estático', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error override para el test
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (String(type).startsWith('webgl')) return null;
      return orig.call(this, type, ...args);
    };
  });
  await page.goto('/web/');
  await page.locator('#web').scrollIntoViewIfNeeded();
  await expect(page.locator('#web .l3d-fallback')).toBeVisible({ timeout: 15000 });
});
```

Run: `npx playwright test tests/08-laptop3d.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/sims/laptop3d.css`:
```css
.l3d-section { overflow: hidden; }
.l3d-layout { display: flex; gap: clamp(2rem, 5vw, 4rem); align-items: center; flex-wrap: wrap; }
.l3d-side { flex: 1 1 22rem; }
.l3d-stage { flex: 1 1 24rem; height: min(60vh, 30rem); min-height: 20rem; position: relative; }
.l3d-mini { width: 340px; background: #0d0f17; border-radius: 6px; overflow: hidden; font-family: var(--font); }
.l3d-mini .m-nav { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #1d2133; font-size: 11px; font-weight: 700; }
.l3d-mini .m-nav i { width: 44px; height: 14px; border-radius: 3px; background: #f2f3f8; }
.l3d-mini .m-hero { padding: 22px 14px; }
.l3d-mini .m-hero b { display: block; font-size: 17px; line-height: 1.15; color: #f2f3f8; letter-spacing: -0.02em; }
.l3d-mini .m-hero p { font-size: 10px; color: #98a0b6; margin-top: 6px; max-width: 26ch; }
.l3d-mini .m-cta { display: inline-block; margin-top: 10px; background: #8a7cff; color: #0d0f17; font-size: 10px; font-weight: 700; padding: 5px 10px; border-radius: 4px; }
.l3d-mini .m-rows { padding: 0 14px 16px; }
.l3d-mini .m-row { height: 9px; border-radius: 2px; background: #1d2133; margin-top: 7px; }
.l3d-mini .m-row:nth-child(2) { width: 78%; }
.l3d-mini .m-row:nth-child(3) { width: 56%; }
.l3d-fallback {
  width: min(30rem, 100%); margin-inline: auto; transform: perspective(1100px) rotateX(8deg) rotateY(-10deg);
  border-radius: 10px; border: 1px solid var(--line); box-shadow: 0 40px 80px rgb(0 0 0 / 0.5);
}
.l3d-fallback .l3d-mini { width: 100%; }
```

`src/components/sims/Laptop3D.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Html, ContactShadows, PerformanceMonitor } from '@react-three/drei';
import type { Group } from 'three';
import './laptop3d.css';

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function MiniSite() {
  return (
    <div className="l3d-mini">
      <div className="m-nav"><span>TU&nbsp;NEGOCIO</span><i /></div>
      <div className="m-hero">
        <b>Reservá tu turno<br />en un minuto.</b>
        <p>Atención de martes a sábado. Confirmación inmediata por WhatsApp.</p>
        <span className="m-cta">Reservar ahora</span>
      </div>
      <div className="m-rows"><div className="m-row" /><div className="m-row" /><div className="m-row" /></div>
    </div>
  );
}

function LaptopModel() {
  const g = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) {
      const onMove = (e: PointerEvent) => {
        target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.55;
        target.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
      };
      window.addEventListener('pointermove', onMove);
      return () => window.removeEventListener('pointermove', onMove);
    }
    const onScroll = () => {
      const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      target.current.x = (p - 0.5) * 0.5;
      target.current.y = 0.05;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((_, dt) => {
    if (!g.current) return;
    const k = Math.min(dt * 3.5, 1);
    g.current.rotation.y += (target.current.x - g.current.rotation.y) * k;
    g.current.rotation.x += (target.current.y - g.current.rotation.x) * k;
  });

  return (
    <group ref={g} position={[0, -0.35, 0]}>
      {/* base */}
      <RoundedBox args={[3.3, 0.12, 2.2]} radius={0.05} position={[0, 0, 0.35]}>
        <meshStandardMaterial color="#161927" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      {/* tapa con pantalla, pivote en el borde trasero de la base */}
      <group position={[0, 0.06, -0.72]} rotation={[-0.32, 0, 0]}>
        <RoundedBox args={[3.3, 2.1, 0.09]} radius={0.05} position={[0, 1.05, 0]}>
          <meshStandardMaterial color="#161927" metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <Html transform position={[0, 1.05, 0.055]} distanceFactor={1.35} style={{ pointerEvents: 'none' }}>
          <MiniSite />
        </Html>
      </group>
    </group>
  );
}

export default function Laptop3D() {
  const [webgl] = useState(supportsWebGL);
  const [active, setActive] = useState(false);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 2));
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stage.current) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '150px' });
    io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  return (
    <section id="web" className="l3d-section">
      <div className="container l3d-layout">
        <div className="l3d-side">
          <p className="kicker">Creación de páginas web</p>
          <h2>Una web que trabaja, no que decora.</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.8rem', maxWidth: '32rem' }}>
            Rápida, clara y pensada para que el que entra te escriba. Como esta que estás mirando — movete y fijate cómo responde.
          </p>
          <p className="micro-cta">
            ¿Tu negocio todavía no tiene web (o tiene una que no ayuda)?{' '}
            <a href="#contacto">Contame tu caso →</a>
          </p>
        </div>
        <div ref={stage} className="l3d-stage">
          {webgl ? (
            <Canvas frameloop={active ? 'always' : 'never'} dpr={dpr} camera={{ position: [0, 0.7, 4.2], fov: 35 }}>
              <PerformanceMonitor onDecline={() => setDpr(1)}>
                <ambientLight intensity={0.75} />
                <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
                <LaptopModel />
                <ContactShadows position={[0, -0.42, 0.3]} opacity={0.45} blur={2.4} far={2.5} resolution={256} />
              </PerformanceMonitor>
            </Canvas>
          ) : (
            <div className="l3d-fallback"><MiniSite /></div>
          )}
        </div>
      </div>
    </section>
  );
}
```

En `index.astro`: importar `Laptop3D` y reemplazar el placeholder por:
```astro
<Laptop3D client:only="react" />
```

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/08-laptop3d.spec.ts` → `2 passed`
Además verificar a ojo en `npm run dev`: la laptop se ve bien encuadrada; si la tapa/pantalla quedan desalineadas, ajustar `position`/`rotation`/`distanceFactor` hasta que el mini-sitio llene la pantalla de la laptop.

```bash
git add -A
git commit -m "feat: laptop 3D con mini-sitio vivo, parallax y fallback sin WebGL"
```

---

### Task 9: Content Collections + Caso de éxito

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/cases/proteccion-choferes.md`
- Create: `src/components/CaseStudy.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/09-case.spec.ts`

**Interfaces:**
- Produces: colecciones `cases` (schema: `title, url, sector, summary, results: string[]`) y `faq` (schema: `question, order`) — la colección `faq` la consume Task 11. Sección `#caso` renderiza todas las entradas de `cases` (hoy: una).

- [ ] **Step 1: Test que falla**

`tests/09-case.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('caso: muestra Protección Choferes con link al sitio real', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('#caso')).toContainText('Protección Choferes');
  const link = page.locator('#caso a[href="https://proteccionchoferes.org.uy"]');
  await expect(link).toBeAttached();
  await expect(link).toHaveAttribute('rel', /noopener/);
});
```

Run: `npx playwright test tests/09-case.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/content.config.ts`:
```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    sector: z.string(),
    summary: z.string(),
    results: z.array(z.string()),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({ question: z.string(), order: z.number() }),
});

export const collections = { cases, faq };
```

`src/content/cases/proteccion-choferes.md` (COPY editable — el usuario ajusta los datos reales del proyecto):
```md
---
title: Protección Choferes
url: https://proteccionchoferes.org.uy
sector: Asociación de choferes · Uruguay
summary: Sitio institucional propio para una asociación que atiende consultas de socios todos los días.
results:
  - Presencia online propia, sin depender de redes
  - La información que antes se repetía por teléfono ahora está publicada
  - Las consultas llegan ordenadas y con contexto
---

La asociación necesitaba un lugar propio donde sus socios encontraran la información
sin llamar por teléfono. Se armó un sitio claro, rápido y fácil de mantener, pensado
para gente que lo consulta desde el celular.
```

`src/components/CaseStudy.astro`:
```astro
---
import { getCollection, render } from 'astro:content';
const cases = await Promise.all(
  (await getCollection('cases')).map(async (c) => ({ data: c.data, Content: (await render(c)).Content })),
);
---
<section id="caso">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Caso real</p>
      <h2>Hecho y funcionando.</h2>
    </div>
    {cases.map(({ data, Content }) => (
      <article class="case" data-reveal>
        <p class="sector">{data.sector}</p>
        <h3>{data.title}</h3>
        <p class="summary">{data.summary}</p>
        <div class="body"><Content /></div>
        <ul class="results">
          {data.results.map((r) => <li>{r}</li>)}
        </ul>
        <a class="btn btn-ghost" href={data.url} target="_blank" rel="noopener noreferrer">
          Ver el sitio en vivo →
        </a>
      </article>
    ))}
  </div>
</section>
<style>
  .case { border-left: 3px solid var(--accent); padding-left: clamp(1.2rem, 4vw, 2.5rem); max-width: 44rem; }
  .sector { color: var(--muted); font-size: 0.88rem; }
  h3 { font-size: clamp(1.5rem, 3.5vw, 2.2rem); margin-top: 0.3rem; }
  .summary { margin-top: 0.7rem; font-size: 1.05rem; }
  .body { color: var(--muted); margin-top: 0.8rem; }
  .results { margin: 1.2rem 0 1.6rem; padding: 0; list-style: none; }
  .results li { padding-left: 1.4rem; position: relative; margin-top: 0.45rem; color: var(--text); }
  .results li::before { content: '✓'; position: absolute; left: 0; color: var(--ok); font-weight: 700; }
</style>
```

En `index.astro`: importar `CaseStudy` y reemplazar el placeholder.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/09-case.spec.ts` → `1 passed`

```bash
git add -A
git commit -m "feat: content collections y sección de caso de éxito"
```

---

### Task 10: Secciones Proceso y Planes

**Files:**
- Create: `src/components/Process.astro`, `src/components/Plans.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/10-process-plans.spec.ts`

**Interfaces:**
- Consumes: `copy.process`, `copy.plans`.
- Produces: `#proceso` (4 pasos con "Vos / Yo"); `#planes` con CTAs `a[data-plan]` cuyo valor es `copy.plans.items[i].service` — **debe coincidir exactamente** con una opción de `copy.contact.services` (lo consume Task 12 para precargar el formulario).

- [ ] **Step 1: Test que falla**

`tests/10-process-plans.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('proceso: 4 pasos con qué hace cada parte', async ({ page }) => {
  await page.goto('/web/');
  await expect(page.locator('#proceso .step')).toHaveCount(4);
  await expect(page.locator('#proceso .step').first()).toContainText('Vos');
});

test('planes: 3 planes sin montos, con CTA data-plan válido', async ({ page }) => {
  await page.goto('/web/');
  const plans = page.locator('#planes .plan');
  await expect(plans).toHaveCount(3);
  await expect(page.locator('#planes')).not.toContainText('$');
  const dataPlans = await page.locator('#planes a[data-plan]').evaluateAll(
    (as) => as.map((a) => a.getAttribute('data-plan')),
  );
  expect(dataPlans).toHaveLength(3);
  dataPlans.forEach((p) => expect(p).toBeTruthy());
});
```

Run: `npx playwright test tests/10-process-plans.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/Process.astro`:
```astro
---
import { copy } from '../data/copy';
---
<section id="proceso">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Proceso</p>
      <h2>{copy.process.title}</h2>
      <p>{copy.process.sub}</p>
    </div>
    <ol class="steps">
      {copy.process.steps.map((s, i) => (
        <li class="step" data-reveal data-reveal-delay={String(i * 0.08)}>
          <span class="n">{i + 1}</span>
          <div>
            <h3>{s.t}</h3>
            <p><strong>Vos:</strong> {s.you}</p>
            <p><strong>Yo:</strong> {s.me}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>
<style>
  .steps { list-style: none; padding: 0; position: relative; max-width: 40rem; }
  .steps::before {
    content: ''; position: absolute; left: 1.05rem; top: 1rem; bottom: 1rem;
    width: 1px; background: var(--line);
  }
  .step { display: flex; gap: 1.4rem; padding-block: 1.2rem; position: relative; }
  .n {
    flex: none; width: 2.1rem; height: 2.1rem; border-radius: 50%;
    background: var(--surface); border: 1px solid var(--accent);
    display: grid; place-items: center; font-weight: 700; font-size: 0.9rem; z-index: 1;
  }
  h3 { font-size: 1.2rem; margin-bottom: 0.4rem; }
  .step p { color: var(--muted); font-size: 0.95rem; margin-top: 0.2rem; }
  .step strong { color: var(--text); font-weight: 600; }
</style>
```

`src/components/Plans.astro` (filas diferenciadas, no cards iguales):
```astro
---
import { copy } from '../data/copy';
---
<section id="planes">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Planes</p>
      <h2>{copy.plans.title}</h2>
      <p>{copy.plans.sub}</p>
    </div>
    <div class="rows">
      {copy.plans.items.map((p, i) => (
        <article class="plan" style={`--i:${i}`} data-reveal>
          <div class="head">
            <h3>{p.name}</h3>
            <p class="who">{p.who}</p>
          </div>
          <ul>
            {p.includes.map((inc) => <li>{inc}</li>)}
          </ul>
          <a class="btn btn-ghost" href="#contacto" data-plan={p.service}>{copy.plans.cta}</a>
        </article>
      ))}
    </div>
  </div>
</section>
<style>
  .rows { display: flex; flex-direction: column; }
  .plan {
    display: flex; flex-wrap: wrap; gap: 1rem 3rem; align-items: flex-start;
    border-top: 1px solid var(--line); padding-block: clamp(1.6rem, 4vh, 2.4rem);
    margin-left: calc(var(--i) * clamp(0rem, 2.5vw, 2.8rem));
  }
  .plan:last-child { border-bottom: 1px solid var(--line); }
  .head { flex: 1 1 16rem; }
  h3 { font-size: clamp(1.4rem, 3vw, 1.8rem); }
  .who { color: var(--muted); margin-top: 0.4rem; max-width: 26rem; }
  ul { flex: 1 1 16rem; list-style: none; padding: 0; margin: 0; }
  li { padding-left: 1.3rem; position: relative; margin-top: 0.4rem; color: var(--muted); font-size: 0.95rem; }
  li::before { content: '—'; position: absolute; left: 0; color: var(--accent); }
  .btn { align-self: center; }
  @media (max-width: 640px) { .plan { margin-left: 0; } }
</style>
```

En `index.astro`: importar ambos y reemplazar los placeholders `#proceso` y `#planes`.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/10-process-plans.spec.ts` → `2 passed`

```bash
git add -A
git commit -m "feat: secciones de proceso y planes sin precios"
```

---

### Task 11: FAQ (colección + acordeón)

**Files:**
- Create: `src/content/faq/01-tecnologia.md` … `06-arranque.md` (6 archivos)
- Create: `src/components/FAQ.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/11-faq.spec.ts`

**Interfaces:**
- Consumes: colección `faq` definida en Task 9 (`question`, `order`).
- Produces: sección `#faq` con `<details class="qa">` por entrada, ordenadas por `order`.

- [ ] **Step 1: Test que falla**

`tests/11-faq.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('faq: 6 preguntas expandibles', async ({ page }) => {
  await page.goto('/web/');
  const qas = page.locator('#faq details.qa');
  await expect(qas).toHaveCount(6);
  const first = qas.first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
});
```

Run: `npx playwright test tests/11-faq.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

Crear los 6 archivos en `src/content/faq/` (COPY editable):

`01-tecnologia.md`:
```md
---
question: ¿Necesito saber de tecnología?
order: 1
---
No. Mi trabajo es justamente que no tengas que aprender nada nuevo: vos me contás cómo trabaja tu negocio y yo me encargo de la parte técnica. Todo lo que uses queda explicado en tu idioma.
```

`02-demora.md`:
```md
---
question: ¿Cuánto demora?
order: 2
---
Depende del alcance, pero siempre te doy una fecha antes de empezar. Una web suele estar lista en semanas, no meses. Las automatizaciones se entregan por partes para que veas resultados rápido.
```

`03-roturas.md`:
```md
---
question: ¿Qué pasa si algo se rompe?
order: 3
---
Después del lanzamiento quedo cerca el primer tiempo, y los problemas se corrigen sin costo si son de lo que se entregó. Además todo queda armado para avisarme si algo falla antes de que lo notes.
```

`04-whatsapp.md`:
```md
---
question: ¿Las respuestas automáticas usan mi mismo WhatsApp?
order: 4
---
Sí, se trabaja sobre tu número. Tus clientes no notan diferencia: escriben a donde siempre escribieron, solo que ahora reciben respuesta al instante.
```

`05-chico.md`:
```md
---
question: ¿Puedo empezar con algo chico?
order: 5
---
Es lo que más recomiendo. Resolvemos primero lo que más tiempo te saca, lo ves funcionando, y recién después decidís si querés sumar el resto.
```

`06-arranque.md`:
```md
---
question: ¿Qué necesitás de mí para arrancar?
order: 6
---
Una charla donde me cuentes cómo trabajás hoy: cómo te llegan los clientes, qué respondés siempre igual, dónde se te pierde tiempo. Con eso ya puedo proponerte por dónde empezar.
```

`src/components/FAQ.astro`:
```astro
---
import { getCollection, render } from 'astro:content';
const entries = await Promise.all(
  (await getCollection('faq'))
    .sort((a, b) => a.data.order - b.data.order)
    .map(async (e) => ({ data: e.data, Content: (await render(e)).Content })),
);
---
<section id="faq">
  <div class="container">
    <div class="section-head" data-reveal>
      <p class="kicker">Preguntas frecuentes</p>
      <h2>Lo que casi todos preguntan antes de empezar</h2>
    </div>
    <div class="qas">
      {entries.map(({ data, Content }) => (
        <details class="qa" data-reveal>
          <summary>{data.question}</summary>
          <div class="answer"><Content /></div>
        </details>
      ))}
    </div>
  </div>
</section>
<style>
  .qas { max-width: 44rem; }
  .qa { border-top: 1px solid var(--line); }
  .qa:last-child { border-bottom: 1px solid var(--line); }
  summary {
    cursor: pointer; list-style: none; font-weight: 600; font-size: 1.05rem;
    padding-block: 1.1rem; position: relative; padding-right: 2rem;
  }
  summary::-webkit-details-marker { display: none; }
  summary::after {
    content: '+'; position: absolute; right: 0.2rem; top: 50%;
    transform: translateY(-50%); color: var(--accent); font-size: 1.4rem; font-weight: 400;
  }
  details[open] summary::after { content: '–'; }
  .answer { color: var(--muted); padding-bottom: 1.2rem; max-width: 40rem; }
</style>
```

En `index.astro`: importar `FAQ` y reemplazar el placeholder.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/11-faq.spec.ts` → `1 passed`

```bash
git add -A
git commit -m "feat: FAQ con colección de contenido y acordeón nativo"
```

---

### Task 12: Formulario de contacto (Web3Forms) + precarga de plan

**Files:**
- Create: `src/components/Contact.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/12-contact.spec.ts`

**Interfaces:**
- Consumes: `copy.contact`; los `a[data-plan]` de Task 10.
- Produces: sección `#contacto` con `form#contact-form` (campos `name`, `business`, `service` select, `message`, honeypot `botcheck`), estados `sending/ok/error` en `#form-status`, y precarga del select al clickear un CTA de plan.

- [ ] **Step 1: Test que falla**

`tests/12-contact.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('contacto: validación nativa bloquea el envío vacío', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#contacto button[type=submit]').click();
  await expect(page.locator('#contact-form input[name=name]:invalid')).toBeAttached();
});

test('contacto: el CTA de un plan precarga el servicio', async ({ page }) => {
  await page.goto('/web/');
  const planLink = page.locator('#planes a[data-plan]').first();
  const planValue = await planLink.getAttribute('data-plan');
  await planLink.click();
  await expect(page.locator('#contact-form select[name=service]')).toHaveValue(planValue!);
});

test('contacto: error de red muestra mensaje sin perder lo tipeado', async ({ page }) => {
  await page.route('**/api.web3forms.com/**', (r) => r.abort());
  await page.goto('/web/');
  await page.fill('#contact-form input[name=name]', 'Ana');
  await page.fill('#contact-form input[name=business]', 'Peluquería Test');
  await page.selectOption('#contact-form select[name=service]', { index: 1 });
  await page.fill('#contact-form textarea[name=message]', 'Quiero automatizar mis reservas.');
  await page.locator('#contacto button[type=submit]').click();
  await expect(page.locator('#form-status')).toContainText(/no se pudo/i, { timeout: 10000 });
  await expect(page.locator('#contact-form input[name=name]')).toHaveValue('Ana');
});
```

Run: `npx playwright test tests/12-contact.spec.ts` → FAIL.

- [ ] **Step 2: Implementar**

`src/components/Contact.astro`:
```astro
---
import { copy } from '../data/copy';
---
<section id="contacto">
  <div class="container layout">
    <div class="side" data-reveal>
      <p class="kicker">Contacto</p>
      <h2>{copy.contact.title}</h2>
      <p class="sub">{copy.contact.sub}</p>
      <p class="alt">
        Si preferís el mail directo:
        <a href={`mailto:${copy.contact.email}`}>{copy.contact.email}</a>
      </p>
    </div>
    <form id="contact-form" data-reveal novalidate={false}>
      <label>Tu nombre
        <input name="name" type="text" required minlength="2" autocomplete="name" />
      </label>
      <label>Tu negocio o rubro
        <input name="business" type="text" required minlength="2" />
      </label>
      <label>¿Qué necesitás?
        <select name="service" required>
          <option value="" disabled selected>Elegí una opción</option>
          {copy.contact.services.map((s) => <option value={s}>{s}</option>)}
        </select>
      </label>
      <label>Contame un poco más
        <textarea name="message" rows="4" required minlength="10"></textarea>
      </label>
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" />
      <button class="btn btn-primary" type="submit">Enviar</button>
      <p id="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
<script>
  // Reemplazar por tu access key de https://web3forms.com (gratis) antes de publicar.
  const WEB3FORMS_ACCESS_KEY = 'REEMPLAZAR_CON_TU_ACCESS_KEY';

  const form = document.querySelector<HTMLFormElement>('#contact-form')!;
  const status = document.querySelector<HTMLElement>('#form-status')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    submitBtn.disabled = true;
    status.textContent = 'Enviando…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'Nueva consulta desde la web',
          ...Object.fromEntries(new FormData(form)),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? 'error');
      status.textContent = '✓ Recibido. Te respondo dentro del día.';
      form.reset();
    } catch {
      status.textContent = 'No se pudo enviar. Probá de nuevo en un rato o escribime directo por mail (acá abajo no se borró nada de lo que escribiste).';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Precarga del servicio desde los CTAs de planes
  document.querySelectorAll<HTMLAnchorElement>('a[data-plan]').forEach((a) => {
    a.addEventListener('click', () => {
      const sel = form.elements.namedItem('service') as HTMLSelectElement;
      sel.value = a.dataset.plan ?? '';
    });
  });
</script>
<style>
  .layout { display: flex; gap: clamp(2rem, 6vw, 5rem); flex-wrap: wrap; }
  .side { flex: 1 1 20rem; }
  .sub { color: var(--muted); margin-top: 0.8rem; max-width: 28rem; }
  .alt { margin-top: 1.6rem; color: var(--muted); font-size: 0.95rem; }
  .alt a { color: var(--text); text-decoration-color: var(--accent); text-underline-offset: 4px; }
  form { flex: 1 1 24rem; display: flex; flex-direction: column; gap: 1rem; max-width: 30rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.92rem; font-weight: 600; }
  input, select, textarea {
    background: var(--surface); border: 1px solid var(--line); border-radius: 0.55rem;
    color: var(--text); padding: 0.7rem 0.9rem; font: inherit; font-weight: 400;
  }
  input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent;
  }
  .hp { position: absolute; left: -9999px; }
  button { margin-top: 0.4rem; align-self: flex-start; }
  button:disabled { opacity: 0.6; transform: none; }
  #form-status { color: var(--muted); min-height: 1.4em; font-size: 0.95rem; }
</style>
```

En `index.astro`: importar `Contact` y reemplazar el último placeholder. Con esto `index.astro` ya no tiene secciones vacías.

- [ ] **Step 3: Verificar y commitear**

Run: `npx playwright test tests/12-contact.spec.ts` → `3 passed`

```bash
git add -A
git commit -m "feat: formulario de contacto con Web3Forms y precarga de plan"
```

---

### Task 13: CI/CD a GitHub Pages, suite completa y push

**Files:**
- Create: `.github/workflows/deploy.yml`
- Test: suite completa `npx playwright test`

**Interfaces:**
- Consumes: todo lo anterior; remote `origin` ya configurado a `https://github.com/MBarrett0/web.git`.

- [ ] **Step 1: Correr la suite completa**

Run: `npx playwright test`
Expected: todos los specs (01–12) en verde. Si algo falla, arreglarlo antes de seguir.

- [ ] **Step 2: Verificación responsive manual**

Con `npm run dev`, revisar a 360, 768, 1024 y 1440 px de ancho: sin scroll horizontal, hero legible, laptop 3D encuadrada, formulario usable. Ajustar CSS si algo desborda.

- [ ] **Step 3: Workflow de deploy**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy a GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build
        uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Commit y push**

```bash
git add -A
git commit -m "ci: deploy automático a GitHub Pages"
git push -u origin main
```
Si el push falla por autenticación, pedirle al usuario que corra `gh auth login` (o configure credenciales) y reintentar.

- [ ] **Step 5: Habilitar Pages y verificar**

Manual (usuario o via gh): en el repo → Settings → Pages → Source: **GitHub Actions**. También se puede via CLI:
```bash
gh api repos/MBarrett0/web/pages -X POST -f build_type=workflow 2>/dev/null || echo "Pages ya habilitado o habilitarlo manualmente"
gh run watch
```
Expected: workflow verde y sitio accesible en `https://mbarrett0.github.io/web/`.

- [ ] **Step 6: Recordatorios finales al usuario**

Reportar al usuario los dos pendientes que quedan en sus manos:
1. Crear la access key gratis en https://web3forms.com con su mail y reemplazar `REEMPLAZAR_CON_TU_ACCESS_KEY` en `src/components/Contact.astro`.
2. Todo el copy es editable en `src/data/copy.ts`, `src/content/` y las constantes marcadas al tope de `BeforeAfter.tsx`.
