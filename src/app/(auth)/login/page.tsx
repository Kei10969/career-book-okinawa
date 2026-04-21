'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import liff from '@line/liff'

export default function LoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          setErrorMsg('LIFF IDが設定されていません')
          setStatus('error')
          return
        }

        await liff.init({ liffId })

        if (liff.isLoggedIn()) {
          // プロフィール取得してユーザー登録/取得
          try {
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
              // ホーム画面にリダイレクト
              window.location.href = '/requests'
              return
            } else {
              const errData = await res.json().catch(() => ({}))
              setErrorMsg(`ユーザー登録に失敗: ${errData.error || res.status}`)
              setStatus('error')
            }
          } catch (profileErr: any) {
            setErrorMsg(`プロフィール取得エラー: ${profileErr.message}`)
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
    liff.login({ redirectUri: window.location.href })
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
    <main className="min-h-screen bg-[#E87A2E] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">🏗️</div>
        <h1 className="font-black text-gray-800 text-xl mb-2">匿名キャリアブック沖縄</h1>
        <p className="text-sm text-gray-500 mb-6">沖縄の建設業界のマッチングサービス</p>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-[#06C755] text-white font-black py-4 rounded-2xl text-lg shadow-lg flex items-center justify-center gap-3 hover:bg-[#05b04c] transition-colors"
        >
          LINE でログイン
        </button>

        <p className="text-xs text-gray-400 mt-4">LINEアカウントで簡単ログイン。<br />個人情報は公開されません。</p>

        <div className="border-t border-gray-100 mt-6 pt-4">
          <Link href="/requests" className="text-sm text-gray-400 hover:text-gray-600">← 戻る</Link>
        </div>
      </div>
    </main>
  )
}
