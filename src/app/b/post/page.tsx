'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { OKINAWA_CITIES, TRADES } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

export default function BusinessPostPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    type: 'support',
    title: '',
    trade: '',
    area: '',
    period_start: '',
    period_end: '',
    daily_rate: '',
    headcount: '',
    description: '',
    is_urgent: false,
  })
  const [submitting, setSubmitting] = useState(false)

  function updateForm(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.title || !form.trade || !form.area || !form.period_start || !form.period_end || !form.description) {
      alert('必須項目を入力してください')
      return
    }
    setSubmitting(true)
    const userId = getCurrentUserId()

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        type: form.type,
        title: form.title,
        trade: form.trade,
        area: form.area,
        period_start: form.period_start,
        period_end: form.period_end,
        daily_rate: form.daily_rate ? parseInt(form.daily_rate) : null,
        headcount: form.headcount ? parseInt(form.headcount) : null,
        description: form.description,
        is_urgent: form.is_urgent,
      }),
    })

    if (res.ok) {
      alert('募集を投稿しました！')
      router.push('/b/home')
    } else {
      alert('投稿に失敗しました')
    }
    setSubmitting(false)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  return (
    <AppShell
      role="business"
      header={
        <h1 className="font-black text-lg text-gray-900">📝 募集を投稿</h1>
      }
    >
      <div className="space-y-4">
        {/* 種別選択 */}
        <div>
          <label className={labelClass}>募集種別 *</label>
          <div className="flex gap-3">
            <button
              onClick={() => updateForm('type', 'support')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                form.type === 'support'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              👥 応援
            </button>
            <button
              onClick={() => updateForm('type', 'subcontract')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                form.type === 'subcontract'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              🏢 下請け
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>タイトル *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="例: 那覇市マンション新築工事 鳶工募集"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>職種 *</label>
          <select
            value={form.trade}
            onChange={(e) => updateForm('trade', e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {TRADES.map((trade) => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>エリア *</label>
          <select
            value={form.area}
            onChange={(e) => updateForm('area', e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {OKINAWA_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>開始日 *</label>
            <input
              type="date"
              value={form.period_start}
              onChange={(e) => updateForm('period_start', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>終了日 *</label>
            <input
              type="date"
              value={form.period_end}
              onChange={(e) => updateForm('period_end', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>日当（円）</label>
            <input
              type="number"
              value={form.daily_rate}
              onChange={(e) => updateForm('daily_rate', e.target.value)}
              placeholder="15000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>募集人数</label>
            <input
              type="number"
              value={form.headcount}
              onChange={(e) => updateForm('headcount', e.target.value)}
              placeholder="3"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>詳細説明 *</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="作業内容、求めるスキル、その他条件を記入"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* 急募スイッチ */}
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200">
          <span className="text-sm font-bold text-gray-700">🔥 急募にする</span>
          <button
            onClick={() => updateForm('is_urgent', !form.is_urgent)}
            className={`relative w-12 h-7 rounded-full transition-all ${
              form.is_urgent ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                form.is_urgent ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <PrimaryButton
          variant="orange"
          onClick={handleSubmit}
          disabled={submitting || !form.title || !form.trade || !form.area || !form.period_start || !form.period_end || !form.description}
        >
          {submitting ? '投稿中...' : '募集を投稿する'}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
