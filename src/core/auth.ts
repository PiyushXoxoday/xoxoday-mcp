import { config } from '../config.js'

interface TokenCache {
  token: string
  expiresAt: number   // ms epoch
}

// In-memory only — never written to disk
let cache: TokenCache | null = null

export async function getToken(): Promise<string> {
  const now = Date.now()
  // Refresh 5 minutes before expiry
  if (cache && now < cache.expiresAt - 300_000) {
    return cache.token
  }

  const res = await fetch(config.authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OAuth token request failed (${res.status}): ${body}`)
  }

  const data = await res.json() as { access_token: string; expires_in?: number }

  cache = {
    token:     data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }

  return cache.token
}

export function clearTokenCache(): void {
  cache = null
}
