export interface UserCreate {
  email: string;
  password: string;
  full_name: string | null;
  subscription_id: string; // uuid
}

export interface UserUpdate {
  full_name?: string | null;
  is_active?: boolean | null;
  custom_system_prompt?: string | null;
  role?: string | null;
}

export interface UserRead {
  id: string; // uuid
  email: string;
  full_name: string | null;
  is_active: boolean | null;
  is_superuser: boolean | null;
  role: string;
  created_at: string | null; // datetime string
  updated_at: string | null; // datetime string
  custom_system_prompt: string | null;
}