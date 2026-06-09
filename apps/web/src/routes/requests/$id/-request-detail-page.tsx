import { useState } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { useRequest, useUpdateRequest, useCloseRequest, useDeleteRequest } from '../../catalog/requests/use-requests'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useCategories } from '../../catalog/use-categories'
import { chatApi } from '../../chat/api'
import { getFieldError, ApiValidationError } from '@/lib/api/errors'

const UNITS = ['кг', 'г', 'шт', 'л', 'мл', 'пучок', 'банка', 'упаковка', 'десяток']

function ContactsBlock({ phone, telegram, viber }: { phone?: string | null; telegram?: string | null; viber?: string | null }) {
  const [open, setOpen] = useState(false)
  const hasContacts = phone || telegram || viber
  if (!hasContacts) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border border-green-600 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50"
      >
        📞 Контакти
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-10 flex flex-col gap-2">
          {phone && (
            <a href={`tel:${phone}`} className="text-sm text-gray-700 hover:text-green-700">
              📞 {phone}
            </a>
          )}
          {telegram && (
            <a
              href={`https://t.me/${telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-700 hover:text-green-700"
            >
              ✈️ {telegram}
            </a>
          )}
          {viber && (
            <a href={`viber://chat?number=${viber}`} className="text-sm text-gray-700 hover:text-green-700">
              📲 {viber}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function EditForm({ requestId, initialValues, onDone }: {
  requestId: number
  initialValues: {
    title: string
    description: string
    categoryId: string
    quantity: string
    unit: string
    location: string
    budget: string
    expiresAt: string
  }
  onDone: () => void
}) {
  const { data: categories = [] } = useCategories()
  const update = useUpdateRequest()

  const [title, setTitle] = useState(initialValues.title)
  const [description, setDescription] = useState(initialValues.description)
  const [categoryId, setCategoryId] = useState(initialValues.categoryId)
  const [quantity, setQuantity] = useState(initialValues.quantity)
  const [unit, setUnit] = useState(initialValues.unit)
  const [location, setLocation] = useState(initialValues.location)
  const [budget, setBudget] = useState(initialValues.budget)
  const [expiresAt, setExpiresAt] = useState(initialValues.expiresAt)

  const fieldError = (field: string) => getFieldError(update.error, field)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      {
        id: requestId,
        payload: {
          title: title.trim(),
          categoryId: categoryId ? Number(categoryId) : undefined,
          quantity: quantity ? Number(quantity) : undefined,
          unit: unit.trim(),
          location: location.trim(),
          description: description.trim() || undefined,
          budget: budget ? Number(budget) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        },
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-title">Назва *</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {fieldError('title') && <p className="text-xs text-red-500">{fieldError('title')}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-category">Категорія</Label>
        <select
          id="edit-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Будь-яка категорія</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {fieldError('categoryId') && <p className="text-xs text-red-500">{fieldError('categoryId')}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="edit-quantity">Кількість *</Label>
          <Input
            id="edit-quantity"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          {fieldError('quantity') && <p className="text-xs text-red-500">{fieldError('quantity')}</p>}
        </div>
        <div className="flex flex-col gap-1.5 w-28">
          <Label htmlFor="edit-unit">Одиниця *</Label>
          <select
            id="edit-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-location">Місто / регіон *</Label>
        <Input
          id="edit-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        {fieldError('location') && <p className="text-xs text-red-500">{fieldError('location')}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-description">Опис</Label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="edit-budget">Бюджет ₴</Label>
          <Input
            id="edit-budget"
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Договірна"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="edit-expires">Дійсний до</Label>
          <Input
            id="edit-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>

      {update.isError && !(update.error instanceof ApiValidationError) && (
        <p className="text-sm text-red-500">{update.error?.message ?? 'Помилка. Спробуйте ще раз.'}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Скасувати
        </button>
        <Button type="submit" disabled={update.isPending} className="flex-1">
          {update.isPending ? 'Збереження...' : 'Зберегти'}
        </Button>
      </div>
    </form>
  )
}

export function RequestDetailPage() {
  const { id } = useParams({ from: '/requests/$id' })
  const { data: user } = useCurrentUser()
  const { data: request, isLoading, isError } = useRequest(Number(id))
  const closeRequest = useCloseRequest()
  const deleteRequest = useDeleteRequest()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  const handleChat = async () => {
    if (!request?.user) return
    setChatLoading(true)
    try {
      const conv = await chatApi.createConversation(request.user.id)
      void navigate({ to: '/chat/$id', params: { id: String(conv.id) } })
    } finally {
      setChatLoading(false)
    }
  }

  const handleClose = () => {
    if (!request) return
    closeRequest.mutate(request.id)
  }

  const handleDelete = () => {
    if (!request) return
    deleteRequest.mutate(request.id, {
      onSuccess: () => void navigate({ to: '/catalog', search: { tab: 'requests' } }),
    })
  }

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !request) return <div className="p-8 text-sm text-red-500">Запит не знайдено</div>

  const isOwner = user?.id === request.user?.id
  const expiryLabel = request.expiresAt
    ? new Date(request.expiresAt).toLocaleDateString('uk-UA')
    : null

  const initialEditValues = {
    title: request.title,
    description: request.description ?? '',
    categoryId: request.category ? String(request.category.id) : '',
    quantity: String(request.quantity),
    unit: request.unit,
    location: request.location,
    budget: request.budget != null ? String(request.budget) : '',
    expiresAt: request.expiresAt ? request.expiresAt.split('T')[0] : '',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Back link */}
      <Link
        to="/catalog"
        search={{ tab: 'requests' }}
        className="text-sm text-gray-500 hover:text-green-700 w-fit"
      >
        ← Назад до запитів
      </Link>

      {/* Main card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
        {/* Status + category */}
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
              request.status === 'active'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            {request.status === 'active' ? 'Активний' : 'Закритий'}
          </span>
          {request.category && (
            <span className="bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs">
              {request.category.name}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{request.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>📍 {request.location}</span>
          {expiryLabel && <span>📅 до {expiryLabel}</span>}
          <span>
            👤 {request.user?.fullName ?? 'Анонім'}
          </span>
        </div>

        {/* Quantity + budget */}
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Кількість</p>
            <p className="text-lg font-bold text-green-700">
              {request.quantity} {request.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Бюджет</p>
            <p className="text-lg font-semibold text-gray-800">
              {request.budget != null ? `до ${request.budget} ₴` : 'Договірна'}
            </p>
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Опис</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {request.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-100 pt-4">
          {isOwner ? (
            <div className="flex flex-col gap-3">
              {!editing && (
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setEditing(true)}
                    className="border border-green-600 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50"
                  >
                    ✏️ Редагувати
                  </button>
                  {request.status === 'active' && (
                    <button
                      onClick={handleClose}
                      disabled={closeRequest.isPending}
                      className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {closeRequest.isPending ? '...' : 'Закрити запит'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleteRequest.isPending}
                    className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteRequest.isPending ? '...' : 'Видалити'}
                  </button>
                </div>
              )}
              {editing && (
                <EditForm
                  requestId={request.id}
                  initialValues={initialEditValues}
                  onDone={() => setEditing(false)}
                />
              )}
            </div>
          ) : (
            user && user.id !== request.user?.id && (
              <div className="flex gap-3 flex-wrap">
                <ContactsBlock
                  phone={request.user?.phone}
                  telegram={request.user?.telegram}
                  viber={request.user?.viber}
                />
                <button
                  onClick={() => void handleChat()}
                  disabled={chatLoading}
                  className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                >
                  {chatLoading ? '...' : '💬 Написати'}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
