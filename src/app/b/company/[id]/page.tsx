'use client'
import { useState, useEffect, use } from 'react'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import EmptyState from '@/components/EmptyState'
import { getCurrentUserId } from '@/lib/auth'
import type { BusinessProfile, Availability } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export default function BusinessCompanyDetailPage({ params }: Props) {
  const { id } = use(params)
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [approaching, setApproaching] = useState(false)
  const [approached, setApproached] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [matchedContact, setMatchedContact] = useState<{ company_name: string; phone: string; contact_name: string } | null>(null)
  const currentUserId = getCurrentUserId()
  const isOwnProfile = currentUserId === id

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [profileRes, availRes, approachRes] = await Promise.all([
        fetch(`/api/business-profiles?user_id=${id}`),
        fetch(`/api/availability?user_id=${id}`),
        fetch(`/api/business-approaches?from_business_id=${currentUserId}`),
      ])

      const profileData = await profileRes.json()
      const availData = await availRes.json()
      const approachData = await approachRes.json()

      if (profileData && !profileData.error) {
        setProfile(profileData)
      }
      setAvailability(Array.isArray(availData) ? availData : [])

      // 既にアプローチ済みかチェック
      if (Array.isArray(approachData)) {
        const existing = approachData.find(
          (a: { to_business_id: string; status: string }) =>
            a.to_business_id === id && a.status === 'pending'
        )
        if (existing) setApproached(true)

        // 成立済みの場合、連絡先を表示
        const matched = approachData.find(
          (a: { to_business_id: string; status: string }) =>
            a.to_business_id === id && a.status === 'accepted'
        )
        if (matched) {
          setApproached(true)
          setMatchedContact({
            company_name: profileData?.company_name || '',
            phone: profileData?.phone || '未登録',
            contact_name: profileData?.contact_name || '',
          })
        }
      }
    } catch (e) {
      console.error('fetchData error:', e)
    }
    setLoading(false)
  }

  async function handleApproach() {
    setApproaching(true)
    try {
      const res = await fetch('/api/business-approaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_business_id: currentUserId,
          to_business_id: id,
          message: message || null,
        }),
      })

      if (res.ok) {
        setApproached(true)
        setShowForm(false)
        alert('✅ アプローチを送信しました！')
      } else {
        const err = await res.json()
        alert(err.error || 'アプローチの送信に失敗しました')
      }
    } catch {
      alert('エラーが発生しました')
    }
    setApproaching(false)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white'

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-black text-lg text-gray-900">🏢 企業プロフィール</h1>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : !profile ? (
        <EmptyState icon="🏢" title="企業情報が見つかりません" />
      ) : (
        <div className="space-y-4">
          {/* 企業情報 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <h2 className="font-black text-lg text-gray-900">{profile.company_name}</h2>
                {profile.area && (
                  <p className="text-xs text-gray-500">📍 {profile.area}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {profile.description && (
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-gray-400 text-xs">業種</span>
                  <p className="font-bold text-gray-700">{profile.description}</p>
                </div>
              )}
              {profile.contact_name && (
                <p><span className="text-gray-400">担当者:</span> {profile.contact_name}</p>
              )}
              {/* 連絡先は成立後のみ表示 */}
              {matchedContact && profile.phone && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">📞 連絡先（成立済み）</p>
                  <p className="text-sm text-green-800">
                    電話: <a href={`tel:${profile.phone}`} className="underline font-bold">{profile.phone}</a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 空き状況 */}
          <div>
            <h2 className="font-bold text-sm text-gray-500 mb-2">📅 空き状況</h2>
            {availability.length === 0 ? (
              <EmptyState icon="📅" title="空き状況は未登録です" />
            ) : (
              <div className="space-y-2">
                {availability.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <p className="font-bold text-sm text-gray-800">
                      {formatDate(item.date_from)} 〜 {formatDate(item.date_to)}
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500 mt-1">💬 {item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アプローチボタン */}
          {!isOwnProfile && (
            <div>
              {matchedContact ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <p className="font-bold text-green-700">✅ マッチング成立済み</p>
                  <p className="text-xs text-green-600 mt-1">上記の連絡先から直接やり取りしてください</p>
                </div>
              ) : approached ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                  <p className="font-bold text-yellow-700">📩 アプローチ送信済み</p>
                  <p className="text-xs text-yellow-600 mt-1">相手の返答をお待ちください</p>
                </div>
              ) : showForm ? (
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                  <h3 className="font-black text-base text-gray-900">アプローチを送る</h3>
                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="例: 〇〇の現場で人手を探しています。空いている期間にお願いできませんか？"
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton variant="orange" onClick={handleApproach} disabled={approaching}>
                      {approaching ? '送信中...' : '📩 アプローチを送信'}
                    </PrimaryButton>
                    <PrimaryButton variant="gray" fullWidth={false} onClick={() => setShowForm(false)}>
                      キャンセル
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <PrimaryButton variant="orange" onClick={() => setShowForm(true)}>
                  📩 この企業にアプローチする
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
