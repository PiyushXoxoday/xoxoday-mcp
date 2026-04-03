import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

// All known payment gateways with official or well-supported MCP servers
const KNOWN_PG_MCPS: Record<string, {
  official: boolean
  regions: string
  install: string
  docsUrl: string
  credFields: string[]
}> = {
  stripe: {
    official:   true,
    regions:    'Global',
    install:    'claude mcp add stripe -e STRIPE_SECRET_KEY=<your_key> -- npx -y @stripe/agent-toolkit',
    docsUrl:    'https://docs.stripe.com/mcp',
    credFields: ['STRIPE_SECRET_KEY'],
  },
  paypal: {
    official:   true,
    regions:    'Global',
    install:    'claude mcp add paypal -e PAYPAL_CLIENT_ID=<id> -e PAYPAL_CLIENT_SECRET=<secret> -- npx -y @paypal/mcp',
    docsUrl:    'https://developer.paypal.com/tools/mcp',
    credFields: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
  },
  adyen: {
    official:   true,
    regions:    'Global / Enterprise',
    install:    'claude mcp add adyen -e ADYEN_API_KEY=<key> -e ADYEN_MERCHANT_ACCOUNT=<account> -- npx -y @adyen/adyen-mcp',
    docsUrl:    'https://docs.adyen.com/development-resources/mcp-server',
    credFields: ['ADYEN_API_KEY', 'ADYEN_MERCHANT_ACCOUNT', 'ADYEN_ENV (test|live)'],
  },
  square: {
    official:   true,
    regions:    'US / Canada / Australia / UK / Japan',
    install:    'claude mcp add square -- npx -y square-mcp-server start',
    docsUrl:    'https://github.com/square/square-mcp-server',
    credFields: ['SQUARE_ACCESS_TOKEN'],
  },
  mollie: {
    official:   true,
    regions:    'Europe',
    install:    'claude mcp add mollie -e MOLLIE_API_KEY=<key> -- npx -y @mollie/mcp',
    docsUrl:    'https://docs.mollie.com/mcp',
    credFields: ['MOLLIE_API_KEY'],
  },
  razorpay: {
    official:   true,
    regions:    'India',
    install:    'claude mcp add razorpay -e RAZORPAY_KEY_ID=<id> -e RAZORPAY_KEY_SECRET=<secret> -- npx -y razorpay-mcp --tools=all',
    docsUrl:    'https://razorpay.com/docs/mcp',
    credFields: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
  },
  payu: {
    official:   true,
    regions:    'India / Poland / South Africa',
    install:    'claude mcp add payu -e PAYU_MERCHANT_KEY=<key> -e PAYU_MERCHANT_SALT=<salt> -- npx -y payu-mcp-server',
    docsUrl:    'https://docs.payu.in/docs/payu-mcp-server',
    credFields: ['PAYU_MERCHANT_KEY', 'PAYU_MERCHANT_SALT'],
  },
  braintree: {
    official:   false,   // community MCP
    regions:    'Global (PayPal-owned)',
    install:    'claude mcp add braintree -e BRAINTREE_MERCHANT_ID=<id> -e BRAINTREE_PUBLIC_KEY=<key> -e BRAINTREE_PRIVATE_KEY=<secret> -- npx -y braintree-mcp-server',
    docsUrl:    'https://github.com/QuentinCody/braintree-mcp-server',
    credFields: ['BRAINTREE_MERCHANT_ID', 'BRAINTREE_PUBLIC_KEY', 'BRAINTREE_PRIVATE_KEY'],
  },
}

const PG_TABLE = `
| Gateway    | Regions                          | MCP Type      |
|------------|----------------------------------|---------------|
| Stripe     | Global                           | ✅ Official    |
| PayPal     | Global                           | ✅ Official    |
| Adyen      | Global / Enterprise              | ✅ Official    |
| Square     | US, Canada, AU, UK, Japan        | ✅ Official    |
| Mollie     | Europe                           | ✅ Official    |
| Razorpay   | India                            | ✅ Official    |
| PayU       | India, Poland, South Africa      | ✅ Official    |
| Braintree  | Global (PayPal-owned)            | ⚠️ Community  |
| Others     | —                                | ❌ No MCP yet |`

function pgGuidance(pg: string | undefined): string {
  if (!pg) {
    return `## Step 1: Choose Your Payment Gateway

Ask the user: **"Which payment gateway do you want to integrate?"**

Recommend based on their target market:
${PG_TABLE}

- If they pick a gateway from the list above → follow the MCP install instructions below
- If they pick a gateway NOT in the list → ask them for:
  1. API documentation URL or PDF
  2. API credentials (key names vary — ask what fields are required)
  3. Whether a sandbox / test environment is available
  4. Whether webhooks are needed for payment confirmation

⚠️ Do NOT proceed to building the store until the payment gateway is confirmed.`
  }

  const key = pg.toLowerCase().replace(/[^a-z]/g, '')
  const info = KNOWN_PG_MCPS[key]

  if (info) {
    const badge = info.official ? '✅ Official MCP' : '⚠️ Community MCP (not officially supported)'
    return `## Payment Gateway: ${pg.charAt(0).toUpperCase() + pg.slice(1)} — ${badge}

**Regions:** ${info.regions}
**Docs:** ${info.docsUrl}

### Setup Instructions — tell the user to run this in their terminal:
\`\`\`bash
${info.install}
\`\`\`

### Credentials required:
${info.credFields.map(f => `- \`${f}\``).join('\n')}
Get these from the ${pg} dashboard / developer portal.

