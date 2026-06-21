import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvcveujspwpfthyqqsaz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Rbklw1jab3mikWf6ZDL3qg_i1xbWd69';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
