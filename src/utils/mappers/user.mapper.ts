import { UserDto } from '../../types/dto/user.dto';
import { Employee } from '../../types/domain';

export function mapUserDtoToEmployee(dto: UserDto): Employee {
  // Access Level / Role
  const access = dto.employee_access || dto.access || (dto.role === 'Admin' ? 'Admin' : 'Employee');
  
  // Employment Type
  let employmentType = dto.employment_type || dto.employmentType || 'Full-time';
  if (employmentType === 'In-house') employmentType = 'Full-time';
  else if (employmentType === 'Freelancer' || employmentType === 'Agency') employmentType = 'Contract';

  // Status
  let status: 'active' | 'inactive' = 'active';
  if (dto.is_active === false) status = 'inactive';
  if (dto.user_employee?.is_active === false) status = 'inactive';
  
  // Phone
  const phone = dto.mobile_number || dto.phone || dto.user_profile?.mobile_number || dto.user_profile?.phone || dto.user?.mobile_number || '';

  // Dates
  const dateOfJoining = dto.date_of_joining ? new Date(dto.date_of_joining).toLocaleDateString('en-GB') : 'N/A';

  return {
    id: dto.id,
    user_id: dto.id, // compatibility
    name: dto.name || '',
    role: dto.designation || dto.role || 'Unassigned',
    email: dto.email || '',
    phone,
    hourlyRate: dto.hourly_rates ? `${dto.hourly_rates}/Hr` : 'N/A',
    hourly_rates: dto.hourly_rates,
    dateOfJoining,
    date_of_joining: dto.date_of_joining,
    experience: dto.experience || 0,
    skillsets: dto.skills?.join(', ') || 'None',
    skills: dto.skills,
    
    status,
    department: typeof dto.department === 'string' ? dto.department : (dto.department?.name || 'Unassigned'),
    access,
    employee_access: access,
    
    managerName: dto.manager?.name || 'N/A',
    manager_id: dto.manager_id || undefined,
    
    salary: dto.salary || dto.salary_yearly || 0,
    currency: dto.currency || 'USD',
    workingHours: dto.workingHours || 0,
    leaves: dto.leaves || dto.no_of_leaves || 0,
    
    roleId: dto.role_id,
    roleColor: dto.roleColor || dto.user_employee?.role?.color,
    
    employmentType,
    profile_pic: dto.profile_pic,
    
    // Address fields if needed
    // ...
  };
}
