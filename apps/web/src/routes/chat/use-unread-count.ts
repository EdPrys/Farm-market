import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/fetch-client'
import { useAuth } from '@/shared/auth/use-auth'

export function useUnreadCount() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['conversations', 'unread-count'],
    queryFn: () => apiFetch<{ count: number }>('/api/v1/conversations/unread-count'),
    enabled: !!token,
    refetchInterval: 10000, // оновлюємо кожні 10 секунд
  })
}
