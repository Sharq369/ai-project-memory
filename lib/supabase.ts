import { createClient } from '@supabase/supabase-js';

// These MUST have the NEXT_PUBLIC_ prefix to work in the login page
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
