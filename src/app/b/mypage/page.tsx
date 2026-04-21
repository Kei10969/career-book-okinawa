'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import RequestCard from '@/components/RequestCard'
import EmptyState from '@/components/EmptyState'
import { getCurrentUserId } from '@/lib/auth'
import { logoutFromLine } from '@/lib/liff'
import { OKINAWA_CITIES } from '@/lib/constants'
import type { BusinessProfile, Request } from '@/types/database'

export default function BusinessMyPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    area: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const userId = getCurrentUserId()
    const [profileRes, reqRes] = await Promise.all([
      fetch(`/api/business-profiles?user_id=${userId}`),
      fetch(`/api/requests?user_id=${userId}`),
    ])

    const profileData = await profileRes.json()
    const reqData = await reqRes.json()

    if (profileData && !profileData.error) {
      setProfile(profileData)
      setForm({
        company_name: profileData.company_name || '',
        contact_name: profileData.contact_name || '',
        phone: profileData.phone || '',
        area: profileData.area || '',
        description: profileData.description || '',
      })
    } else {
      setEditing(true) // 初回は編集モード
    }
    setRequests(reqData)
    setLoading(false)
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function saveProfile() {
    if (!form.company_name) {
      alert('会社名は必須です')
      return
    }
    const userId = getCurrentUserId()

    const res = await fetch('/api/business-profiles', {
      method: profile ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        ...form,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setEditing(false)
    } else {
      alert('保存に失敗しました')
    }
  }

  function handleLogout() {
    logoutFromLine()
    localStorage.clear()
    window.location.href = '/'
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  return (
    <AppShell
      role="business"
      header={
        <h1 className="font-black text-lg text-gray-900">🏢 マイページ</h1>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 企業プロフィール */}
          {editing ? (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-black text-base text-gray-900">企業プロフィール編集</h2>

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

              <div className="flex gap-2">
                <PrimaryButton variant="orange" onClick={saveProfile}>
                  保存する
                </PrimaryButton>
                {profile && (
                  <PrimaryButton variant="gray" fullWidth={false} onClick={() => setEditing(false)}>
                    キャンセル
                  </PrimaryButton>
                )}
              </div>
            </div>
          ) : profile ? (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-base text-gray-900">企業プロフィール</h2>
                <button onClick={() => setEditing(true)} className="text-orange-500 text-xs font-bold">
                  編集
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">会社名:</span> <span className="font-bold">{profile.company_name}</span></p>
                {profile.contact_name && (
                  <p><span className="text-gray-400">担当者:</span> {profile.contact_name}</p>
                )}
                {profile.phone && (
                  <p><span className="text-gray-400">連絡先:</span> {profile.phone}</p>
                )}
                {profile.area && (
                  <p><span className="text-gray-400">エリア:</span> {profile.area}</p>
                )}
                {profile.description && (
                  <p className="text-gray-600 text-xs mt-2 bg-gray-50 rounded-xl p-3">{profile.description}</p>
                )}
              </div>
            </div>
          ) : null}

          {/* 投稿履歴 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">📝 投稿履歴</h2>
            {requests.length === 0 ? (
              <EmptyState icon="📝" title="投稿履歴はありません" />
            ) : (
              requests.map((req) => (
                <RequestCard key={req.id} request={req} linkPrefix="/b" />
              ))
            )}
          </div>

          {/* ログアウト */}
          <PrimaryButton variant="gray" onClick={handleLogout}>
            ログアウト
          </PrimaryButton>
        </div>
      )}
    </AppShell>
  )
}
