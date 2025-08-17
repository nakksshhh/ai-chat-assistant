'use client'

import { useState } from 'react'
import { nhost } from '@/lib/nhost'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MessageSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }
    
    setPasswordError('')
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await nhost.auth.signUp({
        email,
        password,
        options: {
          displayName: email.split('@')[0]
        }
      })
      
      console.log('Sign up result:', result)
      
      if (result.session) {
        // User is immediately signed in
        console.log('Sign up successful with session, redirecting to /chats')
        router.push('/chats')
      } else if (!result.error) {
        // Sign up successful but no session (likely email verification required)
        console.log('Sign up successful, redirecting to login')
        router.push('/auth/login?message=Account created successfully! Please check your email to verify your account.')
      } else {
        // Only show error if there's an actual error
        console.error('Sign up failed:', result.error)
        setError(result.error?.message || 'Sign up failed')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/25 animate-in zoom-in duration-1000 delay-200">
            <MessageSquare className="h-8 w-8 text-primary-foreground animate-in fade-in duration-1000 delay-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">Create Account</h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">Get started with your AI assistant</p>
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-700 shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
              Create a new account to start chatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {(error || passwordError) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {passwordError || error}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full group hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Create Account</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}