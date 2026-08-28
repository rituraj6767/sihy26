import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

// In-memory fallback for Node.js SSR / static export
const memoryStorage = new Map<string, string>();

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) {
      return memoryStorage.get(key) ?? null;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) {
      memoryStorage.set(key, value);
      return;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage setItem error:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) {
      memoryStorage.delete(key);
      return;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage removeItem error:', e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmardtmvdnqzupafwlmg.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_iNL4-fscJIERMuyJ62ibrw_PNRKyFkF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: !isServer,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
