-- Add latitude and longitude to posts for precise mapping
ALTER TABLE posts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add index for spatial queries
CREATE INDEX idx_posts_coordinates ON posts(latitude, longitude) WHERE latitude IS NOT NULL;
