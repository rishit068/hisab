-- Activity log triggers for Hisaab
-- Every add/edit/delete/restore writes to activity_log automatically

-- Generic activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_action TEXT;
  v_entity_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  -- Resolve actor from auth.uid() via member_devices
  SELECT member_id INTO v_actor
  FROM member_devices
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- Determine action and entity_id
  IF TG_OP = 'INSERT' THEN
    v_action := 'added';
    v_entity_id := NEW.id;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := NEW.id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    -- Detect soft delete vs restore vs regular edit
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'deleted';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restored';
    ELSE
      v_action := 'edited';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_entity_id := OLD.id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  INSERT INTO activity_log (actor, action, entity, entity_id, before, after)
  VALUES (v_actor, v_action, TG_TABLE_NAME, v_entity_id, v_before, v_after);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activity logging function for expense_splits (composite PK, no 'id' column)
CREATE OR REPLACE FUNCTION log_activity_splits()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_action TEXT;
  v_entity_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  SELECT member_id INTO v_actor
  FROM member_devices
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    v_action := 'added';
    v_entity_id := NEW.expense_id;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'edited';
    v_entity_id := NEW.expense_id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_entity_id := OLD.expense_id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  INSERT INTO activity_log (actor, action, entity, entity_id, before, after)
  VALUES (v_actor, v_action, 'expense_splits', v_entity_id, v_before, v_after);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on each table
CREATE TRIGGER trg_expenses_activity
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_settlements_activity
  AFTER INSERT OR UPDATE OR DELETE ON settlements
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_categories_activity
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_members_activity
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_expense_splits_activity
  AFTER INSERT OR UPDATE OR DELETE ON expense_splits
  FOR EACH ROW EXECUTE FUNCTION log_activity_splits();
