import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

const OrderItemSchema = z.object({
  productId:    z.number().describe('Product ID from giftcard_get_vouchers'),
  denomination: z.number().describe('Gift card value'),
  quantity:     z.number().int().min(1).describe('Quantity for this product'),
})

export function register(server: McpServer) {
  server.tool(
    'giftcard_bulk_place_order',
    'Place multiple gift card orders in one operation. Designed for corporate gifting — order different brands and denominations simultaneously. Each item is placed as a separate order and results are returned together.',
    {
      items:           z.array(OrderItemSchema).min(1).describe('List of products to order'),
      email:           z.string().email().describe('Recipient or notification email'),
      tag:             z.enum(['b2c_store', 'loyalty_redemption', 'corporate_gifting']).default('corporate_gifting'),
      notifyRecipient: z.boolean().optional().default(false).describe('Send vouchers to email'),
    },
    async ({ items, email, tag, notifyRecipient }) => {
      try {
        const results = await Promise.allSettled(
          items.map(item =>
            callApi(buildBody('placeOrder', {
              productId:           String(item.productId),
              denomination:        String(item.denomination),
              quantity:            String(item.quantity),
              email,
              tag,
              poNumber:            `BULK-${Date.now()}-${item.productId}`,
              notifyReceiverEmail: notifyRecipient ? 1 : 0,
              contact:             '',
            }))
          )
        )

        const summary = results.map((r, i) => ({
          item:    items[i],
          status:  r.status,
          data:    r.status === 'fulfilled' ? r.value : undefined,
          error:   r.status === 'rejected'  ? (r.reason as Error).message : undefined,
        }))

        return ok({ total: items.length, results: summary })
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
