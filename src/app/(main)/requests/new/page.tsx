'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { TRADES, OKINAWA_CITIES } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

export default function NewRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    type: 'support',
    trade: '鳶工',
    area: '那覇市',
    title: '',
    description: '',
    period_start: '',
    period_end: '',
    daily_rate: '',
    headcount: '',
    is_urgent: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const isSupport = form.type === 'support'

  const isValid = form.title.trim() && form.description.trim() && form.period_start && form.period_end

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: getCurrentUserId(),
        type: form.type,
        trade: form.trade,
        area: form.area,
        title: form.title.trim(),
        description: form.description.trim(),
        period_start: form.period_start,
        period_end: form.period_end,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
        headcount: form.headcount ? Number(form.headcount) : null,
        is_urgent: form.is_urgent,
        status: 'open',
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setSubmitError(`投稿に失敗しました: ${err.error || '不明なエラー'}`)
      setSubmitting(false)
    } else {
      router.push('/requests')
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-400 p-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="font-black text-gray-900 text-base">リクエスト投稿</span>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 種別 */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-3">リクエスト種別</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => set('type', 'support')}
              className={`py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                isSupport
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              <span className="text-2xl">👥</span>
              <span className="font-black text-sm">応援リクエスト</span>
            </button>
            <button
              onClick={() => set('type', 'subcontract')}
              className={`py-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                !isSupport
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              <span className="text-2xl">🏢</span>
              <span className="font-black text-sm">下請けリクエスト</span>
            </button>
          </div>
        </div>

        {/* 職種 */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-2">職種</label>
          <div className="relative">
            <select
              value={form.trade}
              onChange={(e) => set('trade', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:border-blue-400 font-medium"
            >
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {/* エリア */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-2">エリア</label>
          <div className="relative">
            <select
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:border-blue-400 font-medium"
            >
              {OKINAWA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {/* タイトル */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-2">タイトル <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例）那覇市マンション現場 鳶工募集"
            className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-800 focus:outline-none focus:border-blue-400 placeholder-gray-300"
          />
        </div>

        {/* 詳細 */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-2">詳細 <span className="text-red-500">*</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="工事内容、必要な資格・経験、持参物など"
            className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-800 focus:outline-none focus:border-blue-400 resize-none placeholder-gray-300"
            rows={4}
          />
        </div>

        {/* 期間 */}
        <div>
          <label className="block text-sm font-black text-gray-800 mb-2">期間 <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.period_start}
              onChange={(e) => set('period_start', e.target.value)}
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="date"
              value={form.period_end}
              onChange={(e) => set('period_end', e.target.value)}
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* 応援の場合のみ: 日当・人数 */}
        {isSupport && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-black text-gray-800 mb-2">日当（円）</label>
              <input
                type="number"
                value={form.daily_rate}
                onChange={(e) => set('daily_rate', e.target.value)}
                placeholder="18000"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-800 mb-2">募集人数</label>
              <input
                type="number"
                value={form.headcount}
                onChange={(e) => set('headcount', e.target.value)}
                placeholder="2"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* 急募チェック */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('is_urgent', !form.is_urgent)}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.is_urgent ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_urgent ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          <div>
            <p className="font-black text-sm text-gray-800">急募にする</p>
            <p className="text-xs text-gray-400">一覧で「急募」バッジが表示されます</p>
          </div>
        </label>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
            <p className="text-sm text-red-600 font-bold">{submitError}</p>
          </div>
        )}

        {/* 投稿ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={`w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
            isSupport ? 'bg-blue-600' : 'bg-orange-500'
          }`}
        >
          {submitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </main>
  )
}
