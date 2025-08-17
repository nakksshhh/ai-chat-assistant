import { AuthGuard } from '@/components/auth/auth-guard'

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>
}