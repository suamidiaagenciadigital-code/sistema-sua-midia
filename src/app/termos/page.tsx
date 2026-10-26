import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sistema SM Terms of Service',
  description: 'Terms of Service of Sistema SM (Termos de Serviço do Sistema SM).',
}

const UPDATED = '12 de outubro de 2026'
const EMAIL = 'suamidiaagenciadigital@gmail.com'

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 space-y-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold text-white">Sistema SM Terms of Service</h1>
      <p className="text-sm text-slate-500">Termos de Serviço · Sistema SM · Sua Mídia Agência Digital · Atualizado em {UPDATED}</p>

      <section className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold text-white">Summary in English</h2>
        <p className="text-sm">
          Sistema SM is the social media management platform of Sua Mídia Agência Digital. It is used to plan, approve and
          publish content for the agency&apos;s business clients on Instagram, Facebook, Google Business Profile and TikTok.
          Each account owner connects only their own accounts, approves what is published, and can disconnect an account at
          any time. The full terms are below, in Portuguese.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">1. Quem somos</h2>
        <p>
          O Sistema SM é a plataforma de gestão de conteúdo da agência Sua Mídia Agência Digital. Ele
          serve para planejar, aprovar e publicar conteúdo nas redes sociais dos clientes da agência, e para
          acompanhar os resultados desse conteúdo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">2. Quem pode usar</h2>
        <p>
          O acesso é restrito à equipe da agência e aos clientes que ela convida. Cada pessoa é responsável por
          manter a confidencialidade do seu acesso e por tudo o que for feito com ele.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">3. Conexão com redes sociais</h2>
        <p>
          Ao conectar uma conta de rede social (como Instagram, Facebook ou TikTok), o titular da conta autoriza
          o sistema a publicar conteúdo e a ler os dados de desempenho em seu nome, apenas dentro das permissões
          concedidas. A autorização pode ser retirada a qualquer momento, no próprio sistema (botão
          &quot;Desconectar&quot;) ou nas configurações da rede social.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">4. Conteúdo publicado</h2>
        <p>
          Todo conteúdo é revisado e aprovado pelo cliente antes de ser publicado. O cliente é responsável por
          garantir que tem os direitos de uso sobre textos, imagens, vídeos e músicas enviados à agência. A
          agência não publica conteúdo que o cliente não tenha aprovado.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">5. Uso adequado</h2>
        <p>
          É proibido usar o sistema para publicar conteúdo ilegal, enganoso ou que viole as regras das redes
          sociais conectadas, ou para tentar acessar dados de outros clientes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">6. Disponibilidade</h2>
        <p>
          Trabalhamos para manter o sistema disponível, mas ele depende de serviços de terceiros (redes sociais,
          provedores de hospedagem e armazenamento). Eles podem sofrer instabilidades ou mudar suas regras, e a
          agência não garante funcionamento ininterrupto.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">7. Alterações destes termos</h2>
        <p>Podemos atualizar estes termos. A versão em vigor é sempre a publicada nesta página, com a data de atualização.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">8. Contato</h2>
        <p>
          Dúvidas sobre estes termos: <a className="text-blue-400 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>

      <p className="text-sm pt-4">
        Veja também a <Link href="/privacidade" className="text-blue-400 underline">Política de Privacidade</Link>.
      </p>
    </main>
  )
}
