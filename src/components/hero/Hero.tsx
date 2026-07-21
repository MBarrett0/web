import { Fragment, useEffect, useMemo, useRef } from 'react';
import {
  animate,
  cubicBezier,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { copy } from '../../data/copy';
import { useStage } from './useStage';
import { buildModules, CONSOLIDATE_AT, DURATION, type Module, type Rect } from './modules';

/**
 * Tipografía del titular. Compartida por el contorno y por las copias rellenas
 * para que calcen al píxel: cualquier diferencia acá se ve como un temblor.
 *
 * El 1.05 de interlineado no es a ojo. Satoshi tiene una caja em de 1.25em
 * (ascent 1.01 + descent 0.24), así que un leading agresivo mete los
 * descendentes en el renglón de abajo. Midiendo la holgura real entre la tinta
 * de la "g" y la de la "l" siguiente, por cada 100px de tipografía:
 *
 *     0.92 → −7.8px    0.98 → −1.8px    1.04 → +4.2px
 *     0.95 → −4.8px    1.00 → +0.2px
 *
 * Con 0.92 la cola de la "g" de *negocio* caía sobre el punto de la "i" de
 * *incluso*. Cualquier valor por debajo de ~1.04 depende de que el corte de
 * línea tenga suerte, y el copy es placeholder: tiene que aguantar el texto
 * final sea cual sea. Sigue leyéndose apretado igual, porque lo "normal" para
 * esta fuente sería 1.25.
 */
const TYPE =
  'text-[clamp(2.6rem,7.8vw,5.8rem)] leading-[1.05] font-extrabold tracking-[-0.015em]';
/**
 * Trazo del titular, en ambas capas: deja el borde exterior en el mismo lugar,
 * así el relleno no "engorda" la letra al aparecer.
 *
 * `paint-order: stroke` no es opcional. Satoshi es una fuente variable y, como
 * casi todas, trae contornos superpuestos sin fusionar (fusionarlos impediría
 * interpolar entre pesos). Al rellenar no se nota, pero al trazar se ven los
 * bordes internos donde el travesaño pisa el asta: la T, la t y la e salían
 * como dos formas encimadas. Pintando el trazo DEBAJO del relleno, el relleno
 * tapa la mitad interna del trazo y con ella todos esos artefactos.
 *
 * El ancho va en em, no en px. Un trazo fijo suma lo mismo a cada letra sin
 * importar el cuerpo: 3px sobre los 93px del desktop es un 3%, pero sobre los
 * 42px del móvil es un 7%, y ahí engorda los glifos al doble y se come el aire
 * entre letras. En em escala con la tipografía y el peso se ve igual en todos
 * lados. Es 0.035em y no la mitad porque con paint-order sólo se ve la mitad
 * exterior del trazo.
 */
const STROKE = '[-webkit-text-stroke:0.035em_var(--text)] [paint-order:stroke]';

/** Encaje: entrada rápida y frenada seca, sin rebote. */
const SNAP = cubicBezier(0.2, 0.9, 0.2, 1);
/** Convergencia: arranca suave y frena largo, para que el colapso se lea. */
const MERGE = cubicBezier(0.5, 0, 0.2, 1);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Hero "Ensamblaje".
 *
 * Al cargar la página, módulos wireframe entran desde fuera de la hoja y encajan
 * formando una estructura. El titular está desde el primer frame pero **en
 * contorno**: cada módulo, al encajar, rellena exactamente las palabras que
 * quedan bajo su área. La estructura se arma y el mensaje se resuelve solo —que
 * es, literalmente, lo que vende el sitio.
 *
 * Por qué el contorno importa: el <h1> se pinta desde el HTML estático, así que
 * cuenta para el LCP y se lee incluso antes de que el relleno llegue. Ocultarlo
 * hasta el final de la animación habría dejado a la landing sin propuesta de
 * valor durante los primeros dos segundos.
 *
 * Sin scroll-lock y sin dependencia del puntero: la animación corre sola, una
 * vez, y la ve el 100% de la gente que entra.
 */
export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const stage = useStage(stageRef, headRef);
  const { modules, frame } = useMemo(() => buildModules(stage), [stage]);
  const words = useMemo(() => copy.hero.title.split(' '), []);

  // Línea de tiempo maestra, lineal: cada módulo aplica su propia curva sobre su
  // ventana. Con un master ya eseado, los tiempos relativos se distorsionan.
  const t = useMotionValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      t.set(1);
      return;
    }
    const controls = animate(t, 1, { duration: DURATION, ease: 'linear' });
    return () => controls.stop();
  }, [reduced, t]);

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-svh items-end overflow-hidden bg-bg py-0 pt-28 pb-[10svh] md:items-center md:pb-0"
    >
      <div ref={stageRef} className="absolute inset-0 z-0">
        <svg
          aria-hidden="true"
          className="h-full w-full"
          viewBox={`0 0 ${stage.w} ${stage.h}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {modules.map((m) => (
            <ModuleRect key={m.id} m={m} t={t} frame={frame} />
          ))}
          <ConsolidatedFrame t={t} frame={frame} />
        </svg>
      </div>

      <div className="relative z-10 w-full">
        <div className="container">
          <p className="kicker flex items-center gap-3">
            <span className="block h-px w-10 bg-linear-to-r from-accent to-transparent" />
            {copy.hero.kicker}
          </p>

          {/* El wrapper lleva el margen, no el <h1>: así su caja coincide
              exactamente con la del titular y las copias `inset-0` calzan.
              También lleva TYPE: `ch` resuelve contra el font-size del propio
              elemento, y sin él 15ch se medía contra los 16px del body.

              El pb no es aire decorativo. Con leading 0.92 las colas de las
              letras (la "g" de llegás) se desbordan por debajo de la última
              caja de línea, o sea fuera de offsetHeight. Como los recortes se
              clampean a esa altura, la cola quedaba fuera de todas las teselas
              y se veía en contorno con el resto ya relleno. Agrandar la caja de
              referencia lo resuelve sin recurrir a insets negativos en
              clip-path, que no son fiables entre navegadores. */}
          <div ref={headRef} className={`relative mt-10 w-fit max-w-[15ch] pb-[0.3em] ${TYPE}`}>
            {/* Relleno en --bg, no transparente: es lo que tapa los artefactos
                del trazo. Sobre el fondo se lee igual que un contorno hueco, y
                de paso las letras ocluyen los módulos que pasan por detrás. */}
            <h1 aria-label={copy.hero.title} className={`${TYPE} ${STROKE} text-bg`}>
              {words.map((word, i) => (
                <Fragment key={i}>
                  <span className="w inline" aria-hidden="true">
                    {word}
                  </span>{' '}
                </Fragment>
              ))}
            </h1>

            {/* Una copia rellena por tesela, recortada a su rect. La unión de
                los recortes cubre la caja entera, así que al final el titular
                queda completo. Superponerse no molesta: pintan lo mismo. */}
            {modules
              .filter((m) => m.clip)
              .map((m) => (
                <FillTile key={m.id} m={m} t={t} title={copy.hero.title} />
              ))}
          </div>

          {/* mt-12 no es aire de más: el marco de consolidación cae 26px por
              debajo de la caja del titular y sin este margen lo cruzaba. */}
          <p className="mt-12 max-w-[34rem] text-[clamp(1.02rem,1.9vw,1.18rem)] text-muted">
            {copy.hero.lead}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a className="btn btn-primary" href="#contacto">
              {copy.hero.ctaPrimary}
            </a>
            <a className="btn btn-ghost" href="#automatizacion">
              {copy.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Un módulo: vuela desde fuera, encaja y se atenúa.
 *
 * Son dos rects superpuestos en vez de interpolar el color del trazo: el
 * destello de encaje sale de la opacidad de una copia en `--accent`, así el
 * color sigue viniendo de los tokens del CSS y no de hex duplicados en JS.
 */
function ModuleRect({ m, t, frame }: { m: Module; t: MotionValue<number>; frame: Rect }) {
  const cx = m.x + m.w / 2;
  const cy = m.y + m.h / 2;
  const dx = frame.x + frame.w / 2 - cx;
  const dy = frame.y + frame.h / 2 - cy;

  // Encaje y consolidación como funciones puras del maestro: así las dos fases
  // componen sobre las mismas propiedades en vez de pelearse por ellas.
  const snap = (v: number) => SNAP(clamp01((v - m.start) / (m.end - m.start)));
  const merge = (v: number) => MERGE(clamp01((v - CONSOLIDATE_AT) / (1 - CONSOLIDATE_AT)));

  // Con transformOrigin en el centro del módulo, escalar lo deja quieto y el
  // translate lleva ese centro al del marco: al final los diez caen sobre el
  // mismo rect exacto.
  const x = useTransform(t, (v) => m.fromX * (1 - snap(v)) + dx * merge(v));
  const y = useTransform(t, (v) => m.fromY * (1 - snap(v)) + dy * merge(v));
  // Primer factor: el "clac" del encaje. Segundo: el colapso hacia el marco.
  const scaleX = useTransform(
    t,
    (v) => (1.09 - 0.09 * snap(v)) * (1 + (frame.w / m.w - 1) * merge(v)),
  );
  const scaleY = useTransform(
    t,
    (v) => (1.09 - 0.09 * snap(v)) * (1 + (frame.h / m.h - 1) * merge(v)),
  );

  const base = useTransform(t, (v) => {
    const appear = clamp01((v - m.start) / 0.05);
    const settled = 0.85 - 0.51 * clamp01((v - m.end) / 0.12);
    // Todos se apagan al converger: el marco que queda es otro elemento.
    return appear * settled * (1 - merge(v));
  });
  const flash = useTransform(t, [m.end - 0.03, m.end, m.end + 0.1], [0, 1, 0]);

  return (
    <motion.g style={{ x, y, scaleX, scaleY, transformOrigin: `${cx}px ${cy}px` }}>
      {/* non-scaling-stroke es lo que permite el colapso: sin él, escalar un
          módulo angosto hasta el ancho del marco le deformaría el trazo. */}
      <motion.rect
        x={m.x}
        y={m.y}
        width={m.w}
        height={m.h}
        strokeWidth={m.weight}
        vectorEffect="non-scaling-stroke"
        className="stroke-muted"
        style={{ opacity: base }}
      />
      <motion.rect
        x={m.x}
        y={m.y}
        width={m.w}
        height={m.h}
        strokeWidth={m.weight}
        vectorEffect="non-scaling-stroke"
        className="stroke-accent"
        style={{ opacity: flash }}
      />
    </motion.g>
  );
}

/**
 * El marco que queda en reposo.
 *
 * Se abre desde el centro hacia los cuatro lados en vez de sobrevivir uno de
 * los módulos: cualquier módulo que se quedara arrastraría su posición de
 * origen, y el que encajaba mejor arrancaba fuera del borde izquierdo, así que
 * el marco final parecía entrar volando desde esa esquina. Cuatro líneas que
 * crecen desde su punto medio no tienen origen direccional: el marco no viene
 * de ningún lado, simplemente se abre donde va.
 */
function ConsolidatedFrame({ t, frame }: { t: MotionValue<number>; frame: Rect }) {
  const open = useTransform(t, [CONSOLIDATE_AT + 0.04, 1], [0, 1], { ease: MERGE });
  const opacity = useTransform(t, [CONSOLIDATE_AT + 0.04, CONSOLIDATE_AT + 0.12], [0, 0.45]);
  const { x, y, w, h } = frame;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const edge = 'stroke-muted';

  return (
    <motion.g style={{ opacity }}>
      <motion.line
        x1={x} y1={y} x2={x + w} y2={y}
        className={edge} strokeWidth={2.5} vectorEffect="non-scaling-stroke"
        style={{ scaleX: open, transformOrigin: `${cx}px ${y}px` }}
      />
      <motion.line
        x1={x} y1={y + h} x2={x + w} y2={y + h}
        className={edge} strokeWidth={2.5} vectorEffect="non-scaling-stroke"
        style={{ scaleX: open, transformOrigin: `${cx}px ${y + h}px` }}
      />
      <motion.line
        x1={x} y1={y} x2={x} y2={y + h}
        className={edge} strokeWidth={2.5} vectorEffect="non-scaling-stroke"
        style={{ scaleY: open, transformOrigin: `${x}px ${cy}px` }}
      />
      <motion.line
        x1={x + w} y1={y} x2={x + w} y2={y + h}
        className={edge} strokeWidth={2.5} vectorEffect="non-scaling-stroke"
        style={{ scaleY: open, transformOrigin: `${x + w}px ${cy}px` }}
      />
    </motion.g>
  );
}

/** La porción de titular que revela un módulo al encajar. */
function FillTile({ m, t, title }: { m: Module; t: MotionValue<number>; title: string }) {
  const clip = m.clip!;
  // Ventana cortísima y arrancada un pelo antes del encaje: el relleno tiene que
  // leerse como consecuencia del módulo, no como un fundido aparte.
  const opacity = useTransform(t, [m.end - 0.04, m.end + 0.01], [0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        clipPath: `inset(${clip.top}px ${clip.right}px ${clip.bottom}px ${clip.left}px)`,
      }}
    >
      <div className={`${TYPE} ${STROKE} text-ink`}>{title}</div>
    </motion.div>
  );
}
