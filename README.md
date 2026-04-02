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

## What you can ask Claude

```
"What gift card categories are available in the US?"
"Build me a React gift card storefront for USD"
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
| `giftcard_get_balance` | Wallet balance |
| `giftcard_place_order` | Buy (B2C) or redeem (loyalty) a gift card |
| `giftcard_bulk_place_order` | Multiple products in one operation |
| `giftcard_get_order_details` | Voucher codes and order status |
| `giftcard_get_order_history` | Past orders |
| `giftcard_get_payment_report` | Transaction history |

## Available Prompts

| Prompt | Description |
|---|---|
| `build_b2c_store` | Generate a complete B2C gift card storefront |
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
| `XOXODAY_ENV` | — | `sandbox` | `sandbox` or `production` |
| `XOXODAY_CATEGORIES` | — | `giftcard` | Comma-separated: `giftcard,lounge,merchandise` |
| `XOXODAY_TRANSPORT` | — | `stdio` | `stdio` (Claude/Cursor) or `http` (ChatGPT) |
| `PORT` | — | `3000` | HTTP port (only used when transport=http) |

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
