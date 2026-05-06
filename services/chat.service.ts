import api from "@/lib/api";
import type { ChatMessage, QuickReply } from "@/types/chat";

export const chatService = {
  getHistory: async (candidateId: string) => {
    const { data } = await api.get<ChatMessage[]>(
      `/chat/history/${candidateId}`
    );
    return data;
  },

  sendMessage: async (candidateId: string, content: string) => {
    const { data } = await api.post<ChatMessage>(`/chat/send`, {
      candidate_id: candidateId,
      content,
    });
    return data;
  },

  getQuickReplies: async () => {
    const { data } = await api.get<QuickReply[]>("/chat/quick-replies");
    return data;
  },
};
