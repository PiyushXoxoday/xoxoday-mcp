import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_filters',
    'Get available filters for the Xoxoday gift card catalog. Returns countries, currencies, voucher categories, product types, and price ranges. Call this first to discover what markets and categories are available before calling giftcard_get_vouchers.',
    {
      filterGroupCode: z.enum(['country', 'currency', 'voucher_category', 'product_category', 'price'])
        .optional()
        .describe('Specific filter group to fetch. Omit to get all groups.'),
    },
    async ({ filterGroupCode }) => {
      try {
        const data = await callApi(buildBody('getFilters', {
          ...(filterGroupCode && { filterGroupCode }),
        }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
