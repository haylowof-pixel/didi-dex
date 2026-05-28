import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};

export const SUPABASE_CONFIG = {
  url: env.VITE_SUPABASE_URL || '',
  anonKey: env.VITE_SUPABASE_ANON_KEY || '',
};

export const isSupabaseConfigured = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function getCurrentSession() {
  if (!supabase) return { session: null, user: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return {
    session: data.session || null,
    user: data.session?.user || null,
  };
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      session: session || null,
      user: session?.user || null,
    });
  });
  return () => data.subscription.unsubscribe();
}

export async function signUpWithEmail({ email, password, displayName, tribeName, avatarUrl }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || '',
        tribe_name: tribeName || '',
        avatar_url: avatarUrl || '',
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail({ email, password }) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function upsertUserProfile({ userId, email, displayName, tribeName, avatarUrl }) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      display_name: displayName || '',
      default_tribe_name: tribeName || '',
      avatar_url: avatarUrl || '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadProfileAvatar({ userId, file }) {
  if (!supabase || !userId || !file) throw new Error('Supabase storage is not configured.');
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'png';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
