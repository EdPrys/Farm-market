import { useEffect } from 'react'
  import { io, Socket } from 'socket.io-client'
  import { useAuth } from '@/shared/auth/use-auth'

  let socketInstance: Socket | null = null

  export function useSocket() {
    const { token } = useAuth()
    useEffect(() => {
      if (!token) {
        socketInstance?.disconnect()
        socketInstance = null
        return
      }

      if (!socketInstance) {
        socketInstance = io('http://localhost:3333', {
          auth: { token },
        })
      }
    }, [token])

    return socketInstance
  }