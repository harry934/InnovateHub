/**
 * Supabase Global Configuration
 * Wrapped in an IIFE to prevent "already declared" errors on double-load.
 */
(function () {
    if (window.supabase && typeof window.supabase.from === 'function') {
        return; // Already initialized — skip entirely
    }

    const SUPABASE_URL = 'https://coouawibolviluoudyam.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb3Vhd2lib2x2aWx1b3VkeWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk4OTQsImV4cCI6MjA4ODI2NTg5NH0.keYEIikIzJJcT66aKHmpaBC4_rdUBZrVwFZSmCO_ZWE';

    const { createClient } = supabase;
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized ✓');
}
)
();
