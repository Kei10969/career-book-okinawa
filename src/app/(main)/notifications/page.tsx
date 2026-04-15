'use client'
import Link from 'next/link'

const DUMMY_NOTIFICATIONS = [
  { id: '1', type: 'new_application', title: '新しい応募が届きました', message: '「鉄筋工 応援 3名急募」に応募がありました', link: '/requests/1', is_read: false, created_at: '2026-04-15T10:30:00Z' },
  { id: '2', type: 'application_approved', title: '応募が承認されました', message: '「内装工事 下請け募集」の応募が承認されました', link: '/requests/2', is_read: true, created_at: '2026-04-14T15:00:00Z' },
]

export default function NotificationsPage() {
  const unread = DUMMY_NOTIFICATIONS.filter((n) => !n.is_read).length

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-gray-800 text-sm">通知</span>
          {unread > 0 && (
            <button className="text-xs text-orange-500 font-bold">すべて既読</button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {DUMMY_NOTIFICATIONS.map((n) => (
          <Link
            key={n.id}
            href={n.link ?? '#'}
            className={`block rounded-2xl p-4 border transition-colors ${
              n.is_read
                ? 'bg-white border-gray-100'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">
                {n.type === 'new_application' ? '📨' : n.type === 'application_approved' ? '✅' : '🔔'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-bold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {[
            { href: '/', icon: '🏠', label: 'ホーム' },
            { href: '/requests', icon: '📋', label: '募集' },
            { href: '/notifications', icon: '🔔', label: '通知' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((n) => (
            <Link key={n.href} href={n.href} className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500">
              <span className="text-xl">{n.icon}</span>
              <span className="text-[10px] font-bold">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  )
}
