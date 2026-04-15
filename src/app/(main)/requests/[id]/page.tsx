'use client'
import { useState } from 'react'
import Link from 'next/link'
import { REQUEST_TYPE_COLOR, REQUEST_TYPE_LABEL } from '@/lib/constants'

// ダミーデータ
const req = {
  id: '1', type: 'support', title: '鉄筋工 応援 3名急募',
  description: '那覇市内マンション工事現場。経験者優遇。朝8時集合、夕方5時終了予定。道具は各自持参お願いします。',
  trade: '鉄筋工', area: '那覇市',
  period_start: '2026-04-20', period_end: '2026-04-30',
  daily_rate: 22000, headcount: 3, is_urgent: true, status: 'open',
  user: { display_name: '匿名ユーザーA', type: 'company', company_name: '○○建設' },
  _count: { applications: 2 },
}

export default function RequestDetailPage() {
  const [message, setMessage] = useState('')
  const [applied, setApplied] = useState(false)

  const handleApply = () => {
    if (!message.trim()) return
    // TODO: Supabase INSERT
    setApplied(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/requests" className="text-gray-400 text-xl">←</Link>
          <span className="font-black text-gray-800 text-sm">募集詳細</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${REQUEST_TYPE_COLOR[req.type]}`}>
            {REQUEST_TYPE_LABEL[req.type]}
          </span>
          {req.is_urgent && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">急募</span>
          )}
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{req.trade}</span>
        </div>

        {/* Title */}
        <h1 className="font-black text-gray-800 text-xl">{req.title}</h1>

        {/* Info Cards */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">📍 エリア</span>
            <span className="font-bold text-gray-800">{req.area}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">📅 期間</span>
            <span className="font-bold text-gray-800">{req.period_start} 〜 {req.period_end}</span>
          </div>
          {req.daily_rate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">💴 日当</span>
              <span className="font-bold text-orange-600 text-base">¥{req.daily_rate.toLocaleString()}</span>
            </div>
          )}
          {req.headcount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">👷 人数</span>
              <span className="font-bold text-gray-800">{req.headcount}名</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">🏢 投稿者</span>
            <span className="font-bold text-gray-800">{req.user.company_name ?? req.user.display_name}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-700 text-sm mb-2">📝 詳細</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{req.description}</p>
        </div>

        {/* Apply Form */}
        {applied ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-black text-green-700">応募しました！</p>
            <p className="text-xs text-green-600 mt-1">投稿者から返信をお待ちください</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-700 text-sm mb-3">📨 応募する</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="自己紹介や意気込みを書いてください（必須）"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-orange-400"
              rows={4}
            />
            <button
              onClick={handleApply}
              disabled={!message.trim()}
              className="w-full mt-3 bg-orange-500 text-white font-black text-sm py-3.5 rounded-xl disabled:opacity-40"
            >
              応募する
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">※ログインが必要です</p>
          </div>
        )}
      </div>

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
