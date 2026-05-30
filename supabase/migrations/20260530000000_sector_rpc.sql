-- Migration: Create Sector with Leader atomically

CREATE OR REPLACE FUNCTION public.create_sector_with_leader(
  p_name text,
  p_description text,
  p_created_by uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sector_id uuid;
  v_sector_record record;
BEGIN
  -- Insert the sector
  INSERT INTO public.sectors (name, description, created_by)
  VALUES (p_name, p_description, p_created_by)
  RETURNING id, name, description, created_by, created_at INTO v_sector_record;

  v_sector_id := v_sector_record.id;

  -- Insert the creator as the leader
  INSERT INTO public.sector_members (sector_id, user_id, role)
  VALUES (v_sector_id, p_created_by, 'leader');

  -- Return the sector as JSON
  RETURN row_to_json(v_sector_record)::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
