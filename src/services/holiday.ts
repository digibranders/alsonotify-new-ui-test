
import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface HolidayType {
    id: number;
    name: string;
    date: string; // YYYY-MM-DD format
    company_id?: number;
    is_deleted?: boolean;
    description?: string;
    [key: string]: unknown;
}

export interface CreateHolidayPayload {
    name: string;
    date: string; // YYYY-MM-DD format
    description?: string;
}

// Get public holidays for the company
export const getPublicHolidays = async (): Promise<ApiResponse<HolidayType[]>> => {
    const { data } = await axiosApi.get<ApiResponse<HolidayType[]>>(`/public-holidays`);
    return data;
};

// Create a new public holiday
export const createPublicHoliday = async (payload: CreateHolidayPayload): Promise<ApiResponse<HolidayType>> => {
    const { data } = await axiosApi.post<ApiResponse<HolidayType>>(`/public-holidays`, payload);
    return data;
};

// Update an existing public holiday
export const updatePublicHoliday = async (id: number, payload: CreateHolidayPayload): Promise<ApiResponse<HolidayType>> => {
    const { data } = await axiosApi.put<ApiResponse<HolidayType>>(`/public-holidays/${id}`, payload);
    return data;
};

// Delete a public holiday
export const deletePublicHoliday = async (id: number): Promise<ApiResponse<HolidayType>> => {
    const { data } = await axiosApi.delete<ApiResponse<HolidayType>>(`/public-holidays/${id}`);
    return data;
};

