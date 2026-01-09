export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  designation?: string;
  is_active?: boolean;
  role?: string;
  role_id?: number;
  roleColor?: string;
  status?: string;
  
  // Nested structure often found in employee responses
  user_employee?: {
    is_active?: boolean;
    role_id?: number;
    role?: { color?: string };
  };
  
  department_id?: number;
  department?: { id: number; name: string } | string; // Sometimes string in some responses
  manager_id?: number | null;
  manager?: { id: number; name: string };
  
  employment_type?: string;
  salary_yearly?: number;
  salary?: number;
  hourly_rates?: number;
  working_hours?: { start_time: string; end_time: string };
  no_of_leaves?: number;
  joining_date?: string;
  experience?: string | number;
  skills?: string[];
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  profile_pic?: string;
  date_of_joining?: string;
  
  // Other observed fields
  employmentType?: string;
  access?: string;
  employee_access?: string;
  employee_type?: string;
  currency?: string;
  leaves?: number;
  workingHours?: number;
  user_profile?: { mobile_number?: string; phone?: string };
  user?: { mobile_number?: string; phone?: string }; // Nested user object sometimes returned
}
