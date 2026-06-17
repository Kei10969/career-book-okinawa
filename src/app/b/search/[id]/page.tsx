'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { JOB_STATUS_LABEL } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

interface WorkerDetail {
  id: string
  skills: string[]
  areas: string[]
  qualifications: string[]
  experience_years: string | null
  desired_salary: string | null
  job_status: string | null
  bio: string | null
  profile_completed: boolean
}

const JOB_STATUS_BADGE: Record<string, string> = {
  immediate: 'bg-green-100 text-green-700',
  considering: 'bg-yellow-100 text-yellow-700',
  not_looking: 'bg-gray-100 text-gray-500',
}

export default function WorkerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workerId = params.id as string

  const [worker, setWorker] = useState<WorkerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [approaching, setApproaching] = useState(false)
  const [approached, setApproached] = useState(false)
  const [message, setMessage] = useState('')
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [profileComplete, setProfileComplete] = useState(true)

  useEffect(() => {
    if (workerId) {
      fetchWorker()
      checkExistingApproach()
      checkBusinessProfile()
    }
  }, [workerId])

  async function checkBusinessProfile() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/business-profiles?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setProfileComplete(!!(data && data.company_name))
      }
    } catch { /* ignore */ }
  }

  async function fetchWorker() {
    try {
      const res = await fetch(`/api/workers/${workerId}`)
      if (res.ok) {
        const data = await res.json()
        setWorker(data)
      }
    } catch (e) {
      console.error('fetchWorker error:', e)
    }
    setLoading(false)
  }

  async function checkExistingApproach() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/approaches?business_user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        const existing = (data || []).find(
          (a: { worker_user_id: string; status: string }) =>
            a.worker_user_id === workerId && a.status === 'pending'
        )
        if (existing) setApproached(true)
      }
    } catch (e) {
      console.error('checkExistingApproach error:', e)
    }
  }

  async function handleApproach() {
    setApproaching(true)
    const userId = getCurrentUserId()

    try {
      const res = await fetch('/api/approaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_user_id: userId,
          worker_user_id: workerId,
          message: message || null,
        }),
      })

      if (res.ok) {
        setApproached(true)
        setShowMessageForm(false)
        alert('アプローチを送信しました')
      } else {
        const err = await res.json()
        alert(err.error || 'アプローチに失敗しました')
      }
    } catch {
      alert('アプローチに失敗しました')
    }
    setApproaching(false)
  }

  if (loading) {
    return (
      <AppShell role="business" header={<h1 className="font-black text-lg text-gray-900">人材詳細</h1>}>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!worker) {
    return (
      <AppShell role="business" header={<h1 className="font-black text-lg text-gray-900">人材詳細</h1>}>
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">人材が見つかりませんでした</p>
          <button onClick={() => router.back()} className="mt-4 text-orange-500 text-sm font-bold">
            ← 戻る
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="business"
      header={
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-black text-lg text-gray-900">人材詳細</h1>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <p className="font-black text-lg text-gray-900">{worker.skills?.[0] || '職種未設定'}</p>
              {worker.job_status && (
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-1 ${JOB_STATUS_BADGE[worker.job_status] || 'bg-gray-100 text-gray-500'}`}>
                  {JOB_STATUS_LABEL[worker.job_status] || worker.job_status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          {worker.experience_years && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">経験年数</p>
              <p className="text-sm font-bold text-gray-800">🔧 {worker.experience_years}</p>
            </div>
          )}

          {worker.desired_salary && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">希望給与</p>
              <p className="text-sm font-bold text-gray-800">💰 {worker.desired_salary}</p>
            </div>
          )}

          {worker.areas && worker.areas.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">希望エリア</p>
              <div className="flex flex-wrap gap-1">
                {worker.areas.map((area) => (
                  <span key={area} className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    📍 {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {worker.qualifications && worker.qualifications.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">保有資格</p>
              <div className="flex flex-wrap gap-1.5">
                {worker.qualifications.map((qual) => (
                  <span key={qual} className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {qual}
                  </span>
                ))}
              </div>
            </div>
          )}

          {worker.bio && (
            <div>
              <p className="text-xs text-gray-400 font-bold mb-1">自由記述</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{worker.bio}</p>
            </div>
          )}
        </div>

        {/* アプローチボタン */}
        {!profileComplete ? (
          <div className="bg-yellow-50 rounded-2xl p-4 text-center space-y-3">
            <span className="text-3xl">🏢</span>
            <p className="font-bold text-sm text-gray-900">企業プロフィールを登録してください</p>
            <p className="text-xs text-gray-500">アプローチするには、企業プロフィールの登録が必要です。</p>
            <button
              onClick={() => router.push('/b/profile-setup')}
              className="w-full bg-orange-500 text-white font-bold text-sm py-3 rounded-xl active:scale-[0.98] transition-all"
            >
              プロフィールを登録する
            </button>
          </div>
        ) : approached ? (
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-bold text-sm">✅ アプローチ済みです</p>
            <p className="text-green-600 text-xs mt-1">職人の応答をお待ちください</p>
          </div>
        ) : showMessageForm ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">メッセージ（任意）</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="自己紹介や案件の概要など"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none"
            />
            <div className="flex gap-2">
              <PrimaryButton variant="orange" onClick={handleApproach} disabled={approaching}>
                {approaching ? '送信中...' : 'アプローチを送信'}
              </PrimaryButton>
              <PrimaryButton variant="gray" fullWidth={false} onClick={() => setShowMessageForm(false)}>
                キャンセル
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton variant="orange" onClick={() => setShowMessageForm(true)}>
            🤝 アプローチする
          </PrimaryButton>
        )}
      </div>
    </AppShell>
  )
}
