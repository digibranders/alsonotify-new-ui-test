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
    salary?: number;
    salary_yearly?: number;
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
  late_time?: string;
  
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
  company?: string | { id: number; name: string }; // Company name (from ClientOrOutsourceType) or object
  company_id?: number;
  
  // Partner specific fields
  association_id?: number;
  partner_user_id?: number;
  invite_id?: number;
  associated_date?: string;
  timezone?: string;
  user_id?: number;
}

// Role types for access management
export interface RoleDto {
  id?: number;
  name: string;
  color?: string;
}

export interface PermissionActionDto {
  id: number;
  name: string;
  assigned: boolean;
}

export interface ModuleActionGroupDto {
  module: string;
  actions: PermissionActionDto[];
}

export interface CreateEmployeeRequestDto {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  password?: string;
  department_id?: number;
  role_id?: number;
  designation?: string;
  employment_type?: string;
  salary?: number;
  salary_yearly?: number;
  hourly_rates?: number;
  date_of_joining?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  working_hours?: {
    start_time: string;
    end_time: string;
  };
  no_of_leaves?: number;
  experience?: string | number;
  skills?: string[];
  manager_id?: number;
  profile_pic?: string;
  late_time?: string;
}

export interface UpdateEmployeeRequestDto extends Partial<CreateEmployeeRequestDto> {
  id: number;
  is_active?: boolean;
}

export interface UpdateUserProfileRequestDto {
  name?: string;
  mobile_number?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  profile_pic?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}
