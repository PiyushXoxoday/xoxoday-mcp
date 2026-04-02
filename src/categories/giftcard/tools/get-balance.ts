import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_balance',
    'Check the Xoxoday account wallet balance. Returns current balance, currency, and available credit. Always check balance before placing large orders to avoid insufficient funds errors.',
    {},
    async () => {
      try {
        const data = await callApi(buildBody('getBalance'))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
