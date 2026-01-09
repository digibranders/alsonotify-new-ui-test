
import axiosApi from "../config/axios";
import { isAxiosError } from "../types/errors";

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
  } catch (error: unknown) {
    // Handle API errors
    let errorMessage = "Unable to reach the assistant. Please try again.";
    if (isAxiosError(error)) {
      const data = error.response?.data as { error?: string } | undefined;
      errorMessage = data?.error || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
};
