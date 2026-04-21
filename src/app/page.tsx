'use client'
import { useState, useEffect } from 'react'
import { initLiff, getLiffProfile, liff } from '@/lib/liff'
import type { UserRole } from '@/types/database'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    checkExistingLogin()
  }, [])

  async function checkExistingLogin() {
    try {
      await initLiff()
      if (liff.isLoggedIn()) {
        const profile = await getLiffProfile()
        if (profile) {
          const userId = localStorage.getItem('user_id')
          const role = localStorage.getItem('user_role') as UserRole
          if (userId && role) {
            window.location.href = role === 'business' ? '/b/home' : '/u/home'
            return
          }
        }
      }
    } catch {
      // LIFF init failed, show login
    }
    setIsCheckingAuth(false)
  }

  async function handleLogin() {
    if (!selectedRole) return
    setIsLoading(true)
    localStorage.setItem('selected_role', selectedRole)

    try {
      await initLiff()
      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const profile = await liff.getProfile()

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: profile.userId,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl || null,
          role: selectedRole,
        }),
      })

      const user = await res.json()
      localStorage.setItem('user_id', user.id)
      localStorage.setItem('user_name', user.display_name)
      localStorage.setItem('user_avatar', user.avatar_url || '')
      localStorage.setItem('user_role', user.role)
      localStorage.setItem('user_nickname', user.nickname || user.display_name)

      window.location.href = user.role === 'business' ? '/b/home' : '/u/home'
    } catch {
      setIsLoading(false)
      alert('ログインに失敗しました。もう一度お試しください。')
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* アイコン */}
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🔧</span>
        </div>

        {/* タイトル */}
        <h1 className="text-white text-3xl font-black mb-2 tracking-tight text-center">
          匿名キャリアブック
        </h1>
        <div className="bg-orange-500 text-white text-sm font-black px-5 py-1 rounded-full mb-3 tracking-widest">
          沖　縄
        </div>
        <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">
          沖縄の建設現場をつなぐ<br />マッチングサービス
        </p>

        {/* 役割選択 */}
        <div className="w-full max-w-sm space-y-3 mb-6">
          <p className="text-white/90 text-center text-sm font-bold mb-2">あなたの立場を選んでください</p>

          {/* ユーザーカード */}
          <button
            onClick={() => setSelectedRole('user')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'user'
                ? 'border-blue-400 bg-blue-600/30 shadow-lg shadow-blue-500/20'
                : 'border-white/20 bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              <div>
                <p className="text-white font-black text-base">仕事を探す</p>
                <p className="text-white/60 text-xs">職人・作業員として応募</p>
              </div>
              {selectedRole === 'user' && (
                <span className="ml-auto text-blue-400 text-xl">✓</span>
              )}
            </div>
          </button>

          {/* 業者カード */}
          <button
            onClick={() => setSelectedRole('business')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'business'
                ? 'border-orange-400 bg-orange-500/30 shadow-lg shadow-orange-500/20'
                : 'border-white/20 bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              <div>
                <p className="text-white font-black text-base">人材を募集する</p>
                <p className="text-white/60 text-xs">事業者として募集を投稿</p>
              </div>
              {selectedRole === 'business' && (
                <span className="ml-auto text-orange-400 text-xl">✓</span>
              )}
            </div>
          </button>
        </div>

        {/* LINEログインボタン */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || isLoading}
          className={`w-full max-w-sm bg-[#06C755] text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all ${
            !selectedRole ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.97C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </>
          )}
        </button>

        <p className="text-white/50 text-xs text-center mt-3">
          LINEアカウントで簡単ログイン
        </p>
      </div>
    </main>
  )
}
