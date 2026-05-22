'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import SummaryCard from '@/components/SummaryCard'
import RequestCard from '@/components/RequestCard'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import type { Request } from '@/types/database'
import { useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'

interface OfferItem {
  id: string
  request_id: string
  applicant_id: string
  message: string
  status: string
  created_at: string
  applicant?: {
    id: string
    display_name: string
    avatar_url: string | null
    skills: string[]
    areas: string[]
    qualifications: string[]
    experience_years: string | null
    desired_salary: string | null
    job_status: string | null
    bio: string | null
  }
  request?: { title: string; type: string }
  applicant_contact?: { display_name: string; phone: string | null; email: string | null }
}

interface WorkerOffer {
  id: string
  from_user_id: string
  area: string
  trade: string
  condition: string | null
  message: string
  status: string
  created_at: string
  user?: { display_name: string; avatar_url: string | null }
}

interface AvailableWorker {
  user_id: string
  date_from: string
  date_to: string
  note: string | null
  user?: {
    id: string
    skills: string[]
    areas: string[]
  }
}

interface ReviewSummaryMap {
  [userId: string]: { avg: number; total: number }
}

export default function BusinessHomePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [allRequests, setAllRequests] = useState<Request[]>([])
  const [applications, setApplications] = useState<OfferItem[]>([])
  const [workerOffers, setWorkerOffers] = useState<WorkerOffer[]>([])
  const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ posts: 0, applications: 0, pending: 0, matched: 0 })
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [reqTab, setReqTab] = useState<'all' | 'support' | 'subcontract'>('all')
  const [reviewedApps, setReviewedApps] = useState<Set<string>>(new Set())
  const [reviewSummaries, setReviewSummaries] = useState<ReviewSummaryMap>({})

  useEffect(() => {
    const stored = localStorage.getItem('user_nickname') || localStorage.getItem('user_name') || ''
    setCompanyName(stored)
    fetchData()
  }, [])

  async function fetchData() {
    const userId = getCurrentUserId()

    try {
      // 自分の投稿を取得
      const reqRes = await fetch(`/api/requests?user_id=${userId}`)
      const reqData = await reqRes.json()
      const reqs = Array.isArray(reqData) ? reqData : []
      setRequests(reqs)

      // 全投稿の応募を一括取得
      const allApps: OfferItem[] = []
      let pendingCount = 0
      let matchedCount = 0

      for (const req of reqs) {
        const appRes = await fetch(`/api/applications?request_id=${req.id}`)
        const apps = await appRes.json()
        const appList = Array.isArray(apps) ? apps : []

        for (const app of appList) {
          allApps.push({ ...app, request: { title: req.title, type: req.type } })
        }

        pendingCount += appList.filter((a: { status: string }) => a.status === 'pending').length
        matchedCount += appList.filter((a: { status: string }) => a.status === 'approved').length
        req._count = { applications: appList.length }
      }

      setApplications(allApps)
      setStats({
        posts: reqs.length,
        applications: allApps.length,
        pending: pendingCount,
        matched: matchedCount,
      })

      // 評価済みチェック & レビューサマリー取得
      const reviewed = new Set<string>()
      const summaries: ReviewSummaryMap = {}
      for (const app of allApps) {
        if (app.status === 'approved') {
          try {
            const rRes = await fetch(`/api/reviews?application_id=${app.id}&reviewer_id=${userId}`)
            const rData = await rRes.json()
            if (rData.exists) reviewed.add(app.id)
          } catch { /* ignore */ }
        }
        // 応募者の評価サマリーを取得
        const applicantId = app.applicant_id || app.applicant?.id
        if (applicantId && !summaries[applicantId]) {
          try {
            const sRes = await fetch(`/api/reviews?reviewee_id=${applicantId}`)
            const sData = await sRes.json()
            if (sData.total_reviews > 0) {
              const avg = Math.round(((sData.avg_quality + sData.avg_deadline + sData.avg_communication + sData.avg_repeat) / 4) * 10) / 10
              summaries[applicantId] = { avg, total: sData.total_reviews }
            }
          } catch { /* ignore */ }
        }
      }
      setReviewedApps(reviewed)
      setReviewSummaries(summaries)

      // 全募集一覧（他社含む）を取得
      const allReqRes = await fetch('/api/requests')
      const allReqData = await allReqRes.json()
      setAllRequests(Array.isArray(allReqData) ? allReqData : [])

      // 職人のオファー一覧を取得
      const offersRes = await fetch('/api/offers')
      const offersData = await offersRes.json()
      setWorkerOffers(Array.isArray(offersData) ? offersData : [])

      // 今空いてる職人を取得（今日〜7日以内）
      try {
        const avRes = await fetch('/api/availability')
        const avData = await avRes.json()
        if (Array.isArray(avData)) {
          const today = new Date()
          const weekLater = new Date()
          weekLater.setDate(weekLater.getDate() + 7)
          const todayStr = today.toISOString().split('T')[0]
          const weekStr = weekLater.toISOString().split('T')[0]

          // 今日〜7日以内に空きがある人
          const nearAvailability = avData.filter((a: { date_from: string; date_to: string }) =>
            a.date_from <= weekStr && a.date_to >= todayStr
          )

          // ユーザーIDで重複排除して最大5件
          const seen = new Set<string>()
          const unique: AvailableWorker[] = []
          for (const av of nearAvailability) {
            if (!seen.has(av.user_id) && unique.length < 5) {
              seen.add(av.user_id)
              unique.push(av)
            }
          }

          // 各ユーザーのプロフィールを取得
          for (const av of unique) {
            try {
              const uRes = await fetch(`/api/users/${av.user_id}`)
              const uData = await uRes.json()
              av.user = { id: uData.id, skills: uData.skills || [], areas: uData.areas || [] }
            } catch { /* ignore */ }
          }
          setAvailableWorkers(unique)
        }
      } catch { /* ignore */ }
    } catch (e) {
      console.error('fetchData error:', e)
    }
    setLoading(false)
  }

  async function handleApplicationAction(appId: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status }),
      })
      const result = await res.json()

      setApplications(prev => prev.map(a => a.id === appId ? {
        ...a,
        status,
        applicant_contact: result.applicant_contact || undefined,
      } : a))
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        matched: status === 'approved' ? prev.matched + 1 : prev.matched,
      }))

      if (status === 'approved') {
        alert('✅ 成立しました！応募者の連絡先が表示されます。')
      } else {
        alert('応募を却下しました。両者に通知が送信されました。')
      }
    } catch (e) {
      console.error('action error:', e)
    }
  }

  const filteredApps = appFilter === 'all'
    ? applications
    : applications.filter(a => a.status === appFilter)

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <h1 className="font-black text-lg text-gray-900">{companyName || 'ダッシュボード'}</h1>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard icon="📝" label="投稿数" value={stats.posts} color="text-orange-500" />
            <SummaryCard icon="📩" label="応募数" value={stats.applications} color="text-blue-600" />
            <SummaryCard icon="⏳" label="未対応" value={stats.pending} color="text-yellow-600" />
            <SummaryCard icon="🤝" label="成立" value={stats.matched} color="text-green-600" />
          </div>

          {/* 📅 今空いてる職人 */}
          {availableWorkers.length > 0 && (
            <div>
              <h2 className="font-bold text-sm text-gray-500 mb-3">📅 今空いてる職人</h2>
              <div className="space-y-2">
                {availableWorkers.map((av) => (
                  <div
                    key={av.user_id}
                    className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 cursor-pointer active:scale-[0.99] transition-all"
                    onClick={() => router.push(`/b/search/${av.user_id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">
                          {av.user?.skills?.[0] || '職種未設定'}
                        </p>
                        {av.user?.areas && av.user.areas.length > 0 && (
                          <p className="text-xs text-gray-500">📍 {av.user.areas.join(' / ')}</p>
                        )}
                        <p className="text-xs text-green-600 font-bold mt-1">
                          📅 {av.date_from} 〜 {av.date_to}
                        </p>
                        {av.note && <p className="text-xs text-gray-400 mt-0.5">{av.note}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => router.push('/b/search')}
                  className="w-full text-center text-orange-500 font-bold text-sm py-2"
                >
                  もっと見る →
                </button>
              </div>
            </div>
          )}

          {/* オファー一覧 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-3 flex items-center gap-2">
              📩 利用者からのオファー
              {stats.pending > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats.pending}件 未対応
                </span>
              )}
            </h2>

            {/* フィルター */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {([
                { key: 'all', label: 'すべて' },
                { key: 'pending', label: '未対応' },
                { key: 'approved', label: '成立' },
                { key: 'rejected', label: '却下' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setAppFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    appFilter === f.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredApps.length === 0 ? (
              <EmptyState
                icon="📩"
                title={appFilter === 'all' ? 'まだオファーがありません' : `${appFilter === 'pending' ? '未対応' : appFilter === 'approved' ? '成立' : '却下'}のオファーはありません`}
                description="利用者からの応募がここに表示されます"
              />
            ) : (
              <div className="space-y-2">
                {filteredApps.map(app => {
                  const applicantId = app.applicant_id || app.applicant?.id || ''
                  const reviewInfo = reviewSummaries[applicantId]

                  return (
                    <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      {/* 応募者情報 */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {app.applicant?.avatar_url ? (
                              <img src={app.applicant.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : '👤'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">
                              {app.applicant?.display_name || '匿名ユーザー'}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(app.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>

                      {/* 評価バッジ */}
                      {reviewInfo ? (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 mb-2">
                          ⭐ {reviewInfo.avg} ({reviewInfo.total}件)
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 mb-2">
                          評価なし
                        </span>
                      )}

                      {/* 対象の投稿 */}
                      {app.request && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                          <p className="text-[11px] text-gray-400 mb-0.5">対象の募集</p>
                          <p className="text-sm font-bold text-gray-700">
                            {app.request.type === 'support' ? '👷 ' : '🏢 '}
                            {app.request.title}
                          </p>
                        </div>
                      )}

                      {/* 職人プロフィール */}
                      {app.applicant && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2 space-y-1">
                          <p className="text-[11px] text-gray-400 mb-1">職人プロフィール</p>
                          {app.applicant.skills && app.applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.applicant.skills.map((s: string) => (
                                <span key={s} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          )}
                          {app.applicant.qualifications && app.applicant.qualifications.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.applicant.qualifications.map((q: string) => (
                                <span key={q} className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{q}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            {app.applicant.experience_years && <span>📅 {app.applicant.experience_years}</span>}
                            {app.applicant.desired_salary && <span>💰 {app.applicant.desired_salary}</span>}
                            {app.applicant.job_status && (
                              <span>{app.applicant.job_status === 'immediate' ? '🔥 今すぐ転職希望' : app.applicant.job_status === 'considering' ? '🤔 良い案件があれば' : ''}</span>
                            )}
                          </div>
                          {app.applicant.areas && app.applicant.areas.length > 0 && (
                            <p className="text-xs text-gray-500">📍 {app.applicant.areas.join(', ')}</p>
                          )}
                          {app.applicant.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">💬 {app.applicant.bio}</p>
                          )}
                        </div>
                      )}

                      {/* メッセージ */}
                      {app.message && (
                        <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
                          💬 {app.message}
                        </p>
                      )}

                      {/* 成立時: 連絡先表示 */}
                      {app.status === 'approved' && app.applicant_contact && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                          <p className="text-xs font-bold text-green-700 mb-1">📞 応募者の連絡先</p>
                          {(app.applicant_contact as { phone?: string; email?: string }).phone && (
                            <p className="text-sm text-green-800">
                              電話: <a href={`tel:${(app.applicant_contact as { phone: string }).phone}`} className="underline font-bold">{(app.applicant_contact as { phone: string }).phone}</a>
                            </p>
                          )}
                          {(app.applicant_contact as { phone?: string; email?: string }).email && (
                            <p className="text-sm text-green-800">
                              メール: <a href={`mailto:${(app.applicant_contact as { email: string }).email}`} className="underline font-bold">{(app.applicant_contact as { email: string }).email}</a>
                            </p>
                          )}
                          {!(app.applicant_contact as { phone?: string; email?: string }).phone && !(app.applicant_contact as { phone?: string; email?: string }).email && (
                            <p className="text-xs text-green-600">連絡先が未登録です</p>
                          )}
                        </div>
                      )}

                      {/* アクションボタン（未対応のみ） */}
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplicationAction(app.id, 'approved')}
                            className="flex-1 bg-green-500 text-white text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all"
                          >
                            ✅ 承認する
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'rejected')}
                            className="flex-1 bg-gray-200 text-gray-600 text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all"
                          >
                            却下
                          </button>
                        </div>
                      )}

                      {/* 成立時: 評価ボタン */}
                      {app.status === 'approved' && (
                        <div className="mt-2">
                          {reviewedApps.has(app.id) ? (
                            <span className="block text-center bg-gray-100 text-gray-500 font-bold text-xs py-2 rounded-xl">
                              ⭐ 評価済み
                            </span>
                          ) : (
                            <button
                              onClick={() => router.push(`/b/review/${app.id}`)}
                              className="w-full bg-yellow-100 text-yellow-700 font-bold text-xs py-2 rounded-xl active:scale-[0.98] transition-all"
                            >
                              ⭐ 評価する
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 職人のオファー一覧 */}
          {workerOffers.length > 0 && (
            <div>
              <h2 className="font-bold text-sm text-gray-500 mb-3">💼 職人からのオファー</h2>
              <div className="space-y-2">
                {workerOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 cursor-pointer active:scale-[0.99] transition-all"
                    onClick={() => router.push(`/b/offers/${offer.id}`)}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">👤</div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{offer.user?.display_name || '匿名職人'}</p>
                        <p className="text-[10px] text-gray-400">{new Date(offer.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{offer.trade}</span>
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">📍 {offer.area}</span>
                    </div>
                    {offer.condition && (
                      <p className="text-xs text-gray-600 bg-orange-50 rounded-lg px-3 py-2 mb-2 whitespace-pre-wrap">
                        📋 {offer.condition}
                      </p>
                    )}
                    <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-2">{offer.message}</p>
                    <p className="text-[10px] text-orange-500 font-bold mt-2">詳細を見る →</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 自分の投稿一覧 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">📝 自分の投稿</h2>
            {requests.length === 0 ? (
              <EmptyState icon="📝" title="まだ投稿がありません" description="＋ボタンから募集を投稿しましょう" />
            ) : (
              requests.map((req) => (
                <RequestCard key={req.id} request={req} linkPrefix="/b" />
              ))
            )}
          </div>

          {/* 全募集一覧（応援・下請け） */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-3">📋 募集一覧（応援・下請け）</h2>
            <div className="flex gap-2 mb-3">
              {([
                { key: 'all', label: 'すべて' },
                { key: 'support', label: '👷 応援' },
                { key: 'subcontract', label: '🏢 下請け' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setReqTab(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    reqTab === tab.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {(() => {
              const filtered = reqTab === 'all'
                ? allRequests
                : allRequests.filter(r => r.type === reqTab)
              return filtered.length === 0 ? (
                <EmptyState icon="📋" title="募集がありません" />
              ) : (
                filtered.map((req) => (
                  <RequestCard key={req.id} request={req} linkPrefix="/b" />
                ))
              )
            })()}
          </div>
        </div>
      )}
    </AppShell>
  )
}
