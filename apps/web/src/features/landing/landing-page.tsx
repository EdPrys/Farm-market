import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Logo } from '@/shared/auth/logo'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useLogout } from '@/shared/auth/use-logout'
import { ProductCard } from '@/routes/catalog/-product-card'
import { useFeaturedProducts } from './use-featured-products'

const QUICK_CATEGORIES = [
  { label: '🥕 Овочі', slug: 'vegetables' },
  { label: '🍎 Фрукти', slug: 'fruits' },
  { label: '🍯 Мед', slug: 'honey' },
  { label: '🥛 Молочні', slug: 'dairy' },
]

export function LandingPage() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: products = [] } = useFeaturedProducts()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void navigate({ to: '/catalog', search: { search: search.trim() || undefined } })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo variant="dark" />
          <nav className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link to="/catalog" className="text-gray-700 hover:text-green-700">
                  Каталог
                </Link>
                <button
                  onClick={() =>
                    void logout.mutate(undefined, {
                      onSettled: () => void navigate({ to: '/' }),
                    })
                  }
                  className="text-gray-700 hover:text-red-600"
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-green-700">
                  Увійти
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Реєстрація
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-green-50 to-green-100 py-16 px-4 text-center">
        <p className="text-xs font-semibold text-green-600 tracking-widest uppercase mb-3">
          Свіжо з поля
        </p>
        <h1 className="text-3xl font-extrabold text-green-900 mb-2">
          Знаходьте продукти від українських фермерів
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Фрукти, овочі, мед і більше — прямо від виробника
        </p>
        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук товарів (картопля, мед...)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800"
          >
            Знайти
          </button>
        </form>
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {QUICK_CATEGORIES.map(({ label, slug }) => (
            <Link
              key={slug}
              to="/catalog"
              search={(s) => ({ ...s, category: slug })}
              className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Нові оголошення</h2>
            <Link to="/catalog" className="text-sm text-green-700 font-medium hover:underline">
              Всі товари →
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Завантаження...</p>
          )}
        </div>
      </section>
    </div>
  )
}
