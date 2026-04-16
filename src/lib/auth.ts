export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('user_id') ?? ''
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
