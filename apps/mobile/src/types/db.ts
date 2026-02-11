// Database types for Supabase tables

export interface Household {
  id: string;
  name: string | null;
  created_by: string | null;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null; // Nullable for placeholder partners
  display_name: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Child {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
}

export interface ScheduleAssignment {
  id: string;
  household_id: string;
  child_id: string;
  date: string; // YYYY-MM-DD format
  slot: 'dropoff' | 'pickup';
  assigned_user_id: string | null;
  updated_by: string;
  created_at: string;
}

export interface EquipmentStatus {
  id: string;
  household_id: string;
  item_key: string;
  status: 'ok' | 'missing';
  updated_at: string;
  updated_by: string;
}

// RPC function parameter types
export interface BootstrapHouseholdParams {
  p_name?: string | null;
  p_my_display_name: string;
  p_partner_display_name?: string | null;
}

export interface AcceptHouseholdInviteParams {
  invite_code: string;
  display_name?: string | null;
}

// RPC function return types
export interface BootstrapHouseholdResult {
  household_id: string;
  child_id: string;
}
