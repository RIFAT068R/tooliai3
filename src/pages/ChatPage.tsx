import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Sparkles, Image, FileSearch, MessageSquare } from 'lucide-react'
import type { Message, Mode, ChatModel, ImageModel } from '../types'
import { MessageBubble } from '../components/chat/MessageBubble'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { InputBar } from '../components/chat/InputBar'
import { useVoice } from '../hooks/useVoice'

interface ChatPageProps {
  conversationId: string
  messages: Message[]
  mode: Mode
  chatModel: ChatModel
  imageModel: ImageModel
  isStreaming: boolean
  streamingContent: string
  onSend: (text: string, file?: File) => void
  onStop?: () => void
  onModeChange: (mode: Mode) => void
  onChatModelChange: (model: ChatModel) => void
  onImageModelChange: (model: ImageModel) => void
  onRegenerate: () => void
}

const MODE_META: Record<Mode, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  chat: { label: 'AI Chat', icon: <MessageSquare size={12} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50' },
  search: { label: 'Web Search', icon: <Globe size={12} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' },
  image: { label: 'Image Generator', icon: <Image size={12} />, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800/50' },
  analyze: { label: 'File Analyzer', icon: <FileSearch size={12} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50' },
}

export function ChatPage({
  conversationId, messages, mode,
  chatModel, imageModel,
  isStreaming, streamingContent,
  onSend, onStop, onModeChange, onChatModelChange, onImageModelChange, onRegenerate
}: ChatPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const meta = MODE_META[mode]

  const {
    sttStatus,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    isProcessing,
    ttsStatus,
    speakingMessageId,
    speak,
    stopSpeaking,
  } = useVoice()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleVoiceStop = async () => {
    try {
      const transcribed = await stopRecording()
      if (transcribed.trim()) onSend(transcribed.trim())
    } catch { /* handled in hook */ }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode badge */}
      <div className="px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </div>
          {mode === 'search' && (
            <span className="text-xs text-muted-foreground">· Sources included in responses</span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
              speakingMessageId={speakingMessageId}
              ttsStatus={ttsStatus}
              onSpeak={speak}
              onStopSpeaking={stopSpeaking}
            />
          ))}

          {/* Streaming message */}
          <AnimatePresence>
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  conversationId,
                  userId: '',
                  role: 'assistant',
                  content: streamingContent,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            {isStreaming && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 shrink-0 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-3xl mx-auto">
          <InputBar
            mode={mode}
            chatModel={chatModel}
            imageModel={imageModel}
            isLoading={isStreaming}
            isRecording={isRecording}
            isProcessing={isProcessing}
            onSend={onSend}
            onStop={onStop}
            onModeChange={onModeChange}
            onChatModelChange={onChatModelChange}
            onImageModelChange={onImageModelChange}
            onVoiceStart={startRecording}
            onVoiceStop={handleVoiceStop}
            onVoiceCancel={cancelRecording}
          />
        </div>
      </div>

      {/* STT error toast */}
      <AnimatePresence>
        {sttStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive text-destructive-foreground text-xs rounded-full shadow-lg z-50"
          >
            Microphone access denied or transcription failed
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
