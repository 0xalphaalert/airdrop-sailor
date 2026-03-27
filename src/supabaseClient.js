import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptobheftxcjiqobxgeal.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2JoZWZ0eGNqaXFvYnhnZWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjU0NzYsImV4cCI6MjA4NDE0MTQ3Nn0.kgs53pdaRHM2G_xsIrw0PbGex-Z-7DuKGfdxBRMRVU8';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});