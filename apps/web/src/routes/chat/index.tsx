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
                      className={`flex items-center gap-4 border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow ${c.unreadCount > 0 ? 'border-red-200 bg-red-50' : ''}`}
                    >
                      <div className="relative w-10 h-10 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                          {(other.fullName ?? other.email).charAt(0).toUpperCase()}
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                            {c.unreadCount > 9 ? '9+' : c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate ${c.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                          {other.fullName ?? other.email}
                        </p>
                        {lastMsg && (
                          <p className={`text-sm truncate ${c.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                            {lastMsg.text}
                          </p>
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