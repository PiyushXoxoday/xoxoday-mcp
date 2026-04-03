import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function register(server: McpServer) {
  server.prompt(
    'xoxoday_store_setup',
    'Complete pre-launch checklist for building a gift card store with Xoxoday — covers account setup, credentials, wallet, payment gateway, infrastructure, legal, and go-live steps',
    {
      store_type: z.enum(['b2c', 'loyalty', 'corporate']).optional().default('b2c')
        .describe('Type of store: b2c (end-customer purchases), loyalty (points redemption), corporate (bulk gifting)'),
      country:    z.string().optional().describe('Target country e.g. "US", "IN", "UK" — used to tailor tax/legal guidance'),
    },
    ({ store_type, country }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Walk me through the complete checklist to build a ${store_type} gift card store using Xoxoday${country ? ` for ${country}` : ''}.

Go through each step below IN ORDER. For each step, ask me the relevant questions, confirm I've completed it, then move to the next. Don't skip steps or batch them together.

---

## Step 1: Xoxoday Account Setup
- Do you already have a Xoxoday/Plum account?
  - If NO → guide them to sign up at https://plum.xoxoday.com/signup
- Has KYB (Know Your Business) verification been completed?
  - KYB is required before any live orders can be placed
  - Documents needed: business registration, GST/VAT number (if applicable), authorized signatory ID
- Is the account approved and active?

## Step 2: Get API Credentials
- Go to: Plum Dashboard → Settings → Developer → API Keys
- You need THREE credentials:
  1. **Client ID** — identifies your application
  2. **Client Secret** — keep this secret, never expose in frontend code
  3. **Refresh Token** — obtained by logging into the developer portal OAuth flow
- Also note your **Access Token** and **access_token_expiry** (ms epoch) — set these as:
  - \`XOXODAY_ACCESS_TOKEN\` — current access token
  - \`XOXODAY_ACCESS_TOKEN_EXPIRY\` — expiry timestamp in ms (the MCP auto-refreshes when this passes)
  - \`XOXODAY_REFRESH_TOKEN\` — used to get new access tokens automatically

## Step 3: Wallet Top-Up
- Check current balance: call \`giftcard_get_balance\`
- For a production store you need sufficient pre-funded balance — Xoxoday is a prepaid model
- How to top up: Plum Dashboard → Wallet → Add Funds
- Recommended minimum: 2–3× your expected daily order volume
- Set up a low-balance alert: poll \`giftcard_get_balance\` in a scheduled job; alert when balance < threshold

## Step 4: Sandbox Testing
- Set \`XOXODAY_ENV=sandbox\` for all testing
- Sandbox URL: https://stagingstores.xoxoday.com/chef/v1/oauth/api
- Run these tests in sandbox:
  - [ ] \`giftcard_get_filters\` returns filter groups
  - [ ] \`giftcard_get_vouchers\` returns catalog
  - [ ] \`giftcard_get_balance\` returns balance
  - [ ] \`giftcard_place_order\` places a test order (use test email)
  - [ ] \`giftcard_get_order_details\` returns voucher codes
  - [ ] \`giftcard_get_order_history\` shows the test order

## Step 5: Payment Gateway Setup
${store_type === 'loyalty' ? `- Loyalty portals do NOT need a payment gateway — users redeem points, wallet is debited directly
- Skip this step` : `- You need a payment gateway to collect customer payments before issuing gift cards
- Use the \`build_b2c_store\` or \`build_corporate_gifting\` prompt which includes PG guidance
- Supported PG MCPs: Stripe, PayPal, Adyen, Square, Mollie, Razorpay, PayU, Braintree
- PG merchant account also requires KYC with the gateway provider
- Test the full payment → order flow in sandbox before going live`}

## Step 6: Infrastructure
- [ ] **Hosting chosen**: Vercel / Netlify / AWS / GCP / Azure
- [ ] **Domain name** registered and DNS configured
- [ ] **SSL certificate** enabled (HTTPS required — never serve payment pages over HTTP)
- [ ] **Backend / server-side layer**: Xoxoday credentials must NEVER be in the browser bundle
  - Use Next.js API routes, Express, or any server framework
  - MCP tools run server-side — never expose XOXODAY_CLIENT_SECRET to the frontend
- [ ] **Environment variables** set in hosting platform (not hardcoded in code)

## Step 7: Email & Notifications
- Xoxoday can deliver vouchers directly to recipients (set \`notifyRecipient: true\` in place_order)
  - This covers basic delivery but emails come from Xoxoday's domain, not yours
- For **branded emails** (recommended for B2C stores):
  - Set up SendGrid / AWS SES / Postmark
  - Set \`notifyRecipient: false\` and handle email delivery yourself using voucher codes from \`giftcard_get_order_details\`
  - Design transactional email templates: order confirmation, voucher delivery, order failure

## Step 8: Legal & Compliance${country ? ` (${country})` : ''}
- [ ] **Terms of Service** — must include gift card purchase terms
- [ ] **Privacy Policy** — required if collecting any personal data (emails, names)
- [ ] **Refund Policy** — Xoxoday vouchers are typically non-refundable; document this clearly
- [ ] **Tax registration**:
${country === 'IN' ? `  - India: GST registration required if turnover > ₹20L/year; Gift cards may attract 18% GST
  - Obtain GSTIN and configure tax invoicing` : country === 'US' ? `  - USA: Sales tax varies by state; gift cards are typically tax-exempt at purchase but taxable at redemption in some states
  - Consult a tax advisor for your specific states of operation` : `  - Check local VAT/sales tax requirements for ${country || 'your target markets'}
  - Consult a local tax advisor`}
- [ ] **Data protection**: GDPR (EU), PDPA (India/Thailand), CCPA (California) as applicable

## Step 9: Monitoring & Operations
- [ ] **Balance monitoring**: scheduled job to poll \`giftcard_get_balance\` and alert when low
- [ ] **Order failure alerts**: monitor \`giftcard_place_order\` errors and alert ops team
- [ ] **Payment reconciliation**: use \`giftcard_get_payment_report\` for daily reconciliation
- [ ] **Error logging**: set up Sentry / Datadog / CloudWatch for production error tracking

## Step 10: Go-Live Checklist
- [ ] Switch \`XOXODAY_ENV=production\` in all environments
- [ ] Production URL: https://accounts.xoxoday.com/chef/v1/oauth/api
- [ ] Update \`XOXODAY_ACCESS_TOKEN\`, \`XOXODAY_ACCESS_TOKEN_EXPIRY\`, \`XOXODAY_REFRESH_TOKEN\` with production credentials
- [ ] Place ONE real test order with a small denomination to verify end-to-end
- [ ] Confirm voucher is delivered to recipient email
- [ ] Confirm order appears in \`giftcard_get_order_history\`
- [ ] Wallet balance deducted correctly in \`giftcard_get_balance\`
- [ ] Enable production payment gateway (disable sandbox/test mode)
- [ ] Announce launch 🚀

---

After confirming all steps are complete, use the appropriate prompt to build the actual application:
- B2C store → \`build_b2c_store\`
- Loyalty portal → \`build_loyalty_portal\`
- Corporate gifting → \`build_corporate_gifting\``,
        },
      }],
    })
  )
}
