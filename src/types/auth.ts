/**
 * Auth and User Session related types
 */

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface CompanyProfile {
  id?: number;
  name: string;
  address?: string;
  website?: string;
  logo?: string;
  email?: string;
  phone?: string;
  description?: string;
  industry?: string;
  size?: string;
  tax_id?: string;
  timezone?: string;
  currency?: string;
  country?: string;
  default_employee_password?: string;
  account_type?: string;
  leaves?: any[]; // Defined more specifically if possible
  working_hours?: {
    start_time?: string;
    end_time?: string;
    working_days?: string[];
    break_time?: string;
    [key: string]: unknown;
  };
  founded?: string;
  // Add flexible index signature only if absolutely needed, but prefer explicit typing
  [key: string]: unknown;
}
