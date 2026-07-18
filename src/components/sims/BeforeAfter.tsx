import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import './before-after.css';

// COPY DE LA SIMULACIÓN — editable
const MSGS = [
  { from: 'Carla', text: '¿Tenés lugar para mañana a la tarde?', bad: 'Sin responder · hace 2 h', ok: 'Respondida al instante · turno confirmado' },
  { from: 'Diego', text: '¿Cuánto sale el servicio completo?', bad: 'Sin responder · hace 3 h', ok: 'Respondida al instante · precio enviado' },
  { from: 'Llamada perdida', text: 'Número desconocido, no dejó mensaje', bad: 'Perdida · sin devolución', ok: 'Derivada a WhatsApp · atendida' },
  { from: 'Romina', text: 'Necesito cancelar el turno del jueves', bad: 'Sin leer · el turno quedó bloqueado', ok: 'Cancelado y reasignado a la lista de espera' },
];

export default function BeforeAfter() {
  const root = useRef<HTMLElement>(null);
  const reduced = typeof window !== 'undefined' && prefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context((self) => {
      const msgs = self.selector!('.ba-msg') as HTMLElement[];
      const badges = self.selector!('.ba-msg .badge') as HTMLElement[];
      const timeEl = self.selector!('.ba-time')[0] as HTMLElement;
      const lostEl = self.selector!('.ba-lost')[0] as HTMLElement;
      const counters = { t: 180, lost: 5 };
      const fmt = (m: number) => (m >= 60 ? `${Math.round(m / 60)} h` : m >= 1 ? `${Math.round(m)} min` : '10 s');

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.to('.ba-title-before', { autoAlpha: 0, y: -14, duration: 0.6 }, 0.15)
        .to('.ba-title-after', { autoAlpha: 1, y: 0, duration: 0.6 }, 0.25);
      msgs.forEach((el, i) => {
        const at = 0.35 + i * 0.14;
        tl.set(el, { className: 'ba-msg ok' }, at);
        tl.set(badges[i], { textContent: MSGS[i].ok }, at);
      });
      tl.to(counters, {
        t: 0.16, lost: 0, duration: 0.55, ease: 'none',
        onUpdate() {
          timeEl.textContent = fmt(counters.t);
          lostEl.textContent = String(Math.round(counters.lost));
        },
      }, 0.35);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="automatizacion" ref={root}>
      <div className={`ba-wrap${reduced ? ' static' : ''}`}>
        <div className="ba-panel">
          <div className="container">
            <p className="kicker">Automatización de servicios</p>
            <div className="ba-titles">
              <h2 className="ba-title-before">Así se ve un martes sin automatizar.</h2>
              <h2 className="ba-title-after" style={reduced ? { opacity: 1, visibility: 'visible' } : undefined}>
                El mismo martes, automatizado.
              </h2>
            </div>
            <div className="ba-grid">
              <div className="ba-msgs">
                {MSGS.map((m) => (
                  <div key={m.from + m.text} className={`ba-msg${reduced ? ' ok' : ''}`}>
                    <p className="from">{m.from}</p>
                    <p className="text">{m.text}</p>
                    <span className="badge">{reduced ? m.ok : m.bad}</span>
                  </div>
                ))}
              </div>
              <div className="ba-stats">
                <div className="ba-stat">
                  <p className="val ba-time">{reduced ? '10 s' : '3 h'}</p>
                  <p className="lbl">Tiempo de respuesta promedio</p>
                </div>
                <div className="ba-stat">
                  <p className="val ba-lost">{reduced ? '0' : '5'}</p>
                  <p className="lbl">Consultas perdidas hoy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
