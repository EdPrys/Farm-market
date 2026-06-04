import { useState, useRef } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useCategories } from '../../catalog/use-categories'
import type { Product } from '../../catalog/types'
import type { ProductInput } from './api'

interface Props {
  initial?: Product
  onSubmit: (data: ProductInput) => void
  onImageChange?: (file: File | null) => void
  isPending: boolean
  error?: string | null
}

const UNITS = ['кг', 'г', 'шт', 'л', 'мл', 'пучок', 'банка', 'упаковка', 'десяток']

export function ProductForm({ initial, onSubmit, onImageChange, isPending, error }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState<number>(initial?.category.id ?? 0)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? 'кг')
  const [quantity, setQuantity] = useState(initial?.quantity ?? '')
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(
    initial?.status ?? 'active',
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useCategories()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      categoryId,
      description: description || null,
      price: Number(price),
      unit,
      quantity: Number(quantity),
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Назва товару *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Категорія *</Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          required
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value={0} disabled>
            Оберіть категорію
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Опис</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="price">Ціна ₴ *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5 w-28">
          <Label htmlFor="unit">Одиниця *</Label>
          <select
            id="unit"
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
        <div className="flex flex-col gap-1.5 w-32">
          <Label htmlFor="quantity">Кількість *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Статус</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="active">Активний</option>
          <option value="inactive">Неактивний</option>
          <option value="archived">Архівний</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Фото</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setImageFile(file)
            onImageChange?.(file)
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-green-500 hover:text-green-700 transition-colors w-full"
        >
          <span className="text-xl">📷</span>
          <span>{imageFile ? imageFile.name : 'Оберіть фото товару'}</span>
          {imageFile && (
            <span
              className="ml-auto text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                setImageFile(null)
                onImageChange?.(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              ✕
            </span>
          )}
        </button>
        {imageFile && (
          <p className="text-xs text-gray-400">
            {(imageFile.size / 1024).toFixed(0)} КБ
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Збереження...' : 'Зберегти товар'}
      </Button>
    </form>
  )
}
