import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useCategories } from '../use-categories'
import { useCreateRequest } from './use-requests'
import { useCurrentUser } from '@/shared/auth/use-current-user'

const UNITS = ['кг', 'г', 'шт', 'л', 'мл', 'пучок', 'банка', 'упаковка', 'десяток']

interface Props {
  onClose: () => void
}

export function RequestForm({ onClose }: Props) {
  const { data: categories = [] } = useCategories()
  const { data: user } = useCurrentUser()
  const createRequest = useCreateRequest()

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('кг')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRequest.mutate(
      {
        title: title.trim(),
        categoryId: Number(categoryId),
        quantity: Number(quantity),
        unit: unit.trim(),
        location: location.trim(),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Новий запит</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-title">Назва *</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр.: Шукаю картоплю для ресторану"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-category">Категорія</Label>
            <select
              id="req-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Будь-яка категорія</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity + Unit */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-quantity">Кількість *</Label>
              <Input
                id="req-quantity"
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 w-28">
              <Label htmlFor="req-unit">Одиниця *</Label>
              <select
                id="req-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-location">Місто / регіон *</Label>
            <Input
              id="req-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Напр.: Київ"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="req-description">Опис</Label>
            <textarea
              id="req-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Додаткові вимоги, сорт, якість..."
              className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Budget + Expires At */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-budget">Бюджет ₴</Label>
              <Input
                id="req-budget"
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Договірна"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="req-expires">Дійсний до</Label>
              <Input
                id="req-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          {/* User contacts info */}
          {user && (user.phone || user.telegram || user.viber) && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium mb-1">Ваші контакти (підтягнуться автоматично):</p>
              {user.phone && <p>📞 {user.phone}</p>}
              {user.telegram && <p>✈️ {user.telegram}</p>}
              {user.viber && <p>📲 {user.viber}</p>}
            </div>
          )}

          {createRequest.isError && (
            <p className="text-sm text-red-500">Помилка. Спробуйте ще раз.</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Скасувати
            </button>
            <Button
              type="submit"
              disabled={createRequest.isPending}
              className="flex-1"
            >
              {createRequest.isPending ? 'Збереження...' : 'Опублікувати'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
