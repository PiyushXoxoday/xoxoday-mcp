import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.prompt(
    'build_loyalty_portal',
    'Generate a loyalty points redemption portal pre-integrated with Xoxoday APIs',
    {
      country:           z.string().describe('Target country code e.g. US, IN'),
      currency:          z.string().describe('Currency code e.g. USD, INR'),
      points_per_dollar: z.number().optional().default(100).describe('How many points = $1'),
      framework:         z.enum(['react', 'nextjs', 'vue']).optional().default('react'),
      ui_library:        z.string().optional(),
      brand_color:       z.string().optional(),
      logo_url:          z.string().optional(),
      company_name:      z.string().optional().describe('Your company name shown in portal'),
    },
    ({ country, currency, points_per_dollar, framework, ui_library, brand_color, logo_url, company_name }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Build a loyalty points redemption portal using Xoxoday MCP tools.

Requirements:
- Framework: ${framework}
- UI: ${ui_library || 'Tailwind CSS'}
- Country: ${country} | Currency: ${currency}
- Points conversion: ${points_per_dollar} points = $1
- Company: ${company_name || 'Your Company'} | Color: ${brand_color || '#6C3AC7'}

Steps to follow:
1. Call giftcard_get_filters for ${country}/${currency}
2. Call giftcard_get_vouchers(country=${country}, currencyCode=${currency}) for catalog
3. Use loyaltyConversion field from each product for points pricing
4. Build complete portal with:
   - Points balance dashboard (use giftcard_get_balance, display as points not currency)
   - Points-to-value display (e.g. "5,000 pts = $50")
   - Gift card catalog showing points cost (denomination × ${points_per_dollar})
   - Denomination picker showing points equivalent
   - Redemption form calling giftcard_place_order with tag: loyalty_redemption
   - Success screen with voucher codes from giftcard_get_order_details
   - Redemption history using giftcard_get_order_history
5. No payment gateway needed — loyalty redemption deducts from wallet
6. Show points before/after redemption clearly`,
        },
      }],
    })
  )
}
