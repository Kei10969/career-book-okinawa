'use client'
import { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import RequestCard from '@/components/RequestCard'
import EmptyState from '@/components/EmptyState'
import type { Request } from '@/types/database'
import { OKINAWA_CITIES } from '@/lib/constants'

export default function UserHomePage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'support' | 'subcontract'>('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRequests()
  }, [typeFilter, areaFilter])

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
