import { config } from '../config.js'
import { getToken } from './auth.js'

// H2: Use exact field names rather than a broad substring regex that strips fields like
//     filterKey, sortKey, productKey. Only sanitise known OAuth/secret fields.
const SENSITIVE_KEYS = /^(secret|clientSecret|accessToken|refreshToken|password|apiKey|credential|client_secret|access_token|refresh_token)$/i

/** Recursively remove sensitive fields before returning to Claude */
function sanitise(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitise)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([k]) => !SENSITIVE_KEYS.test(k))
        .map(([k, v]) => [k, sanitise(v)])
    )
  }
  return obj
}

export interface XoxodayRequest {
  query:     string
  tag:       string
  variables: { data: Record<string, unknown> }
}

const CALL_TIMEOUT_MS = 30_000  // C0: 30-second timeout prevents hanging on Xoxoday API outage

export async function callApi(body: XoxodayRequest): Promise<unknown> {
  const token = await getToken()

  // C0: AbortController so a hanging Xoxoday API call doesn't block the MCP tool forever
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(config.baseUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error(`Xoxoday API timeout after ${CALL_TIMEOUT_MS / 1000}s`)
    }
    throw e
  } finally {
    clearTimeout(timer)
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Xoxoday API error (${res.status}): ${JSON.stringify(sanitise(data))}`)
  }

  return sanitise(data)
}

/** Helper: build the standard Xoxoday GraphQL-style body */
export function buildBody(
  queryName: string,
  variables: Record<string, unknown> = {},
  type: 'mutation' | 'query' = 'mutation'
): XoxodayRequest {
  return {
    query:     `plumProAPI.${type}.${queryName}`,
    tag:       'plumProAPI',
    variables: { data: variables },
  }
}
