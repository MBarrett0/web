# WhatsApp Calendar Morph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un calendario al lado del teléfono de la simulación WhatsApp que transiciona Mes→Día, hace flash verde de los horarios libres, y recibe la tarjeta de "Turno confirmado" que se clona, vuela y se transforma en la reserva del slot 15:00.

**Architecture:** Todo vive en `src/components/WhatsAppShowcase.astro` (markup + `<script>` + `<style>`), siguiendo el patrón existente: HTML estático en estado final (para no-JS / reduced-motion), GSAP setea estados iniciales y un timeline disparado por ScrollTrigger reproduce la coreografía. El morph es un FLIP manual: clon absoluto dentro del clúster `.wa-duo`, rects medidos en runtime con `getBoundingClientRect`.

**Tech Stack:** Astro (static), GSAP 3.13 + ScrollTrigger (ya registrado en `src/lib/gsap.ts`), Playwright para tests.

## Global Constraints

- **No agregar dependencias ni registrar plugins GSAP nuevos** (no usar el plugin Flip; FLIP manual).
- **`prefers-reduced-motion`: mostrar estados finales estáticos** — calendario en vista Día con la reserva de las 15:00 ya puesta, chat completo visible, cero movimiento.
- **Copy en voseo rioplatense**, sin frases cliché; textos placeholder realistas.
- **Tokens visuales existentes**: `--line`, `--accent`, `--accent-2`, fondo `#0b141a`, superficies `#1f2c33`. Verde flash WhatsApp: `#25d366`.
- Solo tocar `src/components/WhatsAppShowcase.astro` y `tests/06-whatsapp.spec.ts`.
- El sitio se sirve bajo `/web/` (tests navegan a `/web/`).
- Tests: `npx playwright test tests/06-whatsapp.spec.ts` (levanta build+preview solo, tarda 1–4 min).
- El clon viajero es decorativo: `aria-hidden="true"`. Nunca dejar la celda 15:00 vacía si algo falla (el estado final vive en el DOM real).
- Fechas reales: **julio 2026 empieza miércoles 1; el jueves objetivo es el 9**.

---

### Task 1: Markup y estilos del calendario (estado final estático)

**Files:**
- Modify: `src/components/WhatsAppShowcase.astro` (markup + `<style>`)
- Test: `tests/06-whatsapp.spec.ts`

**Interfaces:**
- Produces (selectores que usan Tasks 2 y 3):
  - `#whatsapp .wa-duo` — clúster teléfono+calendario, `position: relative` (host del clon).
  - `#whatsapp .wa-cal-month` — pantalla Mes (absoluta, oculta por defecto).
  - `#whatsapp .wa-cal-day` — pantalla Día (visible por defecto).
  - `#whatsapp .wa-slot.free` — slots libres (×3: 10:30, 15:00, 18:30).
  - `#whatsapp .wa-slot.target` — slot 15:00; con clase `booked` muestra `.wa-booking` y oculta `.tag`.
  - `#whatsapp .wa-booking` — la reserva final ("✓ Reserva nueva").
- Consumes: nada (primera task).

- [ ] **Step 1: Escribir tests que fallan**

Reemplazar el contenido de `tests/06-whatsapp.spec.ts` por (los 2 tests existentes se conservan con selectores scoped a `.wa-chat` — el clon de Task 3 también tendrá clase `wa-msg` y no debe contaminar los locators):

