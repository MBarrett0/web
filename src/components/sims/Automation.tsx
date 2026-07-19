import { useEffect, useMemo, useRef, useState } from 'react';
import './automation.css';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// COPY — editable. Cada fila tiene su versión "a mano" y su versión "resuelta".
const ROWS = [
  { manual: { t: '14 mensajes sin responder en WhatsApp', s: 'Pendiente' }, auto: { t: '0 mensajes pendientes', s: 'Respondido al instante' } },
  { manual: { t: 'Turno superpuesto a las 15:00', s: 'Sin resolver' }, auto: { t: 'Agenda optimizada, sin choques', s: 'Ordenado' } },
  { manual: { t: 'Cliente sin confirmar el jueves', s: 'Alerta' }, auto: { t: '3 recordatorios enviados hoy', s: 'Automático' } },
];

const WEEKS_PER_MONTH = 52 / 12;
const WORKDAY_H = 8;

const Check = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6.5 4.6 9 10 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Automation() {
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();
  const root = useRef<HTMLElement>(null);

  const [mode, setMode] = useState<'manual' | 'auto'>(reduced ? 'auto' : 'manual');
  const [playKey, setPlayKey] = useState(0); // reinicia el pulso al pasar a auto
  const userTouched = useRef(false);

  const go = (m: 'manual' | 'auto') => {
    userTouched.current = true;
    if (m === 'auto') setPlayKey((k) => k + 1);
    setMode(m);
  };

  // Reveal pasivo: entra en Manual y, si el visitante no toca nada, muestra solo la paz.
  useEffect(() => {
    if (reduced || !root.current) return;
    const el = root.current;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          t = setTimeout(() => {
            if (!userTouched.current) { setPlayKey((k) => k + 1); setMode('auto'); }
          }, 1500);
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
  const hours = useMemo(
    () => Math.round((turnos * WEEKS_PER_MONTH * minutos) / 60),
    [turnos, minutos],
  );
  const days = useMemo(() => Math.max(1, Math.round(hours / WORKDAY_H)), [hours]);
  const shownHours = useTicker(hours, reduced);

  const isAuto = mode === 'auto';
  const load = isAuto ? 8 : 85;

  return (
    <section id="automatizacion" className="au" ref={root}>
      <div className="au-inner">
        <header className="au-head">
          <p className="au-kicker">Automatización de servicios</p>
          <h2 className="au-title">
            Un día cualquiera del negocio, <b>con y sin el sistema andando.</b>
          </h2>
          <p className="au-sub">
            Movés el interruptor y ves el mismo día de dos maneras: el que corrés vos a mano
            y el que se resuelve solo, en silencio.
          </p>
        </header>

        <div className={`au-card ${isAuto ? 'is-auto' : 'is-manual'}`}>
          <div className="au-card-top">
            <div className="au-switch" role="group" aria-label="Modo de operación">
              <button className={!isAuto ? 'on' : ''} aria-pressed={!isAuto} onClick={() => go('manual')}>Manual</button>
              <button className={isAuto ? 'on' : ''} aria-pressed={isAuto} onClick={() => go('auto')}>Automatizado</button>
              <span className="au-switch-thumb" data-mode={mode} aria-hidden="true" />
            </div>

            <div className="au-load">
              <div className="au-load-head">
                <span className="k">Carga del día</span>
                <span className="au-load-tag">{isAuto ? 'Al día' : 'Carga alta'}</span>
              </div>
              <div className="au-load-bar"><span style={{ width: `${load}%` }} /></div>
            </div>
          </div>

          <div className="au-flow">
            <div className="au-line" aria-hidden="true">
              <span className="au-travel" key={playKey} />
              <span className="au-glow" />
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ROWS.map((r, i) => (
                <li className="au-node" key={i}>
                  <span className="au-dot" style={isAuto ? { transitionDelay: `${0.15 + i * 0.45}s` } : undefined}>
                    <Check />
                  </span>
                  <span className="txt">
                    <span className="au-state manual" aria-hidden={isAuto}>
                      <span className="t">{r.manual.t}</span>
                      <span className="s">{r.manual.s}</span>
                    </span>
                    <span className="au-state auto" aria-hidden={!isAuto}>
                      <span className="t">{r.auto.t}</span>
                      <span className="s">{r.auto.s}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Resumen de ahorro ── */}
        <div className="au-save">
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

// Ticker numérico: persigue el objetivo con suavidad mientras arrastrás y se
// fija apenas soltás (respeta prefers-reduced-motion).
function useTicker(target: number, reduced: boolean) {
  const [value, setValue] = useState(target);
  const raf = useRef<number>();
  const from = useRef(target);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    const start = performance.now();
    const origin = from.current;
    const dur = 380;
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
