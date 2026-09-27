import { useEffect, useState } from 'react';

interface Weather {
  temp: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
}

/**
 * Static placeholder for Herselt — no API key, no network call, no failed request.
 * Swap in a real forecast endpoint here if you ever want live data.
 */
const WEATHER: Weather = {
  temp: 17,
  condition: 'Partly cloudy',
  icon: '⛅',
  high: 19,
  low: 11,
};

export function WeatherGadget({ compact = true }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="text-3xl leading-none">
        {WEATHER.icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-white">
          {WEATHER.temp}°C
        </p>
        <p className="truncate text-[11px] text-white/60">{WEATHER.condition}</p>
        {!compact && (
          <p className="mt-0.5 text-[10.5px] text-white/45">
            {greeting} · H:{WEATHER.high}° L:{WEATHER.low}°
          </p>
        )}
      </div>
    </div>
  );
}
