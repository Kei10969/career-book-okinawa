'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { OKINAWA_CITIES } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'
import type { BusinessProfile } from '@/types/database'

export default function BusinessProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingProfile, setExistingProfile] = useState<BusinessProfile | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    area: '',
    description: '',
  })

  useEffect(() => {
    loadExistingProfile()
  }, [])

  async function loadExistingProfile() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/business-profiles?user_id=${userId}`)
      const data = await res.json()
      if (data && !data.error && data.company_name) {
        setExistingProfile(data)
        setForm({
          company_name: data.company_name || '',
          contact_name: data.contact_name || '',
          phone: data.phone || '',
          email: data.email || '',
          area: data.area || '',
          description: data.description || '',
        })
      }
    } catch (e) {
      console.error('loadExistingProfile error:', e)
    }
    setLoading(false)
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.company_name) {
      alert('会社名は必須です')
      return
    }

    setSubmitting(true)
    const userId = getCurrentUserId()

    try {
      const res = await fetch('/api/business-profiles', {
        method: existingProfile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...form,
        }),
      })

      if (res.ok) {
        localStorage.setItem('profile_completed', 'true')
        router.push('/b/home')
      } else {
        alert('保存に失敗しました')
      }
    } catch {
      alert('保存に失敗しました')
    }
    setSubmitting(false)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  if (loading) {
    return (
      <AppShell role="business" hideNav header={<h1 className="font-black text-lg text-gray-900">🏢 企業プロフィール登録</h1>}>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell hideNav
      role="business"
      header={<h1 className="font-black text-lg text-gray-900">🏢 企業プロフィール登録</h1>}
    >
      <div className="space-y-4">
        <div className="bg-orange-50 rounded-2xl p-4 mb-2">
          <p className="text-sm text-orange-700 font-bold">企業プロフィールを登録して、人材検索を始めましょう。</p>
        </div>

        <div>
          <label className={labelClass}>会社名 *</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => updateForm('company_name', e.target.value)}
            placeholder="株式会社○○建設"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>担当者名</label>
          <input
            type="text"
            value={form.contact_name}
            onChange={(e) => updateForm('contact_name', e.target.value)}
            placeholder="山田太郎"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>連絡先（電話）</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="098-XXX-XXXX"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>メールアドレス</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="info@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>活動エリア</label>
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
          <label className={labelClass}>会社紹介</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="会社の特徴や強みなどを記入"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <PrimaryButton
          variant="orange"
          onClick={handleSubmit}
          disabled={submitting || !form.company_name}
        >
          {submitting ? '保存中...' : '登録する'}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
