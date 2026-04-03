export type Environment = 'sandbox' | 'production'
export type Transport   = 'stdio' | 'http'

function require(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

function mask(val: string): string {
  if (val.length <= 6) return '***'
  return val.slice(0, 4) + '***' + val.slice(-2)
}

const env = (process.env.XOXODAY_ENV || 'sandbox') as Environment

const BASE_URLS: Record<Environment, string> = {
  sandbox:    'https://stagingstores.xoxoday.com/chef/v1/oauth/api',
  production: 'https://accounts.xoxoday.com/chef/v1/oauth/api',
}

const AUTH_URLS: Record<Environment, string> = {
  sandbox:    'https://stagingstores.xoxoday.com/chef/v1/oauth/token/user',
  production: 'https://accounts.xoxoday.com/chef/v1/oauth/token/user',
}

export const config = {
  clientId:     require('XOXODAY_CLIENT_ID'),
  clientSecret: require('XOXODAY_CLIENT_SECRET'),
  refreshToken:       process.env.XOXODAY_REFRESH_TOKEN         ?? '',
  accessToken:        process.env.XOXODAY_ACCESS_TOKEN          ?? '',  // optional: skip auth flow
  accessTokenExpiry:  parseInt(process.env.XOXODAY_ACCESS_TOKEN_EXPIRY ?? '0'),  // ms epoch, from access_token_expiry in OAuth response
  env,
  transport:    (process.env.XOXODAY_TRANSPORT || 'stdio') as Transport,
  port:         parseInt(process.env.PORT || '3000'),
  categories:   (process.env.XOXODAY_CATEGORIES || 'giftcard').split(',').map(s => s.trim()),
  baseUrl:      BASE_URLS[env],
  authUrl:      AUTH_URLS[env],

  // Never log the real secret — use this in log output
  get maskedId()     { return mask(this.clientId) },
  get maskedSecret() { return mask(this.clientSecret) },
}
