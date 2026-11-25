import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { motion } from '@/lib/motion';

/** Chart entrance length — two "slow" motion steps: long enough to read as growth, never a wait. */
export const CHART_ENTRANCE_MS = motion.duration.slow * 2;

/**
 * Entrance progress 0 → 1 (ease-out cubic) for SVG charts, replayed whenever `trigger` changes (new range
 * or data). Plain requestAnimationFrame state so it behaves the same on iOS, Android and the web build;
 * with Reduce Motion on it is 1 straight away.
 */
export function useChartProgress(trigger: unknown, duration: number = CHART_ENTRANCE_MS): number {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return undefined;
    }
    let frame = 0;
    const startedAt = Date.now();
    setProgress(0);
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trigger, reduced, duration]);

  return progress;
}
