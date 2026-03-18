-- NUCLEAR REPAIR SCHEMA v3.2: Full Reset for InnovateHub
-- WARNING: This will drop ALL Supabase tables and recreate them.
--
-- IMPORTANT MANUAL STEP: 
-- You must manually create a bucket named 'public-assets' in Supabase Storage.
-- Set it to PUBLIC (so anyone can view images/documents).
--
-- Tables use gen_random_uuid() for better compatibility.

-- 1. CLEAN SLATE (ALMOST)
-- WARNING: THE LINES BELOW ARE COMMENTED FOR SAFETY. 
-- ONLY UNCOMMENT IF YOU WANT TO WIPE ALL YOUR DATA AND START FROM ZERO.
SET search_path TO public;
-- DROP TABLE IF EXISTS mentorship_sessions CASCADE;
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS progress_reports CASCADE;
-- DROP TABLE IF EXISTS section_feedback CASCADE;
-- DROP TABLE IF EXISTS collaboration_comments CASCADE;
-- DROP TABLE IF EXISTS milestone_reports CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS mentorships CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS user_activity CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. BUILD TABLES
-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Firebase User UID
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'innovator',
    status TEXT DEFAULT 'active',
    phone TEXT,
    institution TEXT,
    expertise TEXT,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    organization TEXT,
    motivation TEXT,
    occupation TEXT,
    experience TEXT,
    mentoring_style TEXT,
    industries_of_interest TEXT,
    availability TEXT,
    communication_preference TEXT,
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist for existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mentoring_style TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industries_of_interest TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS communication_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    innovator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    problem_statement TEXT,
    proposed_solution TEXT,
    objectives TEXT,
    expected_impact TEXT,
    target_area TEXT,
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_project_innovator FOREIGN KEY (innovator_id) REFERENCES profiles(id) ON DELETE CASCADE
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Mentorships
CREATE TABLE IF NOT EXISTS mentorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    innovator_id TEXT NOT NULL,
    mentor_id TEXT NOT NULL,
    project_id UUID,
    message TEXT,
    status TEXT DEFAULT 'pending',
    admin_approved BOOLEAN DEFAULT FALSE,
    pinned_guidance TEXT,
    rejection_reason TEXT,
    rejection_requested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_mentorship_innovator FOREIGN KEY (innovator_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentorship_mentor FOREIGN KEY (mentor_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentorship_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS rejection_requested_at TIMESTAMPTZ;
ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS reports_enabled BOOLEAN DEFAULT FALSE;

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_chat_mentorship FOREIGN KEY (mentorship_id) REFERENCES mentorships(id),
    CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES profiles(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone Reports
CREATE TABLE IF NOT EXISTS milestone_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_title TEXT,
    content TEXT,
    reported_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Section Feedback
CREATE TABLE IF NOT EXISTS section_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mentor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    field_id TEXT, 
    comment TEXT,
    stars INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Reports
CREATE TABLE IF NOT EXISTS progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    innovator_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    next_steps TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentorship Sessions
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_session_mentorship FOREIGN KEY (mentorship_id) REFERENCES mentorships(id)
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    event_time TIME,
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Activity (for heatmaps)
CREATE TABLE IF NOT EXISTS user_activity (
    id TEXT PRIMARY KEY, -- uid_YYYY-MM-DD
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT DEFAULT 'login',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SECURITY (Heavy Handed Repair Mode)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- REPAIR POLICIES (Super Permissive for Setup)
DROP POLICY IF EXISTS "Repair_Profiles_All" ON profiles;
CREATE POLICY "Repair_Profiles_All" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Projects_All" ON projects;
CREATE POLICY "Repair_Projects_All" ON projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Mentorships_All" ON mentorships;
CREATE POLICY "Repair_Mentorships_All" ON mentorships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Chat_All" ON chat_messages;
CREATE POLICY "Repair_Chat_All" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Notifications_All" ON notifications;
CREATE POLICY "Repair_Notifications_All" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Reports_All" ON progress_reports;
CREATE POLICY "Repair_Reports_All" ON progress_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Feedback_All" ON section_feedback;
CREATE POLICY "Repair_Feedback_All" ON section_feedback FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Sessions_All" ON mentorship_sessions;
CREATE POLICY "Repair_Sessions_All" ON mentorship_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Events_All" ON events;
CREATE POLICY "Repair_Events_All" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Repair_Activity_All" ON user_activity;
CREATE POLICY "Repair_Activity_All" ON user_activity FOR ALL USING (true) WITH CHECK (true);

-- 5. AUTOMATION (Profile Sync)
-- This function runs every time a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Member'), 
    COALESCE(new.raw_user_meta_data->>'role', 'innovator')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on every signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ONE-TIME REPAIR (Sync existing Auth users to public.profiles)
-- Run this once if you have existing users who are missing profile entries
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Sync Member'), 
    COALESCE(raw_user_meta_data->>'role', 'innovator')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'SUCCESS: Schema restored and accounts synced.' as status;
