'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Image as ImageIcon, Video, FileText, File, Tag } from 'lucide-react'

interface MediaFile {
  id: string
  file_url: string
  file_type: string
  tags: string[]
  original_name: string
  size_bytes: number
  created_at: string
}

interface Props {
  clientId: string
  files: MediaFile[]
  allTags: string[]
  activeTag?: string
  activeType?: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  pdf: FileText,
  other: File,
}

const TYPE_LABELS: Record<string, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  pdf: 'PDF',
  other: 'Outro',
}

function formatBytes(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibrary({ clientId, files, allTags, activeTag, activeType }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [pendingTags, setPendingTags] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  const uploadFiles = async (fileList: FileList) => {
    if (!fileList.length) return
    setUploading(true)

    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)
      formData.append('tags', JSON.stringify(pendingTags))

      await fetch('/api/media/upload', { method: 'POST', body: formData })
    }

    setUploading(false)
    setPendingTags([])
    router.refresh()
  }

  const addTag = (t: string) => {
    const tag = t.trim().toLowerCase()
    if (tag && !pendingTags.includes(tag)) setPendingTags(p => [...p, tag])
    setTagInput('')
  }

  const removeFile = async (id: string) => {
    if (!confirm('Remover este arquivo?')) return
    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const filterType = (type?: string) => {
    const url = new URL(window.location.href)
    if (type) url.searchParams.set('type', type)
    else url.searchParams.delete('type')
    router.push(url.pathname + '?' + url.searchParams.toString())
  }

  const filterTag = (tag?: string) => {
    const url = new URL(window.location.href)
    if (tag) url.searchParams.set('tag', tag)
    else url.searchParams.delete('tag')
    router.push(url.pathname + '?' + url.searchParams.toString())
  }

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-white bg-zinc-800/50' : 'border-zinc-700 hover:border-zinc-500'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
      >
        <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
        <p className="text-sm text-zinc-400 mb-1">Arraste arquivos aqui ou</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-white underline underline-offset-2 hover:text-zinc-300 transition-colors"
        >
          selecione do computador
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)}
        />

        {/* Tags para o upload */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {pendingTags.map(t => (
            <span key={t} className="flex items-center gap-1 bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-xs">
              #{t}
              <button onClick={() => setPendingTags(p => p.filter(x => x !== t))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
            placeholder="+ adicionar tag"
            className="bg-transparent border-b border-zinc-700 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 px-1 py-0.5 w-28"
          />
        </div>

        {uploading && <p className="text-sm text-zinc-400 mt-3 animate-pulse">Enviando...</p>}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => filterType(undefined)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${!activeType ? 'bg-white text-zinc-900 border-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}
        >
          Todos ({files.length})
        </button>
        {['image', 'video', 'pdf'].map(type => {
          const count = files.filter(f => f.file_type === type).length
          if (!count) return null
          return (
            <button key={type}
              onClick={() => filterType(type)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${activeType === type ? 'bg-white text-zinc-900 border-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}
            >
              {TYPE_LABELS[type]} ({count})
            </button>
          )
        })}
        {allTags.length > 0 && (
          <>
            <span className="text-zinc-700 text-xs ml-1">|</span>
            {allTags.map(tag => (
              <button key={tag}
                onClick={() => filterTag(activeTag === tag ? undefined : tag)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${activeTag === tag ? 'bg-zinc-700 text-white border-zinc-500' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
              >
                <Tag className="h-3 w-3" />#{tag}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Grade de arquivos */}
      {files.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center text-zinc-600">
          <p className="text-sm">Nenhum arquivo ainda. Faça o upload acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map(f => {
            const Icon = TYPE_ICONS[f.file_type] ?? File
            return (
              <div key={f.id} className="group relative rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                {/* Preview */}
                {f.file_type === 'image' ? (
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={f.file_url}
                      alt={f.original_name}
                      className="w-full h-36 object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center h-36 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <Icon className="h-10 w-10 text-zinc-500" />
                  </a>
                )}

                {/* Info */}
                <div className="p-2 space-y-1">
                  <p className="text-xs text-zinc-300 truncate">{f.original_name}</p>
                  <p className="text-xs text-zinc-600">{formatBytes(f.size_bytes)}</p>
                  {f.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.tags.map((t: string) => (
                        <span key={t} className="text-xs text-zinc-500">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão remover */}
                <button
                  onClick={() => removeFile(f.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 rounded-full bg-red-900/80 p-0.5 text-red-300 hover:bg-red-800 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
