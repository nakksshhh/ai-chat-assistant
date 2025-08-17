'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MessageProps {
  content: string
  sender: 'user' | 'bot'
  timestamp: string
}

export const Message = React.memo(function Message({ content, sender, timestamp }: MessageProps) {
  const isUser = sender === 'user'

  return (
    <div className={cn(
      'flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-subtle-float', 
      isUser && 'flex-row-reverse'
    )}>
      <Avatar className={cn(
        'h-9 w-9 flex-shrink-0 shadow-md transition-all duration-300 hover:scale-110', 
        isUser 
          ? 'bg-gradient-to-br from-primary to-primary/80 shadow-primary/25' 
          : 'bg-gradient-to-br from-secondary to-secondary/80 shadow-secondary/25'
      )}>
        <AvatarFallback className="bg-transparent">
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex flex-col max-w-[80%] group', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-300 hover:shadow-md',
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto hover:shadow-primary/25'
              : 'bg-gradient-to-br from-muted to-muted/80 text-foreground hover:shadow-muted/50'
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
})