-- Fix Bug #2: User Stats Out of Memory Risk
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'totalNodes', (SELECT count(*) FROM public.posts WHERE user_id = p_user_id),
    'nightsLogged', (
      SELECT count(*) FROM public.posts 
      WHERE user_id = p_user_id 
      AND (EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') >= 21 OR EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') < 6)
    ),
    'timelineFlow', (
      (SELECT count(*) FROM public.likes l JOIN public.posts p ON l.post_id = p.id WHERE p.user_id = p_user_id) +
      (SELECT count(*) FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE p.user_id = p_user_id)
    ),
    'milestones', (SELECT count(*) FROM public.posts WHERE user_id = p_user_id AND location IS NOT NULL)
  );
$$;

-- Fix Bug #4: Active Stories Parameter Exhaustion Risk
CREATE OR REPLACE FUNCTION public.get_active_stories_for_user(p_user_id uuid)
RETURNS SETOF jsonb
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'id', s.id,
    'media_url', s.media_url,
    'media_type', s.media_type,
    'expires_at', s.expires_at,
    'created_at', s.created_at,
    'user', jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'avatar_url', u.avatar_url
    )
  )
  FROM public.stories s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.expires_at > NOW()
    AND (
      s.user_id = p_user_id OR 
      s.user_id IN (SELECT following_id FROM public.follows WHERE follower_id = p_user_id)
    )
  ORDER BY s.created_at ASC;
$$;
