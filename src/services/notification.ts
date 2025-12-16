import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  icon: string;
  is_read: boolean;
  created_at: string;
  reference_id?: number;
  reference_type?: string;
}

// Fetch notifications
export const fetchNotifications = async (): Promise<ApiResponse<Notification[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<Notification[]>>("/notifications");
    return data;
  } catch (error) {
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (): Promise<ApiResponse<void>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<void>>("/notifications/mark-read");
    return data;
  } catch (error) {
    throw error;
  }
};

// Mark notification as read
export const markNotificationRead = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<void>>(`/notifications/${id}/read`);
    return data;
  } catch (error) {
    throw error;
  }
};

