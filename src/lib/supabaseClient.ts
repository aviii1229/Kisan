import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key from environment variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl: string = metaEnv.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '') || '';
const supabaseAnonKey: string = metaEnv.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : '') || '';

// Helper to check if credentials are configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  );
};

// Create Supabase client for frontend React app
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Health check function to test Supabase connection from frontend
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase credentials are not set in .env file (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
    };
  }

  try {
    const { data, error } = await supabase.from('centres').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: `Supabase connection error: ${error.message}` };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: `Unexpected error connecting to Supabase: ${err.message}` };
  }
};
