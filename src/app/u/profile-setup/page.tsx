'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import PrimaryButton from '@/components/PrimaryButton'
import { TRADES, OKINAWA_CITIES, QUALIFICATIONS, EXPERIENCE_YEARS, DESIRED_SALARY, JOB_STATUS } from '@/lib/constants'
import { getCurrentUserId } from '@/lib/auth'

export default function UserProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // フォーム状態
  const [trade, setTrade] = useState('')
  const [tradeOther, setTradeOther] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [qualifications, setQualifications] = useState<string[]>([])
  const [qualOtherTexts, setQualOtherTexts] = useState<string[]>([''])
  const [experienceYears, setExperienceYears] = useState('')
  const [desiredSalary, setDesiredSalary] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadExistingProfile()
  }, [])

  async function loadExistingProfile() {
    const userId = getCurrentUserId()
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (res.ok) {
        const user = await res.json()
        // 既存データがあればプリロード
        if (user.skills && user.skills.length > 0) {
          const mainTrade = user.skills[0]
          if (TRADES.includes(mainTrade as typeof TRADES[number])) {
            setTrade(mainTrade)
          } else {
            setTrade('その他')
            setTradeOther(mainTrade)
          }
        }
        if (user.areas) setAreas(user.areas)
        if (user.qualifications) {
          const standard: string[] = []
          const others: string[] = []
          for (const q of user.qualifications) {
            if (QUALIFICATIONS.includes(q as typeof QUALIFICATIONS[number]) && q !== 'その他') {
              standard.push(q)
            } else if (q !== 'その他') {
              others.push(q)
            }
          }
          if (others.length > 0) {
            standard.push('その他')
            setQualOtherTexts([...others, ''])
          }
          setQualifications(standard)
        }
        if (user.experience_years) setExperienceYears(user.experience_years)
        if (user.desired_salary) setDesiredSalary(user.desired_salary)
        if (user.job_status) setJobStatus(user.job_status)
        if (user.bio) setBio(user.bio)
        if (user.phone) setPhone(user.phone)
        if (user.email) setEmail(user.email)
      }
    } catch (e) {
      console.error('loadExistingProfile error:', e)
    }
    setLoading(false)
  }

  function toggleQualification(qual: string) {
    setQualifications((prev) => {
      if (prev.includes(qual)) {
        if (qual === 'その他') {
          setQualOtherTexts([''])
        }
        return prev.filter((q) => q !== qual)
      } else {
        return [...prev, qual]
      }
    })
  }

  function toggleArea(area: string) {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  function updateQualOther(index: number, value: string) {
    setQualOtherTexts((prev) => {
      const next = [...prev]
      next[index] = value
      // 最後の入力欄に文字が入ったら新しい入力欄を追加
      if (index === next.length - 1 && value.trim() !== '') {
        next.push('')
      }
      return next
    })
  }

  async function handleSubmit() {
    if (!trade && !tradeOther) {
      alert('職種を選択してください')
      return
    }
    if (!jobStatus) {
      alert('求職ステータスを選択してください')
      return
    }

    setSubmitting(true)
    const userId = getCurrentUserId()

    // 職種の決定
    const finalTrade = trade === 'その他' ? (tradeOther || 'その他') : trade

    // 資格の組み立て
    const finalQualifications = qualifications
      .filter((q) => q !== 'その他')
      .concat(
        qualifications.includes('その他')
          ? qualOtherTexts.filter((t) => t.trim() !== '')
          : []
      )

    const body = {
      skills: [finalTrade],
      areas,
      qualifications: finalQualifications,
      experience_years: experienceYears || null,
      desired_salary: desiredSalary || null,
      job_status: jobStatus,
      bio: bio || null,
      phone: phone || null,
      email: email || null,
      profile_completed: true,
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push('/u/home')
      } else {
        alert('保存に失敗しました')
      }
    } catch {
      alert('保存に失敗しました')
    }
    setSubmitting(false)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1'

  if (loading) {
    return (
      <AppShell role="user" header={<h1 className="font-black text-lg text-gray-900">📝 プロフィール登録</h1>}>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      role="user"
      header={<h1 className="font-black text-lg text-gray-900">📝 プロフィール登録</h1>}
    >
      <div className="space-y-4">
        {/* 職種 */}
        <div>
          <label className={labelClass}>職種 *</label>
          <select
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {trade === 'その他' && (
            <input
              type="text"
              value={tradeOther}
              onChange={(e) => setTradeOther(e.target.value)}
              placeholder="職種名を入力"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        {/* 希望エリア */}
        <div>
          <label className={labelClass}>希望エリア（複数選択可）</label>
          <div className="flex flex-wrap gap-2">
            {OKINAWA_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleArea(city)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  areas.includes(city)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* 資格 */}
        <div>
          <label className={labelClass}>保有資格（複数選択可）</label>
          <div className="space-y-2">
            {QUALIFICATIONS.map((qual) => (
              <label key={qual} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qualifications.includes(qual)}
                  onChange={() => toggleQualification(qual)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{qual}</span>
              </label>
            ))}
          </div>
          {qualifications.includes('その他') && (
            <div className="mt-2 space-y-2">
              {qualOtherTexts.map((text, i) => (
                <input
                  key={i}
                  type="text"
                  value={text}
                  onChange={(e) => updateQualOther(i, e.target.value)}
                  placeholder={`その他の資格${i + 1}`}
                  className={inputClass}
                />
              ))}
            </div>
          )}
        </div>

        {/* 経験年数 */}
        <div>
          <label className={labelClass}>経験年数</label>
          <select
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {EXPERIENCE_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* 希望給与 */}
        <div>
          <label className={labelClass}>希望給与</label>
          <select
            value={desiredSalary}
            onChange={(e) => setDesiredSalary(e.target.value)}
            className={inputClass}
          >
            <option value="">選択してください</option>
            {DESIRED_SALARY.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 求職ステータス */}
        <div>
          <label className={labelClass}>求職ステータス *</label>
          <div className="space-y-2">
            {JOB_STATUS.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setJobStatus(status.value)}
                className={`w-full p-3 rounded-xl text-sm font-bold text-left transition-all ${
                  jobStatus === status.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* 連絡先 */}
        <div>
          <label className={labelClass}>電話番号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="090-XXXX-XXXX"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">※ 企業からのアプローチを承諾した場合のみ開示されます</p>
        </div>

        <div>
          <label className={labelClass}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">※ 企業からのアプローチを承諾した場合のみ開示されます</p>
        </div>

        {/* 自由記述 */}
        <div>
          <label className={labelClass}>自由記述（備考）</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="強みやアピールポイントを自由に記入"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        <PrimaryButton
          variant="blue"
          onClick={handleSubmit}
          disabled={submitting || (!trade && !tradeOther) || !jobStatus}
        >
          {submitting ? '保存中...' : '登録する'}
        </PrimaryButton>
      </div>
    </AppShell>
  )
}
