// テスト用フォールバックID（LINEログイン実装後に削除）
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111'

export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return TEST_USER_ID
  return localStorage.getItem('user_id') || TEST_USER_ID
}

export function getCurrentUserName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('user_name') ?? ''
}

export function getCurrentUserAvatar(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('user_avatar') ?? ''
}

export function isLoggedIn(): boolean {
  return !!getCurrentUserId()
}

export function logout(): void {
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_avatar')
}
