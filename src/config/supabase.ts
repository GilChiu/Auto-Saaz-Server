import { createClient } from '@supabase/supabase-js';
import env from './env';

// Use service role key for server-side operations to bypass RLS
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export { supabase };
export default supabase;