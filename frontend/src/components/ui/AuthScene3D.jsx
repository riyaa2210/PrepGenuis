import React, { useEffect, useRef } from 'react';

/* ─── Floating card data ─────────────────────────────────────────────────── */
const CARDS = [
  {
    x: 52, y: 28, z: 0,
    w: 200, h: 110,
    delay: 0,
    content: (
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 10, color: 'rgba(161,161,174,0.7)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Interview Score
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: '#eeeef3', lineHeight: 1 }}>
          8.4<span style={{ fontSize: 13, color: 'rgba(161,161,174,0.6)', fontWeight: 400 }}>/10</span>
        </div>
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #5f62e8, #34d399)', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: 'rgba(161,161,174,0.5)' }}>Technical</span>
          <span style={{ fontSize: 9, color: '#34d399' }}>↑ 1.2 pts</span>
        </div>
      </div>
    ),
  },
  {
    x: 18, y: 52, z: -30,
    w: 180, h: 96,
    delay: 0.4,
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: 'rgba(161,161,174,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          AI Feedback
        </div>
        <div style={{ fontSize: 11, color: 'rgba(238,238,243,0.85)', lineHeight: 1.5 }}>
          "Strong system design answer. Add more specifics on trade-offs."
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
          {['DSA', 'System Design', 'Behavioral'].map((t) => (
            <span key={t} style={{
              fontSize: 8, padding: '2px 6px', borderRadius: 99,
              background: 'rgba(95,98,232,0.15)', color: '#a5b4fc',
              border: '1px solid rgba(95,98,232,0.2)',
            }}>{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    x: 62, y: 62, z: -20,
    w: 160, h: 88,
    delay: 0.8,
    content: (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: 'rgba(161,161,174,0.6)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Round Progress
        </div>
        {[
          { label: 'HR', score: 9, color: '#60a5fa' },
          { label: 'Technical', score: 7, color: '#c084fc' },
          { label: 'Managerial', score: 8, color: '#fbbf24' },
        ].map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: 'rgba(161,161,174,0.6)', width: 52 }}>{r.label}</span>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{ width: `${r.score * 10}%`, height: '100%', background: r.color, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 9, color: r.color, width: 14, textAlign: 'right' }}>{r.score}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    x: 30, y: 20, z: -50,
    w: 148, h: 72,
    delay: 1.2,
    content: (
      <div style={{ padding: '11px 13px' }}>
        <div style={{ fontSize: 9, color: 'rgba(161,161,174,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Real-time Coach
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#34d399',
            boxShadow: '0 0 6px #34d399',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, color: 'rgba(238,238,243,0.8)' }}>
            "Be more concise"
          </span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
          <span style={{ fontSize: 11, color: 'rgba(238,238,243,0.6)' }}>
            "Add an example"
          </span>
        </div>
      </div>
    ),
  },
];

/* ─── Orbiting particles ─────────────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 0.5,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 12 + 8,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.4 + 0.1,
}));

/* ─── Grid lines ─────────────────────────────────────────────────────────── */
function GridLines() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="grid-fade" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask">
          <rect width="100%" height="100%" fill="url(#grid-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
    </svg>
  );
}

