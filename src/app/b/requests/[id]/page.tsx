'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import RoleBadge from '@/components/RoleBadge'
import StatusBadge from '@/components/StatusBadge'
import PrimaryButton from '@/components/PrimaryButton'
import type { Request, Application } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

export default function BusinessRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<Request | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  // 応募フォーム（他社の投稿用）
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applied, setApplied] = useState(false)

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
    setApplications(await appRes.json())
    setIsOwner(reqData?.user_id === userId)

    // 既に応募済みかチェック
    const checkRes = await fetch(`/api/applications?request_id=${id}&applicant_id=${userId}`)
    const checkData = await checkRes.json()
    if (Array.isArray(checkData) && checkData.length > 0) {
      setApplied(true)
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
            {request.daily_rate && <span>日当: {request.daily_rate.toLocaleString()}円/日</span>}
            {request.headcount && <span>募集人数: {request.headcount}名</span>}
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
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-gray-900">
                        {app.applicant?.nickname || app.applicant?.display_name || '匿名'}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
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
                  </div>
                ))}
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
