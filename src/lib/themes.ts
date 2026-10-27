/** Must match THEMES in server/src/services/jev.ts. Order here is display order. */
export const THEMES = [
  { key: 'work', label: 'Work' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'family', label: 'Family' },
  { key: 'friends', label: 'Friends' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'health', label: 'Health' },
  { key: 'money', label: 'Money' },
  { key: 'creative', label: 'Creative' },
  { key: 'outdoors', label: 'Outdoors' },
] as const;

export const themeLabel = (key: string) => THEMES.find((t) => t.key === key)?.label ?? key;
