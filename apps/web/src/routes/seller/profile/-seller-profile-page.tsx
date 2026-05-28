import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useSellerProfile } from './use-seller-profile'
import { useUpdateSellerProfile } from './use-update-seller-profile'
import type { SellerProfile } from '../products/api'

function SellerProfileForm({ initial }: { initial: SellerProfile }) {
  const update = useUpdateSellerProfile()
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [telegram, setTelegram] = useState(initial.telegram ?? '')
  const [viber, setViber] = useState(initial.viber ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate({
      phone: phone.trim() || null,
      telegram: telegram.trim() || null,
      viber: viber.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Номер телефону</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+380XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telegram">Telegram</Label>
        <Input
          id="telegram"
          placeholder="@username"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="viber">Viber</Label>
        <Input
          id="viber"
          type="tel"
          placeholder="+380XXXXXXXXX"
          value={viber}
          onChange={(e) => setViber(e.target.value)}
        />
      </div>

      {update.isError && (
        <p className="text-sm text-red-500">
          {update.error instanceof Error ? update.error.message : 'Помилка збереження'}
        </p>
      )}
      {update.isSuccess && <p className="text-sm text-green-600">Контакти збережено</p>}

      <Button type="submit" disabled={update.isPending} className="w-full">
        {update.isPending ? 'Збереження...' : 'Зберегти'}
      </Button>
    </form>
  )
}

export function SellerProfilePage() {
  const { data: profile, isLoading } = useSellerProfile()

  if (isLoading || !profile) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Контактна інформація</h1>
      <p className="text-sm text-gray-500 mb-6">
        Контакти бачать лише зареєстровані покупці на сторінці вашого товару і профілю.
      </p>
      <SellerProfileForm initial={profile} />
    </div>
  )
}
