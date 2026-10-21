import { useWindowDimensions } from 'react-native';

/** Matches Tailwind's `lg` (1024px). Use for behaviour that classNames can't express. */
export const LG = 1024;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= LG;
}
