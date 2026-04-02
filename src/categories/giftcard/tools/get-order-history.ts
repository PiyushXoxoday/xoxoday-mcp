import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_order_history',
    'Fetch paginated list of past gift card orders. Returns order IDs, product names, amounts, delivery status, and timestamps.',
    {
      page:  z.number().int().min(1).optional().default(1).describe('Page number'),
      limit: z.number().int().min(1).max(100).optional().default(20).describe('Orders per page'),
    },
    async ({ page, limit }) => {
      try {
        const data = await callApi(buildBody('getOrderHistory', { page, limit }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
