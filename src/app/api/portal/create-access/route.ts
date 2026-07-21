import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/portal/create-access
// Body: { client_id, email, password }
// Cria (ou atualiza) credenciais de acesso ao portal para o cliente
export async function POST(req: NextRequest) {
  // Somente usuários autenticados da agência podem criar acessos
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role === 'client') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { client_id, email, password } = await req.json()
  if (!client_id || !email || !password) {
    return NextResponse.json({ error: 'client_id, email e password são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verificar se cliente já tem portal_user_id
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, portal_user_id')
    .eq('id', client_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  let portalUserId: string

  if (client.portal_user_id) {
    // Já existe → atualizar email/senha
    const { error } = await supabase.auth.admin.updateUserById(client.portal_user_id, {
      email,
      password,
      user_metadata: { role: 'client', client_id },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    portalUserId = client.portal_user_id
  } else {
    // Criar novo usuário
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // confirma automaticamente, sem e-mail de verificação
      user_metadata: { role: 'client', client_id },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    portalUserId = created.user.id
  }

  // Salvar portal_user_id no cliente
  await supabase
    .from('clients')
    .update({ portal_user_id: portalUserId })
    .eq('id', client_id)

  return NextResponse.json({ ok: true, portal_user_id: portalUserId })
}

// DELETE /api/portal/create-access?client_id=xxx
// Remove acesso ao portal do cliente
export async function DELETE(req: NextRequest) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role === 'client') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const client_id = req.nextUrl.searchParams.get('client_id')
  if (!client_id) return NextResponse.json({ error: 'client_id obrigatório' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: client } = await supabase
    .from('clients')
    .select('portal_user_id')
    .eq('id', client_id)
    .single()

  if (client?.portal_user_id) {
    await supabase.auth.admin.deleteUser(client.portal_user_id)
    await supabase.from('clients').update({ portal_user_id: null }).eq('id', client_id)
  }

  return NextResponse.json({ ok: true })
}
