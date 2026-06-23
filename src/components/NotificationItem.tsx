'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  cancel_report: '⚠️',
  cancel_revoked: '↩️',
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter()
  const icon = typeIcon[notification.type] || '🔔'
  const timeAgo = getTimeAgo(notification.created_at)
  const [expanded, setExpanded] = useState(false)

  const hasProfileLink = !!notification.profile_link
  const hasLink = !!notification.link
  const hasBothDifferentLinks = hasProfileLink && hasLink && notification.profile_link !== notification.link

  function handleClick() {
    setExpanded(!expanded)
  }

  function handleNavigateProfile(e: React.MouseEvent) {
    e.stopPropagation()
    if (notification.profile_link) {
      router.push(notification.profile_link)
    }
  }

  function handleNavigateDetail(e: React.MouseEvent) {
    e.stopPropagation()
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-2xl mb-2 cursor-pointer active:scale-[0.98] transition-all ${
        notification.is_read ? 'bg-white' : 'bg-blue-50'
      } hover:bg-gray-50`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900">{notification.title}</p>
          <p className={`text-xs text-gray-500 mt-0.5 ${expanded ? '' : 'line-clamp-2'}`}>
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">{timeAgo}</p>
            {!expanded && (
              <span className="text-xs text-gray-400 font-medium">タップで詳細</span>
            )}
          </div>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
        )}
      </div>

      {/* 展開時: 詳細エリア */}
      {expanded && (
        <div className="mt-3 ml-9 space-y-2">
          {/* メッセージ全文 */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(notification.created_at).toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* ボタンエリア */}
          {hasBothDifferentLinks ? (
            /* profile_link と link が異なる → 2ボタン表示 */
            <div className="flex gap-2">
              <button
                onClick={handleNavigateProfile}
                className="flex-1 bg-blue-500 text-white font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all"
              >
                👤 プロフィールを見る
              </button>
              <button
                onClick={handleNavigateDetail}
                className="flex-1 bg-gray-100 text-gray-700 font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all"
              >
                📋 案件詳細を見る
              </button>
            </div>
          ) : hasProfileLink ? (
            /* profile_link のみ、または link と同じ → プロフィールボタン */
            <button
              onClick={handleNavigateProfile}
              className="w-full bg-blue-500 text-white font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all"
            >
              👤 相手のプロフィールを見る
            </button>
          ) : hasLink ? (
            /* link のみ（profile_linkなし、既存通知互換） → 従来ボタン */
            <button
              onClick={handleNavigateDetail}
              className="w-full bg-blue-500 text-white font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all"
            >
              👤 相手のプロフィールを見る
            </button>
          ) : null}
        </div>
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
