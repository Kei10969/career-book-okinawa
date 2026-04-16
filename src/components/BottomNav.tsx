'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const color = (href: string) => isActive(href) ? 'text-blue-600' : 'text-gray-400'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
      <div className="max-w-lg mx-auto h-16 relative flex items-stretch">

        {/* ホーム */}
        <Link href="/" className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${color('/')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[10px] font-bold">ホーム</span>
        </Link>

        {/* 募集 */}
        <Link href="/requests" className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${color('/requests')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <span className="text-[10px] font-bold">募集</span>
        </Link>

        {/* 通知 */}
        <Link href="/notifications" className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${color('/notifications')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="text-[10px] font-bold">通知</span>
        </Link>

        {/* マイページ */}
        <Link href="/mypage" className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${color('/mypage')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-[10px] font-bold">マイページ</span>
        </Link>

        {/* 中央＋ボタン */}
        <Link
          href="/requests/new"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>

      </div>
    </nav>
  )
}
