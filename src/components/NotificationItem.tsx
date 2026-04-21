import type { Notification } from '@/types/database'

interface NotificationItemProps {
  notification: Notification
}

const typeIcon: Record<string, string> = {
  new_application: '📩',
  application_approved: '✅',
  application_rejected: '❌',
  new_request: '📢',
  new_offer: '💼',
  offer_response: '🤝',
  match: '🎉',
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const icon = typeIcon[notification.type] || '🔔'
  const timeAgo = getTimeAgo(notification.created_at)

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl mb-2 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}>
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'たった今'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}日前`
  return date.toLocaleDateString('ja-JP')
}
