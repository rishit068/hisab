-- RPC functions for Hisaab

-- Validate an invite code (public, used before claiming)
CREATE OR REPLACE FUNCTION validate_invite(p_code TEXT)
RETURNS TABLE(member_name TEXT, member_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT m.name, m.id
  FROM invites i
  JOIN members m ON m.id = i.member_id
  WHERE i.code = p_code
    AND i.used_at IS NULL
    AND i.expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite link is invalid, expired, or has already been used.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim an invite: link current auth session to a member
CREATE OR REPLACE FUNCTION claim_invite(p_code TEXT)
RETURNS TABLE(member_id UUID, member_name TEXT, member_is_admin BOOLEAN) AS $$
DECLARE
  v_member_id UUID;
  v_member_name TEXT;
  v_member_is_admin BOOLEAN;
  v_device_count INT;
BEGIN
  -- Validate code exists and is unused
  SELECT i.member_id, m.name, m.is_admin
  INTO v_member_id, v_member_name, v_member_is_admin
  FROM invites i
  JOIN members m ON m.id = i.member_id
  WHERE i.code = p_code
    AND i.used_at IS NULL
    AND i.expires_at > NOW()
  FOR UPDATE; -- Lock the row

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'This invite link is invalid, expired, or has already been used.';
  END IF;

  -- Check device count (max 2 for non-admin members, unlimited for admins)
  IF NOT v_member_is_admin THEN
    SELECT COUNT(*) INTO v_device_count
    FROM member_devices
    WHERE member_devices.member_id = v_member_id;

    IF v_device_count >= 2 THEN
      RAISE EXCEPTION 'This person already has 2 devices linked. Please ask the admin to remove a device first.';
    END IF;
  END IF;

  -- Check if this auth user is already linked
  IF EXISTS (SELECT 1 FROM member_devices WHERE auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'This device is already linked to a member.';
  END IF;

  -- Link the device
  INSERT INTO member_devices (member_id, auth_user_id)
  VALUES (v_member_id, auth.uid());

  -- Mark invite as used
  UPDATE invites SET used_at = NOW() WHERE code = p_code;

  -- Return member info
  RETURN QUERY SELECT v_member_id, v_member_name, v_member_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an invite link (admin only)
CREATE OR REPLACE FUNCTION create_invite(p_member_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin_member() THEN
    RAISE EXCEPTION 'Only admins can create invite links.';
  END IF;

  -- Verify target member exists
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_member_id AND active = TRUE) THEN
    RAISE EXCEPTION 'Member not found or inactive.';
  END IF;

  -- Generate a random code
  v_code := encode(gen_random_bytes(16), 'hex');

  -- Insert the invite (expires in 7 days)
  INSERT INTO invites (code, member_id, created_by, expires_at)
  VALUES (v_code, p_member_id, get_current_member_id(), NOW() + INTERVAL '7 days');

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a device (admin only, for lost/stolen device)
CREATE OR REPLACE FUNCTION remove_device(p_device_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin_member() THEN
    RAISE EXCEPTION 'Only admins can remove devices.';
  END IF;

  DELETE FROM member_devices WHERE id = p_device_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Device not found.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
