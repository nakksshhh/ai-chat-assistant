'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚨 handleSubmit triggered")

    if (!message.trim() || sending || disabled) return

    const messageToSend = message.trim()
    setMessage('')
    setSending(true)

    try {
      await onSend(messageToSend)
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setMessage(messageToSend) // Restore on error
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-background/80 backdrop-blur-sm p-4
                 animate-in fade-in slide-in-from-bottom-4 duration-1000"
    >
      <div className="flex gap-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[60px] resize-none transition-all duration-200
                     focus:shadow-lg focus:shadow-primary/10 border-border/50"
          disabled={sending || disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sending || disabled}
          className="self-end h-[60px] w-[60px] group hover:shadow-lg 
                     hover:shadow-primary/25 transition-all duration-300 
                     hover:scale-105 disabled:hover:scale-100"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 group-hover:translate-x-0.5 
                             group-hover:-translate-y-0.5 
                             transition-transform duration-200" />
          )}
        </Button>
      </div>
    </form>
  )
}
