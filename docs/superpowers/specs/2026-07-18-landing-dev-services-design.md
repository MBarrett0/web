# Landing de servicios de desarrollo — Spec de diseño

**Fecha:** 2026-07-18
**Estado:** Aprobado por el usuario (diseño validado por brainstorming)
**Repo:** https://github.com/MBarrett0/web

## 1. Objetivo

Landing page de presentación para ofrecer servicios de desarrollo de software a
PyMEs: automatización de servicios, reservas por WhatsApp, gestión de turnos y
creación de páginas web. Debe ser muy llamativa visualmente, con simulaciones
fluidas que den sensación premium, y estar optimizada para convertir clientes
no técnicos en contactos por formulario.

**Criterio de éxito:** un dueño de PyME sin conocimientos técnicos entiende en
un scroll qué se ofrece, ve la solución funcionando (sin operar nada), confía
(caso real + proceso claro) y deja sus datos en el formulario.

## 2. Público y tono

- **Público:** generalista — cualquier PyME con atención al público (comercios, profesionales, servicios).
- **Tono:** lenguaje llano, cero jerga técnica, voseo rioplatense. Sin frases cliché de marketing.
- **Copy:** el usuario aportará el copy final. Se escribe copy realista propio (no lorem ipsum) fácil de localizar y reemplazar, centralizado en archivos de contenido.

## 3. Arquitectura técnica

- **Astro** `output: 'static'` — todo el esqueleto y contenido como HTML/CSS estático; cero JS por defecto.
- **React islands** (`client:visible`) solo en 2 puntos:
  1. **Laptop 3D** — React Three Fiber + drei (three.js).
  2. **Comparador antes/después** — animación scroll-driven con estado.
- **GSAP + ScrollTrigger** como módulo global compartido (fuera de React) para: reveals de entrada, escenas pinneadas con scrub, showcases de WhatsApp y turnos.
- **Content Collections** de Astro para caso(s) de éxito y FAQ — escalar contenido es agregar archivos.
- Si a futuro dos islas necesitan compartir estado: `nanostores` (~1kb). No anticiparlo ahora (YAGNI).
- **Tipografía:** Satoshi (Fontshare), self-hosteada woff2 con `font-display: swap` y preload del peso principal.

## 4. Deploy

- **GitHub Pages** desde el repo `MBarrett0/web`, workflow oficial de Astro (GitHub Actions, deploy en push a `main`).
- `astro.config.mjs`: `site: 'https://mbarrett0.github.io'`, `base: '/web'`. Si después se apunta un dominio propio, solo cambian esos dos valores.
- Sitio estático puro: sin backend, sin auth, sin datos por request. Si el negocio escala a portal de clientes, eso es otro proyecto (el sitio de marketing no se contamina).

## 5. Sistema visual — "Dark Tech Premium"

- Fondo oscuro profundo, acentos de color contenidos, alto contraste tipográfico con Satoshi en tamaños grandes.
- **Prohibiciones explícitas** (pedido del usuario):
  - Nunca verse como "producto hecho con IA" (blobs 3D vacíos, stock photos, SaaS genérico).
  - Sin "cells" (cajas uniformes repetidas como estructura).
  - Sin cookie-cutter grids (columnas iguales genéricas) — layouts editoriales/asimétricos.
  - Gradientes solo con propósito, nunca de empapelado.
  - Floating glass cards: **requieren aprobación previa del usuario**.
  - Copy sin clichés.
- **100% responsive**, mobile-first en el CSS. El 3D corre completo en todos los dispositivos con calidad adaptativa (ver §7).
- Animaciones: pasivas para el usuario (scroll/hover). Nunca exigir drag ni "operar" widgets.
- `prefers-reduced-motion`: se muestran los estados finales estáticos de cada escena.

## 6. Estructura del Home (one-pager, orden aprobado)

Navegación: header sticky minimal con logo placeholder, anclas y un único CTA
siempre visible ("Contame tu caso" → formulario).

