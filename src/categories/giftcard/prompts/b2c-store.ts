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
    official:   false,
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

- If they pick a gateway from the list above → follow the MCP setup instructions below
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

### Credentials required (add to .env.local):
${info.credFields.map(f => `- \`${f}\``).join('\n')}

### Integration pattern:
1. Use the ${pg} MCP tools to create a payment intent / order
2. Show the ${pg} payment UI (hosted fields or redirect) in the browser
3. On payment SUCCESS → call the Next.js API route which calls \`giftcard_place_order\`
4. On payment FAILURE → show error, do NOT call \`giftcard_place_order\`

⚠️ Payment gateway secret keys must go in Next.js API routes ONLY — never in browser components.`
  }

  return `## Payment Gateway: ${pg} — ❌ No MCP Available

No known MCP server exists for "${pg}". Before building, ask the user to share:

1. **API documentation** — URL, PDF, or Postman collection
2. **Required credentials** — ask: "What API keys or secrets do I need?"
3. **Sandbox environment** — "Do you have test/sandbox credentials?"
4. **Webhook requirements** — "Does payment confirmation come via webhook or sync response?"

Once you have the above, integrate ${pg} via a Next.js API route:
- Create \`/app/api/payment/create/route.ts\` with the payment creation logic
- Store credentials as env vars — never expose secret keys in browser components`
}

