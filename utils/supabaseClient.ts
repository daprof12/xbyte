/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client for cross-platform data sync.
 * Replace the placeholder values with your actual Supabase project credentials.
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

// Use environment variables if available, otherwise fallback to info file
const envUrl = import.meta.env?.VITE_SUPABASE_URL;
const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = envUrl || `https://${projectId}.supabase.co`;
const SUPABASE_ANON_KEY = envKey || publicAnonKey;

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: async (name, acquireTimeout, fn) => fn()
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!projectId && !!publicAnonKey;
};

export default supabase;