import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_order_details',
    'Get full details of a specific order including voucher codes, redemption URLs, validity dates, and delivery status. Call this after giftcard_place_order to retrieve the actual gift card codes.',
    {
      orderId: z.string().describe('Order ID returned from giftcard_place_order'),
    },
    async ({ orderId }) => {
      try {
        const data = await callApi(buildBody('getOrderDetails', { orderId }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
