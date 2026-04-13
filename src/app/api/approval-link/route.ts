import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('approval_token')
    .eq('id', clientId)
    .single()

  if (!data) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const origin = req.nextUrl.origin
  return NextResponse.json({ link: `${origin}/approve/${data.approval_token}` })
}
