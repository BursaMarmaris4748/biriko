import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://zvcveujspwpfthyqqsaz.supabase.co';
const supabaseAnonKey = 'sb_publishable_Rbklw1jab3mikWf6ZDL3qg_i1xbWd69';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
