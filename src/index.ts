#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { config }    from './config.js'
import { registerCategories } from './categories/registry.js'
import { startStdio } from './transports/stdio.js'
import { startHttp }  from './transports/http.js'

async function main() {
  console.error(`[xoxoday] Starting MCP server`)
  console.error(`[xoxoday]   env        : ${config.env}`)
  console.error(`[xoxoday]   transport  : ${config.transport}`)
  console.error(`[xoxoday]   categories : ${config.categories.join(', ')}`)
  console.error(`[xoxoday]   client_id  : ${config.maskedId}`)

  const server = new McpServer({
    name:    'xoxoday',
    version: '0.1.0',
  })

  await registerCategories(server)

  if (config.transport === 'http') {
    await startHttp(server)
  } else {
    await startStdio(server)
  }
}

main().catch(err => {
  console.error('[xoxoday] Fatal error:', err)
  process.exit(1)
})
