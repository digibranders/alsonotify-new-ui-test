import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface MeetingType {
    id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    duration?: string;
    meeting_link?: string;
    platform?: string;
    status?: "scheduled" | "cancelled" | "completed";
    participants?: unknown[]; // Adjust based on actual response
    organizer?: unknown;
    [key: string]: unknown;
}

// Get meetings
export const getMeetings = async (options: string = ""): Promise<ApiResponse<MeetingType[]>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<MeetingType[]>>(`/meeting?${options}`);
        return data;
    } catch (error) {
        throw error;
    }
};

// Get meeting by id
export const getMeetingById = async (id: number): Promise<ApiResponse<MeetingType>> => {
    try {
        const { data } = await axiosApi.get<ApiResponse<MeetingType>>(`/meeting/${id}`);
        return data;
    } catch (error) {
        throw error;
    }
};
