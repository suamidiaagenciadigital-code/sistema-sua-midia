import { createClient } from '@/lib/supabase/server'
import { Key, Webhook, MessageCircle, MapPin } from 'lucide-react'
import { getGoogleConnection } from '@/lib/google-business'
import { disconnectGoogleAction } from './actions'

const GOOGLE_MSG: Record<string, { ok: boolean; text: string }> = {
  conectado: { ok: true, text: 'Google conectado.' },
  negado: { ok: false, text: 'A autorização no Google foi cancelada.' },
  estado_invalido: { ok: false, text: 'A conexão expirou ou veio de outro navegador. Clique em Conectar de novo.' },
  sem_refresh: { ok: false, text: 'O Google não devolveu o acesso permanente. Remova o app em myaccount.google.com/permissions e conecte de novo.' },
  erro_salvar: { ok: false, text: 'Conectou, mas não consegui salvar. Rode a migration_v14 no Supabase.' },
  sem_chaves: { ok: false, text: 'Faltam GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas variáveis da Vercel.' },
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const google = await getGoogleConnection()
  const googleMsg = sp.google ? GOOGLE_MSG[sp.google] : null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">API keys, webhooks e integrações</p>
      </div>

      {/* Conta */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-zinc-400" />
          Conta
        </h2>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Usuário autenticado</p>
          <p className="text-sm text-zinc-200">{user?.email ?? '—'}</p>
        </div>
      </section>

      {/* Google Business Profile */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-400" />
          Google Business Profile
        </h2>
        <p className="text-xs text-zinc-500">
          Uma conexão da agência dá acesso a todos os perfis do Google que ela administra. Cada cliente é
          vinculado ao seu perfil na página de Integrações dele.
        </p>
        {googleMsg && (
          <p className={`text-xs rounded-md px-3 py-2 border ${googleMsg.ok ? 'text-emerald-300 bg-emerald-950/30 border-emerald-800/40' : 'text-amber-300 bg-amber-950/30 border-amber-800/40'}`}>
            {googleMsg.text}
          </p>
        )}
        {google && !google.invalid ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-emerald-300">
              ✓ Conectado desde {new Date(google.created_at).toLocaleDateString('pt-BR')}
            </span>
            <div className="flex gap-2">
              <a href="/api/google/connect" className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:text-white">Reconectar</a>
              <form action={disconnectGoogleAction}>
                <button type="submit" className="rounded-md border border-red-900/60 px-3 py-1.5 text-xs text-red-400 hover:text-red-300">Desconectar</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {google?.invalid && (
              <p className="text-xs text-amber-300">A conexão expirou ou foi revogada. Conecte de novo.</p>
            )}
            <a href="/api/google/connect" className="inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">
              Conectar Google
            </a>
          </div>
        )}
      </section>

      {/* Variáveis de ambiente */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-zinc-400" />
          Variáveis de ambiente (.env.local)
        </h2>
        <p className="text-xs text-zinc-500">Configure essas variáveis no arquivo <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.env.local</code> na raiz do projeto.</p>
        <div className="space-y-3">
          <EnvRow name="ANTHROPIC_API_KEY" value={process.env.ANTHROPIC_API_KEY} />
          <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <EnvRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
          <EnvRow name="SUPABASE_SERVICE_ROLE_KEY" value={process.env.SUPABASE_SERVICE_ROLE_KEY} />
          <EnvRow name="NEXT_PUBLIC_APP_URL" value={process.env.NEXT_PUBLIC_APP_URL} />
          <EnvRow name="N8N_WEBHOOK_SECRET" value={process.env.N8N_WEBHOOK_SECRET} />
        </div>
      </section>

      {/* Webhooks para n8n */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Webhook className="h-4 w-4 text-zinc-400" />
          Webhooks (para configurar no n8n)
        </h2>
        <p className="text-xs text-zinc-500">Use esses endpoints nos fluxos do n8n. Todos exigem o header <code className="bg-zinc-800 px-1 rounded text-zinc-300">x-webhook-secret</code> com o valor de <code className="bg-zinc-800 px-1 rounded text-zinc-300">N8N_WEBHOOK_SECRET</code>.</p>
        <div className="space-y-3">
          <WebhookRow
            label="Receber mensagem WhatsApp"
            method="POST"
            url={`${appUrl}/api/webhooks/whatsapp`}
            description="n8n chama quando uma mensagem nova chega no WhatsApp"
          />
          <WebhookRow
            label="Confirmação de envio WhatsApp"
            method="POST"
            url={`${appUrl}/api/webhooks/whatsapp-sent`}
            description="n8n chama quando uma mensagem foi enviada com sucesso"
          />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-zinc-400" />
          WhatsApp / n8n
        </h2>
        <p className="text-xs text-zinc-500">
          A integração com WhatsApp é feita via n8n. Configure o fluxo no n8n apontando para os webhooks acima.
          Defina <code className="bg-zinc-800 px-1 rounded text-zinc-300">N8N_WEBHOOK_SECRET</code> igual nos dois lados.
        </p>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">URL do n8n</p>
          <p className="text-sm text-zinc-300 font-mono">{process.env.N8N_BASE_URL ?? 'Não configurado — adicione N8N_BASE_URL ao .env.local'}</p>
        </div>
      </section>
    </div>
  )
}

function EnvRow({ name, value }: { name: string; value: string | undefined }) {
  const configured = !!value
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
      <code className="text-xs text-zinc-300">{name}</code>
      <span className={`text-xs px-2 py-0.5 rounded border ${configured ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-red-900/30 text-red-300 border-red-800'}`}>
        {configured ? 'Configurado' : 'Não configurado'}
      </span>
    </div>
  )
}

function WebhookRow({ label, method, url, description }: { label: string; method: string; url: string; description: string }) {
  return (
    <div className="space-y-1 py-2 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{method}</span>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <code className="text-xs text-zinc-400 break-all">{url}</code>
      <p className="text-xs text-zinc-600">{description}</p>
    </div>
  )
}
