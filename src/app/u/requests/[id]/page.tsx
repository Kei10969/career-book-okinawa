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
  const [request, setRequest] = useState<(Request & { user?: { display_name?: string; company_name?: string } }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applied, setApplied] = useState(false)
  const [myApplication, setMyApplication] = useState<{ id: string; status: string } | null>(null)
  const [cancelCounts, setCancelCounts] = useState({ late: 0, no_show: 0 })
  const [profileComplete, setProfileComplete] = useState(true)

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
      setMyApplication(data[0])
    }

    // 自分のキャンセル回数 + プロフィール完了チェック
    try {
      const uRes = await fetch(`/api/users/${userId}`)
      const uData = await uRes.json()
      setCancelCounts({
        late: uData.late_cancel_count || 0,
        no_show: uData.no_show_count || 0,
      })
      setProfileComplete(!!uData.profile_completed)
    } catch { /* ignore */ }
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
      const data = await res.json()
      setMyApplication(data)
    } else {
      alert('応募に失敗しました')
    }
    setSubmitting(false)
  }

  async function handleCancel() {
    if (!myApplication || !request) return

    const userId = getCurrentUserId()
    const now = new Date()
    // period_startの前日18時(JST)を計算
    const periodStart = new Date(request.period_start + 'T00:00:00+09:00')
    const deadline = new Date(periodStart)
    deadline.setDate(deadline.getDate() - 1)
    deadline.setHours(18, 0, 0, 0)

    const isLate = now >= deadline
    let cancelType: 'normal' | 'late' = 'normal'

    if (isLate) {
      cancelType = 'late'
      const confirmMsg = `⚠️ このキャンセルはペナルティ対象になります。現在の警告回数: ${cancelCounts.late}回/3回。本当にキャンセルしますか？`
      if (!confirm(confirmMsg)) return
    } else {
      if (!confirm('この応募をキャンセルしますか？')) return
    }

    const res = await fetch('/api/cancellations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: myApplication.id,
        cancelled_by: userId,
        cancel_type: cancelType,
        reason: null,
      }),
    })

    if (res.ok) {
      alert('キャンセルしました')
      setMyApplication({ ...myApplication, status: 'cancelled' })
    } else {
      alert('キャンセルに失敗しました')
    }
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
          {request.status === 'closed' && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
              ✅ 成立済み
            </span>
          )}
          {request.status !== 'closed' && request.is_urgent && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
              🔥 急募
            </span>
          )}
        </div>

        {/* タイトル */}
        <h1 className="text-xl font-black text-gray-900">{request.title}</h1>

        {/* 企業名 */}
        {(request.user?.company_name || request.user?.display_name) && (
          <p className="text-sm text-gray-500">🏢 {request.user.company_name || request.user.display_name}</p>
        )}

        {/* 詳細情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 text-xs w-16 shrink-0">エリア</span>
            <span className="font-bold">{request.area}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 text-xs w-16 shrink-0">職種</span>
            <span className="font-bold">{request.trade}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 text-xs w-16 shrink-0">期間</span>
            <span className="font-bold">{request.period_start} 〜 {request.period_end}</span>
          </div>
          {request.type === 'support' && request.daily_rate && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 text-xs w-16 shrink-0">日当</span>
              <span className="font-bold text-blue-600">{request.daily_rate.toLocaleString()}円/日</span>
            </div>
          )}
          {request.type === 'support' && request.headcount && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 text-xs w-16 shrink-0">募集人数</span>
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

        {/* 応募フォーム / ステータス表示 */}
        {applied ? (
          <div className="space-y-2">
            {myApplication?.status === 'cancelled' ? (
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <span className="text-gray-500 font-bold">キャンセル済み</span>
              </div>
            ) : myApplication?.status === 'approved' ? (
              <>
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <span className="text-green-600 font-bold">✅ 成立済み</span>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full bg-red-100 text-red-600 font-bold text-sm py-3 rounded-2xl active:scale-[0.98] transition-all"
                >
                  キャンセルする
                </button>
              </>
            ) : (
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <span className="text-green-600 font-bold">✅ 応募済み</span>
              </div>
            )}
          </div>
        ) : !profileComplete ? (
          <div className="bg-yellow-50 rounded-2xl p-4 text-center space-y-3">
            <span className="text-3xl">📝</span>
            <p className="font-bold text-sm text-gray-900">プロフィールを登録してください</p>
            <p className="text-xs text-gray-500">応募するには、職種・希望エリアなどのプロフィール登録が必要です。</p>
            <button
              onClick={() => router.push('/u/profile-setup')}
              className="w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl active:scale-[0.98] transition-all"
            >
              プロフィールを登録する
            </button>
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
