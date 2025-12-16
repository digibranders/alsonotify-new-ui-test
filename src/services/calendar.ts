import axiosApi from "../config/axios";
import { ApiResponse } from "../constants/constants";

export interface TeamsConnectionStatus {
  connected: boolean;
}

export interface GraphEvent {
  id: string;
  subject: string;
  isOrganizer?: boolean;
  isCancelled?: boolean;
  showAs?: string;
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  organizer?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  attendees?: Array<{
    type?: "required" | "optional" | "resource";
    status?: {
      response?: "none" | "accepted" | "declined" | "tentativelyAccepted";
      time?: string;
    };
    emailAddress: {
      name?: string;
      address: string;
    };
  }>;
  onlineMeeting?: {
    joinUrl?: string;
  };
  webLink?: string;
  [key: string]: any;
}

// Get calendar events (meetings)
export const getCalendarEvents = async (
  startISO: string,
  endISO: string
): Promise<ApiResponse<GraphEvent[]>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<GraphEvent[]>>(
      "/calendar/events",
      { params: { start: startISO, end: endISO } }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Get Teams connection status
export const getTeamsConnectionStatus = async (): Promise<ApiResponse<TeamsConnectionStatus>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<TeamsConnectionStatus>>("/calendar/connection-status");
    return data;
  } catch (error) {
    throw error;
  }
};

// Connect to Microsoft Teams (OAuth)
export const MicrosoftUserOAuth = async (): Promise<ApiResponse<string>> => {
  try {
    const { data } = await axiosApi.get<ApiResponse<string>>("/microsoft/auth/login");
    return data;
  } catch (error) {
    throw error;
  }
};

// Create Event Payload Interface
export interface CreateEventPayload {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  body?: { contentType: "HTML" | "Text"; content: string };
  attendees?: Array<{ emailAddress: { address: string; name?: string }; type?: "required" | "optional" }>;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: "teamsForBusiness";
}

// Create calendar event
export const createCalendarEvent = async (
  payload: CreateEventPayload
): Promise<ApiResponse<GraphEvent>> => {
  try {
    const { data } = await axiosApi.post<ApiResponse<GraphEvent>>("/calendar/events", payload);
    return data;
  } catch (error) {
    throw error;
  }
};
