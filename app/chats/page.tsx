'use client'

import { ChatList } from '@/components/chat/chat-list'
import { Button } from '@/components/ui/button'
import { useSignOut, useUserData } from '@nhost/nextjs'
import { LogOut, User } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useRouter } from 'next/navigation'

export default function ChatsPage() {
  const { signOut } = useSignOut()
  const user = useUserData()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="border-b bg-background/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold">Welcome back!</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group">
                <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
        <ChatList />
      </div>
    </div>
  )
}