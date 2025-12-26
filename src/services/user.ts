import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface UserType {
  id: number;
  name: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  designation?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface ClientOrOutsourceType {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  country?: string;
  [key: string]: any;
}

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
export const createUser = async (params: UserType): Promise<ApiResponse<UserType>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<UserType>>("/user/create", params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user by ID
export const updateUserById = async (id: number, params: Partial<UserType>): Promise<ApiResponse<UserType>> => {
  try {
    const { data } = await axiosApi.put<ApiResponse<UserType>>(`/user/update/${id}`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get employees
export const getEmployees = async (options: string = ""): Promise<ApiResponse<UserType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<UserType[]>>(`/user?${options}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get user by id
export const getUserById = async (id: number): Promise<ApiResponse<UserType>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<UserType>>(`/user/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get clients
export const getClients = async (options: string = ""): Promise<ApiResponse<ClientOrOutsourceType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<ClientOrOutsourceType[]>>(
      `/user/client${options ? `?${options}` : ""}`
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Get outsource
export const getOutsource = async (options: string = ""): Promise<ApiResponse<ClientOrOutsourceType[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<ClientOrOutsourceType[]>>(
      `/user/outsource${options ? `?${options}` : ""}`
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Invite user (client/outsource)
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

// Search clients dropdown
export const searchClient = async (): Promise<ApiResponse<{ label: string; value: number }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ label: string; value: number }[]>>(`/user/client-dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Search users dropdown
export const searchUsersByName = async (): Promise<ApiResponse<{ label: string; value: number }[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<{ label: string; value: number }[]>>(`/user/user-dropdown`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateCurrentUserProfile = async (params: {
  name: string;
  email: string;
  phone?: string;
  mobile_number?: string;
  designation?: string;
  [key: string]: any;
}): Promise<ApiResponse<UserType>> => {
  try {
    // Ensure mobile_number is sent if phone is provided
    const payload = {
      ...params,
      mobile_number: params.mobile_number || params.phone,
    };
    const { data } = await axiosApi.post<ApiResponse<UserType>>(`/user/profile`, payload);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user password
export const updateCurrentUserPassword = async (params: { password: string }): Promise<ApiResponse<any>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<any>>(`/user/password`, params);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get company details
export const getCurrentUserCompany = async (): Promise<ApiResponse<any>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<any>>(`/user/company`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update company details
export const updateCurrentUserCompany = async (params: any): Promise<ApiResponse<any>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<any>>(`/user/company`, params);
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
export const updateUserStatus = async (params: { user_id: number; is_active: boolean }): Promise<ApiResponse<UserType>> => {
  try {
    const { data } = await axiosApi.patch<ApiResponse<UserType>>(`/user/update/status`, params);
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
