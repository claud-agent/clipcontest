import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key — never expose to client)
// Uses cache: 'no-store' to prevent Next.js fetch cache from serving stale data.
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
        fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}

// -------------------------------------------------------
// Supabase SQL to create the waitlist table:
// Run this once in your Supabase SQL Editor.
//
// CREATE TABLE waitlist (
//   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   name        text NOT NULL,
//   email       text NOT NULL UNIQUE,
//   role        text NOT NULL CHECK (role IN ('creator', 'participant')),
//   created_at  timestamptz DEFAULT now()
// );
//
// Enable Row Level Security and only allow INSERT from anon:
// ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow insert" ON waitlist FOR INSERT TO anon WITH CHECK (true);
// -------------------------------------------------------
