'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'

export default function LoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (liff.isLoggedIn()) {
          // プロフィール取得してユーザー登録/取得
          const profile = await liff.getProfile()
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              line_id: profile.userId,
              display_name: profile.displayName,
              avatar_url: profile.pictureUrl ?? null,
            }),
          })

          if (res.ok) {
            const user = await res.json()
            localStorage.setItem('user_id', user.id)
            localStorage.setItem('user_name', user.display_name)
            localStorage.setItem('user_avatar', user.avatar_url ?? '')
            router.push('/requests')
          } else {
            setErrorMsg('ユーザー登録に失敗しました')
            setStatus('error')
          }
        } else {
          setStatus('ready')
        }
      } catch (e: any) {
        setErrorMsg(e.message ?? 'LIFF初期化エラー')
        setStatus('error')
      }
    }
    init()
  }, [router])

  const handleLogin = () => {
    liff.login()
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-bold">認証中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="font-black text-gray-800 text-2xl mb-2">
          匿名キャリアブック<br /><span className="text-blue-600">沖縄</span>
        </h1>
        <p className="text-sm text-gray-500 mb-8">沖縄の建設現場をつなぐマッチングサービス</p>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-[#06C755] text-white font-black py-4 rounded-2xl text-base shadow-lg flex items-center justify-center gap-3"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          LINEでログイン
        </button>

        <p className="text-xs text-gray-400 mt-4">LINEアカウントで簡単ログイン・登録不要</p>
      </div>
    </main>
  )
}
