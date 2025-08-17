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
    const submitId = Math.random().toString(36).substring(2, 8);
    console.log(`📝 [${submitId}] MessageInput handleSubmit called`, { 
      message: message.trim(), 
      sending, 
      disabled,
      eventType: e.type,
      target: e.target?.constructor?.name
    })
    
    e.preventDefault()
    
    if (!message.trim() || sending || disabled) {
      console.log(`📝 [${submitId}] MessageInput handleSubmit early return`)
      return
    }

    const messageToSend = message.trim()
    setMessage('') // Clear immediately to prevent double submission
    setSending(true)
    
    console.log(`📝 [${submitId}] MessageInput calling onSend with:`, messageToSend)
    try {
      await onSend(messageToSend)
      console.log(`📝 [${submitId}] MessageInput onSend completed`)
    } catch (error) {
      console.error(`📝 [${submitId}] MessageInput onSend error:`, error)
      // Restore message on error
      setMessage(messageToSend)
    } finally {
      setSending(false)
      console.log(`📝 [${submitId}] MessageInput cleanup complete`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending && !disabled) {
      console.log('⌨️ Enter key pressed - triggering form submit')
      e.preventDefault()
      // Trigger form submission instead of calling handleSubmit directly
      const form = e.currentTarget.closest('form')
      if (form) {
        console.log('⌨️ Form found, calling requestSubmit')
        form.requestSubmit()
      } else {
        console.log('⌨️ No form found!')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background/80 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex gap-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[60px] resize-none transition-all duration-200 focus:shadow-lg focus:shadow-primary/10 border-border/50"
          disabled={sending || disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || sending || disabled}
          className="self-end h-[60px] w-[60px] group hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          )}
        </Button>
      </div>
    </form>
  )
}