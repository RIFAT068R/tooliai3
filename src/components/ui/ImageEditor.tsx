import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Wand2, Loader2 } from 'lucide-react'
import { blink } from '../../blink/client'

interface ImageEditorProps {
  url: string
  onClose: () => void
}

const QUICK_EDITS = [
  'Make the background white',
  'Add dramatic lighting',
  'Convert to watercolor style',
  'Make it look more cinematic',
  'Add a sunset background',
  'Remove the background',
]

export function ImageEditor({ url, onClose }: ImageEditorProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editedUrl, setEditedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = async (editPrompt: string) => {
    if (!editPrompt.trim() || isLoading) return
    setIsLoading(true)
    setError(null)
    setEditedUrl(null)

    try {
      const { data } = await blink.ai.modifyImage({
        images: [url],
        prompt: editPrompt,
      })
      setEditedUrl(data[0]?.url || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Edit failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-primary" />
            <span className="font-semibold text-sm">Edit Image with AI</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          {/* Original */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Original</p>
            <img src={url} alt="Original" className="w-full h-48 object-cover rounded-xl border border-border" />
          </div>

          {/* Result */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Edited</p>
            <div className="w-full h-48 rounded-xl border border-border flex items-center justify-center bg-muted overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs">Editing…</span>
                </div>
              ) : editedUrl ? (
                <img src={editedUrl} alt="Edited" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Result will appear here</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick edits */}
        <div className="px-5 pb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick edits</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EDITS.map((edit) => (
              <button
                key={edit}
                onClick={() => { setPrompt(edit); handleEdit(edit) }}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {edit}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div className="px-5 pb-5">
          {error && <p className="text-xs text-destructive mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit(prompt)}
              placeholder="Describe your edit…"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              onClick={() => handleEdit(prompt)}
              disabled={!prompt.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
