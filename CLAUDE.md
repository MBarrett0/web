# Software development services landing page

One-pager landing page to offer software development services to SMEs:
service automation, WhatsApp booking, appointment management, and website
creation. Goal: maximum conversion of non-technical clients, striking
"Dark Tech Premium" aesthetic, fluid simulations with a premium feel.

## Stack

- **Astro** (`output: 'static'`) — skeleton and content. Static HTML by default, zero unnecessary JS.
- **React** — only as islands (`client:visible`) in the 2 interactive simulations: 3D laptop and the manual-vs-automated automation sim.
- **GSAP + ScrollTrigger** — shared global script (outside React) for all scroll/entrance animations and passive showcases.
- **three.js via React Three Fiber + drei** — only inside the 3D laptop island.
- **Astro Content Collections** for the success story and FAQ (scaling content = adding files, not touching code).
- **Typography: Satoshi** (Fontshare), self-hosted in woff2.
- **Contact form: Web3Forms** (static site, no backend).

## Deploy

- **GitHub Pages** — repo: https://github.com/MBarrett0/web
- 100% static build. Deployed via GitHub Actions on push to `main`.
- Watch out for `site`/`base` in `astro.config.mjs`: project page is served under `/web/`.

## Design rules (NON-negotiable)

- **100% responsive** on all devices. 3D runs in full on mobile with adaptive quality (DPR clamp, capability detection) — no 2D fallback.
- **Never** look like an "AI-made product": no empty 3D blobs, stock photos, or generic SaaS aesthetics.
- **No "cells"**: no layouts based on uniform repeated boxes.
- **No cookie-cutter grids**: no generic equal-column grids for services/features — editorial/asymmetric layouts.
- **Gradients in moderation**: never as default decorative wallpaper.
- **Floating glass cards: ask the user before using them.** Do not assume them.
- **Copy without cliché phrases** ("take your business to the next level", etc.). The user will replace the final copy — leave realistic, easy-to-identify placeholder text.
- **Passive interaction first**: simulations are driven by scroll/hover, never force the client to drag or "operate" widgets. Zero friction.
- `prefers-reduced-motion`: show static final states.
- Clean static fallback only if there's no WebGL (error handling, not a device-based downgrade).

## Product decisions

- Audience: general, any SME with customer-facing operations. Always non-technical language.
- One-pager: everything (incl. plans) is a section of the Home with anchor navigation.
- Plans have no prices — everything is "quote on request"; the CTA preloads the plan into the form.
- Only real case study: Protección Choferes (https://proteccionchoferes.org.uy). Do not invent testimonials.
- Brand: placeholder for now (the user will define it later).
- Main CTA: contact form (not WhatsApp).

## Documents

- Design spec: `docs/superpowers/specs/2026-07-18-landing-dev-services-design.md`
