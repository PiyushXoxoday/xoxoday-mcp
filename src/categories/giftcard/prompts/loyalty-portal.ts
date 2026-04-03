import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.prompt(
    'build_loyalty_portal',
    'Generate a secure, deployable loyalty points redemption portal — Next.js app with API routes (server-side credentials), points dashboard, gift card catalog, and deployment config',
    {
      country:           z.string().describe('Target country code e.g. US, IN'),
      currency:          z.string().describe('Currency code e.g. USD, INR'),
      points_per_dollar: z.number().optional().default(100).describe('How many points = $1'),
      framework:         z.enum(['nextjs', 'react', 'vue']).optional().default('nextjs').describe('nextjs strongly recommended — provides API routes to keep credentials server-side'),
      ui_library:        z.string().optional().describe('e.g. tailwind, shadcn, mui'),
      brand_color:       z.string().optional(),
      logo_url:          z.string().optional(),
      company_name:      z.string().optional().describe('Your company name shown in portal'),
    },
    ({ country, currency, points_per_dollar, framework, ui_library, brand_color, logo_url, company_name }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Build a production-ready, secure, deployable loyalty points redemption portal using Xoxoday MCP tools.

## Project Requirements
- Framework: ${framework}${framework !== 'nextjs' ? ' ⚠️ NOTE: Without Next.js, you MUST set up a separate backend — credentials cannot go in the browser.' : ''}
- UI: ${ui_library || 'Tailwind CSS + shadcn/ui'}
- Country: ${country} | Currency: ${currency}
- Points conversion: ${points_per_dollar} points = $1
- Company: ${company_name || 'Your Company'} | Color: ${brand_color || '#6C3AC7'} | Logo: ${logo_url || 'text logo'}

---

## Architecture (MANDATORY)

\`\`\`
Browser (React components)
    ↓  fetch('/api/xoxoday/...')
Next.js API Routes  ← Xoxoday credentials live HERE (server-side only)
    ↓  MCP tool calls
Xoxoday MCP Server → Xoxoday API
\`\`\`

**NEVER call Xoxoday MCP tools directly from React components.**

---

## Files to Generate

### Next.js API Routes (server-side)
\`\`\`
/app/api/xoxoday/filters/route.ts         → calls giftcard_get_filters
/app/api/xoxoday/vouchers/route.ts        → calls giftcard_get_vouchers
/app/api/xoxoday/voucher/[id]/route.ts    → calls giftcard_get_voucher with productName + currencyCode (NOT productId — productId filter is not supported by Xoxoday API; pass product name from catalog link)
/app/api/xoxoday/balance/route.ts         → calls giftcard_get_balance
/app/api/xoxoday/redeem/route.ts          → calls giftcard_place_order (POST)
/app/api/xoxoday/order/[id]/route.ts      → calls giftcard_get_order_details
/app/api/xoxoday/orders/route.ts          → calls giftcard_get_order_history
\`\`\`

### Customer Portal Pages
\`\`\`
/app/page.tsx                             → Points dashboard + catalog
/app/product/[id]/page.tsx               → Product detail with points cost
/app/redeem/page.tsx                     → Redemption confirmation
/app/order/[id]/page.tsx                 → Success: voucher codes
/app/history/page.tsx                    → Redemption history
\`\`\`

### Admin Dashboard
\`\`\`
/app/admin/page.tsx                      → Balance, recent redemptions, alerts
/app/admin/orders/page.tsx               → All redemptions with status
/app/admin/payments/page.tsx             → Transaction/payment report
/middleware.ts                            → Protect /admin with ADMIN_PASSWORD
\`\`\`

### Config & Deployment
\`\`\`
.env.example
vercel.json
README.md                                 → 3-step setup
\`\`\`

---

## Build Steps

1. Call \`giftcard_get_filters\` for ${country}/${currency}
2. Call \`giftcard_get_vouchers(country=${country}, currencyCode=${currency})\` for catalog
3. Call \`giftcard_get_balance\` to display points balance

4. **Portal screens:**

   **Points Dashboard + Catalog (/app/page.tsx)**
   - Fetch balance via \`/api/xoxoday/balance\` → convert to points (balance × ${points_per_dollar})
   - Display: "Your Points: X,XXX pts = $XX.XX"
   - Gift card grid showing points cost per denomination
   - Filter by category, points range

   **Product Detail (/app/product/[id]/page.tsx)**
   - Fetch via \`/api/xoxoday/voucher/[id]\`
   - Show denomination options with points equivalent (denom × ${points_per_dollar})
   - Use loyaltyConversion field if present, otherwise calculate from points_per_dollar
   - "Redeem for X,XXX pts" button

   **Redemption Confirmation (/app/redeem/page.tsx)**
   - Summary: product, denomination, points to deduct, points remaining after
   - "Confirm Redemption" → POST \`/api/xoxoday/redeem\` → place_order({ productId, denomination, quantity, email, tag: "loyalty_redemption" })
   - Redirect to \`/order/[id]\`

   **Success (/app/order/[id]/page.tsx)**
   - Fetch \`/api/xoxoday/order/[id]\` for voucher codes
   - Display voucher code(s), PIN, expiry, redemption instructions
   - Show updated points balance after deduction

   **Redemption History (/app/history/page.tsx)**
   - Fetch \`/api/xoxoday/orders\`

5. **Admin dashboard (/app/admin/):**
   - Balance card (in $ and points equivalent)
   - Low-balance warning when below configurable threshold
   - Redemption volume chart
   - Protected by ADMIN_PASSWORD middleware

6. **Deployment files:**
   - \`.env.example\`: XOXODAY_CLIENT_ID, XOXODAY_CLIENT_SECRET, XOXODAY_REFRESH_TOKEN,
     XOXODAY_ACCESS_TOKEN, XOXODAY_ACCESS_TOKEN_EXPIRY, XOXODAY_ENV, ADMIN_PASSWORD
   - \`vercel.json\`, store \`README.md\`

7. **Error handling:**
   - Insufficient balance → "Not enough points. You have X pts, need Y pts"
   - Invalid denomination → show valid options
   - Network errors → retry 3× with backoff

8. No payment gateway — loyalty redemption deducts from Xoxoday wallet directly

---

## After Building — 3 Manual Steps Remaining
1. **Fund Xoxoday wallet** → Plum Dashboard → Wallet → Add Funds
2. **Complete KYB** with Xoxoday if not done (1–3 business days)
3. **Deploy** → run \`vercel deploy\``,
        },
      }],
    })
  )
}
