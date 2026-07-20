# Rediseño del Hero — "La luz escribe el titular"

**Fecha:** 2026-07-20
**Componente:** `src/components/Hero.astro` + `src/lib/hero-intro.ts`
**Objetivo:** Que la primera sección dé sensación de calidad premium, fluida y no
genérica ("no hecho por IA"), con un titular grande que aparece de forma
sofisticada sobre un fondo vivo. Debe funcionar igual de bien en todo display.

## Concepto

El fondo vivo y el titular son **un solo sistema**: una fuente de luz que habita
el fondo es la que *revela* el titular a su paso. Se evita el patrón genérico de
"texto que sube + gradiente detrás".

## Reveal de entrada (una sola vez, ~1.6s)

1. Escena arranca casi negra.
2. Una luz suave (violeta/cian de marca) cruza despacio.
3. A su paso, el titular se revela **por línea**: máscara + micro-desenfoque que
   se aclara (`blur 10px → 0`) + desplazamiento mínimo (~6-8px). Efecto "enfoque
   de lente", no fade ni slide de plantilla.
4. Easing: `cubic-bezier` custom (no `power4` de librería), lento al final.
5. Después: kicker con regla luminosa que se dibuja, luego lead + CTAs con
   stagger corto.

## Estado ambiental (permanente, sutil)

- La luz **respira** en ciclo lento (~12s).
- **Desktop:** la luz sigue al cursor con damping alto (profundidad, no
  nerviosismo). Titular / fondo / grano se mueven a distintas velocidades →
  parallax de profundidad sutil.
- **Táctil:** la luz deriva sola, lento, sin cursor, sin jank de scroll.

## Detalles premium (anti-genérico)

- **Grano/dither** tenue sobre el gradiente para romper el *banding* — detalle
  clave que separa "premium" de "template". Textura de ruido estática (no
  regenerada por frame).
- Color de luz = tokens de marca (`--accent`, `--accent-2`), nunca degradé
  arcoíris por defecto.
- Animación solo por `transform`/`opacity` (GPU); la luz son 2-3 radiales
  trasladándose. Costo despreciable en cualquier equipo.

## Personalidad

**Calma y precisión con pizca de profundidad.** Elegida porque no depende de
movimiento continuo pesado → fluida hasta en equipos modestos.

## Responsive / accesibilidad / performance

- **Desktop:** parallax por cursor.
- **Táctil:** deriva autónoma lenta, sin cursor.
- **`prefers-reduced-motion`:** estado final estático, luz quieta, sin barrido
  (respeta la regla existente del proyecto).
- Todo GPU-friendly; sin librería nueva (CSS + GSAP ya presentes). El grano es
  una textura estática inline (SVG/dataURI) para no pedir red.

## Fuera de alcance

- No se toca la laptop 3D (vive en `WebSection`, más abajo — no duplicar).
- No se cambia el copy (placeholder existente en `copy.ts`).
- Sin nuevas dependencias.
