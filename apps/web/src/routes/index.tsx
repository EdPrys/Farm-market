import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: function Index() {
    return (
      <div>
        <h1>Ферма Маркет</h1>
        <p>Свіжі продукти від українських фермерів</p>
      </div>
    )
  },
})
