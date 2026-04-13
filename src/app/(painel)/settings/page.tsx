import { createClient } from '@/lib/supabase/server'
import { Key, Webhook, MessageCircle } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
