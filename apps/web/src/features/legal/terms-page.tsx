export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Умови використання</h1>
      <p className="text-sm text-gray-500">Останнє оновлення: 6 липня 2026</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Що таке Farm Market</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Farm Market — це дошка оголошень, яка з'єднує покупців і фермерів. Платформа не є
          стороною угоди між покупцем і продавцем, не обробляє оплату і не відповідає за
          якість, кількість чи доставку товару. Усі домовленості — напряму між користувачами.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Ваші зобов'язання</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 leading-relaxed flex flex-col gap-1">
          <li>Вказувати достовірну інформацію в профілі, оголошеннях і запитах</li>
          <li>Не публікувати спам, шахрайський чи образливий контент</li>
          <li>Спілкуватись у чаті шанобливо, без зловживань</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Модерація</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ми можемо видалити оголошення, відгук чи заблокувати акаунт, який порушує ці умови.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Обмеження відповідальності</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Сервіс надається "як є". Ми не гарантуємо якість товарів чи достовірність тверджень
          фермерів і не несемо відповідальності за наслідки угод між користувачами.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Застосовне право</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Ці умови регулюються законодавством України.
        </p>
      </section>
    </div>
  )
}
