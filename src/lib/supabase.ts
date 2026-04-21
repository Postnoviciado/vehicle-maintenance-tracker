import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://dtyyzfmjjbuenhbjjnru.supabase.co';
const supabaseAnonKey = 'sb_publishable_MA_Oj369gLmxn0ugb06yfA__EwDpTvm';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};
