'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * プロフィール未登録の場合にプロフィール登録画面にリダイレクトするフック
 * localStorageのprofile_completedフラグで判定（APIコール不要）
 * profile-setupページ自体では使わないこと
 */
export function useProfileGuard(role: 'user' | 'business'): { checking: boolean } {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const profileDone = localStorage.getItem('profile_completed') === 'true'
    if (!profileDone) {
      router.replace(role === 'user' ? '/u/profile-setup' : '/b/profile-setup')
      return
    }
    setChecking(false)
  }, [])

  return { checking }
}
