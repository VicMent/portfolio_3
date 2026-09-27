import { useEffect, useState } from 'react';
import { cn } from '../../utils/helpers';

/** Analogue + digital clock gadget. */
export function ClockGadget({ compact = true }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  if (!compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ClockFace seconds={seconds} minutes={minutes} hours={hours} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <ClockFace seconds={seconds} minutes={minutes} hours={hours} small />
      <div className="min-w-0">
        <p className="font-mono text-[15px] font-semibold text-white tabular-nums">
          {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-[11px] text-white/60">
          {now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}

function ClockFace({
  seconds,
  minutes,
  hours,
  small,
}: {
  seconds: number;
  minutes: number;
  hours: number;
  small?: boolean;
}) {
  const size = small ? 44 : 84;
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--aero-blue)"
          strokeWidth={small ? 2 : 3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - seconds / 60)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[38%] w-[2px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-white/85"
        style={{ transform: `translate(-50%,-100%) rotate(${hours * 30}deg)`, transformOrigin: '50% 100%' }}
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[46%] w-[1.5px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-white/70"
        style={{ transform: `translate(-50%,-100%) rotate(${minutes * 6}deg)`, transformOrigin: '50% 100%' }}
      />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
    </div>
  );
}
