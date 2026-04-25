'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  children: React.ReactNode
  className?: string
  loadingText?: string
  savedText?: string
}

function Inner({ children, className, loadingText = 'Salvando...', savedText = 'Salvo!' }: Props) {
  const { pending } = useFormStatus()
  const [saved, setSaved] = useState(false)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
    wasPending.current = pending
  }, [pending])

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 ${saved ? 'bg-green-600 text-white hover:bg-green-600' : ''} ${className ?? ''}`}
    >
      {pending ? (
        <><Loader2 className="h-4 w-4 animate-spin" />{loadingText}</>
      ) : saved ? (
        <><Check className="h-4 w-4" />{savedText}</>
      ) : children}
    </button>
  )
}

export function SubmitButton(props: Props) {
  return <Inner {...props} />
}
