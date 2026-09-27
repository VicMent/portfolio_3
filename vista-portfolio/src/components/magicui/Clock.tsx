import { useEffect, useState } from 'react';

/** Taskbar clock. Updates on the minute boundary rather than every second. */
export function Clock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, delay + 250);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);

  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <time
      dateTime={now.toISOString()}
      title={now.toString()}
      className={`flex flex-col items-end justify-center leading-tight ${className}`}
    >
      <span className="text-[12px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
        {time}
      </span>
      <span className="text-[10px] text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
        {date}
      </span>
    </time>
  );
}
