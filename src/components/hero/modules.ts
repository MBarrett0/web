import type { Stage } from './useStage';

/**
 * Un módulo del ensamblaje: un rectángulo wireframe que entra desde fuera de
 * pantalla y encaja en su posición final.
 */
export type Module = {
  id: string;
  /** Rect final, en px del escenario. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Desplazamiento inicial respecto del destino: de ahí "vuela". */
  fromX: number;
  fromY: number;
  /** Ventana en la línea de tiempo maestra, normalizada [0,1]. */
  start: number;
  end: number;
  weight: number;
  /**
   * Recorte del relleno del titular, en px locales a su caja. Al encajar, el
   * módulo revela la copia rellena del titular recortada a este rect: por eso
   * el texto se completa exactamente por debajo de lo que el módulo cubre.
   * `null` = módulo de pura estructura, no rellena nada.
   */
  clip: { top: number; right: number; bottom: number; left: number } | null;
};

/** Duración total del ensamblaje, en segundos. */
export const DURATION = 2.1;

/**
 * Momento en que arranca la consolidación: todos los módulos convergen en un
 * único marco alrededor del titular.
 *
 * Va después de que la última tesela terminó de atenuarse y de destellar, si no
 * habría rampas peleándose entre sí sobre el mismo elemento.
 */
export const CONSOLIDATE_AT = 0.78;

/**
 * Estructura: los módulos grandes que dan escala.
 *
 * Coordenadas normalizadas al escenario, deliberadamente fuera del rango [0,1]
 * para que se corten contra los bordes. Nada de esto tiene tamaños repetidos:
 * la regla del proyecto prohíbe layouts de cajas uniformes.
 */
const FRAMES_WIDE = [
  { x: -0.22, y: 0.03, w: 0.64, h: 0.55, start: 0.0, end: 0.26, weight: 3 },
  { x: 0.57, y: -0.16, w: 0.68, h: 0.8, start: 0.05, end: 0.31, weight: 3 },
  { x: 0.14, y: 0.63, w: 0.95, h: 0.55, start: 0.1, end: 0.36, weight: 1.5 },
  { x: 0.36, y: 0.18, w: 0.3, h: 0.42, start: 0.14, end: 0.4, weight: 1.5 },
] as const;

/** En retrato la estructura tiene franja propia arriba: no pelea con el texto. */
const FRAMES_TALL = [
  { x: -0.34, y: 0.015, w: 1.02, h: 0.2, start: 0.0, end: 0.26, weight: 3 },
  { x: 0.32, y: 0.055, w: 0.98, h: 0.26, start: 0.05, end: 0.31, weight: 3 },
  { x: -0.1, y: 0.185, w: 0.8, h: 0.15, start: 0.1, end: 0.36, weight: 1.5 },
  { x: 0.48, y: 0.235, w: 0.74, h: 0.11, start: 0.14, end: 0.4, weight: 1.5 },
] as const;

/**
 * Teselas de relleno.
 *
 * Cubren la caja del titular SIN huecos, así que al terminar el ensamblaje el
 * texto queda completo. Los tamaños son deliberadamente desparejos: una grilla
 * regular de 6 celdas iguales sería exactamente el "layout de celdas" que el
 * proyecto prohíbe.
 *
 * Ninguna ventana termina después de 0.64: el destello y la atenuación siguen
 * hasta `end + 0.12`, y todo eso tiene que estar resuelto antes de que arranque
 * la consolidación en CONSOLIDATE_AT.
 */
const TILES = [
  { u: 0, v: 0, du: 0.46, dv: 0.38, start: 0.2, end: 0.34 },
  { u: 0.46, v: 0, du: 0.54, dv: 0.38, start: 0.26, end: 0.4 },
  { u: 0, v: 0.38, du: 0.29, dv: 0.34, start: 0.32, end: 0.46 },
  { u: 0.29, v: 0.38, du: 0.71, dv: 0.34, start: 0.38, end: 0.52 },
  { u: 0, v: 0.72, du: 0.63, dv: 0.28, start: 0.44, end: 0.58 },
  { u: 0.63, v: 0.72, du: 0.37, dv: 0.28, start: 0.5, end: 0.64 },
] as const;

const BLEED = 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export type Rect = { x: number; y: number; w: number; h: number };
export type Sheet = { modules: Module[]; frame: Rect };

export function buildModules(s: Stage): Sheet {
  const frames = (s.portrait ? FRAMES_TALL : FRAMES_WIDE).map((f, i) => ({
    id: `f${i}`,
    x: f.x * s.w,
    y: f.y * s.h,
    w: f.w * s.w,
    h: f.h * s.h,
    // Entran desde el lado más cercano: se lee como que vienen de fuera de la
    // hoja, no como que aparecen de la nada en el centro.
    fromX: (f.x + f.w / 2 < 0.5 ? -1 : 1) * s.w * 0.55,
    fromY: (i % 2 === 0 ? -1 : 1) * s.h * 0.12,
    start: f.start,
    end: f.end,
    weight: f.weight,
    clip: null,
  }));

  // El marco de las teselas desborda la caja del titular: encuadra el texto en
  // vez de calcarlo. El recorte del relleno sí se acota a la caja real.
  const pad = s.portrait ? 14 : 26;
  const box = {
    x: s.type.x - pad,
    y: s.type.y - pad,
    w: s.type.w + pad * 2,
    h: s.type.h + pad * 2,
  };

  const tiles = TILES.map((t, i) => {
    const x = box.x + t.u * box.w;
    const y = box.y + t.v * box.h;
    const w = t.du * box.w;
    const h = t.dv * box.h;
    return {
      id: `t${i}`,
      x,
      y,
      w,
      h,
      fromX: (t.u + t.du / 2 < 0.5 ? -1 : 1) * s.w * 0.4,
      fromY: (i % 3 === 0 ? -1 : 1) * s.h * 0.08,
      start: t.start,
      end: t.end,
      weight: 2,
      // Sangrado: las teselas encajan sin huecos, pero dos recortes exactamente
      // adyacentes dejan una costura de ~1px donde el antialiasing de cada
      // borde no empalma. Solaparlas la elimina y no cuesta nada: todas las
      // copias pintan exactamente lo mismo.
      clip: {
        top: clamp(y - s.type.y - BLEED, 0, s.type.h),
        left: clamp(x - s.type.x - BLEED, 0, s.type.w),
        right: clamp(s.type.x + s.type.w - (x + w) - BLEED, 0, s.type.w),
        bottom: clamp(s.type.y + s.type.h - (y + h) - BLEED, 0, s.type.h),
      },
    };
  });

  // El marco de consolidación es el mismo que encuadran las teselas: los diez
  // módulos terminan colapsando exactamente sobre él.
  return { modules: [...frames, ...tiles], frame: box };
}
