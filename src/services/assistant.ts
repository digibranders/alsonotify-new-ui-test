import axiosApi from "../config/axios";
import { ApiResponse } from "../config/constants";

type AgentResponse = {
  answer?: string;
  error?: string;
};

export const generateAgentResponse = async (
  prompt: string,
  history?: { role: "user" | "assistant"; content: string }[]
): Promise<AgentResponse> => {
  try {
    const { data } = await axiosApi.post<AgentResponse>("/api/generate", {
      prompt,
      history,
    });

    return data;
  } catch (error: any) {
    // Handle API errors
    const errorMessage = error?.response?.data?.error || error?.message || "Unable to reach the assistant. Please try again.";
    return { error: errorMessage };
  }
};
