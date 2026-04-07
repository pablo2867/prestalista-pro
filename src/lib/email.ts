export async function sendEmail(
  type: 'welcome' | 'day1' | 'day3' | 'day7' | 'trial-ending' | 'trial-ended',
  email: string,
  userName: string
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, email, userName }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error enviando email')
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail('welcome', email, userName)
}