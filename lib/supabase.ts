import { createClient } from '@supabase/supabase-js';

// These pull your unique keys from your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This creates the 'client' that Claude will use to send data
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
