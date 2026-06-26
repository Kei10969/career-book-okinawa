'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { getCurrentUserId } from '@/lib/auth'

interface WorkerProfile {
  id: string
  skills: string[]
  areas: string[]
  qualifications: string[]
  experience_years: string | null
  desired_salary: string | null
  job_status: string | null
  bio: string | null
}

interface OfferDetail {
  id: string
  from_user_id: string
  area: string
  trade: string
  condition: string | null
  message: string
  status: string
  created_at: string
  worker_profile: WorkerProfile | null
}

export default function BusinessOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [approachMessage, setApproachMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [approached, setApproached] = useState(false)
  const [checkingApproach, setCheckingApproach] = useState(true)

  useEffect(() => {
    fetchOffer()
  }, [id])

  // offerが取得できたらアプローチ済みチェック
  useEffect(() => {
    if (offer) {
      checkExistingApproach()
    }
  }, [offer])

  async function fetchOffer() {
    try {
      const res = await fetch(`/api/offers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOffer(data)
      }
    } catch (e) {
      console.error('fetchOffer error:', e)
    }
    setLoading(false)
  }

  async function checkExistingApproach() {
    if (!offer) {
      setCheckingApproach(false)
      return
    }
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/approaches?business_user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        const existing = (data as Array<{ worker_user_id: string }>).find(
          (a) => a.worker_user_id === offer.from_user_id
        )
        if (existing) setApproached(true)
      }
    } catch (e) {
      console.error('checkExistingApproach error:', e)
    }
    setCheckingApproach(false)
  }

  async function handleApproach() {
    if (!offer) return
    setSending(true)
    const userId = getCurrentUserId()

    try {
      const res = await fetch('/api/approaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_user_id: userId,
          worker_user_id: offer.from_user_id,
          message: approachMessage || null,
        }),
      })

      if (res.ok) {
        setApproached(true)
        alert('アプローチを送信しました')
        setApproachMessage('')
      } else {
        alert('送信に失敗しました')
      }
    } catch (e) {
      console.error('approach error:', e)
      alert('送信に失敗しました')
    }
    setSending(false)
  }

  const jobStatusLabel = (status: string | null) => {
    switch (status) {
      case 'immediate': return '🔥 今すぐ働きたい'
      case 'considering': return '🤔 良い案件があれば'
      case 'not_looking': return '😌 今は探していない'
      default: return null
    }
  }

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-500 text-lg">←</button>
          <h1 className="font-black text-lg text-gray-900">オファー詳細</h1>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : !offer ? (
        <div className="text-center py-12 text-gray-500">オファーが見つかりません</div>
      ) : (
        <div className="space-y-4">
          {/* オファー内容 */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-gray-900">📋 オファー内容</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                offer.status === 'matched' ? 'bg-green-100 text-green-700' :
                offer.status === 'open' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {offer.status === 'matched' ? '✅ 成立済み' :
                 offer.status === 'open' ? '募集中' :
                 offer.status === 'closed' ? '終了' : offer.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{offer.trade}</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">📍 {offer.area}</span>
              </div>
              {offer.condition && (
                <div className="bg-orange-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">希望条件</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{offer.condition}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">アピール文</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{offer.message}</p>
              </div>
              <p className="text-[11px] text-gray-400">
                投稿日: {new Date(offer.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* 投稿者の匿名プロフィール */}
          {offer.worker_profile && (
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <h2 className="font-black text-base text-gray-900 mb-3">👤 投稿者プロフィール</h2>
              <div className="space-y-2.5">
                {offer.worker_profile.skills && offer.worker_profile.skills.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">職種</p>
                    <div className="flex flex-wrap gap-1">
                      {offer.worker_profile.skills.map((s) => (
                        <span key={s} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {offer.worker_profile.qualifications && offer.worker_profile.qualifications.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">資格</p>
                    <div className="flex flex-wrap gap-1">
                      {offer.worker_profile.qualifications.map((q) => (
                        <span key={q} className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{q}</span>
                      ))}
                    </div>
                  </div>
                )}

                {offer.worker_profile.areas && offer.worker_profile.areas.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">対応エリア</p>
                    <p className="text-sm text-gray-700">📍 {offer.worker_profile.areas.join(', ')}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                  {offer.worker_profile.experience_years && (
                    <span>📅 経験 {offer.worker_profile.experience_years}</span>
                  )}
                  {offer.worker_profile.desired_salary && (
                    <span>💰 {offer.worker_profile.desired_salary}</span>
                  )}
                </div>

                {offer.worker_profile.job_status && jobStatusLabel(offer.worker_profile.job_status) && (
                  <p className="text-sm text-gray-700">{jobStatusLabel(offer.worker_profile.job_status)}</p>
                )}

                {offer.worker_profile.bio && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">自己紹介</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{offer.worker_profile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* アプローチセクション */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            {approached && (
              <div className="bg-green-50 rounded-xl p-2.5 mb-3 text-center">
                <p className="text-green-700 font-bold text-sm">✅ アプローチ済み</p>
              </div>
            )}
            <h2 className="font-black text-base text-gray-900 mb-3">💬 {approached ? '再度アプローチする' : 'アプローチする'}</h2>
            <textarea
              value={approachMessage}
              onChange={(e) => setApproachMessage(e.target.value)}
              placeholder="メッセージを入力（任意）"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              rows={3}
            />
            <PrimaryButton
              variant="orange"
              onClick={handleApproach}
              disabled={sending}
            >
              {sending ? '送信中...' : '🤝 アプローチする'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </AppShell>
  )
}
