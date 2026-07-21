import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** Todo en píxeles CSS del escenario. El SVG usa viewBox="0 0 w h": 1 unidad = 1px. */
export type Stage = {
  w: number;
  h: number;
  portrait: boolean;
  /** Caja de maquetación del titular, inmune a transforms (ver offsetWithin). */
  type: { x: number; y: number; w: number; h: number };
};

const SSR: Stage = { w: 1440, h: 860, portrait: false, type: { x: 160, y: 300, w: 760, h: 300 } };

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Posición de `el` dentro de `root` recorriendo la cadena de offsetParent.
 *
 * A propósito NO usa getBoundingClientRect: los rects incluyen los transforms
 * vivos, y el titular está dentro de contenedores que se animan. Los offsets son
 * posiciones de maquetación y no ven los transforms, así que la estructura
 * siempre encaja donde el texto realmente está.
 */
function offsetWithin(el: HTMLElement, root: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/**
 * Mide el escenario y la caja del titular.
 *
 * Sólo recalcula en resize y al terminar de cargar Satoshi (con
 * font-display:swap el ancho del titular cambia cuando llega la fuente, y los
 * módulos quedarían encuadrando una caja que ya no existe).
 */
export function useStage(
  stage: React.RefObject<HTMLElement | null>,
  headline: React.RefObject<HTMLElement | null>,
): Stage {
  const [value, setValue] = useState<Stage>(SSR);

  const measure = useCallback(() => {
    const root = stage.current;
    const head = headline.current;
    if (!root || !head) return;

    const w = root.clientWidth;
    const h = root.clientHeight;
    if (w < 1 || h < 1) return;

    const at = offsetWithin(head, root);
    const next: Stage = {
      w,
      h,
      portrait: w / h < 1.05,
      type: { x: at.x, y: at.y, w: head.offsetWidth, h: head.offsetHeight },
    };

    setValue((prev) =>
      prev.w === next.w &&
      prev.h === next.h &&
      prev.type.x === next.type.x &&
      prev.type.y === next.type.y &&
      prev.type.w === next.type.w &&
      prev.type.h === next.type.h
        ? prev
        : next,
    );
  }, [stage, headline]);

  useIsomorphicLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    if (headline.current) ro.observe(headline.current);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure, stage, headline]);

  return value;
}
