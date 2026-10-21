import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
if (!url || !key) {
  throw new Error(
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env (see .env.example), then restart Expo.',
  );
}

// SecureStore values max out around 2KB and a Supabase session is bigger, so split it across several keys.
const CHUNK = 1800;
const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    const count = Number(await SecureStore.getItemAsync(`${name}.n`));
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${name}.${i}`)));
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(name: string, value: string): Promise<void> {
    await this.removeItem(name);
    const parts = value.match(new RegExp(`.{1,${CHUNK}}`, 'gs')) ?? [];
    await Promise.all(parts.map((p, i) => SecureStore.setItemAsync(`${name}.${i}`, p)));
    await SecureStore.setItemAsync(`${name}.n`, String(parts.length));
  },
  async removeItem(name: string): Promise<void> {
    const count = Number(await SecureStore.getItemAsync(`${name}.n`));
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${name}.${i}`)));
    await SecureStore.deleteItemAsync(`${name}.n`);
  },
};

export const supabase = createClient(url, key, {
  auth: {
    // Web uses the browser's localStorage (the default). Phones keep the session in the secure keychain/keystore.
    storage: Platform.OS === 'web' ? undefined : secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
