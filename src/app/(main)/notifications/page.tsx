'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Notification } from '@/types/database'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 'dummy-user-id')
      .order('created_at', { ascending: false })

    if (error) {
      setError('通知の取得に失敗しました')
    } else {
      setNotifications((data as Notification[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', 'dummy-user-id')
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter((n) => !n.is_read).length

  const notificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_application': return '📨'
      case 'application_approved': return '✅'
      case 'application_rejected': return '❌'
      case 'new_request': return '🔔'
      default: return '🔔'
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-gray-800 text-sm">通知</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-orange-500 font-bold"
            >
              すべて既読
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-bold">読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-600 font-bold">{error}</p>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🔔</span>
            <p className="text-sm text-gray-400 font-bold">通知はありません</p>
          </div>
        )}

        {!loading && !error && notifications.map((n) => (
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
              <span className="text-xl mt-0.5">{notificationIcon(n.type)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-bold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                    {formatDate(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 shrink-0" />
              )}
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
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500"
            >
              <span className="text-xl">{nav.icon}</span>
              <span className="text-[10px] font-bold">{nav.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  )
}
