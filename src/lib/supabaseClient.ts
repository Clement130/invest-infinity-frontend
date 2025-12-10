import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ ATTENTION : Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas définies. L\'application fonctionne en mode dégradé (UI seule).'
  );
}

// Fallback pour éviter le crash complet de l'UI si les clés manquent
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder';

export const supabase = createClient<Database>(url, key);