### Integration pattern in the app:
1. Use the ${pg} MCP tools to create a payment intent / order
2. Show the ${pg} payment UI (hosted fields or redirect)
3. On payment SUCCESS → immediately call \`giftcard_place_order\`
4. On payment FAILURE → show error, do NOT call \`giftcard_place_order\`
5. Handle webhooks if needed for async payment confirmation

⚠️ Always capture payment BEFORE calling giftcard_place_order. Never charge the Xoxoday wallet if payment has not been confirmed.`
  }

  return `## Payment Gateway: ${pg} — ❌ No MCP Available

No known MCP server exists for "${pg}". Before building, ask the user to share:

1. **API documentation** — URL, PDF, or Postman collection
2. **Required credentials** — ask: "What API keys or secrets do I need? (e.g. API key, client ID + secret, merchant ID)"
3. **Sandbox environment** — "Do you have test/sandbox credentials?"
4. **Webhook requirements** — "Does payment confirmation come via webhook or synchronous response?"
5. **SDK availability** — "Is there an official JavaScript/TypeScript SDK?"

Once you have the above, integrate ${pg} directly in the frontend:
- Create \`src/services/${key}Payment.ts\` with the payment flow
- Store all credentials as environment variables (\`VITE_${key.toUpperCase()}_*\` for Vite, \`NEXT_PUBLIC_*\` for Next.js public keys only)
- Keep secret keys server-side only (API route / backend) — never expose in frontend bundle
- On payment success → call \`giftcard_place_order\``
}

export function register(server: McpServer) {
  server.prompt(
    'build_b2c_store',
    'Generate a complete B2C gift card storefront pre-integrated with Xoxoday APIs and a payment gateway',
    {
      country:         z.string().describe('Target country code e.g. US, IN, GB'),
      currency:        z.string().describe('Currency code e.g. USD, INR, GBP'),
      framework:       z.enum(['react', 'nextjs', 'vue']).optional().default('react'),
      ui_library:      z.string().optional().describe('UI library e.g. tailwind, mui, shadcn'),
      brand_color:     z.string().optional().describe('Primary brand color hex e.g. #6C3AC7'),
      logo_url:        z.string().optional().describe('Your logo URL'),
      payment_gateway: z.string().optional().describe('Payment gateway: stripe, paypal, adyen, square, mollie, razorpay, payu, braintree — or leave blank to be guided'),
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
- Payment gateway: ${payment_gateway || 'NOT specified — follow Step 1 below first'}

---

${pgGuidance(payment_gateway)}

---

## Store Build Steps (follow AFTER payment gateway is confirmed)

1. Call giftcard_get_filters to discover available categories for ${country}/${currency}
2. Call giftcard_get_vouchers(country=${country}, currencyCode=${currency}, limit=20) to get the catalog
3. Call giftcard_get_balance to verify the wallet has sufficient credit

4. Build these screens:

   **Catalog page**
   - Product grid: brand logo (imageUrl), name, starting denomination, discount badge
   - Filter sidebar: by voucher_category and price range
   - Search by product name
   - "Buy Now" CTA on each card

   **Product detail page**
   - Brand logo, full description, T&C, redemption instructions
   - Denomination picker (from valueDenominations — comma-separated string, split and parse)
   - Quantity input (respect orderQuantityLimit)
   - Recipient email input (required for digital delivery)
   - "Proceed to Pay" button

   **Checkout & payment flow**
   - Collect payment via the configured gateway FIRST
   - Only on confirmed payment success → call giftcard_place_order({ productId, denomination, quantity, email, tag: "b2c_store" })
   - On place_order success → redirect to Order Confirmation
   - On any failure → show clear error message, refund if payment was already captured

   **Order confirmation page**
   - Call giftcard_get_order_details(orderId)
   - Display voucher code(s), PIN if applicable, expiry date, redemption instructions
   - "Copy code" button, email resend option

   **Order history page**
   - Call giftcard_get_order_history(startDate, endDate)
   - Show status per order: processing / delivered / failed

5. Error handling:
   - 402 Insufficient balance → "Please contact the store admin"
   - Invalid denomination → show valid options parsed from valueDenominations
   - Network errors → retry up to 3 times with exponential backoff
   - Payment declined → never call place_order, surface the gateway's error message

6. All Xoxoday data must come from MCP tools — no mocked or hardcoded catalog data`,
        },
      }],
    })
  )
}
