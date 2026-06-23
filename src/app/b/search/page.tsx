'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/EmptyState'
import { TRADES, OKINAWA_CITIES, JOB_STATUS, JOB_STATUS_LABEL } from '@/lib/constants'

interface WorkerProfile {
  id: string
  skills: string[]
  areas: string[]
  qualifications: string[]
  experience_years: string | null
  desired_salary: string | null
  job_status: string | null
  bio: string | null
  profile_completed: boolean
  late_cancel_count?: number
  no_show_count?: number
}

interface ReviewInfo {
  avg: number
  total: number
}

const JOB_STATUS_BADGE: Record<string, string> = {
  immediate: 'bg-green-100 text-green-700',
  considering: 'bg-yellow-100 text-yellow-700',
  not_looking: 'bg-gray-100 text-gray-500',
}

export default function BusinessSearchPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [tradeFilter, setTradeFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewMap, setReviewMap] = useState<Record<string, ReviewInfo>>({})
  const [cancelMap, setCancelMap] = useState<Record<string, { late: number; no_show: number }>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchWorkers()
  }, [tradeFilter, areaFilter, statusFilter])

  async function fetchWorkers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (tradeFilter !== 'all') params.set('trade', tradeFilter)
    if (areaFilter !== 'all') params.set('area', areaFilter)
    if (statusFilter !== 'all') params.set('job_status', statusFilter)

    try {
      const res = await fetch(`/api/workers?${params}`)
      const data = await res.json()
      const workerList: WorkerProfile[] = Array.isArray(data) ? data : []
      setWorkers(workerList)

      // 各職人の評価・空き・キャンセル回数を取得
      const reviews: Record<string, ReviewInfo> = {}
      const cancels: Record<string, { late: number; no_show: number }> = {}

      for (const worker of workerList) {
        // 評価
        try {
          const rRes = await fetch(`/api/reviews?reviewee_id=${worker.id}`)
          const rData = await rRes.json()
          if (rData.total_reviews > 0) {
            const avg = Math.round(((rData.avg_quality + rData.avg_deadline + rData.avg_communication + rData.avg_repeat) / 4) * 10) / 10
            reviews[worker.id] = { avg, total: rData.total_reviews }
          }
        } catch { /* ignore */ }

        // キャンセル回数
        try {
          const cRes = await fetch(`/api/users/${worker.id}`)
          const cData = await cRes.json()
          const late = cData.late_cancel_count || 0
          const noShow = cData.no_show_count || 0
          if (late > 0 || noShow > 0) {
            cancels[worker.id] = { late, no_show: noShow }
          }
        } catch { /* ignore */ }
      }

      setReviewMap(reviews)
      setCancelMap(cancels)
    } catch (e) {
      console.error('fetchWorkers error:', e)
      setWorkers([])
    }
    setLoading(false)
  }

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <h1 className="font-black text-lg text-gray-900">人材検索</h1>
        </div>
      }
    >
      {/* 職種フィルター */}
      <div className="mb-3">
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="all">全職種</option>
          {TRADES.map((trade) => (
            <option key={trade} value={trade}>{trade}</option>
          ))}
        </select>
      </div>

      {/* 求職ステータスフィルター */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            statusFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          すべて
        </button>
        {JOB_STATUS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === s.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* エリアチップ横スクロール */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setAreaFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            areaFilter === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          全エリア
        </button>
        {OKINAWA_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => setAreaFilter(city)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              areaFilter === city ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* 検索結果 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : workers.length === 0 ? (
        <EmptyState icon="🔍" title="該当する人材が見つかりません" description="条件を変更して検索してみてください" />
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => {
            const review = reviewMap[worker.id]
            const cancel = cancelMap[worker.id]

            return (
              <button
                key={worker.id}
                onClick={() => router.push(`/b/search/${worker.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm p-4 text-left active:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  {/* 匿名アバター */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-sm text-gray-900">
                        {worker.skills?.[0] || '職種未設定'}
                      </p>
                      {worker.job_status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${JOB_STATUS_BADGE[worker.job_status] || 'bg-gray-100 text-gray-500'}`}>
                          {JOB_STATUS_LABEL[worker.job_status] || worker.job_status}
                        </span>
                      )}
                    </div>

                    {/* 評価バッジ */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      {review ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                          ⭐ {review.avg} ({review.total}件)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">
                          評価なし
                        </span>
                      )}

                    </div>

                    {/* キャンセル回数バッジ */}
                    {cancel && (
                      <div className="flex gap-1 mb-1">
                        {cancel.late > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            ⚠️ 当日キャンセル{cancel.late}回
                          </span>
                        )}
                        {cancel.no_show > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            ⚠️ 無断{cancel.no_show}回
                          </span>
                        )}
                      </div>
                    )}

                    {/* 経験年数 */}
                    {worker.experience_years && (
                      <p className="text-xs text-gray-500 mb-1">🔧 経験 {worker.experience_years}</p>
                    )}

                    {/* エリア */}
                    {worker.areas && worker.areas.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">📍 {worker.areas.join(' / ')}</p>
                    )}

                    {/* 資格タグ */}
                    {worker.qualifications && worker.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {worker.qualifications.slice(0, 3).map((qual) => (
                          <span key={qual} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {qual}
                          </span>
                        ))}
                        {worker.qualifications.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-bold">+{worker.qualifications.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