/* ─── 3D floating card ───────────────────────────────────────────────────── */
function FloatingCard({ card, mouseX, mouseY }) {
  const depth = (100 + card.z) / 100;
  const parallaxX = (mouseX - 0.5) * 18 * depth;
  const parallaxY = (mouseY - 0.5) * 12 * depth;

  return (
    <div style={{
      position: 'absolute',
      left: `${card.x}%`,
      top: `${card.y}%`,
      width: card.w,
      transform: `
        translate(-50%, -50%)
        translateX(${parallaxX}px)
        translateY(${parallaxY}px)
        translateZ(${card.z}px)
        rotateX(${(mouseY - 0.5) * -8}deg)
        rotateY(${(mouseX - 0.5) * 10}deg)
      `,
      transition: 'transform 0.12s ease-out',
      animation: `float-card ${5 + card.delay}s ease-in-out infinite`,
      animationDelay: `${card.delay}s`,
      zIndex: Math.round(card.z + 60),
    }}>
      <div style={{
        background: 'rgba(17,17,22,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        boxShadow: `
          0 ${8 - card.z * 0.1}px ${24 - card.z * 0.2}px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.07),
          0 0 0 0.5px rgba(255,255,255,0.05)
        `,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Top edge highlight */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        }} />
        {card.content}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AuthScene3D() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [mouse, setMouse] = React.useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);
  const targetRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      targetRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    // Smooth lerp
    const animate = () => {
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.06;
      setMouse({ x: mouseRef.current.x, y: mouseRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', handleMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes float-card {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50%       { transform: translate(-50%, -50%) translateY(-10px); }
        }
        @keyframes particle-drift {
          0%   { transform: translateY(0px) translateX(0px); opacity: var(--op); }
          33%  { transform: translateY(-18px) translateX(8px); }
          66%  { transform: translateY(-8px) translateX(-6px); }
          100% { transform: translateY(0px) translateX(0px); opacity: var(--op); }
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 4px #34d399; opacity: 1; }
          50%       { box-shadow: 0 0 10px #34d399; opacity: 0.7; }
        }
        @keyframes orbit-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit-ring-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.25; transform: scale(1.08); }
        }
        @keyframes scan-line {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0,
          perspective: 800,
          perspectiveOrigin: '50% 50%',
          overflow: 'hidden',
        }}
      >
        {/* Grid */}
        <GridLines />

        {/* Central glow */}
        <div style={{
          position: 'absolute',
          top: '38%', left: '42%',
          width: 320, height: 320,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(95,98,232,0.18) 0%, rgba(95,98,232,0.06) 40%, transparent 70%)',
          borderRadius: '50%',
          animation: 'glow-pulse 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Secondary glow — offset */}
        <div style={{
          position: 'absolute',
          top: '65%', left: '25%',
          width: 200, height: 200,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'glow-pulse 6s ease-in-out infinite',
          animationDelay: '2s',
          pointerEvents: 'none',
        }} />

        {/* Orbit rings */}
        <div style={{
          position: 'absolute',
          top: '38%', left: '42%',
          width: 260, height: 260,
          transform: 'translate(-50%, -50%) rotateX(72deg)',
          animation: 'orbit-ring 18s linear infinite',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            border: '1px solid rgba(95,98,232,0.2)',
            boxShadow: '0 0 12px rgba(95,98,232,0.08)',
          }} />
          {/* Dot on ring */}
          <div style={{
            position: 'absolute', top: -3, left: '50%',
            width: 6, height: 6, borderRadius: '50%',
            background: '#5f62e8',
            boxShadow: '0 0 8px rgba(95,98,232,0.8)',
            transform: 'translateX(-50%)',
          }} />
        </div>

        <div style={{
          position: 'absolute',
          top: '38%', left: '42%',
          width: 380, height: 380,
          transform: 'translate(-50%, -50%) rotateX(72deg)',
          animation: 'orbit-ring-rev 28s linear infinite',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            border: '1px solid rgba(52,211,153,0.12)',
          }} />
          <div style={{
            position: 'absolute', bottom: -3, left: '30%',
            width: 5, height: 5, borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 8px rgba(52,211,153,0.8)',
          }} />
        </div>

        {/* Particles */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.id % 3 === 0 ? '#5f62e8' : p.id % 3 === 1 ? '#34d399' : 'rgba(255,255,255,0.6)',
              opacity: p.opacity,
              '--op': p.opacity,
              animation: `particle-drift ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* 3D scene container */}
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transform: `
            rotateX(${(mouse.y - 0.5) * -6}deg)
            rotateY(${(mouse.x - 0.5) * 8}deg)
          `,
          transition: 'transform 0.08s ease-out',
        }}>
          {CARDS.map((card, i) => (
            <FloatingCard key={i} card={card} mouseX={mouse.x} mouseY={mouse.y} />
          ))}
        </div>

        {/* Scan line effect */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(95,98,232,0.4), rgba(52,211,153,0.3), transparent)',
          animation: 'scan-line 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Corner accents */}
        {[
          { top: 16, left: 16, borderTop: true, borderLeft: true },
          { top: 16, right: 16, borderTop: true, borderRight: true },
          { bottom: 16, left: 16, borderBottom: true, borderLeft: true },
          { bottom: 16, right: 16, borderBottom: true, borderRight: true },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: c.top, right: c.right, bottom: c.bottom, left: c.left,
            width: 20, height: 20,
            borderTop: c.borderTop ? '1px solid rgba(95,98,232,0.35)' : 'none',
            borderBottom: c.borderBottom ? '1px solid rgba(95,98,232,0.35)' : 'none',
            borderLeft: c.borderLeft ? '1px solid rgba(95,98,232,0.35)' : 'none',
            borderRight: c.borderRight ? '1px solid rgba(95,98,232,0.35)' : 'none',
            pointerEvents: 'none',
          }} />
        ))}
      </div>
    </>
  );
}
