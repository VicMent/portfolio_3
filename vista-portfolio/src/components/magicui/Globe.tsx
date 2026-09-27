import { useEffect, useRef } from 'react';
import { cn } from '../../utils/helpers';

export interface OrbitItem {
  label: string;
  color: string;
  angle: number;
  distance: number;
}

/**
 * Lightweight canvas globe with orbiting tech labels.
 * Options are read from refs so a parent re-render never restarts the loop.
 */
export function Globe({
  className,
  size = 300,
  rotationSpeed = 0.12,
  showOrbit = true,
  orbitItems = [],
}: {
  className?: string;
  size?: number;
  rotationSpeed?: number;
  showOrbit?: boolean;
  orbitItems?: OrbitItem[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef({ rotationSpeed, showOrbit, orbitItems });
  optionsRef.current = { rotationSpeed, showOrbit, orbitItems };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let rotation = 0;
    let last = performance.now();

    const draw = () => {
      const { rotationSpeed: speed, showOrbit: orbit, orbitItems: items } = optionsRef.current;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.42;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Sphere
      const sphere = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
      sphere.addColorStop(0, '#7cc4ff');
      sphere.addColorStop(0.45, '#0f6fb8');
      sphere.addColorStop(1, '#052a45');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Graticule
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI + rotation * 0.25;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * Math.abs(Math.cos(a)), r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 1; i < 5; i += 1) {
        const y = cy - r + (i / 5) * r * 2;
        const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
        ctx.beginPath();
        ctx.ellipse(cx, y, half, half * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Limelight
      const glow = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.45, 0, cx, cy, r * 1.35);
      glow.addColorStop(0, 'rgba(255,255,255,0.16)');
      glow.addColorStop(1, 'rgba(0,120,215,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      if (orbit) {
        const orbitR = r + size * 0.1;
        items.forEach((item) => {
          const a = item.angle + rotation * 0.4;
          const x = cx + Math.cos(a) * orbitR;
          const y = cy + Math.sin(a) * orbitR * 0.42;

          ctx.beginPath();
          ctx.ellipse(cx, cy, orbitR, orbitR * 0.42, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `${item.color}33`;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = item.color;
          ctx.shadowColor = item.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, x, y - 8);
        });
      }
    };

    const loop = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced.matches) rotation += optionsRef.current.rotationSpeed * delta;
      draw();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <div className={cn('relative', className)}>
      <canvas ref={canvasRef} className="block" role="img" aria-label="Technology orbit diagram" />
    </div>
  );
}
