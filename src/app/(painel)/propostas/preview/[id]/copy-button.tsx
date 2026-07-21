'use client'

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0 transition-colors"
    >
      Copiar
    </button>
  )
}
