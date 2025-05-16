import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://rtoebzgsmpfyrbnxbahr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0b2ViemdzbXBmeXJibnhiYWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNTk3MzksImV4cCI6MjA2MjkzNTczOX0.5LHD09_3DSXjnxJGmoV4ceyWHdCemR2JRrxtxAIVZlU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};