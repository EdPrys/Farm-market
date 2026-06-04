import { useQuery } from '@tanstack/react-query'
  import { chatApi } from './api'

  export function useMessages(conversationId: number) {
    return useQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => chatApi.getMessages(conversationId),
      enabled: !!conversationId,
    })
  }