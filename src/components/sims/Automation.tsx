import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './automation.css';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// COPY — editable. Notificaciones que se acumulan en el modo manual.
const TOASTS = [
  { icon: 'msg', t: 'Carla — ¿tenés lugar mañana a la tarde?', s: 'sin responder · 2 h' },
  { icon: 'cal', t: 'Turno superpuesto a las 15:00', s: 'se pisa con otro' },
  { icon: 'alert', t: 'Diego no confirmó el turno del jueves', s: 'sin confirmar' },
  { icon: 'bell', t: '3 recordatorios sin enviar', s: 'vencen hoy' },
  { icon: 'phone', t: 'Llamada perdida — número nuevo', s: 'sin devolver' },
];
// Posición de reposo de cada toast en el "montón" (x, y en px, rotación en deg)
const POS = [
  { x: -10, y: 0, r: -3.5 },
  { x: 16, y: 40, r: 2.5 },
  { x: -20, y: 80, r: -2 },
  { x: 12, y: 120, r: 3 },
  { x: -4, y: 160, r: -1.5 },
];
const PENDING = 14;

const WEEKS_PER_MONTH = 52 / 12;
const WORKDAY_H = 8;

const Icon = ({ t }: { t: string }) => {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (t) {
    case 'cal':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><rect x="3" y="4.5" width="14" height="12" rx="2" {...p} /><path d="M3 8h14M7 3v3M13 3v3" {...p} /></svg>);
    case 'alert':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 3.5 18 16.5H2z" {...p} /><path d="M10 8.5v3.5M10 14.3v.2" {...p} /></svg>);
    case 'bell':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M5.5 8a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5H4s1.5-1 1.5-5Z" {...p} /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" {...p} /></svg>);
    case 'phone':
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M6 3.5c.6 2 1.4 3.2 2 3.8-.4 1-1 1.8-1.6 2.3 1 2 2.7 3.7 4.7 4.7.5-.6 1.3-1.2 2.3-1.6.6.6 1.8 1.4 3.8 2-.2 1.4-1.4 2.3-2.8 2.1C10.6 18 4 11.4 3.4 6.3 3.2 4.9 4.1 3.7 5.5 3.5Z" {...p} /></svg>);
    default: // msg
      return (<svg viewBox="0 0 20 20" width="16" height="16"><path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-3.5 3v-3a2 2 0 0 1-1-1.7Z" {...p} /></svg>);
  }
};

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function Automation() {
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();
  const root = useRef<HTMLElement>(null);

  const [mode, setMode] = useState<'manual' | 'auto'>(reduced ? 'auto' : 'manual');
  const [entered, setEntered] = useState(reduced);
  const userTouched = useRef(false);

  const go = (m: 'manual' | 'auto') => { userTouched.current = true; setMode(m); };

  // Reveal pasivo: entra en Manual (tormenta) y, si no tocás nada, colapsa solo a la paz.
  useEffect(() => {
    if (reduced || !root.current) return;
    const el = root.current;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          t = setTimeout(() => { if (!userTouched.current) setMode('auto'); }, 1800);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [reduced]);

  // Calculadora
  const [turnos, setTurnos] = useState(40);
  const [minutos, setMinutos] = useState(10);
  const hours = useMemo(() => Math.round((turnos * WEEKS_PER_MONTH * minutos) / 60), [turnos, minutos]);
  const days = useMemo(() => Math.max(1, Math.round(hours / WORKDAY_H)), [hours]);
  const shownHours = useTicker(hours, reduced);

  const isAuto = mode === 'auto';
  const pending = useTicker(isAuto ? 0 : PENDING, reduced);

  return (
    <section id="automatizacion" className="au" ref={root}>
      <div className="au-inner">
        <header className="au-head">
          <p className="au-kicker">Automatización de servicios</p>
          <h2 className="au-title">
            <span className="lead">Un día cualquiera del negocio,</span> con y sin el sistema andando.
          </h2>
          <p className="au-sub">
            Movés el interruptor y ves el mismo día de dos maneras: el que te llueve encima
            y el que se resuelve solo, en silencio.
          </p>
        </header>

        <div className={`au-card ${isAuto ? 'is-auto' : 'is-manual'}${entered ? ' entered' : ''}`}>
          <div className="au-card-top">
            <div className="au-switch" role="group" aria-label="Modo de operación">
              <button className={!isAuto ? 'on' : ''} aria-pressed={!isAuto} onClick={() => go('manual')}>Manual</button>
              <button className={isAuto ? 'on' : ''} aria-pressed={isAuto} onClick={() => go('auto')}>Automatizado</button>
              <span className="au-switch-thumb" data-mode={mode} aria-hidden="true" />
            </div>

            <div className="au-count" aria-live="polite">
              <span className="au-count-n">{pending}</span>
              <span className="au-count-l">{isAuto ? 'al día' : 'pendientes'}</span>
            </div>
          </div>

          <div className="au-storm">
            <div className="au-pile" aria-hidden={isAuto}>
              {TOASTS.map((t, i) => (
                <div
                  key={t.t}
                  className="au-toast"
                  style={{ '--x': `${POS[i].x}px`, '--y': `${POS[i].y}px`, '--r': `${POS[i].r}deg`, '--d': `${i * 70}ms` } as CSSProperties}
                >
                  <div className="au-toast-in" style={{ animationDelay: `${i * 0.4}s` } as CSSProperties}>
                    <span className="au-toast-ic"><Icon t={t.icon} /></span>
                    <span className="au-toast-tx">
                      <span className="tt">{t.t}</span>
                      <span className="ts">{t.s}</span>
                    </span>
                    <span className="au-toast-dot" />
                  </div>
                </div>
              ))}
            </div>

            <div className="au-calm" aria-hidden={!isAuto}>
              <span className="au-calm-ic"><Check /></span>
              <p className="au-calm-t">Todo al día · 0 pendientes</p>
              <p className="au-calm-s">Respondió, ordenó la agenda y mandó los recordatorios por vos.</p>
            </div>
          </div>
        </div>

        {/* ── Resumen de ahorro (tarjeta aparte) ── */}
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
              <p className="pre">Lo que dejás de hacer a mano cada mes</p>
              <p className="au-figure">
                <span className="n">{shownHours.toLocaleString('es-UY')}</span>
                <span className="u">horas libres</span>
              </p>
              <p className="ctx">Equivalen a <b>≈ {days} {days === 1 ? 'día entero' : 'días enteros'} de trabajo</b> recuperados para vos.</p>
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
