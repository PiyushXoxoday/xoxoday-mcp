import { config } from '../config.js'
import { getToken } from './auth.js'

const SENSITIVE_KEYS = /secret|token|password|key|credential/i

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

export async function callApi(body: XoxodayRequest): Promise<unknown> {
  const token = await getToken()

  const res = await fetch(config.baseUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  })

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
