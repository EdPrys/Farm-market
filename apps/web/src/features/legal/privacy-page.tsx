export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Політика конфіденційності</h1>
      <p className="text-sm text-gray-500">Останнє оновлення: 6 липня 2026</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Хто ми</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Farm Market — сервіс, що з'єднує покупців і фермерів напряму, без комісії та участі
          платформи в оплаті чи доставці. Оператором персональних даних є ФОП Едуард Приступа.
          З питань щодо ваших даних пишіть на{' '}
          <a href="mailto:eduard.prystupa@gmail.com" className="text-green-700 underline">
            eduard.prystupa@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Які дані ми збираємо</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
          <li>Дані акаунту: ім'я, email, телефон, Telegram, Viber, назва ферми</li>
          <li>Дані ферми: назва, розташування, опис, Instagram, фото</li>
          <li>Запити покупців: назва, опис, кількість, бюджет, локація</li>
          <li>Повідомлення в чаті між покупцем і продавцем</li>
          <li>Відгуки про ферми: оцінка й текст</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Навіщо ми їх збираємо</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Виключно для того, щоб покупці й фермери могли знайти одне одного та домовитись
          напряму. Ми не використовуємо ваші дані для реклами і не передаємо їх третім особам,
          окрім сервісів, технічно необхідних для роботи платформи (зберігання фото, email-розсилка).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Де і як зберігаються дані</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Дані акаунтів та оголошень зберігаються в базі даних PostgreSQL. Фотографії ферм — в
          об'єктному сховищі (B2/S3). Після входу токен доступу зберігається в localStorage
          вашого браузера. Ми не використовуємо cookies для аналітики чи реклами — на сайті
          взагалі немає систем аналітики чи трекінгу.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ваші права</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ви можете попросити переглянути або видалити всі свої дані, написавши на{' '}
          <a href="mailto:eduard.prystupa@gmail.com" className="text-green-700 underline">
            eduard.prystupa@gmail.com
          </a>
          . Дані зберігаються, поки ваш акаунт активний, і видаляються за запитом.
        </p>
      </section>
    </div>
  )
}
