import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployees,
  getUserById,
  getClients,
  createUser,
  updateUserById,
  getUserDetails,
  updateCurrentUserProfile,
  getCompanyDepartments,
  updateUserStatus,
  inviteUser,
  updateCurrentUserCompany,
  getCurrentUserCompany,
  type UserType,
  type ClientOrOutsourceType,
  type CompanyDepartmentType,
} from "../services/user";

export const useEmployees = (options: string = "") => {
  return useQuery({
    queryKey: ["employees", options],
    queryFn: () => getEmployees(options),
    staleTime: 5 * 1000, // 5 seconds
  });
};

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

export const useClients = (options: string = "") => {
  return useQuery({
    queryKey: ["clients", options],
    queryFn: () => getClients(options),
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UserType) => createUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: { id: number } & Partial<UserType>) => updateUserById(id, params as any),
    onSuccess: (_, variables) => {
      // Invalidate all employee queries (both active and inactive)
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
      // Also invalidate user details if updating current user's own data
      queryClient.invalidateQueries({ queryKey: ["user", "details"] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: any) => updateCurrentUserProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useCompanyDepartments = () => {
  return useQuery({
    queryKey: ["companyDepartments"],
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
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useUserDetails = () => {
  return useQuery({
    queryKey: ["user", "details"],
    queryFn: () => getUserDetails(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Invite user
export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { email: string; requestSentFor: string }) =>
      inviteUser(params.email, params.requestSentFor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

// Create client
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: any) => createUser(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

// Get current user company
export const useCurrentUserCompany = () => {
  return useQuery({
    queryKey: ["user", "company"],
    queryFn: () => getCurrentUserCompany(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update company details
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: any) => updateCurrentUserCompany(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "company"] });
      queryClient.invalidateQueries({ queryKey: ["user", "details"] });
    },
  });
};
