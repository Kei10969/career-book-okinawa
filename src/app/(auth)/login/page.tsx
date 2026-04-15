'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLineLogin = async () => {
    // TODO: LIFF initLiff() → liff.login()
    alert('LIFF ID設定後に有効になります')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="text-5xl mb-4">🏗️</div>
        <h1 className="font-black text-gray-800 text-xl mb-2">匿名キャリアブック沖縄</h1>
        <p className="text-sm text-gray-500 mb-8">沖縄の建設業界のマッチングサービス</p>

        <button
          onClick={handleLineLogin}
          className="w-full bg-[#06C755] text-white font-black text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3"
        >
          <span className="text-xl font-black">LINE</span>
          <span>でログイン</span>
        </button>

        <p className="text-xs text-gray-400 mt-4">
          LINEアカウントで簡単ログイン。<br />個人情報は公開されません。
        </p>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-gray-400"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </main>
  )
}
