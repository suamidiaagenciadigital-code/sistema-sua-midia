'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'

export function ImportCalendarButton({ clientId }: { clientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      const text = await file.text()
      const payload = JSON.parse(text)

      if (!payload.contents || !Array.isArray(payload.contents)) {
        setResult({ ok: false, message: 'JSON inválido. Certifique-se de usar o formato gerado pela skill.' })
        return
      }

      const res = await fetch('/api/import-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, payload }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ ok: true, message: `${data.imported} conteúdo${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''} com sucesso!` })
        router.refresh()
      } else {
        setResult({ ok: false, message: data.error ?? 'Erro ao importar.' })
      }
    } catch {
      setResult({ ok: false, message: 'Erro ao ler o arquivo JSON.' })
    } finally {
      setLoading(false)
      // reset input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {loading ? 'Importando...' : 'Importar calendário'}
      </button>

      {result && (
        <div className={`flex items-center gap-1.5 text-xs ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
          {result.ok
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <AlertCircle className="h-3.5 w-3.5" />
          }
          {result.message}
        </div>
      )}
    </div>
  )
}
