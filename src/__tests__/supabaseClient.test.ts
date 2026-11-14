import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const makeAuthMock = () => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'learner@basicrussian.org' } } }),
});

const loadModule = async (env: { url?: string; key?: string }, auth = makeAuthMock()) => {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', env.url ?? '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', env.key ?? '');
  const createClient = vi.fn().mockReturnValue({ auth });
  vi.doMock('@supabase/supabase-js', () => ({ createClient }));
  const mod = await import('../services/supabaseClient');
  return { mod, auth, createClient };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
});

describe('supabaseClient - URL validation & guest mode', () => {
  it('validates strict HTTPS URLs via isSafeHttpsUrl', async () => {
    const { mod } = await loadModule({});
    expect(mod.isSafeHttpsUrl('https://project.supabase.co')).toBe(true);
    expect(mod.isSafeHttpsUrl('https://cdn.example.com/avatar.png')).toBe(true);
    expect(mod.isSafeHttpsUrl('http://insecure.supabase.co')).toBe(false);
    expect(mod.isSafeHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(mod.isSafeHttpsUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(mod.isSafeHttpsUrl('not a valid url')).toBe(false);
    expect(mod.isSafeHttpsUrl('')).toBe(false);
    expect(mod.isSafeHttpsUrl(null)).toBe(false);
    expect(mod.isSafeHttpsUrl(undefined)).toBe(false);
  });

  it('reports unconfigured and exports a null client when env vars are missing or insecure', async () => {
    const empty = await loadModule({});
    expect(empty.mod.isSupabaseConfigured()).toBe(false);
    expect(empty.mod.supabase).toBeNull();
    expect(empty.createClient).not.toHaveBeenCalled();

    const insecure = await loadModule({ url: 'http://project.supabase.co', key: 'anon-key' });
    expect(insecure.mod.isSupabaseConfigured()).toBe(false);
    expect(insecure.mod.supabase).toBeNull();

    const noKey = await loadModule({ url: 'https://project.supabase.co', key: '' });
    expect(noKey.mod.isSupabaseConfigured()).toBe(false);
  });

  it('rejects .env.example placeholder URL and anon key values', async () => {
    const placeholderUrl = await loadModule({ url: 'https://your-project-id.supabase.co', key: 'real-key' });
    expect(placeholderUrl.mod.isSupabaseConfigured()).toBe(false);

    const placeholderKey = await loadModule({ url: 'https://abc.supabase.co', key: 'your-anon-public-key' });
    expect(placeholderKey.mod.isSupabaseConfigured()).toBe(false);
  });

  it.each(['signInWithGoogle', 'signInWithEntra', 'signInWithGithub'] as const)(
    '%s returns a friendly guest-mode error without throwing',
    async (fn) => {
      const { mod } = await loadModule({});
      const result = await mod[fn]();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toMatch(/Guest Mode/i);
    }
  );

  it('signOutUser succeeds quietly and getCurrentUser returns null in guest mode', async () => {
    const { mod } = await loadModule({});
    expect(await mod.signOutUser()).toEqual({ error: null });
    expect(await mod.getCurrentUser()).toBeNull();
  });
});

describe('supabaseClient - configured cloud mode', () => {
  const env = { url: 'https://abc.supabase.co', key: 'valid-anon-key' };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, origin: 'https://basicrussian.org' },
      writable: true,
    });
  });

  it('creates the Supabase client with persistent auto-refreshing session config', async () => {
    const { mod, createClient } = await loadModule(env);
    expect(mod.isSupabaseConfigured()).toBe(true);
    expect(mod.supabase).not.toBeNull();
    expect(createClient).toHaveBeenCalledWith('https://abc.supabase.co', 'valid-anon-key', {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    });
  });

  it('triggers Google, GitHub, and Microsoft Entra OAuth with correct redirect and scopes', async () => {
    const { mod, auth } = await loadModule(env);

    expect((await mod.signInWithGoogle()).error).toBeNull();
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://basicrussian.org' },
    });

    expect((await mod.signInWithGithub()).error).toBeNull();
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: 'https://basicrussian.org' },
    });

    expect((await mod.signInWithEntra()).error).toBeNull();
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'azure',
      options: { redirectTo: 'https://basicrussian.org', scopes: 'email profile openid' },
    });
  });

  it('surfaces OAuth and signOut errors cleanly and resolves getCurrentUser', async () => {
    const auth = makeAuthMock();
    const oauthErr = new Error('provider disabled');
    auth.signInWithOAuth.mockResolvedValue({ error: oauthErr });
    const { mod } = await loadModule(env, auth);

    expect((await mod.signInWithGoogle()).error).toBe(oauthErr);
    expect((await mod.signInWithEntra()).error).toBe(oauthErr);
    expect((await mod.signInWithGithub()).error).toBe(oauthErr);

    expect(await mod.getCurrentUser()).toEqual({ id: 'u1', email: 'learner@basicrussian.org' });

    expect(await mod.signOutUser()).toEqual({ error: null });
    const signOutErr = new Error('network error');
    auth.signOut.mockResolvedValue({ error: signOutErr });
    expect((await mod.signOutUser()).error).toBe(signOutErr);
  });
});
