# @xoxoday/mcp

Xoxoday MCP Server — connect any AI assistant to the Xoxoday Gift Card API.
Build B2C storefronts, loyalty redemption portals, and corporate gifting apps using plain English.

**Works with:** Claude Desktop · Claude Code · Cursor · Windsurf · VS Code · ChatGPT (via HTTP)

---

## Prerequisites

1. [Create a Plum account](https://plum.xoxoday.com/signup)
2. Complete KYB verification
3. Get your **Client ID** and **Client Secret** from your Plum dashboard
4. Fund your sandbox wallet before placing test orders

---

## Quick Start — Claude Desktop / Cursor / Windsurf

Add to your MCP config file:

**macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows** — `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "xoxoday": {
      "command": "npx",
      "args": ["-y", "@xoxoday/mcp"],
      "env": {
        "XOXODAY_CLIENT_ID":     "your_client_id",
        "XOXODAY_CLIENT_SECRET": "your_client_secret",
        "XOXODAY_ENV":           "sandbox",
        "XOXODAY_CATEGORIES":    "giftcard"
      }
    }
  }
}
```

Restart Claude Desktop. You're done.

---

## Quick Start — Claude Code (CLI)

```bash
XOXODAY_CLIENT_ID=xxx XOXODAY_CLIENT_SECRET=xxx \
  claude mcp add xoxoday -- npx -y @xoxoday/mcp
```

---

## How It Works in Production

When Claude generates a store, credentials are kept server-side — never in the browser:

```
Browser (React components)
    ↓  fetch('/api/xoxoday/...')
Next.js API Routes  ← Xoxoday credentials live HERE (env vars, server-side only)
    ↓  MCP tool calls
Xoxoday MCP Server → Xoxoday API

Browser (React components)
    ↓  Payment gateway frontend SDK (public key only)
Payment Gateway API  ← PG secret key lives in Next.js API routes
```

Claude generates the full stack:
- `/app/api/xoxoday/` — server-side proxy routes (filters, vouchers, balance, orders, redemption)
- `/app/` — customer-facing store pages (catalog, product, checkout, order confirmation, history)
- `/app/admin/` — operator dashboard (balance, orders, payments — password-protected)
- `.env.example`, `vercel.json`, `README.md` — ready to deploy

**3 manual steps remain after generation:**
1. Fund Xoxoday wallet (Plum Dashboard → Wallet → Add Funds)
2. Complete KYB with Xoxoday if not done (1–3 business days)
3. Run `vercel deploy`

---

## What you can ask Claude

```
"What gift card categories are available in the US?"
"Build me a gift card storefront for USD"
"Build a loyalty redemption portal where 100 points = $1"
"What's my current wallet balance?"
"Place a test order for a $25 Amazon gift card to test@example.com"
"Show my last 10 orders"
"Build a corporate bulk gifting portal"
```

---

## Available Tools

| Tool | Description |
|---|---|
| `giftcard_get_filters` | Countries, currencies, categories available |
| `giftcard_get_vouchers` | Full catalog with logos, denominations, pricing |
| `giftcard_get_voucher` | Single product detail lookup by product ID |
| `giftcard_get_balance` | Wallet balance |
| `giftcard_place_order` | Buy (B2C) or redeem (loyalty) a gift card |
| `giftcard_bulk_place_order` | Multiple products in one operation |
| `giftcard_get_order_details` | Voucher codes and order status |
| `giftcard_get_order_history` | Past orders (requires startDate + endDate) |
| `giftcard_get_payment_report` | Transaction history (requires startDate + endDate) |

## Available Prompts

| Prompt | Description |
|---|---|
| `xoxoday_store_setup` | **Start here** — complete pre-launch checklist (account, credentials, wallet, PG, infra, legal, go-live) |
| `build_b2c_store` | Generate a complete B2C gift card storefront with payment gateway |
| `build_loyalty_portal` | Generate a loyalty redemption portal |
| `build_corporate_gifting` | Generate a bulk gifting portal |

---

## ChatGPT — Custom GPT Actions

### Step 1 — Run the HTTP server

```bash
XOXODAY_CLIENT_ID=xxx \
XOXODAY_CLIENT_SECRET=xxx \
XOXODAY_ENV=sandbox \
XOXODAY_TRANSPORT=http \
PORT=3000 \
npx @xoxoday/mcp
```

Deploy this to **Vercel**, **Railway**, or **Render** for a public URL.

### Step 2 — Add to ChatGPT

1. Go to [chat.openai.com](https://chat.openai.com) → Explore GPTs → Create
2. Click **Configure** → **Add Action**
3. Import from URL: `https://your-server.com/openapi.json`
4. Done — your Custom GPT can now call Xoxoday APIs

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `XOXODAY_CLIENT_ID` | ✅ | — | Your Plum OAuth client ID |
| `XOXODAY_CLIENT_SECRET` | ✅ | — | Your Plum OAuth client secret |
| `XOXODAY_REFRESH_TOKEN` | ✅ | — | Your Plum OAuth refresh token (from Plum dashboard) |
| `XOXODAY_ACCESS_TOKEN` | — | — | Optional: current access token — MCP uses this directly and skips fetching a new one |
| `XOXODAY_ACCESS_TOKEN_EXPIRY` | — | — | Optional but recommended: expiry of `XOXODAY_ACCESS_TOKEN` in **milliseconds epoch** (from the `access_token_expiry` field in the OAuth response). When set, the MCP automatically falls through to the refresh token flow 5 minutes before expiry — enabling zero-downtime token rotation. |
| `XOXODAY_ENV` | — | `sandbox` | `sandbox` or `production` |
| `XOXODAY_CATEGORIES` | — | `giftcard` | Comma-separated: `giftcard,lounge,merchandise` |
| `XOXODAY_TRANSPORT` | — | `stdio` | `stdio` (Claude/Cursor) or `http` (ChatGPT) |
| `PORT` | — | `3000` | HTTP port (only used when transport=http) |

### Token rotation flow

```
XOXODAY_ACCESS_TOKEN set?
├── YES + XOXODAY_ACCESS_TOKEN_EXPIRY set
│   ├── Token still valid (> 5 min remaining) → use it
│   └── Token expired → use XOXODAY_REFRESH_TOKEN to fetch a new one automatically
├── YES, no expiry set → use it always (permanent token, no auto-rotation)
└── NO → use XOXODAY_REFRESH_TOKEN to fetch access token on first call
```

---

## Security

- Credentials are read from env vars — never hardcoded
- OAuth token stored **in memory only** — never written to disk
- Credentials are **never** returned in tool responses or logs
- For teams: use OS Keychain, AWS Secrets Manager, or 1Password CLI instead of plaintext env vars

```bash
# macOS Keychain (recommended)
security add-generic-password -s xoxoday -a client_secret -w "your_secret"
```

---

## Adding New Categories (lounge, merchandise, charity, mobile-topup)

Each category is a self-contained module. To activate when APIs are ready:

1. Implement tools in `src/categories/{category}/tools/`
2. Register in `src/categories/{category}/index.ts`
3. Set `XOXODAY_CATEGORIES=giftcard,lounge` in your config

---

## Environments

| Environment | Base URL |
|---|---|
| Sandbox | `https://stagingstores.xoxoday.com/chef/v1/oauth/api` |
| Production | `https://accounts.xoxoday.com/chef/v1/oauth/api` |

---

## License

MIT © Xoxoday
