// apps/web/src/routes/catalog/-catalog-page.tsx
import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCategories } from './use-categories'
import { useProducts } from './use-products'
import { ProductCard } from './-product-card'
import { RequestsList } from './requests/-requests-list'

export function CatalogPage() {
  const search = useSearch({ from: '/catalog' })
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search.search ?? '')

  const tab = search.tab ?? 'products'
  const activeCategory = search.category
  const activeSearch = search.search

  const { data: categories = [] } = useCategories()
  const { data: products = [], isLoading } = useProducts({
    category: activeCategory,
    search: activeSearch,
  })

  const handleTabChange = (newTab: 'products' | 'requests') => {
    void navigate({ search: (prev) => ({ ...prev, tab: newTab, search: undefined }) })
  }

  const handleCategoryClick = (slug?: string) => {
    void navigate({ search: (prev) => ({ ...prev, category: slug, search: undefined }) })
  }

  const handleSearch = (value: string) => {
    setSearchInput(value)
    void navigate({ search: (prev) => ({ ...prev, search: value || undefined }) })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('products')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'products'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Товари
        </button>
        <button
          onClick={() => handleTabChange('requests')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'requests'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Запити покупців
        </button>
      </div>

      {tab === 'products' ? (
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-44 md:shrink-0">
            <p className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Категорії
            </p>
            <ul className="flex overflow-x-auto gap-2 pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
              <li className="shrink-0">
                <button
                  onClick={() => handleCategoryClick(undefined)}
                  className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !activeCategory
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Всі
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id} className="shrink-0">
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`whitespace-nowrap md:whitespace-normal md:w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeCategory === cat.slug
                        ? 'bg-green-100 text-green-800 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500">Завантаження...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500">Товарів не знайдено</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <RequestsList />
      )}
    </div>
  )
}
