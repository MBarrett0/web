import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './automation.css';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// COPY — editable. Cada notificación tiene su versión "a mano" y su versión resuelta.
const TOASTS = [
  { icon: 'msg', bad: 'Carla pregunta si hay lugar', badS: 'sin responder · 2 h', ok: 'Disponibilidad respondida', okS: 'al instante' },
  { icon: 'bell', bad: '3 recordatorios sin enviar', badS: 'vencen hoy', ok: 'Recordatorios enviados', okS: '3 hoy' },
  { icon: 'cal', bad: '2 turnos sin confirmar', badS: 'sin respuesta', ok: 'Mensaje enviado a los sin confirmar', okS: 'esperando ok' },
  { icon: 'phone', bad: 'Llamada perdida · número nuevo', badS: 'sin devolver', ok: 'Llamada devuelta · contactado', okS: 'hecho' },
];
// Posición en el montón (manual) y alineada (auto)
const POS = [
  { x: -8, ym: 0, r: -3, ya: 0 },
  { x: 10, ym: 44, r: 2.5, ya: 64 },
  { x: -12, ym: 88, r: -2, ya: 128 },
  { x: 6, ym: 132, r: 3, ya: 192 },
];
const PENDING = 14;

const WEEKS_PER_MONTH = 52 / 12;
const WORKDAY_H = 8;

const Icon = ({ t }: { t: string }) => {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (t) {
    case 'cal':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><rect x="3" y="4.5" width="14" height="12" rx="2" {...p} /><path d="M3 8h14M7 3v3M13 3v3" {...p} /></svg>);
    case 'bell':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M5.5 8a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5Z" {...p} /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" {...p} /></svg>);
    case 'phone':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M6 3.5c.6 2 1.4 3.2 2 3.8-.4 1-1 1.8-1.6 2.3 1 2 2.7 3.7 4.7 4.7.5-.6 1.3-1.2 2.3-1.6.6.6 1.8 1.4 3.8 2-.2 1.4-1.4 2.3-2.8 2.1C10.6 18 4 11.4 3.4 6.3 3.2 4.9 4.1 3.7 5.5 3.5Z" {...p} /></svg>);
    default: // msg
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-3.5 3v-3a2 2 0 0 1-1-1.7Z" {...p} /></svg>);
  }
};

