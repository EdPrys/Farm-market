import { createFileRoute, Link } from '@tanstack/react-router'
  import { AppLayout } from '@/shared/layout/app-layout'
  import { useConversations } from './use-conversations'
  import { useCurrentUser } from '@/shared/auth/use-current-user'

  function ConversationsPage() {
    const { data: user } = useCurrentUser()
    const { data: conversations = [], isLoading } = useConversations()

    if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Повідомлення</h1>
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">Немає розмов</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {conversations.map((c) => {
                const other = c.buyerId === user?.id ? c.seller : c.buyer
                const lastMsg = c.messages[0]
                return (
                  <li key={c.id}>
                    <Link
                      to="/chat/$id"
                      params={{ id: String(c.id) }}
                      className="flex items-center gap-4 border rounded-xl p-4 bg-white hover:shadow-sm 
  transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center 
  text-green-700 font-bold shrink-0">
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {other.fullName ?? other.email}
                        </p>
                        {lastMsg && (
                          <p className="text-sm text-gray-500 truncate">{lastMsg.text}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ) 
              })}
            </ul>
          )}
        </div>
      </AppLayout>
    ) 
  } 

  export const Route = createFileRoute('/chat/')({
    component: ConversationsPage,
  })