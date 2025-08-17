'use client'

import { useAuthenticationStatus } from '@nhost/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated) {
      router.push('/chats')
    }
  }, [mounted, isAuthenticated, isLoading, router])

  // 🔑 Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-10 animate-in fade-in slide-in-from-top-2 duration-1000 delay-500">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 animate-in zoom-in duration-1000 delay-200">
            <MessageSquare className="h-10 w-10 text-primary-foreground animate-in fade-in duration-1000 delay-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
              AI Chat Assistant
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
              Start conversations with our intelligent AI assistant. Get answers, have discussions, and explore ideas together.
            </p>
          </div>
        </div>

        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          <Button asChild size="lg" className="w-full group hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]">
            <Link href="/auth/login">
              <span className="group-hover:translate-x-1 transition-transform duration-200">Get Started</span>
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground animate-in fade-in duration-1000 delay-1000">
            New user?{' '}
            <Link href="/auth/register" className="text-primary hover:underline transition-all duration-200 hover:text-primary/80">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