const Check = ({ w = 12 }: { w?: number }) => (
  <svg viewBox="0 0 24 24" width={w} height={w} fill="none" aria-hidden="true"><path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function Automation() {
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();
  const root = useRef<HTMLElement>(null);

  const [automated, setAutomated] = useState(reduced);
  const [entered, setEntered] = useState(reduced);
  const userTouched = useRef(false);

  const automate = () => { userTouched.current = true; setAutomated(true); };
  const reset = () => { userTouched.current = true; setAutomated(false); };

  // Reveal pasivo: entra con la tormenta y, si no tocás nada, se automatiza solo.
  useEffect(() => {
    if (reduced || !root.current) return;
    const el = root.current;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          t = setTimeout(() => { if (!userTouched.current) setAutomated(true); }, 2200);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [reduced]);

  // Calculadora — mismo cálculo en tres horizontes
  const [turnos, setTurnos] = useState(40);
  const [minutos, setMinutos] = useState(10);
  const perMonth = useMemo(() => Math.round((turnos * WEEKS_PER_MONTH * minutos) / 60), [turnos, minutos]);
  const perYear = useMemo(() => Math.round((turnos * 52 * minutos) / 60), [turnos, minutos]);
  const per5 = useMemo(() => perYear * 5, [perYear]);
  const days5 = useMemo(() => Math.round(per5 / WORKDAY_H), [per5]);

  const month = useTicker(perMonth, reduced);
  const year = useTicker(perYear, reduced);
  const five = useTicker(per5, reduced);
  const pending = useTicker(automated ? 0 : PENDING, reduced);

  const stateClass = automated ? 'is-auto' : 'is-manual';

  return (
    <section id="automatizacion" className="au" ref={root}>
      <div className="au-inner">
        <header className="au-head">
          <p className="au-kicker">Automatización de servicios</p>
          <h2 className="au-title">
            <span className="lead">Un día cualquiera del negocio,</span> con y sin el sistema andando.
          </h2>
          <p className="au-sub">
            A la izquierda, todo lo que se te acumula en el día. Tocá <b>Automatizar</b> y mirá
            cómo se resuelve solo, en silencio.
          </p>
        </header>

        <div className={`au-card ${stateClass}${entered ? ' entered' : ''}`}>
          <div className="au-scene">
            {/* Notificaciones */}
            <div className="au-pile" aria-hidden="true">
              {TOASTS.map((t, i) => (
                <div
                  key={t.bad}
                  className="au-toast"
                  style={{ '--x': `${POS[i].x}px`, '--ym': `${POS[i].ym}px`, '--ya': `${POS[i].ya}px`, '--r': `${POS[i].r}deg`, '--d': `${i * 70}ms` } as CSSProperties}
                >
                  <div className="au-toast-in" style={{ animationDelay: `${i * 0.4}s` } as CSSProperties}>
                    <span className="au-toast-ic"><Icon t={t.icon} /></span>
                    <span className="au-toast-tx">
                      <span className="s bad"><span className="tt">{t.bad}</span><span className="ts">{t.badS}</span></span>
                      <span className="s ok"><span className="tt">{t.ok}</span><span className="ts">{t.okS}</span></span>
                    </span>
                    <span className="au-toast-dot"><Check w={10} /></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Panel de acción */}
            <div className="au-action">
              <div className="au-count" aria-live="polite">
                <span className="au-count-n">{pending}</span>
                <span className="au-count-l">{automated ? 'al día' : 'pendientes'}</span>
              </div>
              {automated ? (
                <div className="au-done">
                  <span className="au-done-tag"><Check w={13} /> Automatizado</span>
                  <button className="au-reset" onClick={reset}>Verlo de nuevo</button>
                </div>
              ) : (
                <button className={`au-automate${entered ? ' invite' : ''}`} onClick={automate}>Automatizar</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Resumen de ahorro: mes / año / 5 años ── */}
        <div className="au-card">
          <div className="au-save-grid">
            <div className="au-controls">
              <div className="au-control">
                <div className="row">
                  <span className="k">Turnos por semana</span>
                  <span className="v">{turnos}</span>
                </div>
                <input
                  className="au-range" type="range" min={5} max={200} step={5}
                  value={turnos} onChange={(e) => setTurnos(Number(e.target.value))}
                  aria-label="Turnos por semana"
                />
              </div>
              <div className="au-control">
                <div className="row">
                  <span className="k">Minutos por turno a mano</span>
                  <span className="v">{minutos} min</span>
                </div>
                <input
                  className="au-range" type="range" min={2} max={30} step={1}
                  value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}
                  aria-label="Minutos por turno a mano"
                />
              </div>
            </div>

            <div className="au-result">
              <p className="pre">Lo que dejás de hacer a mano</p>
              <div className="au-figs">
                <div className="fig">
                  <span className="fn">{month.toLocaleString('es-UY')}</span>
                  <span className="fu">h</span>
                  <span className="fl">al mes</span>
                </div>
                <div className="fig">
                  <span className="fn">{year.toLocaleString('es-UY')}</span>
                  <span className="fu">h</span>
                  <span className="fl">al año</span>
                </div>
                <div className="fig hero">
                  <span className="fn">{five.toLocaleString('es-UY')}</span>
                  <span className="fu">h</span>
                  <span className="fl">en 5 años</span>
                </div>
              </div>
              <p className="ctx">En 5 años son <b>≈ {days5.toLocaleString('es-UY')} jornadas</b> de 8 horas recuperadas para vos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Ticker numérico: persigue el objetivo con suavidad (respeta prefers-reduced-motion).
function useTicker(target: number, reduced: boolean) {
  const [value, setValue] = useState(target);
  const raf = useRef<number>();
  const from = useRef(target);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    const start = performance.now();
    const origin = from.current;
    const dur = 640;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, reduced]);
  return value;
}
