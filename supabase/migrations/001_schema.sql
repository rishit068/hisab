-- Hisaab: Shared Expense App Schema
-- All money stored as integer paise (1 INR = 100 paise)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table: exactly 6 people
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member devices: links auth sessions to members (max 2 per member)
CREATE TABLE member_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites: single-use invite codes
CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES members(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL
);

-- Categories for expenses
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Expenses: core table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  paid_by UUID NOT NULL REFERENCES members(id),
  category_id UUID REFERENCES categories(id),
  expense_date DATE NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL REFERENCES members(id)
);

-- Expense splits: how an expense is divided
CREATE TABLE expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  share_paise BIGINT NOT NULL,
  PRIMARY KEY (expense_id, member_id)
);

-- Settlements: payment records between members
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_member UUID NOT NULL REFERENCES members(id),
  to_member UUID NOT NULL REFERENCES members(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  settled_on DATE NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Activity log: audit trail for all changes
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor UUID REFERENCES members(id),
  action TEXT NOT NULL, -- 'added' | 'edited' | 'deleted' | 'restored' | 'settled'
  entity TEXT NOT NULL, -- table name
  entity_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_deleted ON expenses(deleted_at);
CREATE INDEX idx_expense_splits_member ON expense_splits(member_id);
CREATE INDEX idx_settlements_from ON settlements(from_member);
CREATE INDEX idx_settlements_to ON settlements(to_member);
CREATE INDEX idx_settlements_deleted ON settlements(deleted_at);
CREATE INDEX idx_member_devices_member ON member_devices(member_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
