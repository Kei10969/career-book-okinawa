'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'

/**
 * プロフィール未登録の場合にプロフィール登録画面にリダイレクトするフック
 * profile-setupページ自体では使わないこと
 */
export function useProfileGuard(role: 'user' | 'business'): { checking: boolean } {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  async function checkProfile() {
    try {
      const userId = getCurrentUserId()

      if (role === 'user') {
        // 職人: profile_completedを確認
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const user = await res.json()
          if (!user.profile_completed) {
            router.replace('/u/profile-setup')
            return
          }
        }
      } else {
        // 企業: business_profileの存在を確認
        const res = await fetch(`/api/business-profiles?user_id=${userId}`)
        if (res.ok) {
          const profile = await res.json()
          if (!profile || profile.error) {
            router.replace('/b/profile-setup')
            return
          }
        }
      }
    } catch (e) {
      console.error('Profile guard error:', e)
    }
    setChecking(false)
  }

  return { checking }
}
