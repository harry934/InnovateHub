/**
 * Supabase Global Configuration
 * Used for file and document storage
 * NOTE: Loaded AFTER the Supabase CDN script, which exposes `window.supabase` as a namespace object.
 */

const SUPABASE_URL = 'https://coouawibolviluoudyam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb3Vhd2lib2x2aWx1b3VkeWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk4OTQsImV4cCI6MjA4ODI2NTg5NH0.keYEIikIzJJcT66aKHmpaBC4_rdUBZrVwFZSmCO_ZWE';

// The CDN exposes a global `supabase` namespace. createClient is a function on it.
// We overwrite window.supabase with the initialized client instance.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
