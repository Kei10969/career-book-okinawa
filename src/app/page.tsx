'use client'
import { useState, useEffect } from 'react'
import { initLiff, liff } from '@/lib/liff'
import type { UserRole } from '@/types/database'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    checkExistingLogin()
  }, [])

  async function checkExistingLogin() {
    try {
      // roleの取得元: URL > Cookie > localStorage
      const params = new URLSearchParams(window.location.search)
      const roleFromUrl = params.get('role') as UserRole | null
      const roleFromCookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('selected_role='))?.split('=')[1] as UserRole | null

      setDebugInfo('LIFF初期化中...')
      await initLiff()
      setDebugInfo(`LIFF初期化完了 | isLoggedIn: ${liff.isLoggedIn()}`)

      if (liff.isLoggedIn()) {
        // 既にローカルにuser情報があればそのままリダイレクト
        const userId = localStorage.getItem('user_id')
        const userRole = localStorage.getItem('user_role') as UserRole

        if (userId && userRole) {
          setDebugInfo(`既存ユーザー → ${userRole}`)
          window.location.href = userRole === 'business' ? '/b/home' : '/u/home'
          return
        }

        // roleの特定: URL > Cookie > localStorage > null
        const role = roleFromUrl || roleFromCookie || localStorage.getItem('selected_role') as UserRole | null
        
        if (role) {
          setDebugInfo(`ロール: ${role} → ユーザー登録中...`)
          await registerUser(role)
          return
        }

        // LINEログイン済みだがrole不明 → 選択画面を出すが、次はliff.login不要
        setDebugInfo('ログイン済み・ロール未選択')
      } else {
        setDebugInfo('未ログイン')
      }
    } catch (e: any) {
      console.error('Auth check failed:', e)
      setDebugInfo(`エラー: ${e.message}`)
      setError(e.message || '認証チェックに失敗しました')
    }
    setIsCheckingAuth(false)
  }

  async function registerUser(role: UserRole) {
    try {
      setDebugInfo('プロフィール取得中...')
      const profile = await liff.getProfile()
      setDebugInfo(`プロフィール: ${profile.displayName}`)

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: profile.userId,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl || null,
          role,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API ${res.status}: ${errText}`)
      }

      const user = await res.json()
      localStorage.setItem('user_id', user.id)
      localStorage.setItem('user_name', user.display_name || user.nickname)
      localStorage.setItem('user_avatar', user.avatar_url || '')
      localStorage.setItem('user_role', user.role)
      localStorage.setItem('user_nickname', user.nickname || user.display_name)
      localStorage.removeItem('selected_role')

      setDebugInfo(`登録完了 → ${user.role}`)
      window.location.href = user.role === 'business' ? '/b/home' : '/u/home'
    } catch (e: any) {
      setError(e.message || 'ユーザー登録に失敗しました')
      setDebugInfo(`登録エラー: ${e.message}`)
      setIsLoading(false)
      setIsCheckingAuth(false)
    }
  }

  async function handleLogin() {
    if (!selectedRole) return
    setIsLoading(true)
    setError('')

    // localStorageとCookieの両方にroleを保存（リダイレクト後の確実な取得のため）
    localStorage.setItem('selected_role', selectedRole)
    document.cookie = `selected_role=${selectedRole};path=/;max-age=300;SameSite=Lax`

    try {
      await initLiff()

      if (liff.isLoggedIn()) {
        // 既にLINEログイン済み → 直接登録
        await registerUser(selectedRole)
      } else {
        // LINEログインへ
        // redirectUriはエンドポイントURLと一致させる必要がある
        // roleはlocalStorageに保存済みなのでそこから取得する
        liff.login({ redirectUri: window.location.origin + '/' })
      }
    } catch (e: any) {
      setError(e.message || 'ログインに失敗しました')
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400 font-bold">認証中...</p>
        <p className="text-xs text-gray-300 mt-2 px-8 text-center">{debugInfo}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🔧</span>
        </div>

        <h1 className="text-white text-3xl font-black mb-2 tracking-tight text-center">
          匿名キャリアブック
        </h1>
        <div className="bg-orange-500 text-white text-sm font-black px-5 py-1 rounded-full mb-3 tracking-widest">
          沖　縄
        </div>
        <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">
          沖縄の建設現場をつなぐ<br />マッチングサービス
        </p>

        {error && (
          <div className="w-full max-w-sm bg-red-500/20 border border-red-400/40 rounded-2xl p-3 mb-4">
            <p className="text-red-200 text-xs text-center font-bold">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-xl p-2 mb-4">
            <p className="text-white/60 text-[10px] text-center font-mono">{debugInfo}</p>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 mb-6">
          <p className="text-white/90 text-center text-sm font-bold mb-2">あなたの立場を選んでください</p>

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
