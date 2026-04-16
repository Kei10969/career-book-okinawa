'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

// テスト用ユーザーID（LINEログイン実装後に差し替え）
const MY_USER_ID = '11111111-1111-1111-1111-111111111111'

type ApplicationWithDetails = {
  id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  request: { id: string; title: string; trade: string; area: string }
  applicant: { display_name: string; company_name: string | null; type: string }
}

type MyRequest = {
  id: string
  title: string
  trade: string
  area: string
  status: string
  type: string
  is_urgent: boolean
  created_at: string
  applications: { id: string; status: string }[]
}

export default function MyPage() {
  const [tab, setTab] = useState<'my_requests' | 'my_applications'>('my_requests')
  const [myRequests, setMyRequests] = useState<MyRequest[]>([])
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requestApplications, setRequestApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    // 自分の投稿
    const { data: reqData } = await supabase
      .from('requests')
      .select('id, title, trade, area, status, type, is_urgent, created_at, applications(id, status)')
      .eq('user_id', MY_USER_ID)
      .order('created_at', { ascending: false })

    // 自分の応募
    const { data: appData } = await supabase
      .from('applications')
      .select('id, message, status, created_at, request:requests(id, title, trade, area), applicant:users(display_name, company_name, type)')
      .eq('applicant_id', MY_USER_ID)
      .order('created_at', { ascending: false })

    setMyRequests((reqData as unknown as MyRequest[]) ?? [])
    setApplications((appData as unknown as ApplicationWithDetails[]) ?? [])
    setLoading(false)
  }

  const fetchRequestApplications = async (requestId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('applications')
      .select('id, message, status, created_at, request:requests(id, title, trade, area), applicant:users(display_name, company_name, type)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    setRequestApplications((data as unknown as ApplicationWithDetails[]) ?? [])
    setSelectedRequestId(requestId)
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    setUpdating(applicationId)
    const supabase = createClient()
    await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)
    setRequestApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    )
    setUpdating(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  // 応募一覧モーダル
  if (selectedRequestId) {
    const req = myRequests.find((r) => r.id === selectedRequestId)
    return (
      <main className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => setSelectedRequestId(null)} className="text-gray-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div>
              <p className="font-black text-gray-800 text-sm">応募者一覧</p>
              <p className="text-xs text-gray-400">{req?.title}</p>
            </div>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {requestApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm font-bold">まだ応募がありません</p>
            </div>
          ) : (
            requestApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-black text-gray-800 text-sm">
                      {app.applicant?.company_name ?? app.applicant?.display_name ?? '匿名'}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(app.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {app.status === 'approved' ? '承認済み' : app.status === 'rejected' ? '却下' : '審査中'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{app.message}</p>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'approved')}
                      disabled={updating === app.id}
                      className="flex-1 bg-blue-600 text-white font-black text-sm py-2.5 rounded-xl disabled:opacity-40"
                    >
                      {updating === app.id ? '...' : '✓ 承認'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      disabled={updating === app.id}
                      className="flex-1 bg-gray-100 text-gray-600 font-black text-sm py-2.5 rounded-xl disabled:opacity-40"
                    >
                      {updating === app.id ? '...' : '✗ 却下'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-gray-800 text-base">マイページ</span>
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setTab('my_requests')}
            className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
              tab === 'my_requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            自分の投稿
          </button>
          <button
            onClick={() => setTab('my_applications')}
            className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
              tab === 'my_applications' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            応募履歴
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* 自分の投稿タブ */}
        {tab === 'my_requests' && (
          <>
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm font-bold">まだ投稿がありません</p>
                <Link href="/requests/new" className="mt-3 inline-block bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl">
                  ＋ 投稿する
                </Link>
              </div>
            ) : (
              myRequests.map((req) => {
                const pendingCount = req.applications?.filter((a) => a.status === 'pending').length ?? 0
                return (
                  <button
                    key={req.id}
                    onClick={() => fetchRequestApplications(req.id)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-2">
                        <p className="font-black text-gray-800 text-sm leading-snug">{req.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{req.area} · {req.trade}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {pendingCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            応募 {pendingCount}件
                          </span>
                        )}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </>
        )}

        {/* 応募履歴タブ */}
        {tab === 'my_applications' && (
          <>
            {applications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📨</div>
                <p className="text-sm font-bold">まだ応募していません</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-black text-gray-800 text-sm flex-1 mr-2 leading-snug">
                      {app.request?.title ?? '削除済み'}
                    </p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      app.status === 'approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status === 'approved' ? '承認済み' : app.status === 'rejected' ? '却下' : '審査中'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{app.request?.area} · {app.request?.trade}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
