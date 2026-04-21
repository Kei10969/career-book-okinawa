'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import RoleBadge from '@/components/RoleBadge'
import StatusBadge from '@/components/StatusBadge'
import type { Request, Application } from '@/types/database'

export default function BusinessRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [request, setRequest] = useState<Request | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [reqRes, appRes] = await Promise.all([
      fetch(`/api/requests/${id}`),
      fetch(`/api/applications?request_id=${id}`),
    ])
    setRequest(await reqRes.json())
    setApplications(await appRes.json())
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
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: status as Application['status'] } : a))
      )
    }
    setUpdating(null)
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
            <span>📍 {request.area}</span>
            <span>🔧 {request.trade}</span>
            <span>📅 {request.period_start} 〜 {request.period_end}</span>
            {request.daily_rate && <span>💰 {request.daily_rate.toLocaleString()}円/日</span>}
            {request.headcount && <span>👥 {request.headcount}名</span>}
          </div>
        </div>

        {/* 応募者一覧 */}
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
                  {app.message && (
                    <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded-xl p-3">
                      {app.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(app.created_at).toLocaleDateString('ja-JP')}
                  </p>

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
      </div>
    </AppShell>
  )
}
