import liff from '@line/liff'

let initialized = false

export async function initLiff(): Promise<boolean> {
  if (initialized) return true

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  if (!liffId) {
    console.error('LIFF ID が設定されていません')
    return false
  }

  try {
    await liff.init({ liffId })
    initialized = true
    console.log('LIFF init success. isLoggedIn:', liff.isLoggedIn(), 'isInClient:', liff.isInClient())
    return true
  } catch (e: any) {
    console.error('LIFF init error:', e?.code, e?.message, e)
    // 認証コードがURLにある場合、LIFF initがトークン交換に失敗した可能性
    if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
      console.error('LIFF init failed with auth code in URL. Possible channel mismatch or PKCE error.')
    }
    return false
  }
}

export async function getLiffProfile() {
  if (!initialized || !liff.isLoggedIn()) return null
  try {
    return await liff.getProfile()
  } catch {
    return null
  }
}

export function isLiffLoggedIn(): boolean {
  return initialized && liff.isLoggedIn()
}

export function isInLiffClient(): boolean {
  return initialized && liff.isInClient()
}

export function logoutFromLine(): void {
  try {
    if (initialized && liff.isLoggedIn()) {
      liff.logout()
    }
  } catch {
    // ignore
  }
}

export { liff }
