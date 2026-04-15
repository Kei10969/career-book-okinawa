'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <span className="font-black text-gray-800 text-sm">匿名キャリアブック沖縄</span>
          </div>
          <Link
            href="/login"
            className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full"
          >
            LINEでログイン
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-10">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-orange-100 text-xs font-bold mb-2 tracking-widest">OKINAWA CONSTRUCTION</p>
          <h1 className="text-2xl font-black mb-3 leading-tight">
            沖縄の建設業を<br />つなぐプラットフォーム
          </h1>
          <p className="text-orange-100 text-sm mb-6">
            応援・下請け募集をシンプルにマッチング。<br />匿名プロフィールで安心して使える。
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/requests"
              className="bg-white text-orange-600 font-black text-sm px-5 py-3 rounded-xl shadow-lg"
            >
              募集を見る
            </Link>
            <Link
              href="/requests/new"
              className="bg-orange-400 text-white font-black text-sm px-5 py-3 rounded-xl border-2 border-orange-300"
            >
              + 投稿する
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '応援募集', value: '24件', icon: '👷' },
            { label: '下請け募集', value: '18件', icon: '🏢' },
            { label: '成立件数', value: '142件', icon: '✅' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-lg mx-auto px-4 pb-6">
        <h2 className="font-black text-gray-700 text-sm mb-3">🔥 新着募集</h2>
        <Link href="/requests" className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-gray-500 text-sm">
          募集一覧を見る →
        </Link>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {[
            { href: '/', icon: '🏠', label: 'ホーム' },
            { href: '/requests', icon: '📋', label: '募集' },
            { href: '/notifications', icon: '🔔', label: '通知' },
            { href: '/mypage', icon: '👤', label: 'マイページ' },
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500"
            >
              <span className="text-xl">{n.icon}</span>
              <span className="text-[10px] font-bold">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16" /> {/* bottom nav spacer */}
    </main>
  )
}
