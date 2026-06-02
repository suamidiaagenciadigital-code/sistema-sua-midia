'use client'

import { useState, useCallback } from 'react'

export type RehostState = 'idle' | 'loading' | 'done' | 'error'

export function useDriveRehost(clientId: string) {
  const [state, setState] = useState<RehostState>('idle')
  const [error, setError] = useState<string | null>(null)

  const isDriveUrl = (url: string) => /drive\.google\.com/.test(url)

  const rehost = useCallback(async (
    url: string,
    onSuccess: (newUrl: string) => void,
  ) => {
    if (!url || !isDriveUrl(url)) return

    setState('loading')
    setError(null)

    try {
      const res = await fetch('/api/media/rehost-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveUrl: url, clientId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Erro ao hospedar')

      onSuccess(data.url)
      setState('done')

      // Reset após 5s
      setTimeout(() => setState('idle'), 5000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setError(msg)
      setState('error')
    }
  }, [clientId])

  return { state, error, isDriveUrl, rehost }
}
