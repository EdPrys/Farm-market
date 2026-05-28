import type { SellerContacts } from '../../catalog/types'

interface Props {
  contacts: SellerContacts | null
  isAuthenticated: boolean
}

export function ContactBlock({ contacts, isAuthenticated }: Props) {
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
        <a href="/login" className="text-green-700 font-medium hover:underline">
          Увійдіть
        </a>
        , щоб побачити контакти продавця
      </div>
    )
  }

  if (!contacts || (!contacts.phone && !contacts.telegram && !contacts.viber)) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-400">
        Продавець не вказав контакти
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
        {"Зв'язатись з продавцем"}
      </p>
      {contacts.phone && (
        <a
          href={`tel:${contacts.phone}`}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700"
        >
          <span className="text-base">📞</span>
          {contacts.phone}
        </a>
      )}
      {contacts.telegram && (
        <a
          href={`https://t.me/${contacts.telegram.replace(/^@/, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700"
        >
          <span className="text-base">✈️</span>
          {contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`}
        </a>
      )}
      {contacts.viber && (
        <a
          href={`viber://chat?number=${contacts.viber.replace(/\D/g, '')}`}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700"
        >
          <span className="text-base">💬</span>
          {contacts.viber}
        </a>
      )}
    </div>
  )
}
