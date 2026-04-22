import { useMutation } from "@tanstack/react-query";
import { chatApi, type ChatMessagePayload } from "@/app/_lib/api/chat.api";

export function useChatAssistant() {
  return useMutation({
    mutationFn: ({
      message,
      history,
      context,
    }: {
      message: string;
      history: ChatMessagePayload[];
      context?: string;
    }) => chatApi.sendMessage(message, history, context),
  });
}
