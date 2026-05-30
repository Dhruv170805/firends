-- Create sectors table
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sector_members table
CREATE TABLE sector_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'leader' or 'member'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sector_id, user_id)
);

-- Add sector_id to posts
ALTER TABLE posts ADD COLUMN sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX idx_posts_sector_id ON posts(sector_id);
CREATE INDEX idx_sector_members_sector_id ON sector_members(sector_id);
CREATE INDEX idx_sector_members_user_id ON sector_members(user_id);

-- Enable RLS
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_members ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_sector_member(sector_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sector_members
    WHERE sector_members.sector_id = $1 AND sector_members.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.check_is_sector_leader(sector_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sector_members
    WHERE sector_members.sector_id = $1 AND sector_members.user_id = $2 AND sector_members.role = 'leader'
  );
$$;

-- RLS Policies for sectors
CREATE POLICY "Sectors are viewable by members" ON sectors
  FOR SELECT USING (check_is_sector_member(id, auth.uid()));

CREATE POLICY "Users can create sectors" ON sectors
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Sectors can be managed by leaders" ON sectors
  FOR ALL USING (check_is_sector_leader(id, auth.uid()));

-- RLS Policies for sector_members
CREATE POLICY "Sector members are viewable by other members" ON sector_members
  FOR SELECT USING (check_is_sector_member(sector_id, auth.uid()));

CREATE POLICY "Leaders can add/remove members" ON sector_members
  FOR ALL USING (
    check_is_sector_leader(sector_id, auth.uid()) OR
    (
      -- Allow the creator to add themselves as the first leader
      EXISTS (
        SELECT 1 FROM sectors
        WHERE sectors.id = sector_id AND sectors.created_by = auth.uid()
      )
    )
  );

-- Update post policy for sectors
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone if public, or if member of sector" ON posts
  FOR SELECT USING (
    (sector_id IS NULL AND (visibility = 'public' OR auth.uid() = user_id)) OR
    (sector_id IS NOT NULL AND check_is_sector_member(sector_id, auth.uid()))
  );

-- Update post media policy
DROP POLICY IF EXISTS "Media is viewable if post is public or user owns post" ON post_media;
CREATE POLICY "Media is viewable if post is viewable" ON post_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_media.post_id
    )
  );
