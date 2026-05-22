'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { getCurrentUserId } from '@/lib/auth'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-2xl transition-transform active:scale-110"
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

export default function ReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [revieweeId, setRevieweeId] = useState('')
  const [revieweeName, setRevieweeName] = useState('')
  const [requestTitle, setRequestTitle] = useState('')
  const [reviewType, setReviewType] = useState<'business_to_business' | 'business_to_worker'>('business_to_worker')

  const [quality, setQuality] = useState(0)
  const [deadline, setDeadline] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [repeat, setRepeat] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchData()
  }, [applicationId])

  async function fetchData() {
    const userId = getCurrentUserId()

    try {
      // 既に評価済みかチェック
      const reviewRes = await fetch(`/api/reviews?application_id=${applicationId}&reviewer_id=${userId}`)
      const reviewData = await reviewRes.json()
      if (reviewData.exists) {
        setAlreadyReviewed(true)
        setLoading(false)
        return
      }

      // URLパラメータから情報を取得（searchParamsは使えないがlocalStorageから一時データを取得）
      // 代わりに、applications APIの全件取得でフィルタする
      // applicant_idを指定しないでリクエスト → GETパラメータなしだと全件取る
      const res = await fetch(`/api/applications?request_id=`)
      const allApps = await res.json()
      
      if (Array.isArray(allApps)) {
        const found = allApps.find((a: { id: string }) => a.id === applicationId)
        if (found) {
          setRevieweeId(found.applicant_id || found.applicant?.id || '')
          setRevieweeName(found.applicant?.display_name || '匿名')
          setRequestTitle(found.request?.title || '')
          // typeがcompanyならbusiness_to_business
          // 実際にはapplicantのユーザーtype（DBのtype列）で判定
          // applicantのデータにtypeが含まれていない場合はデフォルトでbusiness_to_worker
          setReviewType('business_to_worker')
        }
      }
    } catch (e) {
      console.error('fetchData error:', e)
    }

    setLoading(false)
  }

  async function handleSubmit() {
    if (quality === 0 || deadline === 0 || communication === 0 || repeat === 0) {
      alert('すべての項目を評価してください')
      return
    }

    setSubmitting(true)
    const userId = getCurrentUserId()

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        reviewer_id: userId,
        reviewee_id: revieweeId,
        review_type: reviewType,
        quality_rating: quality,
        deadline_rating: deadline,
        communication_rating: communication,
        repeat_rating: repeat,
        comment: comment || null,
      }),
    })

    if (res.ok) {
      alert('評価を送信しました！')
      router.back()
    } else {
      const data = await res.json()
      alert(data.error || '送信に失敗しました')
    }
    setSubmitting(false)
  }

  const labelsWorker = ['時間を守る', '作業態度', 'コミュニケーション', 'またお願いしたいか']
  const labelsBusiness = ['作業品質', '納期遵守', 'コミュニケーション', 'またお願いしたいか']
  const labels = reviewType === 'business_to_worker' ? labelsWorker : labelsBusiness
  const values = [quality, deadline, communication, repeat]
  const setters = [setQuality, setDeadline, setCommunication, setRepeat]

  if (loading) {
    return (
      <AppShell role="business">
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (alreadyReviewed) {
    return (
      <AppShell
        role="business"
        header={
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="font-bold text-sm">戻る</span>
          </button>
        }
      >
        <div className="bg-green-50 rounded-2xl p-8 text-center">
          <span className="text-4xl">⭐</span>
          <p className="text-green-600 font-bold mt-2">この応募は評価済みです</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="business"
      header={
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="font-bold text-sm">戻る</span>
        </button>
      }
    >
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h1 className="text-lg font-black text-gray-900 mb-1">⭐ 評価する</h1>
          {requestTitle && <p className="text-sm text-gray-500">対象: {requestTitle}</p>}
          {revieweeName && <p className="text-sm text-gray-500">相手: {revieweeName}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-5">
          {labels.map((label, i) => (
            <div key={label}>
              <p className="text-sm font-bold text-gray-700 mb-2">{label}</p>
              <StarRating value={values[i]} onChange={setters[i]} />
            </div>
          ))}

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">コメント（任意）</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="自由にコメントを記入"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <PrimaryButton
          variant="orange"
          onClick={handleSubmit}
          disabled={submitting || quality === 0 || deadline === 0 || communication === 0 || repeat === 0}
        >
          {submitting ? '送信中...' : '評価を送信する'}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
