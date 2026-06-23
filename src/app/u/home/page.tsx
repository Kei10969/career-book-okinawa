'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/EmptyState'
import type { Offer, Approach, Notification } from '@/types/database'
import { getCurrentUserId } from '@/lib/auth'

interface ApproachWithDetails extends Approach {
  business_profile?: {
    company_name: string
    contact_name: string | null
    area: string | null
    description: string | null
  }
}

export default function UserHomePage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [approaches, setApproaches] = useState<ApproachWithDetails[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const userId = getCurrentUserId()

    try {
      const [offerRes, appRes, notiRes] = await Promise.all([
        fetch(`/api/offers?from_user_id=${userId}`),
        fetch(`/api/approaches?worker_user_id=${userId}`),
        fetch(`/api/notifications?user_id=${userId}&role=user`),
      ])

      const [offerData, appData, notiData] = await Promise.all([
        offerRes.json(),
        appRes.ok ? appRes.json() : [],
        notiRes.ok ? notiRes.json() : [],
      ])

      setOffers(Array.isArray(offerData) ? offerData : [])
      setApproaches(Array.isArray(appData) ? appData : [])
      setNotifications(Array.isArray(notiData) ? notiData.slice(0, 5) : [])
    } catch (e) {
      console.error('fetchInitialData error:', e)
    }
    setLoading(false)
  }

  async function handleApproachAction(approachId: string, status: 'accepted' | 'rejected') {
    setActionLoading(approachId)
    try {
      const res = await fetch(`/api/approaches/${approachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setApproaches((prev) => prev.map((a) => a.id === approachId ? { ...a, status } : a))
      } else {
        alert('操作に失敗しました')
      }
    } catch {
      alert('操作に失敗しました')
    }
    setActionLoading(null)
  }

  const pendingApproaches = approaches.filter((a) => a.status === 'pending')
  const otherApproaches = approaches.filter((a) => a.status !== 'pending')
  const unreadNotifications = notifications.filter((n) => !n.is_read)

  if (loading) {
    return (
      <AppShell
        role="user"
        header={
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <h1 className="font-black text-lg text-gray-900">キャリアブック沖縄</h1>
          </div>
        }
      >
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="user"
      header={
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <h1 className="font-black text-lg text-gray-900">キャリアブック沖縄</h1>
        </div>
      }
    >
      <div className="space-y-6">

        {/* 通知セクション */}
        {unreadNotifications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm text-gray-500 flex items-center gap-2">
                🔔 新着通知
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadNotifications.length}件
                </span>
              </h2>
              <button
                onClick={() => router.push('/u/notifications')}
                className="text-blue-600 text-xs font-bold"
              >
                すべて見る →
              </button>
            </div>
            <div className="space-y-1.5">
              {unreadNotifications.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  onClick={() => router.push('/u/notifications')}
                  className="bg-blue-50 rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <p className="font-bold text-xs text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アプローチセクション */}
        <div>
          <h2 className="font-bold text-sm text-gray-500 mb-3 flex items-center gap-2">
            🤝 あなたへのアプローチ
            {pendingApproaches.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingApproaches.length}件
              </span>
            )}
          </h2>

          {approaches.length === 0 ? (
            <EmptyState icon="🤝" title="アプローチはまだありません" description="オファーを投稿して、企業からのアプローチを待ちましょう" />
          ) : (
            <div className="space-y-2">
              {[...pendingApproaches, ...otherApproaches].map((approach) => (
                <div key={approach.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm">
                        🏢
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">
                          {approach.business_profile?.company_name || '企業'}
                        </p>
                        {approach.business_profile?.contact_name && (
                          <p className="text-[11px] text-gray-500">担当: {approach.business_profile.contact_name}</p>
                        )}
                        {approach.business_profile?.area && (
                          <p className="text-[11px] text-gray-400">📍 {approach.business_profile.area}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      approach.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      approach.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {approach.status === 'pending' ? '未回答' :
                       approach.status === 'accepted' ? '承諾済' : '辞退済'}
                    </span>
                  </div>

                  {/* 業種 */}
                  {approach.business_profile?.description && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        🏗️ {approach.business_profile.description}
                      </span>
                    </div>
                  )}

                  {/* アプローチメッセージ */}
                  {approach.message && (
                    <div className="bg-orange-50 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[11px] text-gray-400 mb-0.5">メッセージ</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{approach.message}</p>
                    </div>
                  )}

                  {approach.status === 'accepted' && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-green-700 font-bold">✅ 承諾済み — 連絡先が企業に開示されました</p>
                    </div>
                  )}

                  {approach.status === 'rejected' && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-gray-500">辞退済み</p>
                    </div>
                  )}

                  {approach.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproachAction(approach.id, 'accepted')}
                        disabled={actionLoading === approach.id}
                        className="flex-1 bg-green-500 text-white text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {actionLoading === approach.id ? '...' : '✅ 承諾する'}
                      </button>
                      <button
                        onClick={() => handleApproachAction(approach.id, 'rejected')}
                        disabled={actionLoading === approach.id}
                        className="flex-1 bg-gray-200 text-gray-600 text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        辞退する
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 自分のオファー */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-500">💼 自分のオファー</h2>
            <button
              onClick={() => router.push('/u/offer')}
              className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-[0.98] transition-all"
            >
              ＋ 新規投稿
            </button>
          </div>

          {offers.length === 0 ? (
            <EmptyState icon="💼" title="オファーはまだありません" description="オファーを投稿して仕事を探しましょう" />
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {offer.trade}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        📍 {offer.area}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      offer.status === 'open' ? 'bg-green-100 text-green-700' :
                      offer.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {offer.status === 'open' ? '募集中' :
                       offer.status === 'matched' ? '成立' :
                       offer.status === 'reviewing' ? '審査中' : '終了'}
                    </span>
                  </div>
                  {offer.condition && (
                    <p className="text-xs text-gray-500 mb-1">条件: {offer.condition}</p>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">{offer.message}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(offer.created_at).toLocaleDateString('ja-JP')} 投稿
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
