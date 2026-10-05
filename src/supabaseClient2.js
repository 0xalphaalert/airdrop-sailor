import { createClient } from '@supabase/supabase-js';

const supabase2Url = 'https://lrfjeupbfretcfcnqkjg.supabase.co';
const supabase2AnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZmpldXBiZnJldGNmY25xa2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU0NDIsImV4cCI6MjEwMTAxMTQ0Mn0.K68VdEj839idPdSY9RVOLdH_VnO4JWFIwW0yNIOhxY8';

export const supabase2 = createClient(supabase2Url, supabase2AnonKey);