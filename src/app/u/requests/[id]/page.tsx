'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import RoleBadge from '@/components/RoleBadge'
import PrimaryButton from '@/components/PrimaryButton'
import type { Request } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

export default function UserRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetchRequest()
    checkIfApplied()
  }, [id])

  async function fetchRequest() {
    const res = await fetch(`/api/requests/${id}`)
    const data = await res.json()
    setRequest(data)
    setLoading(false)
  }

  async function checkIfApplied() {
    const userId = getCurrentUserId()
    const res = await fetch(`/api/applications?request_id=${id}&applicant_id=${userId}`)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      setApplied(true)
    }
  }

  async function handleApply() {
    if (submitting || applied) return
    setSubmitting(true)
    const userId = getCurrentUserId()

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: id,
        applicant_id: userId,
        message,
      }),
    })

    if (res.ok) {
      setApplied(true)
      setMessage('')
    } else {
      alert('応募に失敗しました')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <AppShell role="user">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!request) {
    return (
      <AppShell role="user">
        <p className="text-center text-gray-500 py-12">募集が見つかりません</p>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="user"
      header={
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="font-bold text-sm">戻る</span>
        </button>
      }
    >
      <div className="space-y-4">
        {/* バッジ */}
        <div className="flex items-center gap-2">
          <RoleBadge type={request.type} />
          {request.is_urgent && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
              🔥 急募
            </span>
          )}
        </div>

        {/* タイトル */}
        <h1 className="text-xl font-black text-gray-900">{request.title}</h1>

        {/* 詳細情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📍</span>
            <span className="font-bold">{request.area}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">🔧</span>
            <span className="font-bold">{request.trade}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📅</span>
            <span className="font-bold">{request.period_start} 〜 {request.period_end}</span>
          </div>
          {request.daily_rate && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">💰</span>
              <span className="font-bold text-blue-600">{request.daily_rate.toLocaleString()}円/日</span>
            </div>
          )}
          {request.headcount && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">👥</span>
              <span className="font-bold">{request.headcount}名</span>
            </div>
          )}
        </div>

        {/* 詳細説明 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-500 mb-2">詳細</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* 応募フォーム */}
        {applied ? (
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <span className="text-green-600 font-bold">✅ 応募済み</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="font-bold text-sm text-gray-900">応募する</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="アピールメッセージ（任意）"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <PrimaryButton
              variant="blue"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting ? '送信中...' : '応募する'}
            </PrimaryButton>
          </div>
        )}
      </div>
    </AppShell>
  )
}
