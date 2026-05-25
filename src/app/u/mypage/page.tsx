'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import StatusBadge from '@/components/StatusBadge'
import PrimaryButton from '@/components/PrimaryButton'
import EmptyState from '@/components/EmptyState'
import { getCurrentUserId } from '@/lib/auth'
import { logoutFromLine } from '@/lib/liff'
import type { Application, Offer, Availability } from '@/types/database'

// カスタムアバター（自分でアップしたもの）かどうか判定
function isCustomAvatar(url: string | null): boolean {
  if (!url) return false
  return url.includes('/avatars/')
}

export default function UserMyPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [editingNickname, setEditingNickname] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avDateFrom, setAvDateFrom] = useState('')
  const [avDateTo, setAvDateTo] = useState('')
  const [avNote, setAvNote] = useState('')
  const [avSubmitting, setAvSubmitting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user_nickname') || localStorage.getItem('user_name') || ''
    setNickname(stored)
    setNewNickname(stored)
    // カスタムアバターのみ表示（LINEアバターは使わない）
    const savedAvatar = localStorage.getItem('user_avatar') || ''
    setAvatarUrl(isCustomAvatar(savedAvatar) ? savedAvatar : null)
    fetchData()
  }, [])

  async function fetchData() {
    const userId = getCurrentUserId()
    try {
      const [appRes, offerRes, avRes] = await Promise.all([
        fetch(`/api/applications?applicant_id=${userId}`),
        fetch(`/api/offers?from_user_id=${userId}`),
        fetch(`/api/availability?user_id=${userId}`),
      ])
      const appData = await appRes.json()
      const offerData = await offerRes.json()
      const avData = await avRes.json()
      setApplications(Array.isArray(appData) ? appData : [])
      setOffers(Array.isArray(offerData) ? offerData : [])
      setAvailabilities(Array.isArray(avData) ? avData : [])
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const userId = getCurrentUserId()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)

    try {
      const res = await fetch('/api/avatar', { method: 'POST', body: formData })
      if (res.ok) {
        const { avatar_url } = await res.json()
        setAvatarUrl(avatar_url)
        localStorage.setItem('user_avatar', avatar_url)
      } else {
        alert('アップロードに失敗しました')
      }
    } catch {
      alert('アップロードに失敗しました')
    }
    setUploading(false)
    // inputをリセット
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  async function addAvailability() {
    if (!avDateFrom || !avDateTo) {
      alert('開始日と終了日を入力してください')
      return
    }
    if (avDateFrom > avDateTo) {
      alert('終了日は開始日以降にしてください')
      return
    }
    setAvSubmitting(true)
    const userId = getCurrentUserId()
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, date_from: avDateFrom, date_to: avDateTo, note: avNote || null }),
    })
    if (res.ok) {
      const data = await res.json()
      setAvailabilities(prev => [...prev, data])
      setAvDateFrom('')
      setAvDateTo('')
      setAvNote('')
    } else {
      alert('登録に失敗しました')
    }
    setAvSubmitting(false)
  }

  async function deleteAvailability(avId: string) {
    if (!confirm('この空き情報を削除しますか？')) return
    const res = await fetch(`/api/availability?id=${avId}`, { method: 'DELETE' })
    if (res.ok) {
      setAvailabilities(prev => prev.filter(a => a.id !== avId))
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
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
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

        {/* プロフィール編集ボタン */}
        <button
          onClick={() => router.push('/u/profile-setup')}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📝</span>
            <div className="text-left">
              <p className="font-bold text-sm text-gray-900">スキル・プロフィール編集</p>
              <p className="text-xs text-gray-400">資格・経験・希望条件を設定</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

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

        {/* 空き状況管理 */}
        <div>
          <h2 className="font-bold text-sm text-gray-500 mb-2">📅 空き状況管理</h2>
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <label className="block text-xs font-bold text-gray-600 mb-1">開始日</label>
                <input
                  type="date"
                  value={avDateFrom}
                  onChange={(e) => setAvDateFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-center px-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-bold text-gray-600 mb-1">終了日</label>
                <input
                  type="date"
                  value={avDateTo}
                  onChange={(e) => setAvDateTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-center px-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <input
              type="text"
              value={avNote}
              onChange={(e) => setAvNote(e.target.value)}
              placeholder="メモ（任意）"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addAvailability}
              disabled={avSubmitting}
              className="w-full bg-blue-600 text-white font-bold text-sm py-2.5 rounded-xl disabled:opacity-50"
            >
              {avSubmitting ? '登録中...' : '登録する'}
            </button>
          </div>

          {availabilities.length === 0 ? (
            <EmptyState icon="📅" title="空き情報はありません" />
          ) : (
            <div className="space-y-2">
              {availabilities.map((av) => (
                <div key={av.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {av.date_from} 〜 {av.date_to}
                    </p>
                    {av.note && <p className="text-xs text-gray-500 mt-0.5">{av.note}</p>}
                  </div>
                  <button
                    onClick={() => deleteAvailability(av.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                  >
                    削除
                  </button>
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
