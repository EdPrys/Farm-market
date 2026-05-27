import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@farm-market/ui'
import { useSellerProducts } from './use-seller-products'
import { useDeleteProduct } from './use-delete-product'

export function SellerProductsPage() {
  const { data: products = [], isLoading } = useSellerProducts()
  const deleteProduct = useDeleteProduct()
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    if (confirmId === id) {
      void deleteProduct.mutate(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мої товари</h1>
        <Button asChild>
          <Link to="/seller/products/new">Додати товар</Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Завантаження...</p>}

      {!isLoading && products.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Ще немає товарів.</p>
          <p>Додайте перший!</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 border rounded-xl p-4 bg-white">
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {product.imagePath ? (
                  <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🥦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category.name}</p>
                <p className="text-sm text-green-700 font-medium">
                  {product.price} ₴ / {product.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {product.status === 'active'
                    ? 'Активний'
                    : product.status === 'inactive'
                      ? 'Неактивний'
                      : 'Архів'}
                </span>
                <Link
                  to="/seller/products/$id/edit"
                  params={{ id: String(product.id) }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✏️
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title={
                    confirmId === product.id ? 'Натисніть ще раз для підтвердження' : 'Видалити'
                  }
                >
                  {confirmId === product.id ? '⚠️' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
