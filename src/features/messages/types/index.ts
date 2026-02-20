export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  created_at: string;
  created_by: string;
  last_message?: Message;
  unread_count?: number;
  participants?: ConversationParticipant[];
}
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  is_admin: boolean;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    is_online?: boolean;
  };
}
export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}
export interface CreateConversationInput {
  type: 'direct' | 'group';
  name?: string;
  participant_ids: string[];
}
export interface SendMessageInput {
  conversation_id: string;
  content: string;
}
