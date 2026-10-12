-- Row Level Security policies for Hisaab
-- Principle: all data readable/writable only by authenticated members
-- Admin-only tables have additional admin check

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is a linked member
CREATE OR REPLACE FUNCTION is_linked_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM member_devices WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM member_devices md
    JOIN members m ON m.id = md.member_id
    WHERE md.auth_user_id = auth.uid() AND m.is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: get current member_id from auth.uid()
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT member_id FROM member_devices WHERE auth_user_id = auth.uid() LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- MEMBERS: readable by all linked members, writable by admin only
CREATE POLICY members_select ON members FOR SELECT USING (is_linked_member());
CREATE POLICY members_insert ON members FOR INSERT WITH CHECK (is_admin_member());
CREATE POLICY members_update ON members FOR UPDATE USING (is_admin_member());
CREATE POLICY members_delete ON members FOR DELETE USING (is_admin_member());

-- MEMBER_DEVICES: readable by all linked members, writable by admin only
CREATE POLICY member_devices_select ON member_devices FOR SELECT USING (is_linked_member());
CREATE POLICY member_devices_insert ON member_devices FOR INSERT WITH CHECK (is_admin_member());
CREATE POLICY member_devices_update ON member_devices FOR UPDATE USING (is_admin_member());
CREATE POLICY member_devices_delete ON member_devices FOR DELETE USING (is_admin_member());

-- INVITES: readable and writable by admin only
CREATE POLICY invites_select ON invites FOR SELECT USING (is_admin_member());
CREATE POLICY invites_insert ON invites FOR INSERT WITH CHECK (is_admin_member());
CREATE POLICY invites_update ON invites FOR UPDATE USING (is_admin_member());
CREATE POLICY invites_delete ON invites FOR DELETE USING (is_admin_member());

-- CATEGORIES: readable by all linked members, writable by admin only
CREATE POLICY categories_select ON categories FOR SELECT USING (is_linked_member());
CREATE POLICY categories_insert ON categories FOR INSERT WITH CHECK (is_admin_member());
CREATE POLICY categories_update ON categories FOR UPDATE USING (is_admin_member());
CREATE POLICY categories_delete ON categories FOR DELETE USING (is_admin_member());

-- EXPENSES: readable and writable by all linked members
CREATE POLICY expenses_select ON expenses FOR SELECT USING (is_linked_member());
CREATE POLICY expenses_insert ON expenses FOR INSERT WITH CHECK (is_linked_member());
CREATE POLICY expenses_update ON expenses FOR UPDATE USING (is_linked_member());
CREATE POLICY expenses_delete ON expenses FOR DELETE USING (is_linked_member());

-- EXPENSE_SPLITS: readable and writable by all linked members
CREATE POLICY expense_splits_select ON expense_splits FOR SELECT USING (is_linked_member());
CREATE POLICY expense_splits_insert ON expense_splits FOR INSERT WITH CHECK (is_linked_member());
CREATE POLICY expense_splits_update ON expense_splits FOR UPDATE USING (is_linked_member());
CREATE POLICY expense_splits_delete ON expense_splits FOR DELETE USING (is_linked_member());

-- SETTLEMENTS: readable and writable by all linked members
CREATE POLICY settlements_select ON settlements FOR SELECT USING (is_linked_member());
CREATE POLICY settlements_insert ON settlements FOR INSERT WITH CHECK (is_linked_member());
CREATE POLICY settlements_update ON settlements FOR UPDATE USING (is_linked_member());
CREATE POLICY settlements_delete ON settlements FOR DELETE USING (is_linked_member());

-- ACTIVITY_LOG: readable by all linked members, insert only (no edit/delete of audit trail)
CREATE POLICY activity_log_select ON activity_log FOR SELECT USING (is_linked_member());
CREATE POLICY activity_log_insert ON activity_log FOR INSERT WITH CHECK (is_linked_member());
