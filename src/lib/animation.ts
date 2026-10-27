import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Respect the OS "reduce motion" setting: animations jump straight to their end state.
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion = v));
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduceMotion = v));

export const isReducedMotion = () => reduceMotion;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function run(from: number, to: number, duration: number, onFrame: (v: number) => void): () => void {
  if (reduceMotion) {
    onFrame(to);
    return () => {};
  }
  let raf = 0;
  let start = 0;
  const tick = (now: number) => {
    if (!start) start = now;
    const t = Math.min(1, (now - start) / duration);
    onFrame(from + (to - from) * easeOut(t));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Progress 0 -> 1 (eased), starting after `delay` ms. Runs once on mount. */
export function useTween(duration = 800, delay = 0): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let cancel = () => {};
    const timer = setTimeout(() => {
      cancel = run(0, 1, duration, setProgress);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancel();
    };
  }, [duration, delay]);
  return progress;
}

/**
 * Follows `target`, sliding from the previous value whenever it changes.
 * Pass `initial` (e.g. 0) to animate in on mount.
 */
export function useTweenedNumber(target: number, duration = 800, delay = 0, initial?: number): number {
  const [value, setValue] = useState(initial ?? target);
  const current = useRef(value);
  useEffect(() => {
    if (current.current === target) return;
    let cancel = () => {};
    const timer = setTimeout(() => {
      cancel = run(current.current, target, duration, (v) => {
        current.current = v;
        setValue(v);
      });
    }, delay);
    return () => {
      clearTimeout(timer);
      cancel();
    };
  }, [target, duration, delay]);
  return value;
}

/**
 * Gentle continuous oscillation in degrees (idle motion like a swaying plant). Period and amplitude
 * can change over time without the phase jumping.
 */
export function useSway(periodMs = 7000, amplitude = 1.2): number {
  const [deg, setDeg] = useState(0);
  const params = useRef({ periodMs, amplitude });
  useEffect(() => {
    params.current = { periodMs, amplitude };
  }, [periodMs, amplitude]);
  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    let last = performance.now();
    let phase = 0;
    const tick = (now: number) => {
      phase += ((now - last) / params.current.periodMs) * 2 * Math.PI;
      last = now;
      setDeg(Math.sin(phase) * params.current.amplitude);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return deg;
}

/** A phase from 0 up to 1 that repeats every `periodMs`. Stays at 0.5 if the system asks for less motion. */
export function useLoop(periodMs: number): number {
  const [phase, setPhase] = useState(reduceMotion ? 0.5 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setPhase(((now - t0) % periodMs) / periodMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [periodMs]);
  return phase;
}
