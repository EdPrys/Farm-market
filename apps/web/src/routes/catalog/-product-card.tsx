import { Link } from '@tanstack/react-router'
import type { Product } from './types'
import { deliveryMethodLabel } from './delivery-methods'
import { useCartStore } from '@/shared/cart/use-cart'
import { useCurrentUser } from '@/shared/auth/use-current-user'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const { data: user } = useCurrentUser()
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const cartItem = items.find((i) => i.productId === product.id)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      imagePath: product.imagePath,
      sellerName: product.seller.farmName ?? product.seller.fullName ?? '',
      sellerId: product.seller.id,
    })
  }

  const handleQty = (e: React.MouseEvent, qty: number) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, qty)
  }

  return (
    <Link
      to="/products/$id"
      params={{ id: String(product.id) }}
      className="block border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imagePath ? (
          <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🥦</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.seller.farmName ?? product.seller.fullName ?? ''}
        </p>
        <p className="text-sm font-bold text-green-700 mt-1">
          {product.price} ₴ / {product.unit}
        </p>
        {product.deliveryMethods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.deliveryMethods.map((method) => (
              <span
                key={method}
                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                {deliveryMethodLabel(method)}
              </span>
            ))}
          </div>
        )}
        {user && (
          cartItem ? (
            <div
              className="mt-2 flex items-center justify-between border border-green-200 rounded py-1 px-2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            >
              <button
                onClick={(e) => handleQty(e, cartItem.quantity - 1)}
                className="text-green-700 font-bold w-5 text-center"
              >
                −
              </button>
              <span className="text-sm font-medium">{cartItem.quantity}</span>
              <button
                onClick={(e) => handleQty(e, cartItem.quantity + 1)}
                className="text-green-700 font-bold w-5 text-center"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="mt-2 w-full text-xs border border-green-600 text-green-700 rounded py-1 hover:bg-green-50 transition-colors"
            >
              До кошика
            </button>
          )
        )}
      </div>
    </Link>
  )
}
