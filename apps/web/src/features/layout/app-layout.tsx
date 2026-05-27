import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/catalog">
            <Logo />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/catalog"
              className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
            >
              Каталог
            </Link>
            {user?.isSeller && (
              <Link
                to="/seller/products"
                className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
              >
                Мої товари
              </Link>
            )}
            <button className="text-gray-400 cursor-not-allowed" disabled>
              Кошик
            </button>
            {user && (
              <button
                onClick={() => void logout.mutate()}
                className="text-gray-700 hover:text-red-600"
              >
                Вийти
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
