import type { Metadata } from 'next'
import Link from 'next/link'

// Página inicial pública do Sistema SM (https://sistema.suamidia.com.br).
// Antes redirecionava direto para o painel/login; o TikTok exige que o endereço
// do site leve a uma página inicial pública, com os Termos e a Política de
// Privacidade acessíveis, e o nome do app igual ao dessas páginas.

export const metadata: Metadata = {
  title: 'Sistema SM - Social media management platform',
  description:
    'Sistema SM is the social media management platform of Sua Midia Agencia Digital: content calendar, client approval and publishing to Instagram, Facebook, Google Business Profile and TikTok.',
}

const EMAIL = 'suamidiaagenciadigital@gmail.com'

const FEATURES = [
  { title: 'Content calendar', text: 'Plan the month of posts, reels, carousels and stories for each client in one editorial calendar.' },
  { title: 'Client approval', text: 'Clients review every piece of content on a private link and approve it or ask for changes before anything is published.' },
  { title: 'Multi-channel publishing', text: 'Approved content is published at the scheduled time to the client\'s connected social accounts.' },
  { title: 'Results for clients', text: 'A client portal with a monthly summary of posts published and the results of the social profiles.' },
]

const PLATFORMS = [
  { name: 'Instagram and Facebook', text: 'Posts, carousels, reels and stories published through the Meta Graph API.' },
  { name: 'Google Business Profile', text: 'Image posts published to the client\'s business listing.' },
  {
    name: 'TikTok',
    text: 'Login Kit lets the account owner connect their own TikTok account. With the Content Posting API (Direct Post), a video is sent to TikTok only after the user reviews the posting screen (account, title, visibility, interaction settings, commercial content disclosure) and clicks Post.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen text-slate-300">
      {/* Cabeçalho */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sua Mídia Agência Digital" className="h-10 w-auto" />
            <div className="hidden border-l border-white/15 pl-4 sm:block">
              <p className="text-lg font-bold leading-tight text-white">Sistema SM</p>
              <p className="text-xs text-slate-500">Social media management platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/portal/login" className="text-slate-400 hover:text-white">Client portal</Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 font-semibold text-white"
              style={{ background: 'linear-gradient(to right, #2B80FF, #A855F7)' }}
            >
              Agency sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-14">
        {/* Apresentação */}
        <section className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Sistema SM
            <span className="block text-2xl font-semibold text-slate-400 md:text-3xl">
              Social media management platform
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Sistema SM is the platform that Sua Mídia Agência Digital, a social media agency in Brazil, uses to plan,
            approve and publish content for its business clients on Instagram, Facebook, Google Business Profile and TikTok.
          </p>
        </section>

        {/* O que faz */}
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold text-white">What it does</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plataformas */}
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold text-white">Connected platforms</h2>
          <div className="space-y-4">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacidade e controle */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Your data and your control</h2>
          <p className="max-w-3xl text-slate-400">
            Each client connects only its own accounts and decides what is published. Access tokens are stored in a
            protected environment and used only to publish content approved by the client. Any account can be
            disconnected at any time, in the system or in the social network&apos;s own settings. Read our{' '}
            <Link href="/privacidade" className="text-blue-400 underline">Privacy Policy</Link> and{' '}
            <Link href="/termos" className="text-blue-400 underline">Terms of Service</Link>.
          </p>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sua Mídia Agência Digital" className="h-6 w-auto opacity-80" />
            <p>© {new Date().getFullYear()} Sua Mídia Agência Digital · Sistema SM</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/termos" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacidade" className="hover:text-white">Privacy Policy</Link>
            <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