```ts
import { test, expect } from '@playwright/test';

test('whatsapp: la conversación se reproduce sola al entrar en viewport', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  const last = page.locator('#whatsapp .wa-chat .wa-msg').last();
  await expect(last).toBeVisible({ timeout: 15000 });
  // Wait for animation to complete (timeline is ~5.05s, plus time for trigger to fire)
  await page.waitForTimeout(6000);
  const op = await last.evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(op).toBeGreaterThan(0.9);
});

test('whatsapp: sin JS-animación (reduced motion) todo el chat es visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  for (const msg of await page.locator('#whatsapp .wa-chat .wa-msg').all()) await expect(msg).toBeVisible();
});

test('whatsapp: el calendario existe con mes de 31 días y jueves 9 objetivo', async ({ page }) => {
  await page.goto('/web/');
  const cal = page.locator('#whatsapp .wa-cal');
  await expect(cal).toHaveCount(1);
  await expect(page.locator('#whatsapp .wa-cal-month .d')).toHaveCount(31);
  await expect(page.locator('#whatsapp .wa-cal-month .d.target')).toHaveText('9');
  await expect(page.locator('#whatsapp .wa-slot.free')).toHaveCount(3);
  await expect(page.locator('#whatsapp .wa-slot.busy')).toHaveCount(2);
});

test('whatsapp: con reduced motion el calendario muestra el día con la reserva puesta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-cal').scrollIntoViewIfNeeded();
  await expect(page.locator('#whatsapp .wa-cal-day')).toBeVisible();
  await expect(page.locator('#whatsapp .wa-booking')).toBeVisible();
  await expect(page.locator('#whatsapp .wa-cal-month')).toBeHidden();
  // el tag "libre" del slot 15:00 queda oculto cuando está reservado
  await expect(page.locator('#whatsapp .wa-slot.target .tag')).toBeHidden();
});
```

- [ ] **Step 2: Correr tests y verificar que los 2 nuevos fallan**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: los 2 tests nuevos FALLAN (`.wa-cal` count 0); los 2 existentes PASAN.

- [ ] **Step 3: Implementar markup + estilos**

En `src/components/WhatsAppShowcase.astro`:

**3a.** En el frontmatter, agregar los datos del calendario:

```astro
---
import SectionCta from './SectionCta.astro';

// Julio 2026: empieza miércoles (offset 2 celdas bajo L-M), 31 días, jueves 9 objetivo.
const monthOffset = 2;
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
const slots = [
  { time: '10:30', kind: 'free' },
  { time: '12:00', kind: 'busy', who: 'Corte — Ana' },
  { time: '15:00', kind: 'free', target: true },
  { time: '16:30', kind: 'busy', who: 'Color — Lucía' },
  { time: '18:30', kind: 'free' },
];
---
```

**3b.** Reemplazar el bloque `.wa-phone` del markup: envolver teléfono + calendario en un clúster `.wa-duo`. El `data-reveal` pasa del `.wa-phone` al `.wa-duo`:

```astro
<div class="wa-duo" data-reveal>
  <div class="wa-phone" aria-label="Demostración de una reserva por WhatsApp">
    <div class="wa-top"><span class="wa-avatar"></span><span>Estética Nova</span><span class="wa-status">en línea</span></div>
    <div class="wa-chat">
      <p class="wa-msg user">¡Hola! ¿Tenés lugar el jueves?</p>
      <p class="wa-typing" aria-hidden="true"><span></span><span></span><span></span></p>
      <p class="wa-msg bot">¡Hola! Sí — el jueves tengo <strong>10:30</strong>, <strong>15:00</strong> y <strong>18:30</strong>. ¿Cuál te queda mejor?</p>
      <p class="wa-msg user">15:00 👌</p>
      <p class="wa-typing" aria-hidden="true"><span></span><span></span><span></span></p>
      <p class="wa-msg bot card">✓ <strong>Turno confirmado</strong><br />Jueves · 15:00<br /><small>Te llega un recordatorio el miércoles.</small></p>
    </div>
  </div>
  <div class="wa-cal" aria-label="Calendario de reservas, jueves 9 seleccionado">
    <div class="wa-cal-screens">
      <div class="wa-cal-month" aria-hidden="true">
        <p class="wa-cal-title">Julio</p>
        <div class="wa-cal-grid">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => <span class="dow">{d}</span>)}
          {Array.from({ length: monthOffset }).map(() => <span class="pad"></span>)}
          {monthDays.map((d) => <span class={`d${d === 9 ? ' target' : ''}`}>{d}</span>)}
        </div>
      </div>
      <div class="wa-cal-day">
        <p class="wa-cal-title">Jueves 9 · Julio</p>
        <ul class="wa-slots">
          {slots.map((s) => (
            <li class={`wa-slot ${s.kind}${s.target ? ' target booked' : ''}`}>
              <span class="t">{s.time}</span>
              {s.kind === 'busy' && <span class="who">{s.who}</span>}
              {s.kind === 'free' && <span class="tag">libre</span>}
              {s.target && <span class="wa-booking">✓ Reserva nueva</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</div>
```

**3c.** En `<style>`, ajustar el layout y agregar los estilos del calendario. Reemplazar las reglas `.layout`, `.side` y `.wa-phone` existentes por:

