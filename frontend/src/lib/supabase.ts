import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'INSIRA_SUA_ANON_KEY_AQUI') {
    console.warn('⚠️ Supabase URL or Anon Key not configured correctly in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
