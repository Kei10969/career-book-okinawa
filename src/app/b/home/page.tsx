'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import SummaryCard from '@/components/SummaryCard'
import RequestCard from '@/components/RequestCard'
import EmptyState from '@/components/EmptyState'
import type { Request } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

export default function BusinessHomePage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ posts: 0, applications: 0, pending: 0, matched: 0 })

  useEffect(() => {
    const stored = localStorage.getItem('user_nickname') || localStorage.getItem('user_name') || ''
    setCompanyName(stored)
    fetchData()
  }, [])

  async function fetchData() {
    const userId = getCurrentUserId()

    // 自分の投稿を取得
    const reqRes = await fetch(`/api/requests?user_id=${userId}`)
    const reqData = await reqRes.json()
    setRequests(reqData)

    // 応募データを取得して統計を計算
    let totalApplications = 0
    let pendingCount = 0
    let matchedCount = 0

    for (const req of reqData) {
      const appRes = await fetch(`/api/applications?request_id=${req.id}`)
      const apps = await appRes.json()
      totalApplications += apps.length
      pendingCount += apps.filter((a: { status: string }) => a.status === 'pending').length
      matchedCount += apps.filter((a: { status: string }) => a.status === 'approved').length

      // 応募数を付与
      req._count = { applications: apps.length }
    }

    setStats({
      posts: reqData.length,
      applications: totalApplications,
      pending: pendingCount,
      matched: matchedCount,
    })

    setLoading(false)
  }

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
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard icon="📝" label="投稿数" value={stats.posts} color="text-orange-500" />
            <SummaryCard icon="📩" label="応募数" value={stats.applications} color="text-blue-600" />
            <SummaryCard icon="⏳" label="未対応" value={stats.pending} color="text-yellow-600" />
            <SummaryCard icon="🤝" label="成立" value={stats.matched} color="text-green-600" />
          </div>

          {/* 投稿一覧 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">自分の投稿</h2>
            {requests.length === 0 ? (
              <EmptyState icon="📝" title="まだ投稿がありません" description="＋ボタンから募集を投稿しましょう" />
            ) : (
              requests.map((req) => (
                <RequestCard key={req.id} request={req} linkPrefix="/b" />
              ))
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
