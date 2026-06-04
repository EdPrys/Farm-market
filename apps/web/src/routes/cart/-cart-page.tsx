import { Link } from '@tanstack/react-router'
import { useCartStore } from '@/shared/cart/use-cart'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  )

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center flex flex-col gap-4">
        <p className="text-gray-500 text-lg">Кошик порожній</p>
        <Link to="/catalog" className="text-green-700 hover:underline text-sm">
          Перейти до каталогу →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900">Кошик</h1>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-4 border rounded-xl p-4 bg-white"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sellerName}</p>
              <p className="text-sm text-green-700 mt-1">
                {item.price} ₴ / {item.unit}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-7 h-7 border rounded flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-7 h-7 border rounded flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right font-semibold text-gray-900 shrink-0">
              {(parseFloat(item.price) * item.quantity).toFixed(2)} ₴
            </p>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-gray-300 hover:text-red-500 ml-1 text-lg leading-none shrink-0"
              aria-label="Видалити"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t pt-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? 'товар' : 'товарів'}
          </span>
          <span className="font-bold text-gray-900 text-lg">{total.toFixed(2)} ₴</span>
        </div>
        <button
          disabled
          className="w-full bg-gray-100 text-gray-400 rounded-lg py-3 text-sm cursor-not-allowed"
          title="Скоро"
        >
          Оформити замовлення (скоро)
        </button>
      </div>
    </div>
  )
}
