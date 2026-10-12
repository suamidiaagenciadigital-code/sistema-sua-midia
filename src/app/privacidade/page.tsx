import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Sua Mídia',
  description: 'Como o Sistema Sua Mídia trata dados pessoais e dados das redes sociais conectadas.',
}

const UPDATED = '12 de outubro de 2026'
const EMAIL = 'suamidiaagenciadigital@gmail.com'

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 space-y-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
      <p className="text-sm text-slate-500">Sistema Sua Mídia · Agência de Bolso · Atualizado em {UPDATED}</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">1. Quem é o responsável</h2>
        <p>
          A Sua Mídia Agência Digital é a responsável pelo tratamento dos dados descritos aqui, conforme a Lei
          Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018). Contato: <a className="text-blue-400 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">2. Quais dados coletamos</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><b className="text-slate-200">Dados de acesso:</b> nome, e-mail e senha (guardada de forma protegida) de quem usa o sistema.</li>
          <li><b className="text-slate-200">Dados de contas conectadas:</b> identificador e nome do perfil nas redes sociais autorizadas (Instagram, Facebook, TikTok) e as chaves de acesso (tokens) que a rede fornece quando o titular autoriza.</li>
          <li><b className="text-slate-200">Conteúdo:</b> textos, imagens e vídeos enviados à agência para publicação.</li>
          <li><b className="text-slate-200">Resultados:</b> números de desempenho do perfil e das publicações (como visualizações, alcance e seguidores), lidos das redes conectadas.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">3. Para que usamos</h2>
        <p>
          Usamos os dados somente para prestar o serviço contratado: publicar o conteúdo aprovado pelo cliente,
          mostrar os resultados no portal do cliente e manter o acesso seguro. Não vendemos dados e não os
          usamos para publicidade própria ou de terceiros.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">4. Dados do TikTok</h2>
        <p>
          Quando o titular conecta a conta do TikTok, solicitamos apenas as permissões de ver o nome do perfil
          (<code>user.info.basic</code>) e de enviar vídeos para a conta (<code>video.publish</code>). Os tokens de
          acesso ficam armazenados em ambiente protegido, acessível apenas ao servidor do sistema, e são usados
          unicamente para publicar os vídeos aprovados. Não coletamos mensagens privadas nem dados de outros
          usuários do TikTok.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">5. Com quem compartilhamos</h2>
        <p>
          Os dados ficam em provedores que operam o sistema, como hospedagem e banco de dados (Vercel e
          Supabase), e são enviados às redes sociais apenas para executar a publicação autorizada. Não
          compartilhamos dados com outras empresas para fins próprios delas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">6. Por quanto tempo guardamos</h2>
        <p>
          Guardamos os dados enquanto o cliente mantiver contrato com a agência. Ao desconectar uma rede social
          no sistema, os tokens daquela conta são apagados na hora. Dados do cliente podem ser excluídos a
          pedido, após o fim do contrato.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">7. Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados, e retirar a autorização de qualquer rede
          conectada, escrevendo para <a className="text-blue-400 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>. No
          TikTok, também é possível remover o acesso do app nas configurações de segurança da própria conta.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">8. Segurança</h2>
        <p>
          Usamos conexão criptografada (HTTPS), controle de acesso por usuário e separação entre os dados de cada
          cliente. Nenhum sistema é totalmente imune a riscos, e em caso de incidente relevante avisaremos os
          afetados.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">9. Alterações</h2>
        <p>Esta política pode ser atualizada. A versão em vigor é sempre a desta página, com a data de atualização.</p>
      </section>

      <p className="text-sm pt-4">
        Veja também os <Link href="/termos" className="text-blue-400 underline">Termos de Serviço</Link>.
      </p>
    </main>
  )
}
