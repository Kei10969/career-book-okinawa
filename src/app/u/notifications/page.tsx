'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import NotificationItem from '@/components/NotificationItem'
import EmptyState from '@/components/EmptyState'
import type { Notification } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}`)
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('fetchNotifications error:', e)
    }
    setLoading(false)

    // 既読にする
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
    } catch {}
  }

  return (
    <AppShell
      role="user"
      header={
        <h1 className="font-black text-lg text-gray-900">🔔 通知</h1>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="通知はありません" />
      ) : (
        <div>
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
