/**
 * TypeScript types mirroring the Supabase database schema.
 * All money values are in integer paise (1 INR = 100 paise).
 */

export interface Member {
  id: string;
  name: string;
  is_admin: boolean;
  active: boolean;
  created_at: string;
}

export interface MemberDevice {
  id: string;
  member_id: string;
  auth_user_id: string;
  linked_at: string;
}

export interface Invite {
  code: string;
  member_id: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  sort: number;
  active: boolean;
}

export interface Expense {
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
}

export interface ExpenseSplit {
  expense_id: string;
  member_id: string;
  share_paise: number;
}

export interface Settlement {
  id: string;
  from_member: string;
  to_member: string;
  amount_paise: number;
  settled_on: string;
  note: string | null;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
}

export type ActivityAction = 'added' | 'edited' | 'deleted' | 'restored' | 'settled';

export interface ActivityLogEntry {
  id: string;
  actor: string | null;
  action: ActivityAction;
  entity: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

// Supabase Database type helpers
export type Database = {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Member, 'id'>>;
        Relationships: [];
      };
      member_devices: {
        Row: MemberDevice;
        Insert: Omit<MemberDevice, 'id' | 'linked_at'> & { id?: string; linked_at?: string };
        Update: Partial<Omit<MemberDevice, 'id'>>;
        Relationships: [];
      };
      invites: {
        Row: Invite;
        Insert: Invite;
        Update: Partial<Invite>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id'> & { id?: string };
        Update: Partial<Omit<Category, 'id'>>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          deleted_by?: string;
        };
        Update: Partial<Omit<Expense, 'id'>>;
        Relationships: [];
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: ExpenseSplit;
        Update: Partial<ExpenseSplit>;
        Relationships: [];
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at' | 'deleted_at'> & {
          id?: string;
          created_at?: string;
          deleted_at?: string;
        };
        Update: Partial<Omit<Settlement, 'id'>>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Omit<ActivityLogEntry, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<ActivityLogEntry, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
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
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
