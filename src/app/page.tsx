'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 背景画像（建設現場） */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80')`,
        }}
      />
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/55" />

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* アイコン */}
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🔧</span>
        </div>

        {/* タイトル */}
        <h1 className="text-white text-4xl font-black mb-3 tracking-tight text-center">
          匿名キャリアブック
        </h1>
        <div className="bg-orange-500 text-white text-base font-black px-6 py-1.5 rounded-full mb-4 tracking-widest">
          沖　縄
        </div>
        <p className="text-white/80 text-base text-center mb-10 leading-relaxed">
          沖縄の建設現場をつなぐ<br />マッチングサービス
        </p>

        {/* 機能リスト（半透明カード） */}
        <div className="w-full max-w-sm bg-white/15 backdrop-blur-md rounded-3xl border border-white/25 overflow-hidden mb-8">
          {[
            { icon: '👥', title: '応援リクエスト', desc: '職人・人手を募集' },
            { icon: '🏢', title: '下請けリクエスト', desc: '協力会社を募集' },
            { icon: '🤝', title: 'かんたんマッチング', desc: '応募→承認で成立' },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`flex items-center gap-4 px-5 py-4 ${i < 2 ? 'border-b border-white/20' : ''}`}
            >
              <span className="text-2xl w-8 text-center">{item.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{item.title}</p>
                <p className="text-white/70 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LINEログインボタン */}
        <Link
          href="/login"
          className="w-full max-w-sm bg-[#06C755] text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl mb-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.97C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          LINEでログイン
        </Link>

        <p className="text-white/60 text-xs text-center">
          LINEアカウントで簡単ログイン・登録不要
        </p>
      </div>
    </main>
  )
}
