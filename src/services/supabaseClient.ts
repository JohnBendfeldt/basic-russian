import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEFAULT_GOOGLE_CLIENT_ID = '905048514453-nvuv8q589bhkv121o1lugquu19u2dgsc.apps.googleusercontent.com';
const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID !== undefined
    ? import.meta.env.VITE_GOOGLE_CLIENT_ID
    : DEFAULT_GOOGLE_CLIENT_ID;
export const GOOGLE_NONCE_STORAGE_KEY = 'bls_google_oauth_nonce';

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const isSafeHttpsUrl = (value?: string | null): boolean => {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey || !isSafeHttpsUrl(supabaseUrl)) {
    return false;
  }
  if (
    supabaseUrl.includes('your-project-id.supabase.co') ||
    supabaseAnonKey === 'your-anon-public-key'
  ) {
    return false;
  }
  return true;
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
  const redirectTo = window.location.origin;

  if (googleClientId && typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
    try {
      const rawNonce = crypto.randomUUID();
      sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, rawNonce);
      const hashedNonce = await sha256Hex(rawNonce);

      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: `${redirectTo.replace(/\/+$/, '')}/`,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: hashedNonce,
        prompt: 'select_account',
      });

      window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
      return { error: null };
    } catch {
      // Fallback to standard Supabase OAuth if crypto.subtle, sessionStorage, or navigation is unavailable
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });
  return { error: error as Error | null };
};

export const consumeGoogleIdTokenFromHash = async (): Promise<void> => {
  if (!supabase || typeof window === 'undefined' || !window.location.hash) return;
  const rawHash = window.location.hash.substring(1);
  if (!rawHash.includes('id_token=')) return;

  const params = new URLSearchParams(rawHash);
  const idToken = params.get('id_token');
  if (!idToken || params.get('access_token')) return;

  let rawNonce: string | undefined;
  try {
    rawNonce = sessionStorage.getItem(GOOGLE_NONCE_STORAGE_KEY) || undefined;
    sessionStorage.removeItem(GOOGLE_NONCE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }

  if (typeof window.history?.replaceState === 'function') {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: rawNonce,
  });

  if (error && rawNonce) {
    await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
  }
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
