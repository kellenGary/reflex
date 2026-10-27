import { vars } from 'nativewind';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme, View } from 'react-native';

import { readPref, readPrefSync, writePref } from '@/lib/prefs';
import { cssVars, phaseAt, resolvePalette, type Mode, type Palette, type Phase } from '@/theme/palettes';

export type Appearance = 'light' | 'dark' | 'system';
type Prefs = { appearance: Appearance; timeOfDay: boolean };

const KEY = 'lilac.theme.v1';
const DEFAULTS: Prefs = { appearance: 'system', timeOfDay: false };

function parse(raw: string | null): Prefs {
  if (!raw) return DEFAULTS;
  try {
    const p = JSON.parse(raw) as Partial<Prefs>;
    const appearance =
      p.appearance === 'light' || p.appearance === 'dark' || p.appearance === 'system'
        ? p.appearance
        : DEFAULTS.appearance;
    return { appearance, timeOfDay: p.timeOfDay === true };
  } catch {
    return DEFAULTS;
  }
}

type ThemeContextValue = {
  palette: Palette;
  isDark: boolean;
  /** The time-of-day phase being shown, or null when the time-of-day setting is off. */
  phase: Phase | null;
  appearance: Appearance;
  timeOfDay: boolean;
  setAppearance: (a: Appearance) => void;
  setTimeOfDay: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => parse(readPrefSync(KEY)));
  const [now, setNow] = useState(() => new Date());
  const system = useColorScheme();

  // Phones read the saved choice asynchronously; the web already has it from the initial state.
  useEffect(() => {
    if (Platform.OS !== 'web') readPref(KEY).then((raw) => setPrefs(parse(raw)));
  }, []);

  // Re-check the time once a minute so the colors drift as the day does.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const mode: Mode = prefs.appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : prefs.appearance;
  const phase = prefs.timeOfDay ? phaseAt(now) : null;
  const palette = useMemo(() => resolvePalette(mode, phase ?? 'day'), [mode, phase]);
  const isDark = mode === 'dark';

  // Keep the browser's own surfaces (overscroll, scrollbars, form controls) in step.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.style.backgroundColor = palette.cream;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [palette.cream, isDark]);

  const update = useCallback((next: Prefs) => {
    setPrefs(next);
    writePref(KEY, JSON.stringify(next));
  }, []);
  const setAppearance = useCallback((appearance: Appearance) => update({ ...prefs, appearance }), [prefs, update]);
  const setTimeOfDay = useCallback((timeOfDay: boolean) => update({ ...prefs, timeOfDay }), [prefs, update]);

  const value = useMemo(
    () => ({
      palette,
      isDark,
      phase,
      appearance: prefs.appearance,
      timeOfDay: prefs.timeOfDay,
      setAppearance,
      setTimeOfDay,
    }),
    [palette, isDark, phase, prefs, setAppearance, setTimeOfDay],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* The CSS variables set here are what bg-cream, text-ink, etc. resolve to throughout the app. */}
      <View style={[{ flex: 1, backgroundColor: palette.cream }, vars(cssVars(palette))]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** The current palette, for SVG and other code that can't use classNames. */
export const useColors = (): Palette => useTheme().palette;
