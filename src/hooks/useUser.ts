import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployees,
  getUserById,
  getPartners,
  createUser,
  updateUserById,
  getUserDetails,
  updateCurrentUserProfile,
  updateCurrentUserPassword,
  getCompanyDepartments,
  updateUserStatus,
  inviteUser,
  updateCurrentUserCompany,
  getCurrentUserCompany,
  getRoles,
  upsertRole,
  getRolePermissions,
  updateRolePermissions,
  // updatePassword,
} from "../services/user";
import { UserDto, RoleDto, ModuleActionGroupDto } from "../types/dto/user.dto";
import { ProfileUpdateInput, CompanyUpdateInput } from "../types/genericTypes";

import { mapUserDtoToEmployee, mapUserToDomain } from "../utils/mappers/user";
import { queryKeys } from "../lib/queryKeys";

export const useEmployees = (options: string = "") => {
  return useQuery({
    queryKey: queryKeys.users.employees(options),
    queryFn: () => getEmployees(options),
    staleTime: 5 * 1000, // 5 seconds
    select: (data) => ({
      ...data,
      result: data.result ? data.result.map(mapUserDtoToEmployee) : []
    })
  });
};

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
    select: (data) => ({
      ...data,
      result: data.result ? mapUserDtoToEmployee(data.result) : undefined
    })
  });
};

export const usePartners = (options: string = "") => {
  return useQuery({
    queryKey: queryKeys.users.partners(options),
    queryFn: () => getPartners(options),
    staleTime: 5 * 1000,
  });
};

export const useOutsourcePartners = (options: string = "") => {
  return useQuery({
    queryKey: queryKeys.users.partners(options),
    queryFn: () => getPartners(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};


// ...

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<UserDto>) => createUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employeesRoot() });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: { id: number } & Partial<UserDto>) => updateUserById(id, params),
    onSuccess: (_, variables) => {
      // Invalidate all employee queries (both active and inactive)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employeesRoot() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      // Also invalidate user details if updating current user's own data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ProfileUpdateInput) => updateCurrentUserProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (params: { password: string, currentPassword?: string }) => updateCurrentUserPassword(params),
  });
};

export const useCompanyDepartments = () => {
  return useQuery({
    queryKey: queryKeys.company.departments(),
    queryFn: getCompanyDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { user_id: number; is_active: boolean }) => updateUserStatus(params),
    onSuccess: () => {
      // Invalidate all employee queries (both active and inactive) when status changes
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employeesRoot() });
    },
  });
};

export const useUserDetails = () => {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => getUserDetails(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      ...data,
      result: data.result ? mapUserDtoToEmployee(data.result) : undefined
    })
  });
};

// Invite user
export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { email: string; requestSentFor: string }) =>
      inviteUser(params.email, params.requestSentFor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.clients() });
    },
  });
};

// Create client
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<UserDto>) => createUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.clients() });
    },
  });
};

// Get current user company
export const useCurrentUserCompany = () => {
  return useQuery({
    queryKey: queryKeys.users.company(),
    queryFn: () => getCurrentUserCompany(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update company details
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CompanyUpdateInput) => updateCurrentUserCompany(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.company() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
    },
  });
};
// Get all roles
export const useRoles = () => {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: () => getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};



export const useRolePermissions = (roleId: number | null) => {
  return useQuery({
    queryKey: queryKeys.roles.permissions(roleId),
    queryFn: () => getRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpsertRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<RoleDto>) => upsertRole(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
    },
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, actions }: { roleId: number; actions: number[] }) =>
      updateRolePermissions(roleId, actions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions(variables.roleId) });
    },
  });
};

// End of file

