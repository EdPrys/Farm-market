export const DELIVERY_METHODS = [
  { value: 'nova_poshta', label: 'Нова Пошта' },
  { value: 'ukrposhta', label: 'Укрпошта' },
  { value: 'pickup', label: 'Особиста зустріч' },
] as const

export function deliveryMethodLabel(value: string): string {
  return DELIVERY_METHODS.find((m) => m.value === value)?.label ?? value
}
