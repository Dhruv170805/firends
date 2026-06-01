-- Migration: Fix Sector RLS policies to solve chicken-and-egg

-- 1. Drop the old viewable policy
DROP POLICY IF EXISTS "Sectors are viewable by members" ON sectors;

-- 2. Create the fixed policy that allows creators to see their sectors even before they are members
CREATE POLICY "Sectors are viewable by members or creators" ON sectors
  FOR SELECT USING (
    created_by = auth.uid() OR
    check_is_sector_member(id, auth.uid())
  );

-- 3. Update the RPC to use SECURITY INVOKER so it strictly adheres to RLS
CREATE OR REPLACE FUNCTION public.create_sector_with_leader(
  p_name text,
  p_description text,
  p_created_by uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_sector_id uuid;
  v_sector_record record;
BEGIN
  -- Insert the sector (Passes because created_by matches auth.uid())
  INSERT INTO public.sectors (name, description, created_by)
  VALUES (p_name, p_description, p_created_by)
  RETURNING id, name, description, created_by, created_at INTO v_sector_record;

  v_sector_id := v_sector_record.id;

  -- Insert the creator as the leader (Passes because they can now SELECT the sector they just created)
  INSERT INTO public.sector_members (sector_id, user_id, role)
  VALUES (v_sector_id, p_created_by, 'leader');

  -- Return the sector as JSON
  RETURN row_to_json(v_sector_record)::jsonb;
END;
$$;
