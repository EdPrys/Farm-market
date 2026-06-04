import { createFileRoute, useParams } from '@tanstack/react-router'
  import { useState, useEffect, useRef } from 'react'
  import { AppLayout } from '@/shared/layout/app-layout'
  import { useMessages } from './use-messages'
  import { useSocket } from '@/shared/socket/use-socket'
  import { useCurrentUser } from '@/shared/auth/use-current-user'
  import type { ChatMessage } from './api'

  function ConversationPage() {
    const { id } = useParams({ strict: false }) as { id: string }
    const conversationId = Number(id)
    const { data: user } = useCurrentUser()
    const { data: initial = [], isLoading } = useMessages(conversationId)
    const socket = useSocket()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [text, setText] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(initial)
    }, [initial])

    useEffect(() => {
      if (!socket) return
      socket.emit('join', { conversationId })
      socket.on('new_message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg])
      })
      return () => {
        socket.off('new_message')
      }
    }, [socket, conversationId])

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = (e: React.FormEvent) => {
      e.preventDefault()
      if (!text.trim() || !socket) return
      socket.emit('send', { conversationId, text: text.trim() })
      setText('')
    }

    if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)]">
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-4">
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.id
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-green-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 border-t pt-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написати повідомлення..."
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 
  disabled:opacity-50"
            >
              Надіслати
            </button>
          </form>
        </div>
      </AppLayout>
    ) 
  }

  export const Route = createFileRoute('/chat/$id')({
    component: ConversationPage,
  })