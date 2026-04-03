import { config } from '../config.js'

interface TokenCache {
  token: string
  expiresAt: number   // ms epoch
}

// In-memory only — never written to disk
let cache: TokenCache | null = null

export async function getToken(): Promise<string> {
  const now = Date.now()

  // C3: Fail fast with a clear message if no auth credential is configured
  if (!config.accessToken && !config.refreshToken) {
    throw new Error(
      '[xoxoday] No authentication credential found. ' +
      'Set XOXODAY_REFRESH_TOKEN (for OAuth flow) or XOXODAY_ACCESS_TOKEN (for static token).',
    )
  }

  // If a static access token is provided, use it — but respect expiry if set
  if (config.accessToken) {
    if (!config.accessTokenExpiry || now < config.accessTokenExpiry - 300_000) {
      return config.accessToken  // still valid (or no expiry configured)
    }
    // access token expired — fall through to refresh flow below
  }

  // Refresh 5 minutes before expiry
  if (cache && now < cache.expiresAt - 300_000) {
    return cache.token
  }

  const res = await fetch(config.authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'refresh_token',
      refresh_token: config.refreshToken,
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
