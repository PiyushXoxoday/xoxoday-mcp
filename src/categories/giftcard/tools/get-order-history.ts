import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_order_history',
    'Fetch paginated list of past gift card orders. Returns order IDs, product names, amounts, delivery status, and timestamps. startDate and endDate are required.',
    {
      // H1: Validate date format before sending to avoid cryptic Xoxoday API errors
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format e.g. "2025-01-01"').describe('Start date in YYYY-MM-DD format e.g. "2025-01-01"'),
      endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format e.g. "2026-04-03"').describe('End date in YYYY-MM-DD format e.g. "2026-04-03"'),
      page:      z.number().int().min(1).optional().default(1).describe('Page number'),
      limit:     z.number().int().min(1).max(100).optional().default(20).describe('Orders per page'),
    },
    async ({ startDate, endDate, page, limit }) => {
      try {
        const data = await callApi(buildBody('getOrderHistory', { startDate, endDate, page, limit }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