```css
.layout { display: flex; gap: clamp(2rem, 5vw, 4rem); align-items: center; flex-wrap: wrap; }
.side { flex: 1 1 20rem; }
.wa-duo {
  flex: 1 1 30rem; display: flex; gap: clamp(1rem, 2.5vw, 1.8rem);
  align-items: center; justify-content: center; flex-wrap: wrap;
  position: relative; /* host del clon viajero */
}
.wa-phone {
  flex: 0 1 21rem;
  background: #0b141a; border: 1px solid var(--line); border-radius: 1.6rem;
  overflow: hidden; box-shadow: 0 30px 60px rgb(0 0 0 / 0.45);
  width: min(21rem, 100%);
}
```

Y agregar al final del `<style>`:

```css
/* Calendario */
.wa-cal {
  flex: 0 1 15.5rem; width: min(15.5rem, 100%);
  background: #0b141a; border: 1px solid var(--line); border-radius: 1.2rem;
  box-shadow: 0 30px 60px rgb(0 0 0 / 0.45);
  padding: 1rem 0.9rem 1.1rem;
}
.wa-cal-screens { position: relative; }
.wa-cal-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.7rem; }
/* Estado final por defecto (no-JS / reduced motion): Mes oculto, Día visible */
.wa-cal-month { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
.wa-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; text-align: center; font-size: 0.72rem; }
.wa-cal-grid .dow { color: #8fa6ae; font-weight: 600; padding-block: 0.15rem; }
.wa-cal-grid .d { padding-block: 0.3rem; border-radius: 0.4rem; color: #d5dee3; }
.wa-cal-grid .d.target { background: rgba(37, 211, 102, 0.16); border: 1px solid rgba(37, 211, 102, 0.45); font-weight: 700; }
.wa-slots { list-style: none; display: flex; flex-direction: column; gap: 0.45rem; padding: 0; margin: 0; }
.wa-slot {
  display: flex; align-items: center; gap: 0.55rem;
  background: #141f26; border: 1px solid var(--line); border-radius: 0.55rem;
  padding: 0.45rem 0.65rem; font-size: 0.82rem;
}
.wa-slot .t { font-weight: 600; font-variant-numeric: tabular-nums; }
.wa-slot.busy { opacity: 0.55; }
.wa-slot .who, .wa-slot .tag { color: #8fa6ae; font-size: 0.76rem; }
.wa-slot.free .tag { color: #25d366; }
.wa-booking { color: #25d366; font-weight: 600; font-size: 0.78rem; }
/* target: booked muestra la reserva, sin booked muestra "libre" */
.wa-slot.target:not(.booked) .wa-booking { display: none; }
.wa-slot.target.booked .tag { display: none; }
.wa-slot.target.booked { border-color: rgba(37, 211, 102, 0.45); }
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: 4 PASS (con JS y motion el calendario queda en estado final estático porque el script todavía no lo anima — válido).

- [ ] **Step 5: Commit**

```bash
git add src/components/WhatsAppShowcase.astro tests/06-whatsapp.spec.ts
git commit -m "feat: calendario junto al teléfono en la simulación WhatsApp"
```

---

### Task 2: Sincronizar calendario con el timeline del chat (Mes→Día + flash verde)

**Files:**
- Modify: `src/components/WhatsAppShowcase.astro` (`<script>`)
- Test: `tests/06-whatsapp.spec.ts`

**Interfaces:**
- Consumes: selectores de Task 1 (`.wa-cal-month`, `.wa-cal-day`, `.wa-slot.free`, `.wa-slot.target`).
- Produces: timeline `tl` con la coreografía completa hasta la tarjeta de confirmación (msgs[3]); función `resetSim()` que Task 3 extiende. El timeline termina ~6.4s; Task 3 agrega el morph después de msgs[3].

- [ ] **Step 1: Escribir test que falla**

Agregar a `tests/06-whatsapp.spec.ts`:

```ts
test('whatsapp: el calendario transiciona de mes a día durante la conversación', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  // Con motion, el script arranca mostrando el Mes y ocultando el Día
  const month = page.locator('#whatsapp .wa-cal-month');
  const day = page.locator('#whatsapp .wa-cal-day');
  await expect(month).toBeVisible({ timeout: 5000 });
  // La transición Mes→Día ocurre dentro del timeline
  await expect(day).toBeVisible({ timeout: 15000 });
  await expect(month).toBeHidden();
});
```

Y en el primer test ("la conversación se reproduce sola"), cambiar `waitForTimeout(6000)` por `waitForTimeout(9000)` (el timeline ahora dura más).

- [ ] **Step 2: Correr test y verificar que falla**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: el test nuevo FALLA (el Mes nunca se hace visible — el script no setea estados del calendario); el resto PASA.

- [ ] **Step 3: Implementar la sincronización**

Reemplazar el `<script>` completo de `src/components/WhatsAppShowcase.astro` por:

```ts
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';

