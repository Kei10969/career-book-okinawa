'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import EmptyState from '@/components/EmptyState'
import { getCurrentUserId } from '@/lib/auth'
import type { Availability } from '@/types/database'

export default function BusinessAvailabilityPage() {
  const [items, setItems] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    date_from: '',
    date_to: '',
    note: '',
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    const userId = getCurrentUserId()
    const res = await fetch(`/api/availability?user_id=${userId}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.date_from || !form.date_to) {
      alert('開始日と終了日を入力してください')
      return
    }
    if (form.date_from > form.date_to) {
      alert('終了日は開始日以降にしてください')
      return
    }

    setSubmitting(true)
    const userId = getCurrentUserId()

    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        date_from: form.date_from,
        date_to: form.date_to,
        note: form.note || null,
      }),
    })

    if (res.ok) {
      setForm({ date_from: '', date_to: '', note: '' })
      await fetchAvailability()
    } else {
      alert('登録に失敗しました')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この空き状況を削除しますか？')) return

    const res = await fetch(`/api/availability?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      alert('削除に失敗しました')
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  return (
    <AppShell
      role="business"
      header={
        <h1 className="font-black text-lg text-gray-900">📅 空き状況管理</h1>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 登録フォーム */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="font-black text-base text-gray-900">空き期間を登録</h2>

            <div>
              <label className={labelClass}>開始日 *</label>
              <input
                type="date"
                value={form.date_from}
                onChange={(e) => updateForm('date_from', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>終了日 *</label>
              <input
                type="date"
                value={form.date_to}
                onChange={(e) => updateForm('date_to', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>メモ（任意）</label>
              <textarea
                value={form.note}
                onChange={(e) => updateForm('note', e.target.value)}
                placeholder="例: 午前のみ対応可、小規模工事のみ等"
                rows={2}
                className={inputClass}
              />
            </div>

            <PrimaryButton
              variant="orange"
              onClick={handleSubmit}
              disabled={submitting || !form.date_from || !form.date_to}
            >
              {submitting ? '登録中...' : '空き状況を登録'}
            </PrimaryButton>
          </div>

          {/* 登録済み一覧 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">📋 登録済みの空き状況</h2>
            {items.length === 0 ? (
              <EmptyState
                icon="📅"
                title="空き状況が未登録です"
                description="空き期間を登録すると、求職者や他の企業に表示されます"
              />
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-gray-800">
                          {formatDate(item.date_from)} 〜 {formatDate(item.date_to)}
                        </p>
                        {item.note && (
                          <p className="text-xs text-gray-500 mt-1">💬 {item.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 text-xs font-bold px-2.5 py-1 rounded-full transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
