'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/database'

interface BottomNavProps {
  role: UserRole
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const prefix = role === 'business' ? '/b' : '/u'
  const accentColor = role === 'business' ? 'text-orange-500' : 'text-blue-600'
  const accentBg = role === 'business' ? 'bg-orange-500' : 'bg-blue-600'

  const navItems = role === 'business'
    ? [
        { href: '/b/home', label: 'ホーム', icon: 'home' },
        { href: '/b/post', label: '投稿', icon: 'plus' },
        { href: '/b/notifications', label: '通知', icon: 'bell' },
        { href: '/b/mypage', label: 'マイページ', icon: 'user' },
      ]
    : [
        { href: '/u/home', label: 'ホーム', icon: 'home' },
        { href: '/u/offer', label: 'オファー', icon: 'plus' },
        { href: '/u/notifications', label: '通知', icon: 'bell' },
        { href: '/u/mypage', label: 'マイページ', icon: 'user' },
      ]

  const isActive = (href: string) => {
    if (href === `${prefix}/home`) return pathname === href || pathname === prefix
    return pathname.startsWith(href)
  }

  const iconMap: Record<string, (active: boolean) => React.ReactNode> = {
    home: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    plus: (active) => (
      <div className={`w-10 h-10 ${active ? accentBg : accentBg} rounded-full flex items-center justify-center`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    ),
    bell: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    user: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
      <div className="max-w-lg mx-auto h-16 flex items-stretch">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const color = item.icon === 'plus' ? '' : active ? accentColor : 'text-gray-400'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${color}`}
            >
              {iconMap[item.icon](active)}
              {item.icon !== 'plus' && (
                <span className="text-[10px] font-bold">{item.label}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
