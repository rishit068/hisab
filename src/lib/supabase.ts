import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Missing Supabase environment variables. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'hisaab-auth',
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export async function validateInviteCode(code: string) {
  const { data, error } = await (supabase.rpc as any)('validate_invite', {
    p_code: code,
  });
  return {
    data: data as { member_name: string; member_id: string }[] | null,
    error,
  };
}

export async function claimInviteCode(code: string) {
  const { data, error } = await (supabase.rpc as any)('claim_invite', {
    p_code: code,
  });
  return {
    data: data as { member_id: string; member_name: string; member_is_admin: boolean }[] | null,
    error,
  };
}
