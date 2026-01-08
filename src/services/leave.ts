import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface LeaveType {
    id: number;
    user_id: number;
    company_id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    day_type?: string;
    reason?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
    days: number;
    days_count?: number;
    user?: {
        id: number;
        name: string;
        avatar?: string;
    };
    created_at?: string;
    [key: string]: unknown;
}

// Get leaves (user's own leaves)
export const getLeaves = async (options: string = ""): Promise<ApiResponse<LeaveType[]>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<LeaveType[]>>(`/leaves/requests?${options}`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Get company leaves (all leaves in company - for admins/managers)
export const getCompanyLeaves = async (): Promise<ApiResponse<LeaveType[]>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<LeaveType[]>>(`/leaves/requests/company`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Get leave by id
export const getLeaveById = async (id: number): Promise<ApiResponse<LeaveType>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<LeaveType>>(`/leaves/requests/${id}`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Get leave balance for current user
export const getLeaveBalance = async (): Promise<ApiResponse<Array<{ leave_type: string; used: number }>>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<Array<{ leave_type: string; used: number }>>>(`/leaves/balance`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Update leave request status (approve/reject)
export const updateLeaveStatus = async (id: number, status: "APPROVED" | "REJECTED"): Promise<ApiResponse<LeaveType>> => {
    try {
        const { data } = await axiosApi.patch<ApiResponse<LeaveType>>(`/leaves/${id}/${status}`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Apply for leave
export interface ApplyLeaveDto {
    start_date: string;
    end_date: string;
    day_type?: string;
    leave_type: string;
    reason?: string;
}

export const applyForLeave = async (payload: ApplyLeaveDto): Promise<ApiResponse<LeaveType>> => {
    try {
        const { data } = await axiosApi.post<ApiResponse<LeaveType>>(`/leaves`, payload);
        return data;
    } catch (error) {
        throw error;
    }
};
