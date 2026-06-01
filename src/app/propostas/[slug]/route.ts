import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateProposalHtml } from '@/lib/proposal-html'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const download = req.nextUrl.searchParams.get('download') === '1'

  const supabase = createServiceClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!proposal) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b1326;color:#94a3b8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center">
        <div><div style="font-size:48px;margin-bottom:16px">📄</div><h1 style="color:#f1f5f9;margin-bottom:8px">Proposta não encontrada</h1><p>Este link pode ter expirado ou sido removido.</p></div>
      </body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  // Incrementa visualizações (fire and forget)
  supabase
    .from('proposals')
    .update({ views: (proposal.views || 0) + 1 })
    .eq('id', proposal.id)
    .then(() => {})

  const html = generateProposalHtml(proposal)

  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store',
  }

  if (download) {
    headers['Content-Disposition'] = `attachment; filename="proposta-${slug}.html"`
  }

  return new NextResponse(html, { headers })
}
