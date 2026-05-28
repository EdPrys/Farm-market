import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCategories } from './use-categories'
import { useProducts } from './use-products'
import { ProductCard } from './-product-card'

export function CatalogPage() {
  const search = useSearch({ strict: false }) as { category?: string; search?: string }
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(search.search ?? '')

  const activeCategory = search.category
  const activeSearch = search.search

  const { data: categories = [] } = useCategories()
  const { data: products = [], isLoading } = useProducts({
    category: activeCategory,
    search: activeSearch,
  })

  const handleCategoryClick = (slug?: string) => {
    void navigate({ search: (prev) => ({ ...prev, category: slug, search: undefined }) })
  }

  const handleSearch = (value: string) => {
    setSearchInput(value)
    void navigate({ search: (prev) => ({ ...prev, search: value || undefined }) })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      <aside className="w-44 shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Категорії
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !activeCategory
                  ? 'bg-green-100 text-green-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Всі
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
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
          <div className="grid grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
