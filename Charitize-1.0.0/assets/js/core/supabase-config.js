/**
 * Supabase Global Configuration
 * Wrapped in an IIFE to prevent "already declared" errors on double-load.
 */
(function () {
    // Guard: Skip if already initialized
    if (window.supabase && typeof window.supabase.from === 'function') {
        return;
    }

    var SUPABASE_URL = 'https://coouawibolviluoudyam.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb3Vhd2lib2x2aWx1b3VkeWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk4OTQsImV4cCI6MjA4ODI2NTg5NH0.keYEIikIzJJcT66aKHmpaBC4_rdUBZrVwFZSmCO_ZWE';

    // The Supabase CDN script exposes a global `supabase` namespace with `createClient`
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized ✓');
    } else {
        console.error('Supabase SDK not loaded. Ensure the CDN script loads before this file.');
    }
})();
