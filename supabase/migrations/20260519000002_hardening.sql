-- Hardening Row Level Security (RLS) for privacy and security

-- Drop existing loose policies if any (based on previous migrations)
-- Users hardening
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
CREATE POLICY "Profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can only update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Posts hardening
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Public posts are viewable by everyone" ON posts FOR SELECT 
  USING (visibility = 'public' OR auth.uid() = user_id);
CREATE POLICY "Users can only manage their own posts" ON posts FOR ALL 
  USING (auth.uid() = user_id);

-- Interactions hardening
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can only manage their own likes" ON likes FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can only manage their own comments" ON comments FOR ALL 
  USING (auth.uid() = user_id);

-- Post Media hardening (Fixing CRITICAL leakage bug)
DROP POLICY IF EXISTS "Media is viewable by everyone" ON post_media;
CREATE POLICY "Media is viewable if post is public or user owns post" ON post_media 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_media.post_id 
      AND (posts.visibility = 'public' OR posts.user_id = auth.uid())
    )
  );

-- Adding an audit log table for security tracking
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit logs" ON security_audit_logs FOR SELECT USING (false); -- Admin only placeholder
