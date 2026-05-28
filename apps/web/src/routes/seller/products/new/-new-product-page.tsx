import { useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ProductForm } from '../-product-form'
import { useCreateProduct } from './use-create-product'
import { useUploadImage } from '../use-upload-image'
import type { ProductInput } from '../api'

export function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const uploadImage = useUploadImage()
  const imageFileRef = useRef<File | null>(null)

  const handleSubmit = async (data: ProductInput) => {
    const product = await createProduct.mutateAsync(data)
    if (imageFileRef.current) {
      await uploadImage.mutateAsync({ id: product.id, file: imageFileRef.current })
    }
    await router.navigate({ to: '/seller/products' })
  }

  const isPending = createProduct.isPending || uploadImage.isPending
  const error = createProduct.isError
    ? createProduct.error instanceof Error
      ? createProduct.error.message
      : 'Помилка'
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Новий товар</h1>
      <ProductForm
        onSubmit={(data) => void handleSubmit(data)}
        onImageChange={(file) => {
          imageFileRef.current = file
        }}
        isPending={isPending}
        error={error}
      />
    </div>
  )
}
