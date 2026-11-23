export type ContactPayload = { name: string; email: string; message: string; website: string }

/**
 * TODO: wire to email/API. Replace the body with a Supabase Edge Function + Resend, or Formspree.
 * Keep the honeypot check. Never hardcode keys in the client.
 */
export async function submit(payload: ContactPayload): Promise<void> {
  if (payload.website) return // honeypot: silently succeed for bots
  await new Promise((r) => setTimeout(r, 600))
}

export const validators = {
  name: (v: string) => (v.trim().length >= 2 && v.trim().length <= 120 ? '' : 'Skriv dit fulde navn.'),
  email: (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.length <= 254 ? '' : 'Indtast en gyldig e-mailadresse.'),
  message: (v: string) => (v.trim().length >= 10 && v.length <= 2000 ? '' : 'Skriv en kort besked (mindst 10 tegn).'),
}
