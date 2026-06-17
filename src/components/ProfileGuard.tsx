'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'

interface ProfileGuardProps {
  role: 'user' | 'business'
  children: React.ReactNode
}

/**
 * プロフィール未完了のユーザーに対して、
 * プロフィール登録を促すガード画面を表示する。
 * 完了済みならchildrenをそのまま表示。
 */
export default function ProfileGuard({ role, children }: ProfileGuardProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    checkProfile()
  }, [])

  async function checkProfile() {
    const userId = getCurrentUserId()

    try {
      if (role === 'user') {
        // 職人: usersテーブルのprofile_completedをチェック
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const user = await res.json()
          setProfileComplete(!!user.profile_completed)
        }
      } else {
        // 企業: business_profilesにデータがあるかチェック
        const res = await fetch(`/api/business-profiles?user_id=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setProfileComplete(!!(data && data.company_name))
        }
      }
    } catch (e) {
      console.error('ProfileGuard check error:', e)
    }
    setChecking(false)
  }

  if (checking) {
    return (
      <div className="flex justify-center py-12">
        <div className={`animate-spin w-8 h-8 border-4 ${role === 'user' ? 'border-blue-600' : 'border-orange-500'} border-t-transparent rounded-full`} />
      </div>
    )
  }

  if (!profileComplete) {
    const isUser = role === 'user'
    return (
      <div className="py-12 px-4">
        <div className="text-center space-y-4">
          <span className="text-5xl">{isUser ? '📝' : '🏢'}</span>
          <h2 className="font-black text-lg text-gray-900">
            プロフィールを登録してください
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isUser
              ? '投稿やオファーを行うには、職種・希望エリアなどのプロフィール登録が必要です。'
              : '募集投稿やアプローチを行うには、企業プロフィールの登録が必要です。'}
          </p>
          <button
            onClick={() => router.push(isUser ? '/u/profile-setup' : '/b/profile-setup')}
            className={`w-full max-w-xs mx-auto py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] ${
              isUser ? 'bg-blue-600' : 'bg-orange-500'
            }`}
          >
            プロフィールを登録する
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
