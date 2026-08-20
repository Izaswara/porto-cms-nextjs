'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_LOC = { lat: -6.2088, lon: 106.8456, city: 'Jakarta' };

const WMO: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Clear' },
  1: { icon: '🌤️', label: 'Mostly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Rime fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy drizzle' },
  61: { icon: '🌧️', label: 'Light rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  66: { icon: '🌧️', label: 'Freezing rain' },
  67: { icon: '🌧️', label: 'Freezing rain' },
  71: { icon: '❄️', label: 'Light snow' },
  73: { icon: '❄️', label: 'Snow' },
  75: { icon: '❄️', label: 'Heavy snow' },
  77: { icon: '❄️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Light showers' },
  81: { icon: '🌧️', label: 'Showers' },
  82: { icon: '🌧️', label: 'Violent showers' },
  85: { icon: '❄️', label: 'Snow showers' },
  86: { icon: '❄️', label: 'Snow showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm' },
  99: { icon: '⛈️', label: 'Thunderstorm' },
};

const weatherInfo = (code: number) =>
  WMO[code] ?? { icon: '🌡️', label: `Code ${code}` };

interface Weather {
  icon: string;
  label: string;
  temp: number;
  city: string;
}

/** Futuristic HUD terminal info (compact, inline — dipasang di dalam MusicBar) */
export default function Hud() {
  const [time, setTime] = useState('00:00:00');
  const [date, setDate] = useState('');
  const [uptime, setUptime] = useState('00:00:00');
  const [scrollY, setScrollY] = useState('0000');
  const [weather, setWeather] = useState<Weather | null>(null);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const start = Date.now();

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setDate(
        now
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .toUpperCase()
      );
      const s = Math.floor((Date.now() - start) / 1000);
      setUptime(
        `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      );
    };
    tick();
    const interval = setInterval(tick, 1000);

    const onScroll = () => setScrollY(String(Math.round(window.scrollY)).padStart(4, '0'));
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const loadWeather = async (lat: number, lon: number) => {
      if (cancelledRef.current) return;
      try {
        const [geoRes, meteoRes] = await Promise.all([
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          ),
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
          ),
        ]);
        if (cancelledRef.current) return;
        const geo = await geoRes.json();
        const meteo = await meteoRes.json();
        const city =
          geo.city ?? geo.locality ?? geo.principalSubdivision ?? 'Your location';
        const current = meteo.current;
        if (!current || typeof current.temperature_2m !== 'number') return;
        const info = weatherInfo(current.weather_code);
        setWeather({
          icon: info.icon,
          label: info.label,
          temp: Math.round(current.temperature_2m),
          city: String(city),
        });
      } catch {
        // offline / gagal fetch — biarkan fallback "SYSTEM ONLINE"
      }
    };

    const locate = () => {
      if (!('geolocation' in navigator)) {
        loadWeather(DEFAULT_LOC.lat, DEFAULT_LOC.lon);
        return;
      }
      const t = setTimeout(() => {
        if (!coordsRef.current) loadWeather(DEFAULT_LOC.lat, DEFAULT_LOC.lon);
      }, 6000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(t);
          coordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          clearTimeout(t);
          loadWeather(DEFAULT_LOC.lat, DEFAULT_LOC.lon);
        },
        { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 6000 }
      );
    };

    locate();
    const refresh = setInterval(() => {
      const c = coordsRef.current ?? DEFAULT_LOC;
      loadWeather(c.lat, c.lon);
    }, 10 * 60 * 1000);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
      clearInterval(refresh);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="hud-inline hidden md:flex" aria-hidden="true">
      <span className="hud-line">
        <span className="hud-dot" />
        {weather ? (
          <>
            {weather.icon} {weather.temp}°C · {weather.city.toUpperCase()}
            <span className="hud-cursor">▮</span>
          </>
        ) : (
          <>
            SYSTEM ONLINE <span className="hud-cursor">▮</span>
          </>
        )}
      </span>
      <span className="hud-time">{time}</span>
      <span className="hud-sub">{date}</span>
      <span className="hud-row">UPTIME {uptime}</span>
      <span className="hud-row">Y:{scrollY}</span>
    </div>
  );
}