export function register(server: McpServer) {
  server.prompt(
    'build_b2c_store',
    'Generate a complete, secure, deployable B2C gift card storefront — Next.js app with API routes (server-side credentials), customer store, admin dashboard, payment gateway integration, and deployment config',
    {
      country:         z.string().describe('Target country code e.g. US, IN, GB'),
      currency:        z.string().describe('Currency code e.g. USD, INR, GBP'),
      framework:       z.enum(['nextjs', 'react', 'vue']).optional().default('nextjs').describe('nextjs is strongly recommended — it provides built-in API routes to keep credentials server-side'),
      ui_library:      z.string().optional().describe('UI library e.g. tailwind, shadcn, mui'),
      brand_color:     z.string().optional().describe('Primary brand color hex e.g. #6C3AC7'),
      logo_url:        z.string().optional().describe('Your logo URL'),
      payment_gateway: z.string().optional().describe('Payment gateway: stripe, paypal, adyen, square, mollie, razorpay, payu, braintree — or leave blank to be guided'),
    },
    ({ country, currency, framework, ui_library, brand_color, logo_url, payment_gateway }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Build a production-ready, secure, deployable B2C gift card store using the Xoxoday MCP tools.

## Project Requirements
- Framework: ${framework}${framework !== 'nextjs' ? ' ⚠️ NOTE: Without Next.js, you MUST set up a separate backend server — credentials cannot go in the browser. Consider switching to nextjs.' : ''}
- UI: ${ui_library || 'Tailwind CSS + shadcn/ui'}
- Country: ${country} | Currency: ${currency}
- Brand color: ${brand_color || '#6C3AC7'} | Logo: ${logo_url || 'text logo'}
- Payment gateway: ${payment_gateway || 'NOT specified — follow Step 1 below first'}

---

${pgGuidance(payment_gateway)}

---

## Architecture (MANDATORY — follow this exactly)

\`\`\`
Browser (React components)
    ↓  fetch('/api/xoxoday/...')
Next.js API Routes  ← Xoxoday credentials live HERE (server-side only)
    ↓  MCP tool calls
Xoxoday MCP Server → Xoxoday API

Browser (React components)
    ↓  Payment gateway frontend SDK (public key only)
Payment Gateway API  ← PG secret key lives in Next.js API routes
\`\`\`

**NEVER import or call Xoxoday MCP tools directly from React components.**
All Xoxoday calls must go through Next.js API routes under \`/app/api/xoxoday/\`.

---

## Files to Generate

### Next.js API Routes (server-side — credentials safe here)
\`\`\`
/app/api/xoxoday/filters/route.ts         → calls giftcard_get_filters
/app/api/xoxoday/vouchers/route.ts        → calls giftcard_get_vouchers
/app/api/xoxoday/voucher/[id]/route.ts    → calls giftcard_get_voucher (pass productName + currencyCode — NOT productId, productId filter is not supported by Xoxoday API)
/app/api/xoxoday/balance/route.ts         → calls giftcard_get_balance
/app/api/xoxoday/order/route.ts           → calls giftcard_place_order (POST)
/app/api/xoxoday/order/[id]/route.ts      → calls giftcard_get_order_details
/app/api/xoxoday/orders/route.ts          → calls giftcard_get_order_history
/app/api/payment/create/route.ts          → creates payment intent via PG
/app/api/payment/webhook/route.ts         → PG webhook handler → triggers place_order
\`\`\`

### Customer-Facing Store Pages
\`\`\`
/app/page.tsx                             → Catalog: grid of gift cards with filters
/app/product/[id]/page.tsx               → Product detail: logo, denominations, buy button
/app/checkout/page.tsx                   → Payment form → PG checkout
/app/order/[id]/page.tsx                 → Order confirmation: voucher codes, instructions
/app/orders/page.tsx                     → Order history list
\`\`\`

### Admin Dashboard (password-protected)
\`\`\`
/app/admin/page.tsx                      → Overview: balance card, recent orders, alerts
/app/admin/orders/page.tsx               → All orders with status filter
/app/admin/payments/page.tsx             → Payment report / transaction history
/middleware.ts                            → Protect /admin with ADMIN_PASSWORD env var
\`\`\`

### Config & Deployment
\`\`\`
.env.example                              → All required env vars with descriptions
vercel.json                               → Vercel deployment config
README.md                                 → 3-step setup: clone → env vars → deploy
\`\`\`

---

## Build Steps

1. Call \`giftcard_get_filters\` to discover categories for ${country}/${currency}
2. Call \`giftcard_get_vouchers(country=${country}, currencyCode=${currency}, limit=20)\` to get catalog
3. Call \`giftcard_get_balance\` to display wallet status in admin

4. **Customer store screens:**

   **Catalog (/app/page.tsx)**
   - Fetch via \`/api/xoxoday/vouchers\`
   - Product grid: brand logo (imageUrl), name, starting denomination, discount badge
   - Filter sidebar: voucher category, price range (from filters API)
   - Search by product name

   **Product detail (/app/product/[id]/page.tsx)**
   - H3: Fetch via \`/api/xoxoday/voucher/[id]\` — the route must call \`giftcard_get_voucher\` with \`productName\` (from catalog) + \`currencyCode\`. **Do NOT pass productId** — Xoxoday API does not support productId as a filter parameter for getVouchers. Pass the product name via URL query param from the catalog link.
   - Full brand logo, description, T&C, redemption instructions
   - Denomination picker (parse valueDenominations comma-separated string)
   - Quantity input (respect orderQuantityLimit)
   - Recipient email input
   - "Pay Now" button

   **Checkout (/app/checkout/page.tsx)**
   - Call \`/api/payment/create\` to create payment intent
   - Show ${payment_gateway || 'payment gateway'} UI
   - On success → POST to \`/api/xoxoday/order\` → place_order({ productId, denomination, quantity, email, tag: "b2c_store" })
   - Redirect to \`/order/[id]\`

   **Order confirmation (/app/order/[id]/page.tsx)**
   - Fetch via \`/api/xoxoday/order/[id]\`
   - Display voucher code(s), PIN, expiry, redemption instructions
   - Copy-to-clipboard button

   **Order history (/app/orders/page.tsx)**
   - Fetch via \`/api/xoxoday/orders?startDate=...&endDate=...\`

5. **Admin dashboard (/app/admin/):**
   - Balance card: fetch \`/api/xoxoday/balance\` — show warning if below threshold
   - Recent orders table: last 30 days, sortable by status
   - Payment report: date-range picker → transaction table
   - Protected by middleware checking \`ADMIN_PASSWORD\` env var

6. **Deployment files:**
   - \`.env.example\` listing: XOXODAY_CLIENT_ID, XOXODAY_CLIENT_SECRET, XOXODAY_REFRESH_TOKEN,
     XOXODAY_ACCESS_TOKEN, XOXODAY_ACCESS_TOKEN_EXPIRY, XOXODAY_ENV, ADMIN_PASSWORD,
     and all PG credential variables
   - \`vercel.json\` with framework: nextjs
   - Store \`README.md\` with: 1) clone repo 2) copy .env.example → fill values 3) vercel deploy

7. **Error handling:**
   - 402 Insufficient balance → "Store temporarily unavailable — contact support"
   - Invalid denomination → show valid options from valueDenominations
   - Payment declined → do NOT call place_order, show gateway error message
   - Network errors → retry up to 3× with exponential backoff

8. All Xoxoday data via MCP tools through API routes — zero hardcoded catalog data

---

## Mobile & Embedding Setup (H4)

### Security Headers (add to next.config.ts)
\`\`\`typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },  // change to ALLOWFROM for partner embedding
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
        "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
        "img-src 'self' data: https: blob:",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self'",
        "object-src 'none'",
      ].join('; ')},
    ],
  }]
},
\`\`\`

### Razorpay Popup in iframes
⚠️ **Razorpay opens a popup window** — this is blocked in sandboxed iframes without \`allow-popups\`.

If embedding this store in an iframe:
\`\`\`html
<!-- Minimum required sandbox attributes for Razorpay to work -->
<iframe src="https://your-store.com/checkout"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox">
</iframe>
\`\`\`

In checkout.tsx, always guard before opening:
\`\`\`typescript
if (typeof window.Razorpay === 'undefined') {
  setError('Payment system unavailable. If embedded in an iframe, add allow-popups to the sandbox attribute.')
  return
}
\`\`\`

### Mobile Web (PWA/WebView)
- All denomination buttons must have \`min-h-[44px]\` (Apple HIG / Material Design minimum touch target)
- Quantity steppers must be at least 44×44px
- Use \`type="email"\` for email inputs to trigger mobile keyboard
- Add \`<meta name="viewport" content="width=device-width, initial-scale=1">\` in layout.tsx

---

## After Building — 3 Manual Steps Remaining
Tell the user:
1. **Fund Xoxoday wallet** → Plum Dashboard → Wallet → Add Funds (prepaid model)
2. **Complete KYB** with Xoxoday if not done (takes 1–3 business days)
3. **Deploy** → run \`vercel deploy\` in the project directory`,
        },
      }],
    })
  )
}
