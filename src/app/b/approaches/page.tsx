'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import { getCurrentUserId } from '@/lib/auth'
import type { BusinessApproach } from '@/types/database'

export default function BusinessApproachesPage() {
  const router = useRouter()
  const [received, setReceived] = useState<BusinessApproach[]>([])
  const [sent, setSent] = useState<BusinessApproach[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const currentUserId = getCurrentUserId()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`/api/business-approaches?to_business_id=${currentUserId}`),
        fetch(`/api/business-approaches?from_business_id=${currentUserId}`),
      ])
      const receivedData = await receivedRes.json()
      const sentData = await sentRes.json()
      setReceived(Array.isArray(receivedData) ? receivedData : [])
      setSent(Array.isArray(sentData) ? sentData : [])
    } catch (e) {
      console.error('fetchData error:', e)
    }
    setLoading(false)
  }

  async function handleAction(approachId: string, status: 'accepted' | 'rejected') {
    try {
      const res = await fetch(`/api/business-approaches/${approachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const result = await res.json()

        setReceived(prev => prev.map(a => {
          if (a.id === approachId) {
            return { ...a, status }
          }
          return a
        }))

        if (status === 'accepted') {
          alert(`✅ マッチングが成立しました！\n連絡先: ${result.contact?.phone || '未登録'}`)
        } else {
          alert('アプローチをお断りしました。')
        }
      } else {
        alert('処理に失敗しました')
      }
    } catch {
      alert('エラーが発生しました')
    }
  }

  const pendingCount = received.filter(a => a.status === 'pending').length

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/b/home')} className="text-gray-400 hover:text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-black text-lg text-gray-900">🤝 企業アプローチ</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* タブ切替 */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab('received')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === 'received'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              📩 受信 {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === 'sent'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              📤 送信済み
            </button>
          </div>

          {/* 受信アプローチ一覧 */}
          {tab === 'received' && (
            received.length === 0 ? (
              <EmptyState icon="📩" title="受信したアプローチはありません" description="他の企業からのアプローチがここに表示されます" />
            ) : (
              <div className="space-y-3">
                {received.map((approach) => (
                  <div key={approach.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => router.push(`/b/company/${approach.from_business_id}`)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🏢</div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">
                            {approach.from_profile?.company_name || '企業'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(approach.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={approach.status} />
                    </div>

                    {approach.from_profile?.description && (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-2">
                        {approach.from_profile.description}
                      </span>
                    )}

                    {approach.from_profile?.area && (
                      <p className="text-xs text-gray-500 mb-2">📍 {approach.from_profile.area}</p>
                    )}

                    {approach.message && (
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
                        💬 {approach.message}
                      </p>
                    )}

                    {/* 成立時: 連絡先表示 */}
                    {approach.status === 'accepted' && approach.from_profile?.phone && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                        <p className="text-xs font-bold text-green-700 mb-1">📞 連絡先</p>
                        <p className="text-sm text-green-800">
                          電話: <a href={`tel:${approach.from_profile.phone}`} className="underline font-bold">{approach.from_profile.phone}</a>
                        </p>
                        {approach.from_profile.contact_name && (
                          <p className="text-sm text-green-800">担当: {approach.from_profile.contact_name}</p>
                        )}
                      </div>
                    )}

                    {/* アクションボタン */}
                    {approach.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(approach.id, 'accepted')}
                          className="flex-1 bg-green-500 text-white text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all"
                        >
                          ✅ 承諾する
                        </button>
                        <button
                          onClick={() => handleAction(approach.id, 'rejected')}
                          className="flex-1 bg-gray-200 text-gray-600 text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-all"
                        >
                          お断り
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* 送信済みアプローチ一覧 */}
          {tab === 'sent' && (
            sent.length === 0 ? (
              <EmptyState icon="📤" title="送信したアプローチはありません" description="空きのある企業にアプローチしてみましょう" />
            ) : (
              <div className="space-y-3">
                {sent.map((approach) => (
                  <div key={approach.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => router.push(`/b/company/${approach.to_business_id}`)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🏢</div>
                        <div>
                          <p className="font-bold text-sm text-gray-800">
                            {approach.to_profile?.company_name || '企業'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(approach.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={approach.status} />
                    </div>

                    {approach.message && (
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2 mb-2">
                        💬 {approach.message}
                      </p>
                    )}

                    {/* 成立時: 連絡先 */}
                    {approach.status === 'accepted' && approach.to_profile?.phone && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">📞 連絡先</p>
                        <p className="text-sm text-green-800">
                          電話: <a href={`tel:${approach.to_profile.phone}`} className="underline font-bold">{approach.to_profile.phone}</a>
                        </p>
                        {approach.to_profile.contact_name && (
                          <p className="text-sm text-green-800">担当: {approach.to_profile.contact_name}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </AppShell>
  )
}
