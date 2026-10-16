import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Trigger OAuth login with Google (Gmail)
 */
export const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  if (!supabase) {
    return { error: new Error('Supabase is not configured yet. Running in Guest Mode.') };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { error: error as Error | null };
};

/**
 * Trigger OAuth login with Microsoft Entra ID (Azure AD)
 */
export const signInWithEntra = async (): Promise<{ error: Error | null }> => {
  if (!supabase) {
    return { error: new Error('Supabase is not configured yet. Running in Guest Mode.') };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: window.location.origin,
      scopes: 'email profile openid'
    }
  });
  return { error: error as Error | null };
};

/**
 * Trigger OAuth login with GitHub
 */
export const signInWithGithub = async (): Promise<{ error: Error | null }> => {
  if (!supabase) {
    return { error: new Error('Supabase is not configured yet. Running in Guest Mode.') };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { error: error as Error | null };
};

/**
 * Sign out user
 */
export const signOutUser = async (): Promise<{ error: Error | null }> => {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error as Error | null };
};

/**
 * Get current session user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
