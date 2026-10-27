import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/* Tiny key/value store for on-device preferences: localStorage on the web, the secure store on phones. */

export function readPrefSync(key: string): string | null {
  if (Platform.OS !== 'web') return null;
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null; // private mode or blocked storage
  }
}

export async function readPref(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return readPrefSync(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writePref(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // a preference that does not persist is not worth an error
  }
}
