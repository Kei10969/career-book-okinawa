import liff from '@line/liff'

let initialized = false

export async function initLiff(): Promise<void> {
  if (initialized) return
  await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
  initialized = true
}

export async function getLiffProfile() {
  await initLiff()
  if (!liff.isLoggedIn()) return null
  return await liff.getProfile()
}

export async function loginWithLine(): Promise<void> {
  await initLiff()
  if (!liff.isLoggedIn()) {
    liff.login()
  }
}

export function logoutFromLine(): void {
  if (liff.isLoggedIn()) {
    liff.logout()
  }
}

export { liff }
