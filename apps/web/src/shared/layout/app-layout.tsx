import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Logo } from '../auth/logo'
import { useCurrentUser } from '../auth/use-current-user'
import { useLogout } from '../auth/use-logout'
import { useCartStore } from '@/shared/cart/use-cart'
import { useUnreadCount } from '@/routes/chat/use-unread-count'

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const cartCount = useCartStore((state) => state.items.length)
  const { data: unread } = useUnreadCount()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo variant="dark" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/catalog"
              className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
            >
              Каталог
            </Link>
            <Link
              to="/farms"
              className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
            >
              Ферми
            </Link>
            {user?.isSeller && (
              <Link
                to="/seller/products"
                className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
              >
                Мої товари
              </Link>
            )}
            {user?.isSeller && (
              <Link
                to="/seller/farm"
                className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
              >
                Моя ферма
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Кошик
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/chat"
                  className="relative text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Повідомлення
                  {!!unread?.count && unread.count > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unread.count > 9 ? '9+' : unread.count}
                    </span>
                  )}
                </Link>
                <Link
                  to={user.isSeller ? '/seller/profile' : '/profile'}
                  className="text-gray-700 hover:text-green-700 [&.active]:text-green-700 [&.active]:font-semibold"
                >
                  Профіль
                </Link>
                <button
                  onClick={() => void logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })}
                  className="text-gray-700 hover:text-red-600"
                >
                  Вийти
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center gap-6 text-xs text-gray-500">
          <Link to="/privacy" className="hover:text-green-700">
            Політика конфіденційності
          </Link>
          <Link to="/terms" className="hover:text-green-700">
            Умови використання
          </Link>
        </div>
      </footer>
    </div>
  )
}
