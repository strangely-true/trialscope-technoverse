export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  patient_id: string;
  trial_id?: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface QuickReply {
  id: string;
  text: string;
}
