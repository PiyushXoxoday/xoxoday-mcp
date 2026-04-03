import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_voucher',
    'Get full details for a single gift card product by its ID — brand logo, all denominations, description, T&C, redemption instructions, loyalty conversion rate. Use this for product detail pages after the user selects a product from giftcard_get_vouchers.',
    {
      productId: z.number().describe('Product ID from giftcard_get_vouchers response'),
    },
    async ({ productId }) => {
      try {
        const data = await callApi(buildBody('getVouchers', {
          filters: [{ key: 'productId', value: String(productId) }],
          page:  1,
          limit: 1,
        }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
