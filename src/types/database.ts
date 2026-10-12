/**
 * TypeScript types mirroring the Supabase database schema.
 * All money values are in integer paise (1 INR = 100 paise).
 */

export type Member = {
  id: string;
  name: string;
  is_admin: boolean;
  active: boolean;
  created_at: string;
};

export type MemberDevice = {
  id: string;
  member_id: string;
  auth_user_id: string;
  linked_at: string;
};

export type Invite = {
  code: string;
  member_id: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  sort: number;
  active: boolean;
};

export type Expense = {
  id: string;
  title: string;
  amount_paise: number;
  paid_by: string;
  category_id: string | null;
  expense_date: string;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type ExpenseSplit = {
  expense_id: string;
  member_id: string;
  share_paise: number;
};

export type Settlement = {
  id: string;
  from_member: string;
  to_member: string;
  amount_paise: number;
  settled_on: string;
  note: string | null;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
};

export type ActivityAction = 'added' | 'edited' | 'deleted' | 'restored' | 'settled';

export type ActivityLogEntry = {
  id: string;
  actor: string | null;
  action: ActivityAction;
  entity: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

export type ExpenseInsert = {
  id?: string;
  title: string;
  amount_paise: number;
  paid_by: string;
  category_id?: string | null;
  expense_date: string;
  note?: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

export type SettlementInsert = {
  id?: string;
  from_member: string;
  to_member: string;
  amount_paise: number;
  settled_on: string;
  note?: string | null;
  created_by: string;
  created_at?: string;
  deleted_at?: string | null;
};

// Supabase Database type helpers
export type Database = {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: {
          id?: string;
          name: string;
          is_admin?: boolean;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_admin?: boolean;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      member_devices: {
        Row: MemberDevice;
        Insert: {
          id?: string;
          member_id: string;
          auth_user_id: string;
          linked_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          auth_user_id?: string;
          linked_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: Invite;
        Insert: {
          code: string;
          member_id: string;
          created_by: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          code?: string;
          member_id?: string;
          created_by?: string;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          name: string;
          sort?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          sort?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: Partial<ExpenseInsert>;
        Relationships: [];
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: {
          expense_id: string;
          member_id: string;
          share_paise: number;
        };
        Update: {
          expense_id?: string;
          member_id?: string;
          share_paise?: number;
        };
        Relationships: [];
      };
      settlements: {
        Row: Settlement;
        Insert: SettlementInsert;
        Update: Partial<SettlementInsert>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: {
          id?: string;
          actor?: string | null;
          action: ActivityAction;
          entity: string;
          entity_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor?: string | null;
          action?: ActivityAction;
          entity?: string;
          entity_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_invite: {
        Args: { p_code: string };
        Returns: { member_id: string; member_name: string; member_is_admin: boolean }[];
      };
      validate_invite: {
        Args: { p_code: string };
        Returns: { member_name: string; member_id: string }[];
      };
      create_invite: {
        Args: { p_member_id: string };
        Returns: string;
      };
      remove_device: {
        Args: { p_device_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
