'use client'
import { useState } from 'react'
import Link from 'next/link'
import { OKINAWA_CITIES } from '@/lib/constants'

const DUMMY_REQUESTS = [
  {
    id: '1', type: 'support', title: '那覇市新築マンション現場 鳶工募集',
    trade: '鳶工', area: '那覇市',
    period_start: '4/18', period_end: '5/2',
    daily_rate: 18000, headcount: 3, is_urgent: true,
    user: { company_name: '(株)沖縄建設' },
  },
  {
    id: '2', type: 'support', title: '浦添市商業施設 型枠工急募',
    trade: '型枠工', area: '浦添市',
    period_start: '4/16', period_end: '4/29',
    daily_rate: 16000, headcount: 2, is_urgent: true,
    user: { company_name: '南建設工業' },
  },
  {
    id: '3', type: 'support', title: '沖縄市住宅新築 大工さん募集',
    trade: '大工', area: '沖縄市',
    period_start: '4/22', period_end: '5/15',
    daily_rate: 17000, headcount: 2, is_urgent: false,
    user: { company_name: '島建工務店' },
  },
  {
    id: '4', type: 'subcontract', title: '豊見城市商業施設 内装工事',
    trade: '内装工事', area: '豊見城市',
    period_start: '4/30', period_end: '5/30',
    daily_rate: null, headcount: null, is_urgent: true,
    user: { company_name: '(株)沖縄総合建設' },
  },
  {
    id: '5', type: 'subcontract', title: '那覇市再開発 左官工事一式',
    trade: '左官', area: '那覇市',
    period_start: '5/5', period_end: '6/14',
    daily_rate: null, headcount: null, is_urgent: false,
    user: { company_name: '大成沖縄(株)' },
  },
  {
    id: '6', type: 'subcontract', title: '浦添市マンション 防水工事協力会社',
    trade: '防水工', area: '浦添市',
    period_start: '5/15', period_end: '6/4',
    daily_rate: null, headcount: null, is_urgent: false,
    user: { company_name: '琉球ハウジング' },
  },
]

export default function RequestsPage() {
  const [typeFilter, setTypeFilter] = useState<'support' | 'subcontract'>('support')
  const [areaFilter, setAreaFilter] = useState('all')

  const filtered = DUMMY_REQUESTS.filter((r) => {
    if (r.type !== typeFilter) return false
    if (areaFilter !== 'all' && r.area !== areaFilter) return false
    return true
  })

  const isSupport = typeFilter === 'support'

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔧</span>
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">匿名キャリアブック</p>
              <p className="text-gray-400 text-[10px]">沖縄 建設マッチング</p>
            </div>
          </div>
          <button className="text-gray-400 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Type Tab */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-2 bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setTypeFilter('support')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isSupport ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <span>👥</span> 応援
          </button>
          <button
            onClick={() => setTypeFilter('subcontract')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !isSupport ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <span>🏢</span> 下請け
          </button>
        </div>
      </div>

      {/* Area Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setAreaFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              areaFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            全エリア
          </button>
          {OKINAWA_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setAreaFilter(city)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                areaFilter === city
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {filtered.map((req) => (
          <Link
            key={req.id}
            href={`/requests/${req.id}`}
            className={`block bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
              req.type === 'support' ? 'border-l-blue-600' : 'border-l-orange-500'
            } border border-gray-100 hover:shadow-md transition-shadow`}
          >
            {/* Tags + 急募 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  req.type === 'support'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-orange-50 text-orange-600'
                }`}>
                  {req.type === 'support' ? '応援' : '下請け'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                  {req.trade}
                </span>
              </div>
              {req.is_urgent ? (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-red-600 text-white">急募</span>
              ) : (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-green-500 text-white">募集中</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-black text-gray-900 text-[15px] mb-2.5 leading-snug">{req.title}</h3>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2.5">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {req.area}
              </span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {req.period_start}〜{req.period_end}
              </span>
              {req.headcount && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  {req.headcount}名
                </span>
              )}
            </div>

            {/* Price + Company */}
            <div className="flex items-center justify-between">
              {req.daily_rate ? (
                <span className="text-orange-500 font-black text-lg">
                  ¥{(req.daily_rate / 10000).toFixed(1)}万/日
                </span>
              ) : (
                <span className="text-gray-400 text-sm">要相談</span>
              )}
              <span className="text-xs text-gray-400">{req.user.company_name}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16 relative">
          <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-blue-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-bold">ホーム</span>
          </Link>
          <div />
          <Link href="/notifications" className="flex flex-col items-center justify-center gap-0.5 text-gray-400 relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <span className="text-[10px] font-bold">通知</span>
            <span className="absolute top-2 right-6 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">2</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center justify-center gap-0.5 text-gray-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-[10px] font-bold">マイページ</span>
          </Link>
          {/* 中央＋ボタン */}
          <Link
            href="/requests/new"
            className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </Link>
        </div>
      </nav>
    </main>
  )
}
