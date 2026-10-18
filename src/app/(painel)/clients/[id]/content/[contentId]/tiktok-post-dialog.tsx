'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'

// Tela de postagem no TikTok. Segue as regras de UX da Content Posting API
// (necessárias para o app ser auditado): mostra a conta que vai receber o
// vídeo, deixa escolher título, visibilidade (sem valor padrão), interações
// (todas desmarcadas), divulgação de conteúdo comercial, mostra a prévia e o
// texto de consentimento, e só envia depois do clique em "Post".
// Textos em inglês de propósito: é o que o TikTok revisa.

interface CreatorInfo {
  ok: boolean
  error?: string
  audited: boolean
  creator: { nickname: string; username: string; avatar: string | null }
  privacyOptions: string[]
  commentDisabled: boolean
  duetDisabled: boolean
  stitchDisabled: boolean
  maxVideoSeconds: number | null
}

const PRIVACY_LABEL: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
}

const MUSIC_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'
const BRANDED_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en'

function driveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/?&]+)/)
  return m ? m[1] : null
}

export function TikTokPostDialog({
  clientId,
  contentId,
  videoUrl,
  defaultTitle,
  onClose,
}: {
  clientId: string
  contentId: string
  videoUrl: string
  defaultTitle: string
  onClose: () => void
}) {
  const [info, setInfo] = useState<CreatorInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // A legenda do Instagram pode trazer negrito em markdown (**texto**), que o
  // TikTok mostraria com os asteriscos. O título continua editável.
  const [title, setTitle] = useState(
    defaultTitle.replace(/\*\*([\s\S]+?)\*\*|__([\s\S]+?)__/g, '$1$2').replace(/\*/g, '').trim().slice(0, 2200),
  )
  const [privacy, setPrivacy] = useState('') // sem padrão: a pessoa escolhe
  const [comment, setComment] = useState(false)
  const [duet, setDuet] = useState(false)
  const [stitch, setStitch] = useState(false)
  const [disclose, setDisclose] = useState(false)
  const [yourBrand, setYourBrand] = useState(false)
  const [branded, setBranded] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)

  const [posting, setPosting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Dados da conta: consultados toda vez que a tela abre (exigência do TikTok)
  useEffect(() => {
    let alive = true
    fetch(`/api/tiktok/creator-info?cliente=${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d.ok) setInfo(d)
        else setLoadError(d.error ?? 'Could not load the TikTok account.')
      })
      .catch(() => alive && setLoadError('Could not load the TikTok account.'))
    return () => { alive = false }
  }, [clientId])

  const drive = driveId(videoUrl)
  const tooLong = !!(info?.maxVideoSeconds && duration && duration > info.maxVideoSeconds)
  const commercialInvalid = disclose && !yourBrand && !branded
  const privateWithBranded = privacy === 'SELF_ONLY' && branded
  const canPost = !!info && !!privacy && !tooLong && !commercialInvalid && !privateWithBranded && !posting && !result?.ok

  const label = useMemo(() => {
    if (!disclose) return null
    if (branded) return "Your video will be labeled as 'Paid partnership'"
    if (yourBrand) return "Your video will be labeled as 'Promotional content'"
    return null
  }, [disclose, branded, yourBrand])

  const post = async () => {
    setPosting(true)
    setResult(null)
    try {
      const res = await fetch(`/api/contents/${contentId}/tiktok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          privacy_level: privacy,
          disable_comment: !comment,
          disable_duet: !duet,
          disable_stitch: !stitch,
          commercial: { enabled: disclose, your_brand: yourBrand, branded_content: branded },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not post to TikTok.')
      setResult({
        ok: true,
        msg: data.concluido
          ? 'Posted. It can take a few minutes to show on your profile.'
          : `Sent to TikTok (${data.status}). It may take a few minutes to be processed and appear on your profile.`,
      })
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : 'Could not post to TikTok.' })
    } finally {
      setPosting(false)
    }
  }

  const box = 'rounded-lg border border-white/10 bg-white/[0.03] p-3'
  const off = 'opacity-40 cursor-not-allowed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1729] text-slate-200">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Post to TikTok</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          {!info && !loadError && (
            <p className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading your TikTok account…</p>
          )}

          {loadError && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-red-300">
              {loadError} This account may not be able to post right now. Please try again later.
            </p>
          )}

          {info && (
            <>
              {/* Conta que vai receber o vídeo */}
              <div className={`${box} flex items-center gap-3`}>
                {info.creator.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.creator.avatar} alt="" className="h-9 w-9 rounded-full" />
                )}
                <div>
                  <p className="text-xs text-slate-500">Posting to</p>
                  <p className="font-semibold text-white">{info.creator.nickname || info.creator.username}</p>
                </div>
              </div>

              {/* Prévia */}
              <div>
                {drive ? (
                  <iframe src={`https://drive.google.com/file/d/${drive}/preview`} className="aspect-[9/16] max-h-80 w-full rounded-lg border border-white/10" allow="autoplay" />
                ) : (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    preload="metadata"
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    className="max-h-80 w-full rounded-lg border border-white/10 bg-black"
                  />
                )}
                {tooLong && (
                  <p className="mt-1 text-xs text-red-300">
                    This video is longer than the {info.maxVideoSeconds}s this account can post. Please use a shorter video.
                  </p>
                )}
              </div>

              {/* Título */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-slate-400">Title</label>
                  <span className="text-[11px] text-slate-600">{title.length}/2200</span>
                </div>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 2200))}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Visibilidade: sem valor padrão */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Who can view this video</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  <option value="" disabled>Select who can view this video</option>
                  {info.privacyOptions.map((o) => (
                    <option key={o} value={o} disabled={o === 'SELF_ONLY' && branded} title={o === 'SELF_ONLY' && branded ? 'Branded content visibility cannot be set to private.' : undefined}>
                      {PRIVACY_LABEL[o] ?? o}{o === 'SELF_ONLY' && branded ? ' (not available for branded content)' : ''}
                    </option>
                  ))}
                </select>
                {!info.audited && (
                  <p className="text-[11px] text-amber-300/80">This app is still in TikTok review: for now videos can only be posted as &quot;Only me&quot;.</p>
                )}
              </div>

              {/* Interações: todas desmarcadas */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400">Allow users to</p>
                <div className="flex flex-wrap gap-4">
                  <label className={`flex items-center gap-2 ${info.commentDisabled ? off : ''}`}>
                    <input type="checkbox" checked={comment} disabled={info.commentDisabled} onChange={(e) => setComment(e.target.checked)} className="h-4 w-4" /> Comment
                  </label>
                  <label className={`flex items-center gap-2 ${info.duetDisabled ? off : ''}`}>
                    <input type="checkbox" checked={duet} disabled={info.duetDisabled} onChange={(e) => setDuet(e.target.checked)} className="h-4 w-4" /> Duet
                  </label>
                  <label className={`flex items-center gap-2 ${info.stitchDisabled ? off : ''}`}>
                    <input type="checkbox" checked={stitch} disabled={info.stitchDisabled} onChange={(e) => setStitch(e.target.checked)} className="h-4 w-4" /> Stitch
                  </label>
                </div>
              </div>

              {/* Divulgação de conteúdo comercial */}
              <div className={box}>
                <label
                  className="flex items-center justify-between gap-3"
                  title="Turn on to disclose that this video promotes goods or services in exchange for something of value. Your video could promote yourself, a third party, or both."
                >
                  <span className="font-medium text-white">Disclose video content</span>
                  <input
                    type="checkbox"
                    checked={disclose}
                    onChange={(e) => {
                      setDisclose(e.target.checked)
                      if (!e.target.checked) { setYourBrand(false); setBranded(false) }
                    }}
                    className="h-4 w-4"
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-500">
                  Turn on to disclose that this video promotes goods or services in exchange for something of value. Your video could promote yourself, a third party, or both.
                </p>

                {disclose && (
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} className="h-4 w-4" />
                      Your brand <span className="text-[11px] text-slate-500">(you are promoting yourself or your own business)</span>
                    </label>
                    <label className={`flex items-center gap-2 ${privacy === 'SELF_ONLY' ? off : ''}`} title={privacy === 'SELF_ONLY' ? 'Branded content visibility cannot be set to private.' : undefined}>
                      <input type="checkbox" checked={branded} disabled={privacy === 'SELF_ONLY'} onChange={(e) => setBranded(e.target.checked)} className="h-4 w-4" />
                      Branded content <span className="text-[11px] text-slate-500">(you are promoting another brand or a third party)</span>
                    </label>
                    {privacy === 'SELF_ONLY' && (
                      <p className="text-[11px] text-amber-300/80">Branded content visibility cannot be set to private.</p>
                    )}
                    {commercialInvalid && (
                      <p className="text-[11px] text-red-300">You need to indicate if your content promotes yourself, a third party, or both.</p>
                    )}
                    {label && <p className="text-xs text-sky-300">{label}</p>}
                  </div>
                )}
              </div>

              {/* Consentimento */}
              <p className="text-xs text-slate-400">
                {branded ? (
                  <>By posting, you agree to TikTok&apos;s <a href={BRANDED_URL} target="_blank" rel="noreferrer" className="text-sky-300 underline">Branded Content Policy</a> and <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="text-sky-300 underline">Music Usage Confirmation</a>.</>
                ) : (
                  <>By posting, you agree to TikTok&apos;s <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="text-sky-300 underline">Music Usage Confirmation</a>.</>
                )}
              </p>

              <p className="text-[11px] text-slate-500">
                After you post, it may take a few minutes for your video to be processed and appear on your profile.
              </p>

              {result && (
                <p className={`rounded-lg border px-3 py-2 text-xs ${result.ok ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' : 'border-red-500/30 bg-red-950/30 text-red-300'}`}>
                  {result.msg}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button onClick={onClose} className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/5">
                  {result?.ok ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={post}
                  disabled={!canPost}
                  className="flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'linear-gradient(to right, #25f4ee, #fe2c55)' }}
                >
                  {posting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : 'Post'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
