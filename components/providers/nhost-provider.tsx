'use client'

import { NhostProvider } from '@nhost/nextjs'
import { nhost } from '@/lib/nhost'

export function NhostAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NhostProvider 
      nhost={nhost}
      initial={undefined}
    >
      {children}
    </NhostProvider>
  )
}