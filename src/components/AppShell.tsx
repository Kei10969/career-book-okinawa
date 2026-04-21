'use client'
import { ReactNode } from 'react'
import BottomNav from './BottomNav'
import type { UserRole } from '@/types/database'

interface AppShellProps {
  children: ReactNode
  role: UserRole
  header?: ReactNode
}

export default function AppShell({ children, role, header }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {header && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
            {header}
          </div>
        </header>
      )}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