if (!prefersReducedMotion()) {
  const msgs = gsap.utils.toArray<HTMLElement>('#whatsapp .wa-chat .wa-msg');
  const typings = gsap.utils.toArray<HTMLElement>('#whatsapp .wa-typing');
  const calMonth = document.querySelector<HTMLElement>('#whatsapp .wa-cal-month')!;
  const calDay = document.querySelector<HTMLElement>('#whatsapp .wa-cal-day')!;
  const freeSlots = gsap.utils.toArray<HTMLElement>('#whatsapp .wa-slot.free');
  const targetSlot = document.querySelector<HTMLElement>('#whatsapp .wa-slot.target')!;

  gsap.set(msgs, { autoAlpha: 0, y: 14 });
  gsap.set(typings, { autoAlpha: 0 });
  gsap.set(calMonth, { autoAlpha: 1, xPercent: 0 });
  gsap.set(calDay, { autoAlpha: 0, xPercent: 10 });

  function resetSim() {
    targetSlot.classList.remove('booked');
  }
  resetSim();

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  tl.to(msgs[0], { autoAlpha: 1, y: 0, duration: 0.45 }, 0.3)
    .to(typings[0], { autoAlpha: 1, duration: 0.2 }, '+=0.5')
    // el calendario reacciona mientras el bot "escribe"
    .to(calMonth, { xPercent: -10, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '+=0.3')
    .to(calDay, { xPercent: 0, autoAlpha: 1, duration: 0.4 }, '-=0.1')
    // flash verde escalonado de los horarios libres
    .to(freeSlots, {
      backgroundColor: 'rgba(37, 211, 102, 0.28)',
      duration: 0.22, stagger: 0.18, repeat: 1, yoyo: true,
    }, '+=0.15')
    .to(typings[0], { autoAlpha: 0, duration: 0.2 }, '+=0.3')
    .to(msgs[1], { autoAlpha: 1, y: 0, duration: 0.45 }, '<')
    .to(msgs[2], { autoAlpha: 1, y: 0, duration: 0.45 }, '+=1.0')
    .to(typings[1], { autoAlpha: 1, duration: 0.2 }, '+=0.4')
    .to(typings[1], { autoAlpha: 0, duration: 0.2 }, '+=0.9')
    .to(msgs[3], { autoAlpha: 1, y: 0, duration: 0.45 }, '<');

  ScrollTrigger.create({
    trigger: '#whatsapp .wa-phone',
    start: 'top 70%',
    onEnter: () => { resetSim(); tl.restart(); },
    onEnterBack: () => { resetSim(); tl.restart(); },
  });
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/WhatsAppShowcase.astro tests/06-whatsapp.spec.ts
git commit -m "feat: calendario sincronizado con el chat (mes→día y flash de horarios)"
```

---

### Task 3: Morph — la tarjeta de confirmación vuela y se transforma en la reserva

**Files:**
- Modify: `src/components/WhatsAppShowcase.astro` (`<script>` + `<style>`)
- Test: `tests/06-whatsapp.spec.ts`

**Interfaces:**
- Consumes: timeline `tl`, `resetSim()`, `targetSlot`, `msgs` de Task 2; host `.wa-duo` de Task 1.
- Produces: nada (task final).

- [ ] **Step 1: Escribir test que falla**

Agregar a `tests/06-whatsapp.spec.ts`:

```ts
test('whatsapp: la reserva aterriza en el slot 15:00 y el clon desaparece', async ({ page }) => {
  await page.goto('/web/');
  await page.locator('#whatsapp .wa-phone').scrollIntoViewIfNeeded();
  const booking = page.locator('#whatsapp .wa-booking');
  await expect(booking).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1500); // el clon termina de desvanecerse
  await expect(page.locator('#whatsapp .wa-fly')).toHaveCount(0);
  await expect(page.locator('#whatsapp .wa-slot.target')).toHaveClass(/booked/);
});
```

- [ ] **Step 2: Correr test y verificar que falla**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: el test nuevo FALLA (timeout: `.wa-booking` nunca se hace visible con motion — `booked` fue removido por `resetSim()` y nadie lo repone); el resto PASA.

- [ ] **Step 3: Implementar el morph**

**3a.** En el `<script>`, después de la declaración de `targetSlot`, agregar:

```ts
const duo = document.querySelector<HTMLElement>('#whatsapp .wa-duo')!;
let flyTl: gsap.core.Timeline | null = null;

function cleanupFly() {
  flyTl?.kill();
  flyTl = null;
  duo.querySelector('.wa-fly')?.remove();
}

function runMorph() {
  cleanupFly();
  const card = msgs[3];
  const from = card.getBoundingClientRect();
  const to = targetSlot.getBoundingClientRect();
  const base = duo.getBoundingClientRect();

  const clone = card.cloneNode(true) as HTMLElement;
  clone.classList.add('wa-fly');
  clone.setAttribute('aria-hidden', 'true');
  duo.appendChild(clone);
  gsap.set(clone, {
    position: 'absolute', margin: 0, zIndex: 5,
    left: from.left - base.left, top: from.top - base.top,
    width: from.width, height: from.height,
  });

  flyTl = gsap.timeline({ onComplete: cleanupFly });
  flyTl
    // trayecto + cambio de forma (FLIP manual)
    .to(clone, {
      left: to.left - base.left, top: to.top - base.top,
      width: to.width, height: to.height, borderRadius: '0.55rem',
      duration: 0.55, ease: 'power3.inOut',
    }, 0)
    // leve arco
    .to(clone, { y: -26, duration: 0.28, ease: 'power2.out' }, 0)
    .to(clone, { y: 0, duration: 0.27, ease: 'power2.in' }, 0.28)
    // aterrizaje: aparece la reserva real + flash verde, el clon se desvanece
    .add(() => targetSlot.classList.add('booked'), 0.55)
    .fromTo(targetSlot,
      { backgroundColor: 'rgba(37, 211, 102, 0.35)' },
      { backgroundColor: 'rgba(37, 211, 102, 0)', duration: 0.7, clearProps: 'backgroundColor' },
      0.55)
    .to(clone, { autoAlpha: 0, duration: 0.25 }, 0.55);
}
```

**3b.** Al final del timeline `tl` (después del `.to(msgs[3], …)`), encadenar:

```ts
    .add(() => runMorph(), '+=0.45');
```

**3c.** En `resetSim()`, limpiar también el vuelo (queda así):

```ts
function resetSim() {
  cleanupFly();
  targetSlot.classList.remove('booked');
}
```

(Nota: `resetSim` referencia `cleanupFly`, así que las declaraciones de 3a van antes de `resetSim` en el archivo — son `function` declarations, hoisting las cubre igual.)

**3d.** En `<style>`, agregar:

```css
.wa-fly { pointer-events: none; overflow: hidden; box-shadow: 0 18px 40px rgb(0 0 0 / 0.5); }
```

(El clon hereda el look de `.wa-msg.bot.card` — está clonado con esas clases, y los estilos de Astro aplican porque el clon vive dentro del mismo componente.)

**Nota de scope de Astro:** los estilos del componente son scoped (Astro agrega `data-astro-cid-*` a los elementos originales); el clon conserva esos atributos al clonarse, así que `.wa-fly` y las clases heredadas aplican sin `is:global`.

- [ ] **Step 4: Correr tests y verificar que pasan**

Run: `npx playwright test tests/06-whatsapp.spec.ts`
Expected: 6 PASS.

- [ ] **Step 5: Correr la suite completa**

Run: `npx playwright test`
Expected: todos los specs (01–12) PASAN.

- [ ] **Step 6: Commit**

```bash
git add src/components/WhatsAppShowcase.astro tests/06-whatsapp.spec.ts
git commit -m "feat: morph de la tarjeta de confirmación hacia la reserva del calendario"
```
