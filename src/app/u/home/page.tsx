'use client'
import { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import RequestCard from '@/components/RequestCard'
import EmptyState from '@/components/EmptyState'
import type { Request, Approach } from '@/types/database'
import { OKINAWA_CITIES } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

interface ApproachWithDetails extends Approach {
  business_profile?: {
    company_name: string
    contact_name: string | null
    area: string | null
    description: string | null
  }
}

export default function UserHomePage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [approaches, setApproaches] = useState<ApproachWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'support' | 'subcontract'>('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRequests()
  }, [typeFilter, areaFilter])

  useEffect(() => {
    fetchApproaches()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (areaFilter !== 'all') params.set('area', areaFilter)

    const res = await fetch(`/api/requests?${params}`)
    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }

  async function fetchApproaches() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/approaches?worker_user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setApproaches(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('fetchApproaches error:', e)
    }
  }

  async function handleApproachAction(approachId: string, status: 'accepted' | 'rejected') {
    setActionLoading(approachId)
    try {
      const res = await fetch(`/api/approaches/${approachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setApproaches((prev) => prev.map((a) => a.id === approachId ? { ...a, status } : a))
      } else {
        alert('操作に失敗しました')
      }
    } catch {
      alert('操作に失敗しました')
    }
    setActionLoading(null)
  }

  const pendingApproaches = approaches.filter((a) => a.status === 'pending')
  const otherApproaches = approaches.filter((a) => a.status !== 'pending')

  return (
    <AppShell
      role="user"
      header={
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <h1 className="font-black text-lg text-gray-900">キャリアブック沖縄</h1>
        </div>
      }
    >
      {/* アプローチセクション */}
      {approaches.length > 0 && (
        <div className="mb-5">
          <h2 className="font-bold text-sm text-gray-500 mb-3 flex items-center gap-2">
            🤝 あなたへのアプローチ
            {pendingApproaches.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingApproaches.length}件
              </span>
            )}
          </h2>

          <div className="space-y-2">
            {/* pending を先に表示 */}
            {[...pendingApproaches, ...otherApproaches].map((approach) => (
              <div key={approach.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm">
                      🏢
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">
                        {approach.business_profile?.company_name || '企業'}
                      </p>
                      {approach.business_profile?.contact_name && (
                        <p className="text-[11px] text-gray-500">担当: {approach.business_profile.contact_name}</p>
                      )}
                      {approach.business_profile?.area && (
                        <p className="text-[11px] text-gray-400">📍 {approach.business_profile.area}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    approach.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    approach.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {approach.status === 'pending' ? '未回答' :
                     approach.status === 'accepted' ? '承諾済' : '辞退済'}
                  </span>
                </div>

                {/* 企業紹介 */}
                {approach.business_profile?.description && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                    <p className="text-[11px] text-gray-400 mb-0.5">会社紹介</p>
                    <p className="text-xs text-gray-600 line-clamp-3">{approach.business_profile.description}</p>
                  </div>
                )}

                {approach.message && (
                  <p className="text-sm text-gray-600 bg-orange-50 rounded-lg px-3 py-2 mb-3">
                    💬 {approach.message}
                  </p>
                )}

                {approach.status === 'accepted' && (
                  <div className="bg-green-50 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-green-700 font-bold">✅ 承諾済み — 連絡先が企業に開示されました</p>
                  </div>
                )}

                {approach.status === 'rejected' && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-gray-500">辞退済み</p>
                  </div>
                )}

                {approach.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproachAction(approach.id, 'accepted')}
                      disabled={actionLoading === approach.id}
                      className="flex-1 bg-green-500 text-white text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {actionLoading === approach.id ? '...' : '✅ 承諾する'}
                    </button>
                    <button
                      onClick={() => handleApproachAction(approach.id, 'rejected')}
                      disabled={actionLoading === approach.id}
                      className="flex-1 bg-gray-200 text-gray-600 text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      辞退する
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-3">
        {[
          { value: 'all', label: 'すべて' },
          { value: 'support', label: '応援' },
          { value: 'subcontract', label: '下請け' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value as typeof typeFilter)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              typeFilter === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* エリアチップ横スクロール */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setAreaFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            areaFilter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          全エリア
        </button>
        {OKINAWA_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => setAreaFilter(city)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              areaFilter === city
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* 募集リスト */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon="📋" title="募集がまだありません" description="新しい募集が投稿されるまでお待ちください" />
      ) : (
        <div>
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} linkPrefix="/u" />
          ))}
        </div>
      )}
    </AppShell>
  )
}
