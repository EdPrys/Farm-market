export interface Category {
  id: number
  name: string
  slug: string
}

export interface SellerContacts {
  phone: string | null
  telegram: string | null
  viber: string | null
}

export interface ProductSeller {
  id: number
  fullName: string | null
  farmName: string | null
  contacts: SellerContacts | null
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: 'active' | 'inactive' | 'archived'
  deliveryMethods: string[]
  category: Category
  seller: ProductSeller
}
