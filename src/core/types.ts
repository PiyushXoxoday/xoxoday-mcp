import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export interface CategoryModule {
  name:     string
  register: (server: McpServer) => void
}

export type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>
}

export function ok(data: unknown): ToolResponse {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

export function err(message: string): ToolResponse {
  return { content: [{ type: 'text', text: `Error: ${message}` }] }
}
