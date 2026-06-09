import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useRequests } from './use-requests'
import { RequestCard } from './-request-card'
import { RequestForm } from './-request-form'
import { useCategories } from '../use-categories'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useSubscribe } from '@/shared/auth/use-subscribe'

function SubscribeGate() {
  const { data: user } = useCurrentUser()
  const subscribe = useSubscribe()

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-2xl">🔒</p>
        <h3 className="text-lg font-semibold text-gray-800">Запити покупців — лише для підписників</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Увійдіть в акаунт і оформіть підписку, щоб переглядати запити від покупців та знаходити нових клієнтів.
        </p>
        <Link
          to="/login"
          className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
        >
          Увійти
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-2xl">🔒</p>
      <h3 className="text-lg font-semibold text-gray-800">Запити покупців — лише для підписників</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Підпишіться, щоб переглядати запити від покупців, знаходити нових клієнтів і отримувати більше замовлень.
      </p>
      <button
        onClick={() => subscribe.mutate()}
        disabled={subscribe.isPending}
        className="bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50"
      >
        {subscribe.isPending ? 'Підключення...' : 'Підписатись безкоштовно'}
      </button>
      {subscribe.isError && (
        <p className="text-xs text-red-500">Помилка. Спробуйте ще раз.</p>
      )}
    </div>
  )
}

export function RequestsList() {
  const search = useSearch({ strict: false }) as { category?: string }
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useRequests({
    category: search.category as string | undefined,
    page,
    enabled: !!user?.isSubscribed,
  })

  if (!user?.isSubscribed) {
    return <SubscribeGate />
  }

  const requests = data?.data ?? []
  const meta = data?.meta

  const handleCategoryChange = (slug: string) => {
    setPage(1)
    void navigate({ search: (prev) => ({ ...prev, category: slug || undefined }) })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={search.category ?? ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Всі категорії</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(true)}
          className="ml-auto bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
        >
          + Створити запит
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">Запитів не знайдено</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            ← Назад
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {meta.lastPage}
          </span>
          <button
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40"
          >
            Далі →
          </button>
        </div>
      )}

      {showForm && <RequestForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
