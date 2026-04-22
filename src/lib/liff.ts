import liff from '@line/liff'

let initialized = false
let initError: string | null = null

export async function initLiff(): Promise<void> {
  if (initialized) return
  if (initError) throw new Error(initError)

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  if (!liffId) {
    initError = 'LIFF ID が設定されていません'
    throw new Error(initError)
  }

  try {
    await liff.init({ liffId })
    initialized = true
  } catch (e: any) {
    initError = `LIFF初期化エラー: ${e.message || e}`
    throw new Error(initError)
  }
}

export async function getLiffProfile() {
  await initLiff()
  if (!liff.isLoggedIn()) return null
  return await liff.getProfile()
}

export function isLiffLoggedIn(): boolean {
  return initialized && liff.isLoggedIn()
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
