import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_place_order',
    'Place a gift card order on Xoxoday. Works for both B2C purchases (tag: b2c_store) and loyalty redemptions (tag: loyalty_redemption). Returns order ID and voucher codes. Check wallet balance with giftcard_get_balance before placing orders.',
    {
      productId:           z.number().describe('Product ID from giftcard_get_vouchers'),
      denomination:        z.number().describe('Gift card value (must be in valueDenominations list)'),
      quantity:            z.number().int().min(1).max(10).default(1).describe('Number of gift cards'),
      email:               z.string().email().describe('Recipient email address'),
      tag:                 z.enum(['b2c_store', 'loyalty_redemption']).describe('Use b2c_store for purchases, loyalty_redemption for points redemption'),
      poNumber:            z.string().optional().describe('Your internal purchase order reference'),
      notifyRecipient:     z.boolean().optional().default(true).describe('Send voucher to recipient by email'),
      contact:             z.string().optional().describe('Recipient phone number if required by product'),
    },
    async ({ productId, denomination, quantity, email, tag, poNumber, notifyRecipient, contact }) => {
      try {
        const data = await callApi(buildBody('placeOrder', {
          productId:            String(productId),
          denomination:         String(denomination),
          quantity:             String(quantity),
          email,
          tag,
          poNumber:             poNumber ?? `PO-${Date.now()}`,
          notifyReceiverEmail:  notifyRecipient ? 1 : 0,
          contact:              contact ?? '',
        }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
