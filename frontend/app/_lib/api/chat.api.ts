import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";

export interface ChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export const chatApi = {
  sendMessage: (
    message: string,
    history: ChatMessagePayload[],
    context?: string,
  ) =>
    api
      .post<ApiResponse<{ response: string }>>("/chat/message", {
        message,
        history,
        context,
      })
      .then((r) => r.data),
};