1. **Hero** — titular concreto de beneficio + CTA primario al formulario + CTA secundario "Ver cómo funciona" (ancla a la primera simulación). Visual: tipografía Satoshi grande con reveal cinético y fondo con profundidad sutil. Sin glass cards.
2. **Servicios (índice)** — lista editorial numerada 01–04, asimétrica; cada ítem ancla a su sección de demo.
3. **Simulación: automatización (antes/después)** — isla React. Escena pinneada con scrub de scroll: caos (chats sin responder, llamadas perdidas acumulándose) → orden (respuestas al instante, reservas confirmadas), contadores animados. Auto-animada por scroll, sin slider manual. Micro-CTA al salir.
4. **Showcase: reservas por WhatsApp** — mockup de teléfono construido a mano (HTML/CSS, no screenshot); la conversación se reproduce sola al entrar en viewport (indicador "escribiendo…", confirmación de turno). Timeline GSAP.
5. **Showcase: gestión de turnos** — agenda que se organiza sola: turnos entran, recordatorios salen, una cancelación se reasigna automáticamente. Timeline GSAP.
6. **Simulación: laptop 3D** — isla React (R3F). Laptop/pantalla 3D con un sitio "vivo" como textura; parallax con mouse en desktop, respuesta a scroll/giroscopio en mobile. Golpe visual que cierra el bloque de servicios.
7. **Caso de éxito** — Protección Choferes (https://proteccionchoferes.org.uy): contexto → qué se hizo → resultado, link al sitio real. Content Collection (preparada para futuros casos). Sin testimonios inventados.
8. **Cómo trabajamos** — 4 pasos (contactás → definimos → desarrollo → lanzamos) en lenguaje llano; cada paso explicita qué hace el cliente y qué hago yo.
9. **Planes** — paquetes de alcance **sin montos** ("a cotizar"); el CTA de cada plan ancla al formulario con el plan precargado en el mensaje. Layout no-grid (filas diferenciadas).
10. **FAQ** — acordeón accesible (`<details>` mejorado); objeciones reales de PyMEs. Content Collection.
11. **Contacto** — formulario corto: nombre, negocio/rubro, servicio de interés (select), mensaje. **Web3Forms** (gratis 250/mes, llega por mail; requiere access key del usuario — hasta tenerla, la key vive en una constante señalizada). Estado de éxito/error inline sin salir de la página. Mail directo visible como alternativa.

## 7. Performance y manejo de errores

- **Presupuesto:** la página debe sentirse instantánea; JS solo en las 2 islas; imágenes en formatos modernos; Lighthouse mobile ≥ 90 en Performance como referencia.
- **3D adaptativo (decisión del usuario: 3D completo siempre, optimizado):** clamp de `devicePixelRatio` (máx. 2), detección de capacidad para escalar luces/sombras/postprocesado, texturas livianas, `frameloop="demand"` cuando la escena está quieta, pausa total fuera de viewport.
- **Sin WebGL** (navegador/driver que no soporta): fallback estático prolijo del mismo mockup (error handling, no downgrade por dispositivo).
- **Formulario:** validación en cliente, mensajes de error claros en español, estado de fallo de red con reintento; nunca perder lo tipeado.
- **GSAP:** todos los ScrollTriggers se registran con cleanup correcto; `matchMedia` de GSAP para variantes responsive de las escenas.

## 8. Testing y verificación

- `astro build` sin errores como gate mínimo en CI (el mismo workflow del deploy).
- Smoke test con Playwright local: las 11 secciones renderizan, las islas montan, el formulario valida y muestra estados.
- Verificación manual responsive en anchos clave (360, 768, 1024, 1440) antes de cada entrega visual.
- Verificación de `prefers-reduced-motion` y del fallback sin WebGL.

## 9. Fuera de alcance (por ahora)

- Precios con montos, testimonios adicionales, blog, portal de clientes, backend propio, analytics (se puede sumar después), definición de marca/nombre (placeholder hasta que el usuario la defina).
