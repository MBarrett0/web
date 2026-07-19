import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './automation.css';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// COPY — editable
const TASKS = ['Confirmar turno', 'Enviar recordatorio', 'Actualizar agenda', 'Cargar datos del cliente'];
// Minutos "de reloj" que suma cada tarea hecha a mano (ilustrativo)
const MANUAL_LUMP = [255, 240, 300, 210]; // segundos
const AUTO_MS = 2600; // duración del barrido automático
const IDLE_MS = 2000; // si no clickeás, avanza solo
const WORKDAY_H = 8; // una jornada = 8 h

const Check = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6.5 4.6 9 10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const fmtClock = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const allDone = (arr: boolean[]) => arr.every(Boolean);
const nextIndex = (arr: boolean[]) => arr.findIndex((d) => !d);

export default function Automation() {
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();
  const root = useRef<HTMLElement>(null);

  // ── Estado manual ──────────────────────────────────────────────────────
  const [manual, setManual] = useState<boolean[]>(() =>
    reduced ? TASKS.map(() => true) : TASKS.map(() => false),
  );
  const [manualSec, setManualSec] = useState(reduced ? MANUAL_LUMP.reduce((a, b) => a + b, 0) : 0);
  const [active, setActive] = useState(reduced); // sección en viewport → invita
  const lastAction = useRef(0);

  // ── Estado auto ────────────────────────────────────────────────────────
  const [auto, setAuto] = useState<boolean[]>(() =>
    reduced ? TASKS.map(() => true) : TASKS.map(() => false),
  );
  const [autoProg, setAutoProg] = useState(reduced ? 1 : 0);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoSec, setAutoSec] = useState(3);
  const autoRaf = useRef<number>();

  // ── Calculadora ────────────────────────────────────────────────────────
  const [reservas, setReservas] = useState(40);
  const [minutos, setMinutos] = useState(10);

  const manualComplete = allDone(manual);
  const autoComplete = allDone(auto);

  // Ref espejo del estado manual, para no anidar setState dentro de otro updater
  const manualRef = useRef(manual);
  manualRef.current = manual;

  // Un clic completa la próxima tarea y empuja el reloj
  const processNext = useCallback(() => {
    const prev = manualRef.current;
    const i = nextIndex(prev);
    if (i < 0) return;
    lastAction.current = Date.now();
    const copy = [...prev];
    copy[i] = true;
    manualRef.current = copy;
    setManual(copy);
    setManualSec((s) => s + MANUAL_LUMP[i]);
  }, []);

  const resetManual = useCallback(() => {
    lastAction.current = Date.now();
    const fresh = TASKS.map(() => false);
    manualRef.current = fresh;
    setManual(fresh);
    setManualSec(0);
  }, []);

  // Auto: barrido fluido, tareas solas, reloj mínimo
  const runAuto = useCallback(() => {
    if (reduced) return;
    setAuto(TASKS.map(() => false));
    setAutoProg(0);
    setAutoRunning(true);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / AUTO_MS);
      setAutoProg(p);
      setAutoSec(Math.max(1, Math.round(p * 3)));
      setAuto(TASKS.map((_, i) => p >= (i + 1) / (TASKS.length + 0.15)));
      if (p < 1) {
        autoRaf.current = requestAnimationFrame(tick);
      } else {
        setAuto(TASKS.map(() => true));
        setAutoRunning(false);
      }
    };
    autoRaf.current = requestAnimationFrame(tick);
  }, [reduced]);

  const resetAuto = useCallback(() => {
    if (autoRaf.current) cancelAnimationFrame(autoRaf.current);
    setAuto(TASKS.map(() => false));
    setAutoProg(0);
    setAutoRunning(false);
    setAutoSec(3);
  }, []);

  // ── Viewport: activa la invitación y auto-arranca el lado automático ────
  useEffect(() => {
    if (reduced || !root.current) return;
    const el = root.current;
    let autoTimer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          lastAction.current = Date.now();
          autoTimer = setTimeout(() => runAuto(), 900); // pasivo: el lado bueno se muestra solo
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(autoTimer);
    };
  }, [reduced, runAuto]);

  // ── Reloj manual que sube + auto-avance si el visitante no clickea ──────
  useEffect(() => {
    if (reduced || !active || manualComplete) return;
    const id = setInterval(() => {
      setManualSec((s) => s + 3); // el tiempo corre igual mientras hay cola
      if (Date.now() - lastAction.current > IDLE_MS) processNext();
    }, 300);
    return () => clearInterval(id);
  }, [reduced, active, manualComplete, processNext]);

  useEffect(() => () => { if (autoRaf.current) cancelAnimationFrame(autoRaf.current); }, []);

  // ── Cálculo de ahorro ──────────────────────────────────────────────────
  const hours = useMemo(() => Math.round((reservas * minutos * 52) / 60), [reservas, minutos]);
  const days = useMemo(() => Math.round(hours / WORKDAY_H), [hours]);
  const shownHours = useAnimatedNumber(hours, reduced);

  return (
    <section id="automatizacion" className="au" ref={root}>
      <div className="au-inner">
        <header className="au-head">
          <p className="au-kicker">Automatización de servicios</p>
          <h2 className="au-title">
            Las mismas tareas. <b>Una las hacés vos, la otra se hace sola.</b>
          </h2>
          <p className="au-sub">
            Cada reserva arrastra la misma lista de siempre. Mirá lo que cuesta hacerla a mano
            y lo que pesa cuando el sistema la resuelve por vos.
          </p>
        </header>

        <div className="au-cols">
          {/* ── A mano ── */}
          <div className="au-card is-manual">
            <div className="au-card-top">
              <div>
                <p className="au-label">A mano</p>
                <p className="au-cap">Tarea por tarea</p>
              </div>
              <div className="au-clock">
                <p className={`t${manualSec > 0 ? ' up' : ''}`}>{fmtClock(manualSec)}</p>
                <p className="lbl">acumulado esta reserva</p>
              </div>
            </div>

            <ul className="au-tasks">
              {TASKS.map((t, i) => (
                <li key={t} className={`au-task${manual[i] ? ' done' : ''}`}>
                  <span className="tick"><Check /></span>
                  <span className="name">{t}</span>
                  <span className="state">{manual[i] ? 'Hecho' : 'Pendiente'}</span>
                </li>
              ))}
            </ul>

            <div className="au-foot">
              {manualComplete ? (
                <button className="au-reset" onClick={resetManual}>↺ Empezar de nuevo</button>
              ) : (
                <>
                  <button className={`au-btn${active ? ' invite' : ''}`} onClick={processNext}>
                    Procesar <span className="arrow">▸</span>
                  </button>
                  <span className="au-hint">Pulsá por cada tarea</span>
                </>
              )}
            </div>
          </div>

          {/* ── Automatizado ── */}
          <div className="au-card is-auto">
            <div className="au-card-top">
              <div>
                <p className="au-label">Automatizado</p>
                <p className="au-cap">Todo de una</p>
              </div>
              <div className="au-clock">
                <p className="t">{`0:${String(autoSec).padStart(2, '0')}`}</p>
                <p className="lbl">de principio a fin</p>
              </div>
            </div>

            <div className="au-progress"><span style={{ width: `${autoProg * 100}%` }} /></div>

            <ul className="au-tasks">
              {TASKS.map((t, i) => (
                <li key={t} className={`au-task${auto[i] ? ' done' : ''}`}>
                  <span className="tick"><Check /></span>
                  <span className="name">{t}</span>
                  <span className="state">{auto[i] ? 'Listo' : autoRunning ? 'Procesando…' : 'En cola'}</span>
                </li>
              ))}
            </ul>

            <div className="au-foot">
              {autoComplete ? (
                <button className="au-reset" onClick={resetAuto}>↺ Verlo otra vez</button>
              ) : (
                <button className="au-btn" onClick={runAuto} disabled={autoRunning}>
                  Activar automatización
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Resumen de ahorro ── */}
        <div className="au-save">
          <div className="au-save-grid">
            <div className="au-controls">
              <div className="au-control">
                <div className="row">
                  <span className="k">Reservas por semana</span>
                  <span className="v">{reservas}</span>
                </div>
                <input
                  className="au-range" type="range" min={5} max={200} step={5}
                  value={reservas} onChange={(e) => setReservas(Number(e.target.value))}
                  aria-label="Reservas por semana"
                />
              </div>
              <div className="au-control">
                <div className="row">
                  <span className="k">Minutos por reserva a mano</span>
                  <span className="v">{minutos} min</span>
                </div>
                <input
                  className="au-range" type="range" min={2} max={30} step={1}
                  value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}
                  aria-label="Minutos por reserva a mano"
                />
              </div>
            </div>

            <div className="au-result">
              <p className="pre">Lo que dejás de hacer a mano en un año</p>
              <p className="au-figure">
                <span className="n">{shownHours.toLocaleString('es-UY')}</span>
                <span className="u">horas</span>
              </p>
              <p className="days">Son <b>≈ {days} jornadas</b> de 8 horas que le devolvés a tu negocio.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Cuenta suave hacia el valor objetivo (respeta reduced-motion)
function useAnimatedNumber(target: number, reduced: boolean) {
  const [value, setValue] = useState(target);
  const raf = useRef<number>();
  const from = useRef(target);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    const start = performance.now();
    const origin = from.current;
    const dur = 420;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(origin + (target - origin) * eased);
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, reduced]);
  return value;
}
