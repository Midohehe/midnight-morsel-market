import { useEffect, useState } from "react";

export const OPEN_HOUR = 22;
export const CLOSE_HOUR = 5;
export const isOpenAt = (d: Date) => d.getHours() >= OPEN_HOUR || d.getHours() < CLOSE_HOUR;

export function nextChange(d: Date) {
  const n = new Date(d);
  n.setMinutes(0, 0, 0);
  if (isOpenAt(d)) {
    n.setHours(CLOSE_HOUR);
    if (d.getHours() >= OPEN_HOUR) n.setDate(n.getDate() + 1);
  } else n.setHours(OPEN_HOUR);
  return n;
}

export function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(i);
  }, [ms]);
  return now;
}

export function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* audio blocked */ }
}

export const timeAgo = (ts: number, ar: boolean) => {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 60) return ar ? `قبل ${m} د` : `${m}m ago`;
  return ar ? `قبل ${Math.round(m / 60)} س` : `${Math.round(m / 60)}h ago`;
};
