import { useState } from 'react'
import { Button, Input, Label } from '@farm-market/ui'
import { useSellerProfile } from './use-seller-profile'
import { useUpdateSellerProfile } from './use-update-seller-profile'
import type { SellerProfile } from './api'

interface FormProps {
  initial: SellerProfile
}

function SellerProfileForm({ initial }: FormProps) {
  const update = useUpdateSellerProfile()
  const [phones, setPhones] = useState<string[]>(initial.phones.length > 0 ? initial.phones : [''])
  const [telegram, setTelegram] = useState(initial.telegram ?? '')
  const [viber, setViber] = useState(initial.viber ?? '')

  const addPhone = () => {
    if (phones.length < 5) setPhones([...phones, ''])
  }

  const removePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index))
  }

  const updatePhone = (index: number, value: string) => {
    setPhones(phones.map((p, i) => (i === index ? value : p)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate({
      phones: phones.filter((p) => p.trim() !== ''),
      telegram: telegram.trim() || null,
      viber: viber.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Номери телефонів</Label>
        {phones.map((phone, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="tel"
              placeholder="+380XXXXXXXXX"
              value={phone}
              onChange={(e) => updatePhone(index, e.target.value)}
              className="flex-1"
            />
            {phones.length > 1 && (
              <button
                type="button"
                onClick={() => removePhone(index)}
                className="text-gray-400 hover:text-red-500 px-2 text-lg leading-none"
                aria-label="Видалити номер"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {phones.length < 5 && (
          <button
            type="button"
            onClick={addPhone}
            className="text-sm text-green-700 hover:underline text-left w-fit"
          >
            + Додати номер
          </button>
        )}
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
