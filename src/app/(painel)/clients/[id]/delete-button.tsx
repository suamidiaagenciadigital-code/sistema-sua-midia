'use client'

import { deleteClientAction } from './actions'

export function DeleteClientButton({ id }: { id: string }) {
  const del = deleteClientAction.bind(null, id)

  return (
    <form action={del} onSubmit={(e) => {
      if (!confirm('Tem certeza? Essa ação não pode ser desfeita.')) e.preventDefault()
    }}>
      <button
        type="submit"
        className="rounded-md border border-red-800 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors"
      >
        Excluir cliente
      </button>
    </form>
  )
}
