'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import RoleBadge from '@/components/RoleBadge'
import StatusBadge from '@/components/StatusBadge'
import PrimaryButton from '@/components/PrimaryButton'
import type { Request, Application } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

interface CancellationInfo {
  id: string
  application_id: string
  cancelled_by: string
  cancel_type: string
  is_revoked: boolean
}

export default function BusinessRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<Request | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applied, setApplied] = useState(false)
  const [cancellations, setCancellations] = useState<CancellationInfo[]>([])
  const [cancelCounts, setCancelCounts] = useState<Record<string, { late: number; no_show: number }>>({})
  const [reviewedApps, setReviewedApps] = useState<Set<string>>(new Set())
  const [cancelDropdown, setCancelDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const userId = getCurrentUserId()
    const [reqRes, appRes] = await Promise.all([
      fetch(`/api/requests/${id}`),
      fetch(`/api/applications?request_id=${id}`),
    ])
    const reqData = await reqRes.json()
    setRequest(reqData)
    const appsData = await appRes.json()
    setApplications(Array.isArray(appsData) ? appsData : [])
    setIsOwner(reqData?.user_id === userId)

    // 既に応募済みかチェック
    const checkRes = await fetch(`/api/applications?request_id=${id}&applicant_id=${userId}`)
    const checkData = await checkRes.json()
    if (Array.isArray(checkData) && checkData.length > 0) {
      setApplied(true)
    }

    // キャンセル情報を取得
    try {
      const cancelRes = await fetch(`/api/cancellations?application_id=`)
      // 全キャンセルから該当のものをフィルタ
      // → application_idでフィルタした方がいい。各applicationのcancelを個別取得
      const allCancellations: CancellationInfo[] = []
      if (Array.isArray(appsData)) {
        for (const app of appsData) {
          try {
            const cRes = await fetch(`/api/cancellations?application_id=${app.id}`)
            const cData = await cRes.json()
            if (Array.isArray(cData)) {
              allCancellations.push(...cData)
            }
          } catch { /* ignore */ }
        }
      }
      setCancellations(allCancellations)
    } catch { /* ignore */ }

    // 応募者のキャンセル回数を取得
    if (Array.isArray(appsData)) {
      const counts: Record<string, { late: number; no_show: number }> = {}
      for (const app of appsData) {
        const applicantId = app.applicant_id || app.applicant?.id
        if (applicantId && !counts[applicantId]) {
          try {
            const uRes = await fetch(`/api/users/${applicantId}`)
            const uData = await uRes.json()
            counts[applicantId] = {
              late: uData.late_cancel_count || 0,
              no_show: uData.no_show_count || 0,
            }
          } catch {
            counts[applicantId] = { late: 0, no_show: 0 }
          }
        }
      }
      setCancelCounts(counts)
    }

    // 評価済みチェック
    if (Array.isArray(appsData)) {
      const reviewed = new Set<string>()
      for (const app of appsData) {
        if (app.status === 'approved') {
          try {
            const rRes = await fetch(`/api/reviews?application_id=${app.id}&reviewer_id=${userId}`)
            const rData = await rRes.json()
            if (rData.exists) reviewed.add(app.id)
          } catch { /* ignore */ }
        }
      }
      setReviewedApps(reviewed)
    }

    setLoading(false)
  }

  async function updateApplicationStatus(appId: string, status: string) {
    setUpdating(appId)
    const res = await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, status }),
    })
    if (res.ok) {
      const result = await res.json()
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: status as Application['status'], _contact: result.applicant_contact } : a))
      )
      if (status === 'approved') {
        const contact = result.applicant_contact
        const info = [contact?.phone, contact?.email].filter(Boolean).join(' / ')
        alert(`✅ 成立しました！\n連絡先: ${info || '未登録'}`)
      } else if (status === 'rejected') {
        alert('応募を却下しました。両者に通知が送信されました。')
      }
    }
    setUpdating(null)
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

  async function handleCancelReport(appId: string, cancelType: 'late' | 'no_show') {
    const userId = getCurrentUserId()
    const app = applications.find(a => a.id === appId)
    if (!app) return

    const applicantId = app.applicant_id || (app.applicant as { id: string } | undefined)?.id || ''
    const counts = cancelCounts[applicantId] || { late: 0, no_show: 0 }

    let confirmMsg = ''
    if (cancelType === 'late') {
      confirmMsg = `このキャンセルはペナルティ対象です。相手の現在の警告回数: ${counts.late}回/3回。3回でアカウント利用停止。本当にキャンセルしますか？`
    } else {
      confirmMsg = `この報告により相手にペナルティが付与されます。無断キャンセル2回でアカウント利用停止。虚偽の報告はお控えください。本当に報告しますか？`
    }

    if (!confirm(confirmMsg)) {
      setCancelDropdown(null)
      return
    }

    const res = await fetch('/api/cancellations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: appId,
        cancelled_by: userId,
        cancel_type: cancelType,
        reason: null,
      }),
    })

    if (res.ok) {
      alert('キャンセルを報告しました')
      setCancelDropdown(null)
      fetchData()
    } else {
      alert('キャンセル報告に失敗しました')
    }
  }

  async function handleRevokeCancel(cancellationId: string) {
    if (!confirm('キャンセル報告を取り消しますか？')) return

    const res = await fetch(`/api/cancellations/${cancellationId}`, {
      method: 'PATCH',
    })

    if (res.ok) {
      alert('キャンセル報告を取り消しました')
      fetchData()
    } else {
      alert('取り消しに失敗しました')
    }
  }

  if (loading) {
    return (
      <AppShell role="business">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!request) {
    return (
      <AppShell role="business">
        <p className="text-center text-gray-500 py-12">募集が見つかりません</p>
      </AppShell>
    )
  }

  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : ''

  return (
    <AppShell
      role="business"
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
        {/* 募集情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <RoleBadge type={request.type} />
            {request.is_urgent && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                🔥 急募
              </span>
            )}
          </div>
          <h1 className="text-lg font-black text-gray-900 mb-2">{request.title}</h1>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>エリア: {request.area}</span>
            <span>職種: {request.trade}</span>
            <span>期間: {request.period_start} 〜 {request.period_end}</span>
            {request.type === 'support' && request.daily_rate && <span>日当: {request.daily_rate.toLocaleString()}円/日</span>}
            {request.type === 'support' && request.headcount && <span>募集人数: {request.headcount}名</span>}
          </div>
        </div>

        {/* 詳細説明 */}
        {request.description && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-500 mb-2">詳細</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
          </div>
        )}

        {/* 自分の投稿の場合: 応募者一覧 */}
        {isOwner && (
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">
              📩 応募者（{applications.length}件）
            </h2>

            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <span className="text-4xl">📭</span>
                <p className="text-gray-500 font-bold text-sm mt-2">まだ応募がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const applicantId = app.applicant_id || (app.applicant as { id?: string } | undefined)?.id || ''
                  const counts = cancelCounts[applicantId] || { late: 0, no_show: 0 }
                  const appCancellations = cancellations.filter(
                    c => c.application_id === app.id && !c.is_revoked
                  )
                  const myCancellation = cancellations.find(
                    c => c.application_id === app.id && c.cancelled_by === userId && !c.is_revoked && (c.cancel_type === 'late' || c.cancel_type === 'no_show')
                  )

                  return (
                    <div key={app.id} className="bg-white rounded-2xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900">
                          {(app.applicant as { nickname?: string } | undefined)?.nickname || app.applicant?.display_name || '匿名'}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>

                      {/* キャンセル回数バッジ */}
                      {(counts.late > 0 || counts.no_show > 0) && (
                        <div className="flex gap-2 mb-2">
                          {counts.late > 0 && (
                            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ⚠️ 当日キャンセル{counts.late}回
                            </span>
                          )}
                          {counts.no_show > 0 && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ⚠️ 無断{counts.no_show}回
                            </span>
                          )}
                        </div>
                      )}

                      {/* プロフィール */}
                      {app.applicant && (() => {
                        const a = app.applicant as { skills?: string[]; qualifications?: string[]; experience_years?: string; desired_salary?: string; bio?: string }
                        return (
                          <div className="bg-gray-50 rounded-xl p-3 mb-2 space-y-1">
                            {a.skills && a.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {a.skills.map((s) => (
                                  <span key={s} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                                ))}
                              </div>
                            )}
                            {a.qualifications && a.qualifications.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {a.qualifications.map((q) => (
                                  <span key={q} className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{q}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              {a.experience_years && <span>経験: {a.experience_years}</span>}
                              {a.desired_salary && <span>希望: {a.desired_salary}</span>}
                            </div>
                            {a.bio && <p className="text-xs text-gray-500 line-clamp-2">{a.bio}</p>}
                          </div>
                        )
                      })()}
                      {app.message && (
                        <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded-xl p-3">
                          応募メッセージ: {app.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mb-2">
                        {new Date(app.created_at).toLocaleDateString('ja-JP')}
                      </p>

                      {/* 成立時: 連絡先表示 */}
                      {app.status === 'approved' && (() => {
                        const contact = (app as Application & { _contact?: { phone?: string; email?: string } })._contact
                        if (!contact) return null
                        return (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                            <p className="text-xs font-bold text-green-700 mb-1">📞 応募者の連絡先</p>
                            {contact.phone && (
                              <p className="text-sm text-green-800">電話: <a href={`tel:${contact.phone}`} className="underline font-bold">{contact.phone}</a></p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-green-800">メール: <a href={`mailto:${contact.email}`} className="underline font-bold">{contact.email}</a></p>
                            )}
                          </div>
                        )
                      })()}

                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                            disabled={updating === app.id}
                            className="flex-1 bg-green-500 text-white font-bold text-xs py-2 rounded-xl disabled:opacity-50"
                          >
                            🤝 成立
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            disabled={updating === app.id}
                            className="flex-1 bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl disabled:opacity-50"
                          >
                            却下
                          </button>
                        </div>
                      )}

                      {/* 成立(approved)時: キャンセル報告 + 評価ボタン */}
                      {app.status === 'approved' && appCancellations.length === 0 && (
                        <div className="flex gap-2 mt-2">
                          {/* 評価ボタン */}
                          {reviewedApps.has(app.id) ? (
                            <span className="flex-1 text-center bg-gray-100 text-gray-500 font-bold text-xs py-2 rounded-xl">
                              ⭐ 評価済み
                            </span>
                          ) : (
                            <button
                              onClick={() => router.push(`/b/review/${app.id}`)}
                              className="flex-1 bg-yellow-100 text-yellow-700 font-bold text-xs py-2 rounded-xl active:scale-[0.98] transition-all"
                            >
                              ⭐ 評価する
                            </button>
                          )}

                          {/* キャンセル報告ドロップダウン */}
                          <div className="relative flex-1">
                            <button
                              onClick={() => setCancelDropdown(cancelDropdown === app.id ? null : app.id)}
                              className="w-full bg-gray-100 text-gray-600 font-bold text-xs py-2 rounded-xl"
                            >
                              ⚠️ キャンセル報告
                            </button>
                            {cancelDropdown === app.id && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                <button
                                  onClick={() => handleCancelReport(app.id, 'late')}
                                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-yellow-700 hover:bg-yellow-50 border-b border-gray-100"
                                >
                                  ⏰ 当日キャンセル
                                </button>
                                <button
                                  onClick={() => handleCancelReport(app.id, 'no_show')}
                                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                                >
                                  ❌ 無断キャンセル
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* キャンセル済み: 取り消しボタン */}
                      {myCancellation && (
                        <div className="mt-2">
                          <div className="bg-gray-50 rounded-xl p-3 mb-2">
                            <p className="text-xs text-gray-600">
                              {myCancellation.cancel_type === 'late' ? '⏰ 当日キャンセル' : '❌ 無断キャンセル'}を報告済み
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeCancel(myCancellation.id)}
                            className="w-full bg-blue-100 text-blue-600 font-bold text-xs py-2 rounded-xl"
                          >
                            報告を取り消す
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 他社の投稿の場合: 応募フォーム */}
        {!isOwner && (
          applied ? (
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <span className="text-green-600 font-bold">✅ 応募済み</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-bold text-sm text-gray-900">この募集に応募する</h2>
              <p className="text-xs text-gray-500">下請け案件として応募できます。メッセージで自社の強みをアピールしましょう。</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="会社紹介・実績・対応可能な内容など"
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <PrimaryButton
                variant="orange"
                onClick={handleApply}
                disabled={submitting}
              >
                {submitting ? '送信中...' : '応募する'}
              </PrimaryButton>
            </div>
          )
        )}
      </div>
    </AppShell>
  )
}
