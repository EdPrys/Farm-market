 import { apiFetch } from '@/lib/api/fetch-client'

  export interface Conversation {
    id: number
    buyerId: number
    sellerId: number
    buyer: { id: number; fullName: string | null; email: string }
    seller: { id: number; fullName: string | null; farmName: string | null; email: string }
    messages: ChatMessage[]
    createdAt: string
    updatedAt: string
  }

  export interface ChatMessage {
    id: number
    conversationId: number
    senderId: number
    text: string
    readAt: string | null
    createdAt: string
  }

  export const chatApi = {
    getConversations: () =>
      apiFetch<Conversation[]>('/api/v1/conversations'),

    createConversation: (sellerId: number) =>
      apiFetch<Conversation>('/api/v1/conversations', {
        method: 'POST',
        body: JSON.stringify({ sellerId }),
      }),

    getMessages: (conversationId: number) =>
      apiFetch<ChatMessage[]>(`/api/v1/conversations/${conversationId}/messages`),
  }