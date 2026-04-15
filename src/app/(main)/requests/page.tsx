'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TRADES, OKINAWA_CITIES, REQUEST_TYPE_LABEL, REQUEST_TYPE_COLOR } from '@/lib/constants'

// ダミーデータ（Supabase接続後に差し替え）
const DUMMY_REQUESTS = [
  {
    id: '1', type: 'support', title: '鉄筋工 応援 3名急募', trade: '鉄筋工',
    area: '那覇市', period_start: '2026-04-20', period_end: '2026-04-30',
    daily_rate: 22000, headcount: 3, is_urgent: true, status: 'open',
    user: { display_name: '匿名ユーザーA', type: 'company', company_name: '○○建設' },
    _count: { applications: 2 },
  },
  {
    id: '2', type: 'subcontract', title: '内装工事 下請け募集 浦添',
    trade: '内装工事', area: '浦添市',
    period_start: '2026-05-01', period_end: '2026-05-31',
    daily_rate: null, headcount: null, is_urgent: false, status: 'open',
    user: { display_name: '匿名ユーザーB', type: 'company', company_name: '△△工務店' },
    _count: { applications: 5 },
  },
  {
    id: '3', type: 'support', title: '電気工事 応援 沖縄市', trade: '電気工事',
    area: '沖縄市', period_start: '2026-04-18', period_end: '2026-04-25',
    daily_rate: 25000, headcount: 1, is_urgent: false, status: 'open',
    user: { display_name: '匿名ユーザーC', type: 'individual', company_name: null },
    _count: { applications: 1 },
  },
]

export default function RequestsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [tradeFilter, setTradeFilter] = useState<string>('all')

  const filtered = DUMMY_REQUESTS.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (areaFilter !== 'all' && r.area !== areaFilter) return false
    if (tradeFilter !== 'all' && r.trade !== tradeFilter) return false
    return true
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-gray-400 text-xl">←</Link>
          <span className="font-black text-gray-800 text-sm">募集一覧</span>
          <Link href="/requests/new" className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            + 投稿
          </Link>
        </div>
      </header>

      {/* Type Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          {[
            { value: 'all', label: 'すべて' },
            { value: 'support', label: '🦺 応援' },
            { value: 'subcontract', label: '🏢 下請け' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                typeFilter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area Scroll Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setAreaFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
              areaFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            全エリア
          </button>
          {OKINAWA_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setAreaFilter(city)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                areaFilter === city ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">条件に合う募集がありません</p>
          </div>
        ) : (
          filtered.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${REQUEST_TYPE_COLOR[req.type]}`}>
                    {REQUEST_TYPE_LABEL[req.type]}
                  </span>
                  {req.is_urgent && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      急募
                    </span>
                  )}
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                    {req.trade}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{req.area}</span>
              </div>
              <h3 className="font-black text-gray-800 text-sm mb-2">{req.title}</h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>📅 {req.period_start} 〜 {req.period_end}</span>
                {req.daily_rate && (
                  <span className="font-bold text-orange-600">
                    日当 ¥{req.daily_rate.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{req.user.company_name ?? req.user.display_name}</span>
                <span>応募 {req._count.applications}件</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {[
            { href: '/', icon: '🏠', label: 'ホーム' },
            { href: '/requests', icon: '📋', label: '募集' },
            { href: '/notifications', icon: '🔔', label: '通知' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((n) => (
            <Link key={n.href} href={n.href} className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500">
              <span className="text-xl">{n.icon}</span>
              <span className="text-[10px] font-bold">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  )
}
