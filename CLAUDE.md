# Landing de servicios de desarrollo

Landing page one-pager para ofrecer servicios de desarrollo de software a PyMEs:
automatización de servicios, reservas por WhatsApp, gestión de turnos y creación
de páginas web. Objetivo: máxima conversión de clientes no técnicos, estética
"Dark Tech Premium" muy llamativa, simulaciones fluidas con sensación premium.

## Stack

- **Astro** (`output: 'static'`) — esqueleto y contenido. HTML estático por defecto, cero JS innecesario.
- **React** — solo como islands (`client:visible`) en las 2 simulaciones interactivas: laptop 3D y comparador antes/después.
- **GSAP + ScrollTrigger** — script global compartido (fuera de React) para todas las animaciones de scroll/entrada y los showcases pasivos.
- **three.js vía React Three Fiber + drei** — únicamente dentro de la isla del laptop 3D.
- **Content Collections** de Astro para caso de éxito y FAQ (escalar contenido = agregar archivos, no tocar código).
- **Tipografía: Satoshi** (Fontshare), self-hosteada en woff2.
- **Formulario de contacto: Web3Forms** (sitio estático, sin backend).

## Deploy

- **GitHub Pages** — repo: https://github.com/MBarrett0/web
- Build 100% estático. Deploy vía GitHub Actions en push a `main`.
- Ojo con `site`/`base` en `astro.config.mjs`: project page sirve bajo `/web/`.

## Reglas de diseño (NO negociables)

- **100% responsive** en todos los dispositivos. El 3D corre completo en mobile con calidad adaptativa (DPR clamp, detección de capacidad) — no fallback 2D.
- **Nunca** verse como "producto hecho con IA": nada de blobs 3D vacíos, stock photos, ni estética SaaS genérica.
- **No usar "cells"**: nada de layouts a base de cajas uniformes repetidas.
- **No cookie-cutter grids**: nada de grillas genéricas de columnas iguales para servicios/features — layouts editoriales/asimétricos.
- **Gradientes con moderación**: nunca como empapelado decorativo por defecto.
- **Floating glass cards: preguntar al usuario antes de usarlas.** No asumirlas.
- **Copy sin frases cliché** ("llevá tu negocio al siguiente nivel", etc.). Voseo rioplatense. El usuario reemplazará el copy final — dejar textos realistas y fáciles de ubicar.
- **Interacción pasiva primero**: las simulaciones se manejan con scroll/hover, nunca obligar al cliente a arrastrar u "operar" widgets. Cero fricción.
- `prefers-reduced-motion`: mostrar estados finales estáticos.
- Fallback estático prolijo solo si no hay WebGL (error handling, no downgrade por dispositivo).

## Decisiones de producto

- Público: generalista, cualquier PyME con atención al público. Lenguaje no técnico siempre.
- One-pager: todo (incl. planes) es sección del Home con navegación por anclas.
- Planes sin montos — todo "a cotizar"; el CTA precarga el plan en el formulario.
- Único caso real: Protección Choferes (https://proteccionchoferes.org.uy). No inventar testimonios.
- Marca: placeholder por ahora (el usuario la define después).
- CTA principal: formulario de contacto (no WhatsApp).

## Documentos

- Spec de diseño: `docs/superpowers/specs/2026-07-18-landing-dev-services-design.md`
