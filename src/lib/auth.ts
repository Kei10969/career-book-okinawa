import type { UserRole } from '@/types/database'

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

export function getCurrentUserRole(): UserRole {
  if (typeof window === 'undefined') return 'user'
  return (localStorage.getItem('user_role') as UserRole) || 'user'
}

export function getSelectedRole(): UserRole {
  if (typeof window === 'undefined') return 'user'
  return (localStorage.getItem('selected_role') as UserRole) || 'user'
}

export function setSelectedRole(role: UserRole): void {
  localStorage.setItem('selected_role', role)
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('user_id')
}

export function logout(): void {
  localStorage.clear()
}
