import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.prompt(
    'build_corporate_gifting',
    'Generate a corporate bulk gift card ordering portal pre-integrated with Xoxoday APIs',
    {
      country:     z.string(),
      currency:    z.string(),
      framework:   z.enum(['react', 'nextjs', 'vue']).optional().default('react'),
      brand_color: z.string().optional(),
      logo_url:    z.string().optional(),
    },
    ({ country, currency, framework, brand_color, logo_url }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Build a corporate bulk gift card ordering portal using Xoxoday MCP tools.

Requirements:
- Framework: ${framework} | Country: ${country} | Currency: ${currency}
- Color: ${brand_color || '#6C3AC7'} | Logo: ${logo_url || 'text logo'}

Steps:
1. Call giftcard_get_filters and giftcard_get_vouchers for the catalog
2. Call giftcard_get_balance to show wallet balance upfront
3. Build with:
   - Multi-select catalog (add multiple brands + denominations to cart)
   - Quantity input per product (up to orderQuantityLimit)
   - Bulk recipient upload (CSV: email, name, amount)
   - Order summary with total cost before confirming
   - Bulk order using giftcard_bulk_place_order
   - Dashboard showing all orders from giftcard_get_order_history
   - Payment report using giftcard_get_payment_report
4. Include wallet balance warning if order total exceeds available balance`,
        },
      }],
    })
  )
}
