'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { OKINAWA_CITIES, TRADES } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

export default function UserOfferPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    area: '',
    trade: '',
    condition: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.area || !form.trade || !form.message) {
      alert('必須項目を入力してください')
      return
    }
    setSubmitting(true)
    const userId = getCurrentUserId()

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_user_id: userId,
        ...form,
      }),
    })

    if (res.ok) {
      alert('オファーを投稿しました！')
      router.push('/u/home')
    } else {
      alert('投稿に失敗しました')
    }
    setSubmitting(false)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  return (
    <AppShell
      role="user"
      header={
        <h1 className="font-black text-lg text-gray-900">💼 オファーを投稿</h1>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
          <p className="font-bold mb-1">💡 オファーとは？</p>
          <p className="text-xs">「こんな仕事を探しています」をアピールできます。業者からの連絡を待ちましょう。</p>
        </div>

        <div>
          <label className={labelClass}>希望エリア *</label>
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

        <div>
          <label className={labelClass}>希望職種 *</label>
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
          <label className={labelClass}>条件・希望（期間・単価・人数など）</label>
          <input
            type="text"
            value={form.condition}
            onChange={(e) => updateForm('condition', e.target.value)}
            placeholder="例: 日当15,000円以上希望、来月から3ヶ月"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>意気込み・アピール *</label>
          <textarea
            value={form.message}
            onChange={(e) => updateForm('message', e.target.value)}
            placeholder="経験年数やスキルなど自由に書いてください"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        <PrimaryButton
          variant="blue"
          onClick={handleSubmit}
          disabled={submitting || !form.area || !form.trade || !form.message}
        >
          {submitting ? '投稿中...' : 'オファーを投稿する'}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
