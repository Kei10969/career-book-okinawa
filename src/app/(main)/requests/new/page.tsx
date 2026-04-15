'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TRADES, OKINAWA_CITIES } from '@/lib/constants'

export default function NewRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    type: 'support',
    title: '',
    description: '',
    trade: '',
    area: '',
    period_start: '',
    period_end: '',
    daily_rate: '',
    headcount: '',
    is_urgent: false,
  })

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    // TODO: Supabase INSERT + ログイン確認
    alert('投稿しました！（Supabase未接続のためダミー）')
    router.push('/requests')
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/requests" className="text-gray-400 text-xl">←</Link>
          <span className="font-black text-gray-800 text-sm">募集を投稿する</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-xs font-black text-gray-500 mb-2">種別</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'support', label: '🦺 応援募集', desc: '職人・人手' },
              { value: 'subcontract', label: '🏢 下請け募集', desc: '協力会社' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => set('type', t.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.type === t.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-sm font-black">{t.label}</div>
                <div className="text-xs text-gray-500">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-xs font-black text-gray-500 mb-2">タイトル <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例: 鉄筋工 応援 3名急募 那覇市"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Trade & Area */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-black text-gray-500 mb-2">職種 <span className="text-red-500">*</span></label>
            <select
              value={form.trade}
              onChange={(e) => set('trade', e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">選択してください</option>
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 mb-2">エリア <span className="text-red-500">*</span></label>
            <select
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
            >
              <option value="">選択してください</option>
              {OKINAWA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Period */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div>
            <label className="block text-xs font-black text-gray-500 mb-2">期間 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.period_start} onChange={(e) => set('period_start', e.target.value)}
                className="border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-400" />
              <input type="date" value={form.period_end} onChange={(e) => set('period_end', e.target.value)}
                className="border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
          {form.type === 'support' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">日当（円）</label>
                <input type="number" value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)}
                  placeholder="20000"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">人数</label>
                <input type="number" value={form.headcount} onChange={(e) => set('headcount', e.target.value)}
                  placeholder="2"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-400" />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-xs font-black text-gray-500 mb-2">詳細説明</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="現場の詳細、集合場所、必要な道具、注意事項など"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-orange-400"
            rows={4}
          />
        </div>

        {/* Urgent */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_urgent}
              onChange={(e) => set('is_urgent', e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <div>
              <div className="font-black text-sm text-gray-800">急募にする</div>
              <div className="text-xs text-gray-500">一覧で「急募」バッジが表示されます</div>
            </div>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.title || !form.trade || !form.area || !form.period_start || !form.period_end}
          className="w-full bg-orange-500 text-white font-black text-sm py-4 rounded-2xl shadow-lg disabled:opacity-40"
        >
          投稿する
        </button>
      </div>
    </main>
  )
}
