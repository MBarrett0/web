# Simulación WhatsApp: calendario + morph de la reserva

## Objetivo

Ampliar la simulación de reservas por WhatsApp (`src/components/WhatsAppShowcase.astro`)
agregando un **calendario al lado del teléfono** que reacciona en vivo a la conversación,
y una animación "eye-catcher" donde la tarjeta de "Turno confirmado" **se duplica, viaja
al calendario y se transforma en la reserva** en el slot correcto (Jueves · 15:00).

El efecto refuerza la relación causa→efecto ("este mensaje *es* tu turno") y encaja con la
estética Dark Tech Premium del sitio. Interacción pasiva: todo se dispara con scroll, el
cliente nunca opera nada.

## Layout

Teléfono + calendario forman un **clúster a la derecha**; el texto/CTA queda a la izquierda.

- **Desktop (fila):** `[ texto/CTA ]  [ 📱 teléfono ]  [ 📅 calendario ]`. El clon viaja en horizontal.
- **Mobile (apilado):** teléfono arriba, calendario abajo (mismo ancho). El clon viaja en vertical.
- El trayecto del clon se calcula en runtime con `getBoundingClientRect`, así funciona igual
  en cualquier layout sin coordenadas hardcodeadas.
- El calendario reutiliza los tokens Dark Tech existentes (`--line`, `--accent`, `--accent-2`,
  fondo `#0b141a`, superficies `#1f2c33`) para leerse como parte del mismo sistema que el teléfono.
- El clon viajero se monta en un contenedor a nivel de sección (`position: relative` en la sección,
  clon `position: absolute`) para poder viajar entre teléfono y calendario sin recortarse por
  el `overflow: hidden` de cada frame.

## Calendario: dos estados

Un solo frame (`.wa-cal`) con dos "pantallas" superpuestas que se cruzan (slide + fade):

- **Estado A — Mes:** encabezado "Julio", grilla de fechas. El **jueves 9** resaltado como
  día seleccionable/objetivo.
- **Estado B — Día (Jueves 9):** cabecera "Jueves 9" y lista vertical de horarios:
  - Libres: **10:30 · 15:00 · 18:30** (marcados como disponibles).
  - Ocupados: 2 slots en gris (p. ej. 12:00 "Corte — Ana", 16:30 "Color — Lucía") para que la
    agenda se sienta real y no vacía.
  - El slot **15:00** es el destino del morph; arranca "libre" y termina como la reserva nueva.

## Coreografía (timeline GSAP, disparado por ScrollTrigger)

Se extiende el timeline actual del chat con labels para sincronizar chat + calendario:

1. Cliente: *"¡Hola! ¿Tenés lugar el jueves?"* aparece.
2. Calendario **transiciona Mes → Día** (el mes sale, entra el día con slide+fade).
3. Los 3 slots libres (10:30 / 15:00 / 18:30) hacen un **flash verde escalonado** (stagger)
   para señalar de qué horarios habla el bot.
4. *Recién ahí* aparece la burbuja del bot: *"…el jueves tengo 10:30, 15:00 y 18:30…"*.
5. Cliente: *"15:00 👌"* → typing → burbuja **"✓ Turno confirmado · Jueves · 15:00"**.
6. **Morph:** se clona la tarjeta de confirmación. El clon viaja rápido (leve arco), encogiéndose
   y mutando de forma-burbuja a forma-reserva, hasta el slot de las 15:00. Al aterrizar:
   flash verde + la **reserva real** queda fija en el slot 15:00; el clon se desvanece.

### Técnica del morph (FLIP manual, sin plugins)

- No se registra el plugin Flip. Se hace manual:
  1. Medir rect del origen (tarjeta de confirmación) y del destino (slot 15:00) con `getBoundingClientRect`.
  2. Clonar la tarjeta a un contenedor absoluto de sección, posicionado sobre el origen.
  3. GSAP anima `x`/`y` (con `motionPath`-like arco simple vía `keyframes` o un punto de control en y),
     `scale` y `borderRadius`/tamaño hacia el rect destino. Duración ~0.5–0.7s, ease `power3.inOut`.
  4. Al completar: mostrar la reserva real en el slot (fade + flash verde), ocultar el clon.
- La reserva real ya existe en el DOM (oculta con `autoAlpha: 0`); el clon solo "entrega" visualmente.

## Reduced motion / responsive / accesibilidad

- **`prefers-reduced-motion`:** sin timeline ni morph. Estado final directo: calendario en
  **vista Día con la reserva de las 15:00 ya puesta**, y chat completo visible. Cero movimiento.
  (Coherente con el patrón del resto del sitio.)
- **Responsive:** trayecto calculado en runtime; funciona en fila o apilado. Sin coordenadas fijas.
- **Accesibilidad:**
  - El clon viajero es decorativo → `aria-hidden="true"`.
  - El calendario lleva `aria-label` (p. ej. "Calendario de reservas, jueves 9 seleccionado").
  - La reserva final queda como texto real legible en el DOM.
  - Fallback: si el morph fallara, el estado final (reserva en el slot) igual queda visible —
    nunca una celda vacía.

## Alcance / no incluido

- Solo se toca `src/components/WhatsAppShowcase.astro` (markup + `<script>` + `<style>`).
- No se cambia copy final (placeholder realista, el usuario lo reemplaza después).
- No se agregan dependencias ni se registran plugins GSAP nuevos.
- No se toca el resto de las simulaciones (laptop 3D, antes/después).
