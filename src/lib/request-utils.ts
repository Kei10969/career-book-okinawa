import type { Request } from '@/types/database'

/**
 * 応募期間が終了しているか判定
 * period_end の日付の23:59:59 JST を過ぎていたら true
 */
export function isExpired(request: Request): boolean {
  if (request.status === 'closed') return false
  const endDate = new Date(request.period_end + 'T23:59:59+09:00')
  return new Date() > endDate
}

/**
 * period_end から30日以上経過しているか判定
 */
export function isOverRetention(request: Request, retentionDays = 30): boolean {
  const endDate = new Date(request.period_end + 'T23:59:59+09:00')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  return endDate < cutoff
}

/**
 * 表示用ステータスを返す
 * closed → 'closed', 期間終了 → 'expired', それ以外 → request.status
 */
export function getDisplayStatus(request: Request): string {
  if (request.status === 'closed') return 'closed'
  if (isExpired(request)) return 'expired'
  return request.status
}
