'use client'
import { useState } from 'react'
import type { UserRole } from '@/types/database'

/**
 * デモモード: LINEログインをスキップし、ダミーユーザーで直接遷移
 * 本番復帰時はこのファイルを元のLIFF版に戻す
 */

const DEMO_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  display_name: 'デモユーザー',
  nickname: 'デモさん',
  avatar_url: '',
  line_id: 'demo_line_id',
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDemoLogin() {
    if (!selectedRole) return
    setIsLoading(true)

    // デモユーザー情報をlocalStorageに保存
    localStorage.setItem('user_id', DEMO_USER.id)
    localStorage.setItem('user_name', DEMO_USER.display_name)
    localStorage.setItem('user_avatar', DEMO_USER.avatar_url)
    localStorage.setItem('user_role', selectedRole)
    localStorage.setItem('user_nickname', DEMO_USER.nickname)

    // ロールに応じたホームへ遷移
    window.location.href = selectedRole === 'business' ? '/b/home' : '/u/home'
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80')` }} />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🔧</span>
        </div>

        <h1 className="text-white text-3xl font-black mb-2 tracking-tight text-center">匿名キャリアブック</h1>
        <div className="bg-orange-500 text-white text-sm font-black px-5 py-1 rounded-full mb-3 tracking-widest">沖　縄</div>
        <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">沖縄の建設現場をつなぐ<br />マッチングサービス</p>

        {/* デモモード表示 */}
        <div className="w-full max-w-sm bg-yellow-500/20 border border-yellow-400/40 rounded-2xl p-3 mb-4">
          <p className="text-yellow-200 text-xs text-center font-bold">🔧 デモモード（ログイン不要）</p>
        </div>

        <div className="w-full max-w-sm space-y-3 mb-6">
          <p className="text-white/90 text-center text-sm font-bold mb-2">あなたの立場を選んでください</p>

          <button onClick={() => setSelectedRole('user')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'user' ? 'border-blue-400 bg-blue-600/30 shadow-lg shadow-blue-500/20' : 'border-white/20 bg-white/10'
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              <div>
                <p className="text-white font-black text-base">仕事を探す</p>
                <p className="text-white/60 text-xs">職人・作業員として応募</p>
              </div>
              {selectedRole === 'user' && <span className="ml-auto text-blue-400 text-xl">✓</span>}
            </div>
          </button>

          <button onClick={() => setSelectedRole('business')}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedRole === 'business' ? 'border-orange-400 bg-orange-500/30 shadow-lg shadow-orange-500/20' : 'border-white/20 bg-white/10'
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              <div>
                <p className="text-white font-black text-base">人材を募集する</p>
                <p className="text-white/60 text-xs">事業者として募集を投稿</p>
              </div>
              {selectedRole === 'business' && <span className="ml-auto text-orange-400 text-xl">✓</span>}
            </div>
          </button>
        </div>

        <button onClick={handleDemoLogin} disabled={!selectedRole || isLoading}
          className={`w-full max-w-sm bg-blue-600 text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all ${
            !selectedRole ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'
          }`}>
          {isLoading ? (
            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
          ) : (
            'デモで体験する'
          )}
        </button>

        <p className="text-white/50 text-xs text-center mt-3">ログインなしでアプリを体験できます</p>
      </div>
    </main>
  )
}
