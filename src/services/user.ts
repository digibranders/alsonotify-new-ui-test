/* eslint-disable no-useless-catch */
import axiosApi from "../config/axios";
import { ApiResponse } from "../types/api";
import { ProfileUpdateInput, CompanyUpdateInput } from "../types/genericTypes";
import { CompanyProfile } from "../types/auth";
import { UserDto, RoleDto, ModuleActionGroupDto } from "../types/dto/user.dto";

// Get user details
export const getUserDetails = async () => {
  try {
    const { data } = await axiosApi.get("/user/details");
    return data;
  } catch (error) {
    throw error;
  }
};

// Create user/employee
export const createUser = async (params: Partial<UserDto>): Promise<ApiResponse<UserDto>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<UserDto>>("/user/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user by ID
export const updateUserById = async (id: number, params: Partial<UserDto>): Promise<ApiResponse<UserDto>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<UserDto>>(`/user/update/${id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get employees
export const getEmployees = async (options: string = ""): Promise<ApiResponse<UserDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<UserDto[]>>(`/user?${options}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get user by id
export const getUserById = async (id: number): Promise<ApiResponse<UserDto>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<UserDto>>(`/user/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get partners (using UserDto as base since structure is similar enough for listing)
// Or we could define a specific PartnerDto if needed, but UserDto is flexible.
// Checking ClientOrOutsourceType: id, name, email, company, phone, country. All in UserDto now.
export const getPartners = async (options: string = ""): Promise<ApiResponse<UserDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<UserDto[]>>(
      `/user/partners${options ? `?${options}` : ""}`
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Invite user (partner)
export const inviteUser = async (email: string, requestSentFor: string) => {
  try {
    const { data } = await axiosApi.post("/user/invite", {
      email,
      requestSentFor: requestSentFor,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// Search partners dropdown
export const searchPartners = async (): Promise<ApiResponse<{ label: string; value: number }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ label: string; value: number }[]>>(`/user/partners/dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Search employees dropdown
export const searchEmployees = async (): Promise<ApiResponse<{ label: string; value: number }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ label: string; value: number }[]>>(`/user/user-dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateCurrentUserProfile = async (
  params: ProfileUpdateInput
): Promise<ApiResponse<UserDto>> => {
  try {
    // Ensure mobile_number is sent if phone is provided
    const payload = {
      ...params,
      mobile_number: params.mobile_number || params.phone,
    };
    const { data } = await axiosApi.post<ApiResponse<UserDto>>(`/user/profile`, payload);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user password
export const updateCurrentUserPassword = async (params: { password: string, currentPassword?: string }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<any>>(`/user/password`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get company details
export const getCurrentUserCompany = async (): Promise<ApiResponse<CompanyProfile>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<CompanyProfile>>(`/user/company`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update company details
export const updateCurrentUserCompany = async (params: CompanyUpdateInput): Promise<ApiResponse<CompanyProfile>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<CompanyProfile>>(`/user/company`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get company departments
export interface CompanyDepartmentType {
  id?: number | null;
  name: string;
  company_id: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

export const getCompanyDepartments = async (): Promise<ApiResponse<CompanyDepartmentType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<CompanyDepartmentType[]>>(`/user/company/departments-dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (params: { user_id: number; is_active: boolean }): Promise<ApiResponse<UserDto>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<UserDto>>(`/user/update/status`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update partner status (activate/deactivate)
export const updatePartnerStatus = async (params: { association_id: number; is_active: boolean }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<unknown>>(`/user/partners/status`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get all roles
export const getRoles = async (): Promise<ApiResponse<{ id: number; name: string }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ id: number; name: string }[]>>(`/role`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Accept invitation
export const acceptInvitation = async (token: string) => {
  try {
    const { data } = await axiosApi.post("/auth/accept-invite", { token });
    return data;
  } catch (error) {
    throw error;
  }
};

// Create or update role
export const upsertRole = async (params: Partial<RoleDto>): Promise<ApiResponse<RoleDto>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<RoleDto>>("/role", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get permissions for a role
export const getRolePermissions = async (roleId: number): Promise<ApiResponse<ModuleActionGroupDto[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<ModuleActionGroupDto[]>>(`/role/${roleId}/actions`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update permissions for a role
export const updateRolePermissions = async (roleId: number, actions: number[]): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<unknown>>(`/role/${roleId}/actions`, { actions });
    return data;
  } catch (error) {
    throw error;
  }
};

// Get received invites
export const getReceivedInvites = async (): Promise<ApiResponse<{
  id: number;
  inviterName: string;
  inviterCompany: string;
  inviterImage: string | null;
  type: string;
  date: string
}[]>> => {
  try {
    const { data } = await axiosApi.get("/user/invites/received");
    return data;
  } catch (error) {
    // Gracefully handle missing endpoint or server errors
    console.warn('Failed to fetch received invites:', error);
    return { success: true, message: 'No invites', result: [] };
  }
};

// Accept invite by ID
export const acceptInviteById = async (inviteId: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.post("/user/invite/accept-id", { inviteId });
    return data;
  } catch (error) {
    throw error;
  }
};

// Decline invite by ID
export const declineInviteById = async (inviteId: number): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.post("/user/invite/decline-id", { inviteId });
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete partner (or cancel request)
export const deletePartner = async (params: { userType: 'PARTNER'; partnerUserId?: number; inviteId?: number }): Promise<ApiResponse<unknown>> => {
  try {
    const { data } = await axiosApi.delete<ApiResponse<unknown>>("/user/partners", { data: params });
    return data;
  } catch (error) {
    throw error;
  }
};
