import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Html, ContactShadows, PerformanceMonitor } from '@react-three/drei';
import type { Group } from 'three';
import { prefersReducedMotion } from '../../lib/gsap';
import './laptop3d.css';

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function MiniSite() {
  // COPY — editable
  return (
    <div className="l3d-mini">
      <div className="m-nav"><span>TU&nbsp;NEGOCIO</span><i /></div>
      <div className="m-hero">
        <b>Reservá tu turno<br />en un minuto.</b>
        <p>Atención de martes a sábado. Confirmación inmediata por WhatsApp.</p>
        <span className="m-cta">Reservar ahora</span>
      </div>
      <div className="m-rows"><div className="m-row" /><div className="m-row" /><div className="m-row" /></div>
    </div>
  );
}

function LaptopModel() {
  const g = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) {
      const onMove = (e: PointerEvent) => {
        target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.55;
        target.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
      };
      window.addEventListener('pointermove', onMove);
      return () => window.removeEventListener('pointermove', onMove);
    }
    const onScroll = () => {
      const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      target.current.x = (p - 0.5) * 0.5;
      target.current.y = 0.05;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((_, dt) => {
    if (!g.current) return;
    const k = Math.min(dt * 3.5, 1);
    g.current.rotation.y += (target.current.x - g.current.rotation.y) * k;
    g.current.rotation.x += (target.current.y - g.current.rotation.x) * k;
  });

  return (
    <group ref={g} position={[0, -0.35, 0]}>
      {/* base */}
      <RoundedBox args={[3.3, 0.12, 2.2]} radius={0.05} position={[0, 0, 0.35]}>
        <meshStandardMaterial color="#161927" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      {/* tapa con pantalla, pivote en el borde trasero de la base */}
      <group position={[0, 0.06, -0.72]} rotation={[-0.32, 0, 0]}>
        <RoundedBox args={[3.3, 2.1, 0.09]} radius={0.05} position={[0, 1.05, 0]}>
          <meshStandardMaterial color="#161927" metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <Html transform position={[0, 1.05, 0.055]} distanceFactor={1.35} style={{ pointerEvents: 'none' }}>
          <MiniSite />
        </Html>
      </group>
    </group>
  );
}

export default function Laptop3DStage() {
  const [webgl] = useState(supportsWebGL);
  const [active, setActive] = useState(false);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 2));
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stage.current) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '150px' });
    io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={stage} className="l3d-stage">
      {webgl ? (
        <Canvas frameloop={active ? 'always' : 'never'} dpr={dpr} camera={{ position: [0, 0.7, 4.2], fov: 35 }}>
          <PerformanceMonitor onDecline={() => setDpr(1)}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
            <LaptopModel />
            <ContactShadows position={[0, -0.42, 0.3]} opacity={0.45} blur={2.4} far={2.5} resolution={256} />
          </PerformanceMonitor>
        </Canvas>
      ) : (
        <div className="l3d-fallback"><MiniSite /></div>
      )}
    </div>
  );
}
