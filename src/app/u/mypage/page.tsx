'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import StatusBadge from '@/components/StatusBadge'
import PrimaryButton from '@/components/PrimaryButton'
import EmptyState from '@/components/EmptyState'
import { getCurrentUserId, getCurrentUserAvatar } from '@/lib/auth'
import { logoutFromLine } from '@/lib/liff'
import type { Application, Offer } from '@/types/database'

export default function UserMyPage() {
  const [nickname, setNickname] = useState('')
  const [editingNickname, setEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const avatar = getCurrentUserAvatar()

  useEffect(() => {
    const stored = localStorage.getItem('user_nickname') || localStorage.getItem('user_name') || ''
    setNickname(stored)
    setNewNickname(stored)
    fetchData()
  }, [])

  async function fetchData() {
    const userId = getCurrentUserId()
    try {
      const [appRes, offerRes] = await Promise.all([
        fetch(`/api/applications?applicant_id=${userId}`),
        fetch(`/api/offers?from_user_id=${userId}`),
      ])
      const appData = await appRes.json()
      const offerData = await offerRes.json()
      setApplications(Array.isArray(appData) ? appData : [])
      setOffers(Array.isArray(offerData) ? offerData : [])
    } catch (e) {
      console.error('fetchData error:', e)
    }
    setLoading(false)
  }

  async function saveNickname() {
    const userId = getCurrentUserId()
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: newNickname }),
    })
    setNickname(newNickname)
    localStorage.setItem('user_nickname', newNickname)
    setEditingNickname(false)
  }

  async function deleteOffer(offerId: string) {
    if (!confirm('このオファーを削除しますか？')) return
    const userId = getCurrentUserId()
    const res = await fetch(`/api/offers/${offerId}?from_user_id=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setOffers((prev) => prev.filter((o) => o.id !== offerId))
    } else {
      alert('削除に失敗しました')
    }
  }

  function handleLogout() {
    logoutFromLine()
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <AppShell
      role="user"
      header={
        <h1 className="font-black text-lg text-gray-900">👤 マイページ</h1>
      }
    >
      <div className="space-y-4">
        {/* プロフィール */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div className="flex-1">
            {editingNickname ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button onClick={saveNickname} className="bg-blue-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg">保存</button>
                  <button onClick={() => setEditingNickname(false)} className="bg-gray-100 text-gray-500 font-bold text-xs px-4 py-1.5 rounded-lg">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-black text-base text-gray-900">{nickname}</p>
                <button onClick={() => setEditingNickname(true)} className="text-blue-600 text-xs font-bold">
                  編集
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-0.5">職人</p>
          </div>
        </div>

        {/* 応募履歴 */}
        <div>
          <h2 className="font-bold text-sm text-gray-500 mb-2">📩 応募履歴</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState icon="📩" title="応募履歴はありません" />
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const req = app.request as { title?: string; area?: string; trade?: string } | undefined
                return (
                  <div key={app.id} className="bg-white rounded-2xl shadow-sm p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate flex-1 min-w-0">
                        {req?.title || '（案件情報なし）'}
                      </p>
                      <StatusBadge status={app.status} />
                    </div>
                    {req && (
                      <div className="flex gap-2 text-xs text-gray-500 mb-1">
                        {req.area && <span>📍 {req.area}</span>}
                        {req.trade && <span>🔧 {req.trade}</span>}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(app.created_at).toLocaleDateString('ja-JP')} 応募
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 自分のオファー */}
        <div>
          <h2 className="font-bold text-sm text-gray-500 mb-2">💼 自分のオファー</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : offers.length === 0 ? (
            <EmptyState icon="💼" title="オファーはまだありません" />
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-2xl shadow-sm p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">{offer.trade}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={offer.status} />
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">📍 {offer.area}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{offer.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ログアウト */}
        <PrimaryButton variant="gray" onClick={handleLogout}>
          ログアウト
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
