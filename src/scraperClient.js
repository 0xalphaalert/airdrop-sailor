// src/scraperClient.js
import { createClient } from '@supabase/supabase-js';

const scraperUrl = import.meta.env.VITE_SCRAPER_URL;
const scraperKey = import.meta.env.VITE_SCRAPER_ANON_KEY;

export const scraperDb = createClient(scraperUrl, scraperKey);