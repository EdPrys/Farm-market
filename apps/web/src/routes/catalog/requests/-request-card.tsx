import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { BuyerRequest } from './types'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { chatApi } from '../../chat/api'

interface Props {
  request: BuyerRequest
  isOwn?: boolean
  onClose?: (id: number) => void
  onDelete?: (id: number) => void
}

export function RequestCard({ request, isOwn, onClose, onDelete }: Props) {
  const { data: user } = useCurrentUser()
  const navigate = useNavigate()
  const [showContacts, setShowContacts] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  const handleChat = async () => {
    if (!request.user) return
    setChatLoading(true)
    try {
      const conv = await chatApi.createConversation(request.user.id)
      void navigate({ to: '/chat/$id', params: { id: String(conv.id) } })
    } finally {
      setChatLoading(false)
    }
  }

  const expiryLabel = request.expiresAt
    ? `до ${new Date(request.expiresAt).toLocaleDateString('uk-UA')}`
    : null

  const hasContacts =
    request.user && (request.user.phone || request.user.telegram || request.user.viber)

  const handleCardClick = () => {
    void navigate({ to: '/requests/$id', params: { id: String(request.id) } })
  }

  return (
    <div
      className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3 cursor-pointer hover:border-green-300 transition-colors"
      onClick={handleCardClick}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-1">
            {request.category && (
              <span className="bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-xs">
                {request.category.name}
              </span>
            )}
            <span className="text-xs text-gray-400">📍 {request.location}</span>
            {expiryLabel && <span className="text-xs text-gray-400">{expiryLabel}</span>}
          </div>
          <h3 className="font-semibold text-gray-900 leading-snug">{request.title}</h3>
          {request.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{request.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-green-700">
            {request.quantity} {request.unit}
          </p>
          {request.budget != null ? (
            <p className="text-xs text-gray-500">до {request.budget} ₴</p>
          ) : (
            <p className="text-xs text-gray-400">ціна договірна</p>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-gray-400 flex-1">
          {request.user?.fullName ?? 'Анонім'}
        </span>

        {isOwn ? (
          <div className="flex gap-2">
            {request.status === 'active' && onClose && (
              <button
                onClick={() => onClose(request.id)}
                className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50"
              >
                Закрити
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(request.id)}
                className="text-xs border border-red-200 text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Видалити
              </button>
            )}
          </div>
        ) : (
          user && user.id !== request.user?.id && (
            <div className="flex gap-2 relative">
              {hasContacts && (
                <div className="relative">
                  <button
                    onClick={() => setShowContacts((v) => !v)}
                    className="text-xs border border-green-600 text-green-700 px-3 py-1 rounded-lg hover:bg-green-50"
                  >
                    📞 Контакти
                  </button>
                  {showContacts && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-40 z-10 flex flex-col gap-1">
                      {request.user?.phone && (
                        <a
                          href={`tel:${request.user.phone}`}
                          className="text-sm text-gray-700 hover:text-green-700"
                        >
                          📞 {request.user.phone}
                        </a>
                      )}
                      {request.user?.telegram && (
                        <a
                          href={`https://t.me/${request.user.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:text-green-700"
                        >
                          ✈️ {request.user.telegram}
                        </a>
                      )}
                      {request.user?.viber && (
                        <a
                          href={`viber://chat?number=${request.user.viber}`}
                          className="text-sm text-gray-700 hover:text-green-700"
                        >
                          📲 {request.user.viber}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => void handleChat()}
                disabled={chatLoading}
                className="text-xs bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {chatLoading ? '...' : '💬 Написати'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
