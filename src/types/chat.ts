/**
 * Chat message type for AI assistant conversations
 */
export interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actions?: string[];
  responseType?: string;
}

/**
 * @deprecated Use ChatMessage instead
 */
export type Message = ChatMessage;
