import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.prompt(
    'build_b2c_store',
    'Generate a complete B2C gift card storefront pre-integrated with Xoxoday APIs',
    {
      country:      z.string().describe('Target country code e.g. US, IN, GB'),
      currency:     z.string().describe('Currency code e.g. USD, INR, GBP'),
      framework:    z.enum(['react', 'nextjs', 'vue']).optional().default('react'),
      ui_library:   z.string().optional().describe('UI library e.g. tailwind, mui, shadcn'),
      brand_color:  z.string().optional().describe('Primary brand color hex e.g. #6C3AC7'),
      logo_url:     z.string().optional().describe('Your logo URL'),
      payment_gateway: z.string().optional().describe('Payment gateway name e.g. stripe, razorpay'),
    },
    ({ country, currency, framework, ui_library, brand_color, logo_url, payment_gateway }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Build a production-ready B2C gift card storefront using the Xoxoday MCP tools.

Requirements:
- Framework: ${framework}
- UI: ${ui_library || 'Tailwind CSS'}
- Country: ${country} | Currency: ${currency}
- Brand color: ${brand_color || '#6C3AC7'} | Logo: ${logo_url || 'use text logo'}
- Payment gateway: ${payment_gateway || 'not specified — ask user'}

Steps to follow:
1. Call giftcard_get_filters to discover available categories for ${country}/${currency}
2. Call giftcard_get_vouchers(country=${country}, currencyCode=${currency}) to get catalog
3. Call giftcard_get_balance to show available credit
4. Build the complete app with:
   - Product catalog grid with brand logos, names, denominations
   - Category and price filters
   - Product detail page with denomination picker
   - Checkout form (email, quantity) calling giftcard_place_order with tag: b2c_store
   ${payment_gateway ? `- ${payment_gateway} payment integration before calling place_order` : '- Payment gateway placeholder (ask user for PG details)'}
   - Order confirmation showing voucher codes from giftcard_get_order_details
   - Order history page using giftcard_get_order_history
5. All API calls use real Xoxoday endpoints — no mocks
6. Include error handling for: insufficient balance (402), invalid denomination, network errors`,
        },
      }],
    })
  )
}
