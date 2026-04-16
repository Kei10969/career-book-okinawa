'use client'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function MyPage() {
  const user = null

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">👷</div>
          <h2 className="font-black text-gray-800 text-lg mb-2">ログインが必要です</h2>
          <p className="text-sm text-gray-500 mb-6">LINEアカウントで簡単ログイン</p>
          <Link
            href="/login"
            className="bg-[#06C755] text-white font-black px-8 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg"
          >
            <span className="text-lg">LINE</span> でログイン
          </Link>
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-gray-800 text-sm">マイページ</span>
          <button className="text-xs text-gray-400">ログアウト</button>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-5">
        <p className="text-center text-gray-500 text-sm">ログイン後に表示されます</p>
      </div>
      <BottomNav />
    </main>
  )
}
