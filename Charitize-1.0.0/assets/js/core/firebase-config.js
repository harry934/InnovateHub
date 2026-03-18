/**
 * Firebase Configuration — HOSTING ONLY
 * Firebase Auth has been removed. Supabase handles all authentication.
 * Firebase is kept only for hosting deployment.
 *
 * Analytics are loaded passively via the Firebase Hosting auto-snippet.
 * No Firebase SDK imports are needed here anymore.
 */

// This file is intentionally minimal.
// Firebase Hosting injects its own analytics snippet automatically.
// All authentication now uses Supabase (see supabase-config.js).

// Stub exports so any legacy imports don't throw errors during the transition.
export const auth = null;
export const googleProvider = null;
export const analytics = null;
