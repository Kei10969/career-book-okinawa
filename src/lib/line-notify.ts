/**
 * LINE Messaging API でプッシュ通知を送信する
 * ユーザーのline_idが必要
 */
export async function sendLinePush(lineUserId: string, message: string): Promise<boolean> {
  const token = process.env.LINE_MESSAGING_CHANNEL_TOKEN
  if (!token || !lineUserId) return false

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('LINE push failed:', err)
      return false
    }

    return true
  } catch (e) {
    console.error('LINE push error:', e)
    return false
  }
}
