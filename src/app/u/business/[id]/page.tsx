'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'

interface BusinessProfile {
  id: string
  user_id: string
  company_name: string
  contact_name: string | null
  phone: string | null
  area: string | null
  description: string | null
  logo_url: string | null
}

export default function BusinessProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchProfile()
  }, [userId])

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/business-profiles?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (e) {
      console.error('fetchProfile error:', e)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <AppShell role="user" header={<h1 className="font-black text-lg text-gray-900">企業プロフィール</h1>}>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell role="user" header={<h1 className="font-black text-lg text-gray-900">企業プロフィール</h1>}>
        <div className="text-center py-12">
          <span className="text-4xl">🏢</span>
          <p className="text-gray-400 text-sm mt-2">企業プロフィールが見つかりませんでした</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-500 text-sm font-bold">
            ← 戻る
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="user"
      header={
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-black text-lg text-gray-900">企業プロフィール</h1>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={profile.company_name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-black text-lg text-gray-900">{profile.company_name}</p>
              {profile.contact_name && (
                <p className="text-sm text-gray-500 mt-0.5">担当: {profile.contact_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          {profile.area && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">エリア</p>
              <p className="text-sm font-bold text-gray-800">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  📍 {profile.area}
                </span>
              </p>
            </div>
          )}

          {profile.phone && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">電話番号</p>
              <p className="text-sm font-bold text-gray-800">
                <a href={`tel:${profile.phone}`} className="text-blue-600 underline">📞 {profile.phone}</a>
              </p>
            </div>
          )}

          {profile.description && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">事業内容</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
