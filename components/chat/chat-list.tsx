'use client'

import { useQuery, useMutation } from '@apollo/client'
import { GET_CHATS } from '@/lib/graphql/queries'
import { CREATE_CHAT } from '@/lib/graphql/mutations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, MessageSquare, Loader2, LogIn } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { useUserData } from '@nhost/nextjs'
import { useRouter } from 'next/navigation'

interface Chat {
  id: string
  title: string
  created_at: string
  messages_aggregate: {
    aggregate: {
      count: number
    }
  }
}

export function ChatList() {
  const router = useRouter()
  const user = useUserData()
  const isAuthenticated = !!user
  const userId = user?.id
  
  const { data, loading, error, refetch } = useQuery(GET_CHATS, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only' // Always fetch fresh data
  })
  
  const [createChat, { loading: creating }] = useMutation(CREATE_CHAT, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      console.error('Error creating chat:', error)
    }
  })
  
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateChat = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login')
      return
    }
    
    if (!user.id) {
      console.error('User ID is not available in the user object:', user)
      return
    }

    setIsCreating(true)
    try {
      const now = new Date()
      const formattedDate = now.toISOString() // Use ISO string for consistent formatting
      
      await createChat({
        variables: {
          title: `New Chat - ${formattedDate}`,
          userId: user.id
        }
      })
    } catch (err) {
      console.error('Error creating chat:', err)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your chats...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Please sign in to view your chats</p>
        <Button onClick={() => router.push('/auth/login')}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your chats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading chats</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const chats: Chat[] = data?.chats || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Chats</h1>
          <p className="text-muted-foreground">
            Manage your conversations with the AI assistant
          </p>
        </div>
        <Button 
          onClick={handleCreateChat}
          disabled={isCreating || creating}
          className="gap-2"
        >
          {isCreating || creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Chat
        </Button>
      </div>

      {!data?.chats?.length ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chats yet</h3>
          <p className="text-muted-foreground mb-4">
            Start your first conversation with the AI assistant
          </p>
          <Button onClick={handleCreateChat} disabled={isCreating || creating}>
            {isCreating || creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Your First Chat
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {data.chats.map((chat: Chat) => {
            // Safely parse the date
            const chatDate = chat.created_at ? new Date(chat.created_at) : new Date()
            const formattedDate = isNaN(chatDate.getTime()) 
              ? 'Some time ago' 
              : formatDistanceToNow(chatDate, { addSuffix: true })
            
            return (
              <Link href={`/chats/${chat.id}`} key={chat.id}>
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{chat.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formattedDate}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">
                        {chat.messages_aggregate.aggregate.count} messages
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}