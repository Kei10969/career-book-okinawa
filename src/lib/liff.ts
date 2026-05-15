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
    // URLに認証コードがある場合（LINE認証後のリダイレクト）は
    // withLoginOnExternalBrowserをtrueにしてトークン交換を実行
    const hasAuthCode = typeof window !== 'undefined' && window.location.search.includes('code=')
    await liff.init({
      liffId,
      withLoginOnExternalBrowser: hasAuthCode,
    })
    initialized = true
    return true
  } catch (e: any) {
    console.error('LIFF init error:', e?.code, e?.message, e)
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
