import { useRouter, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { isReducedMotion, useTween } from '@/lib/animation';
import { useColors } from '@/state/theme';

type Origin = { x: number; y: number };
type Run = { id: number; href: Href; origin: Origin };

const TransitionContext = createContext<{ go: (href: Href, origin?: Origin) => void } | null>(null);

const STAGGER = 0.1;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function Circle({
  origin,
  diameter,
  color,
  scale,
}: {
  origin: Origin;
  diameter: number;
  color: string;
  scale: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: origin.x - diameter / 2,
        top: origin.y - diameter / 2,
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: color,
        transform: [{ scale }],
      }}
    />
  );
}

/** Phase 1: colour spreads out from where the user pressed until the whole screen is covered. */
// `layers` run back to front. The last is the page colour, so the screen ends fully covered before the swap.
function Expand({
  origin,
  diameter,
  layers,
  onCovered,
}: {
  origin: Origin;
  diameter: number;
  layers: string[];
  onCovered: () => void;
}) {
  const p = useTween(950);
  useEffect(() => {
    if (p >= 1) onCovered();
  }, [p, onCovered]);
  return (
    <>
      {layers.map((color, i) => (
        <Circle
          key={color}
          origin={origin}
          diameter={diameter}
          color={color}
          scale={clamp01((p - i * STAGGER) / (1 - (layers.length - 1) * STAGGER))}
        />
      ))}
    </>
  );
}

/** Phase 2: the new page is underneath. Dissolve the cover so its own animations play into view. */
function Dissolve({
  origin,
  diameter,
  color,
  onDone,
}: {
  origin: Origin;
  diameter: number;
  color: string;
  onDone: () => void;
}) {
  const t = useTween(700, 250);
  useEffect(() => {
    if (t >= 1) onDone();
  }, [t, onDone]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 1 - t }}>
      <Circle origin={origin} diameter={diameter} color={color} scale={1} />
    </View>
  );
}

/**
 * Wraps the app. `go(href, origin)` plays a colour wash that spreads from `origin` (the press point),
 * navigates once the screen is covered, then dissolves to reveal the new page.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const palette = useColors();
  const [run, setRun] = useState<Run | null>(null);
  const [covered, setCovered] = useState(false);

  const go = useCallback(
    (href: Href, origin?: Origin) => {
      if (run) return;
      if (isReducedMotion()) {
        router.push(href);
        return;
      }
      setCovered(false);
      setRun({ id: Date.now(), href, origin: origin ?? { x: width / 2, y: height / 2 } });
    },
    [run, router, width, height],
  );

  const onCovered = useCallback(() => {
    if (!run || covered) return;
    router.push(run.href);
    setCovered(true);
  }, [run, covered, router]);

  const onDone = useCallback(() => {
    setRun(null);
    setCovered(false);
  }, []);

  // Radius needed to reach the farthest corner from the press point.
  const diameter = run
    ? 2 * Math.hypot(Math.max(run.origin.x, width - run.origin.x), Math.max(run.origin.y, height - run.origin.y)) + 4
    : 0;

  return (
    <TransitionContext.Provider value={{ go }}>
      <View style={{ flex: 1 }}>
        {children}
        {run && (
          <View
            key={run.id}
            // Absorb taps while the wash is running so the page underneath can't be double-triggered.
            pointerEvents="auto"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', zIndex: 1000 }}
          >
            {covered ? (
              <Dissolve origin={run.origin} diameter={diameter} color={palette.cream} onDone={onDone} />
            ) : (
              <Expand
                origin={run.origin}
                diameter={diameter}
                layers={[palette.blobSage, palette.blobYellow, palette.blobPeach, palette.cream]}
                onCovered={onCovered}
              />
            )}
          </View>
        )}
      </View>
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside <TransitionProvider>');
  return ctx;
}
