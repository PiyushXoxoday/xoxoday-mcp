import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { config } from '../config.js'

/**
 * HTTP transport — serves two things:
 *  1. /sse + /messages  → Remote MCP (Claude via URL, future)
 *  2. /openapi.json     → OpenAPI 3.0 spec for ChatGPT Custom GPT Actions
 *  3. /tools/*          → REST endpoints matching MCP tools (ChatGPT calls these)
 */
export async function startHttp(server: McpServer): Promise<void> {
  const app = express()
  app.use(express.json())

  // ── CORS (needed for ChatGPT to call your server) ──────────────────────
  app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    next()
  })

  // ── Health check ────────────────────────────────────────────────────────
  app.get('/health', (_, res) => res.json({ status: 'ok', env: config.env }))

  // ── Remote MCP via SSE ──────────────────────────────────────────────────
  const transports: Record<string, SSEServerTransport> = {}

  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res)
    transports[transport.sessionId] = transport
    res.on('close', () => delete transports[transport.sessionId])
    await server.connect(transport)
  })

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string
    const transport = transports[sessionId]
    if (!transport) return res.status(400).json({ error: 'Unknown sessionId' })
    await transport.handlePostMessage(req, res)
  })

  // ── OpenAPI 3.0 spec for ChatGPT Custom Actions ─────────────────────────
  app.get('/openapi.json', (_, res) => {
    res.json(buildOpenApiSpec())
  })

  // ── REST endpoints for ChatGPT (mirrors each MCP tool) ──────────────────
  // ChatGPT calls these REST endpoints; internally they re-use the same handlers
  // by calling the Xoxoday API directly (same core/client.ts)
  const { callApi, buildBody } = await import('../core/client.js')

  app.post('/tools/giftcard_get_filters', async (req, res) => {
    try {
      const { filterGroupCode } = req.body
      const data = await callApi(buildBody('getFilters', filterGroupCode ? { filterGroupCode } : {}))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_get_vouchers', async (req, res) => {
    try {
      const { country, currencyCode, category, minPrice, maxPrice, productName, deliveryType, page = 1, limit = 20 } = req.body
      const filters: Array<{ key: string; value: string }> = []
      if (country)      filters.push({ key: 'country',          value: country })
      if (currencyCode) filters.push({ key: 'currencyCode',     value: currencyCode })
      if (category)     filters.push({ key: 'voucher_category', value: category })
      if (minPrice)     filters.push({ key: 'minPrice',         value: String(minPrice) })
      if (maxPrice)     filters.push({ key: 'maxPrice',         value: String(maxPrice) })
      if (productName)  filters.push({ key: 'productName',      value: productName })
      if (deliveryType) filters.push({ key: 'deliveryType',     value: deliveryType })
      const data = await callApi(buildBody('getVouchers', { filters, page, limit, exchangeRate: 1 }))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_get_balance', async (_, res) => {
    try {
      const data = await callApi(buildBody('getBalance'))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_place_order', async (req, res) => {
    try {
      const { productId, denomination, quantity = 1, email, tag, poNumber, notifyRecipient = true, contact = '' } = req.body
      const data = await callApi(buildBody('placeOrder', {
        productId: String(productId), denomination: String(denomination),
        quantity: String(quantity), email, tag,
        poNumber: poNumber ?? `PO-${Date.now()}`,
        notifyReceiverEmail: notifyRecipient ? 1 : 0, contact,
      }))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_get_order_details', async (req, res) => {
    try {
      const data = await callApi(buildBody('getOrderDetails', { orderId: req.body.orderId }))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_get_order_history', async (req, res) => {
    try {
      const data = await callApi(buildBody('getOrderHistory', { page: req.body.page ?? 1, limit: req.body.limit ?? 20 }))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.post('/tools/giftcard_get_payment_report', async (req, res) => {
    try {
      const data = await callApi(buildBody('getPaymentReport', { page: req.body.page ?? 1, limit: req.body.limit ?? 20 }))
      res.json(data)
    } catch (e) { res.status(500).json({ error: (e as Error).message }) }
  })

  app.listen(config.port, () => {
    console.error(`[xoxoday] HTTP server running on port ${config.port}`)
    console.error(`[xoxoday]   OpenAPI spec : http://localhost:${config.port}/openapi.json`)
    console.error(`[xoxoday]   MCP/SSE      : http://localhost:${config.port}/sse`)
    console.error(`[xoxoday]   Health       : http://localhost:${config.port}/health`)
  })
}

function buildOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title:       'Xoxoday Gift Card API',
      description: 'Access the Xoxoday gift card catalog, place orders, manage loyalty redemptions, and more.',
      version:     '0.1.0',
    },
    servers: [{ url: `http://localhost:${config.port}` }],
    paths: {
      '/tools/giftcard_get_filters': {
        post: {
          operationId: 'giftcard_get_filters',
          summary:     'Get available filters (countries, currencies, categories)',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
            filterGroupCode: { type: 'string', enum: ['country','currency','voucher_category','product_category','price'] },
          }}}}},
          responses: { '200': { description: 'Filter groups' } },
        },
      },
      '/tools/giftcard_get_vouchers': {
        post: {
          operationId: 'giftcard_get_vouchers',
          summary:     'Browse gift card catalog with logos and pricing',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
            country:      { type: 'string' },
            currencyCode: { type: 'string' },
            category:     { type: 'string' },
            minPrice:     { type: 'number' },
            maxPrice:     { type: 'number' },
            productName:  { type: 'string' },
            page:         { type: 'integer', default: 1 },
            limit:        { type: 'integer', default: 20 },
          }}}}},
          responses: { '200': { description: 'Gift card products' } },
        },
      },
      '/tools/giftcard_get_balance': {
        post: {
          operationId: 'giftcard_get_balance',
          summary:     'Check wallet balance',
          requestBody: { content: { 'application/json': { schema: { type: 'object' }}}},
          responses: { '200': { description: 'Balance info' } },
        },
      },
      '/tools/giftcard_place_order': {
        post: {
          operationId: 'giftcard_place_order',
          summary:     'Place a gift card order',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['productId','denomination','email','tag'], properties: {
            productId:    { type: 'number' },
            denomination: { type: 'number' },
            quantity:     { type: 'integer', default: 1 },
            email:        { type: 'string', format: 'email' },
            tag:          { type: 'string', enum: ['b2c_store','loyalty_redemption','corporate_gifting'] },
          }}}}},
          responses: { '200': { description: 'Order confirmation with voucher codes' } },
        },
      },
      '/tools/giftcard_get_order_details': {
        post: {
          operationId: 'giftcard_get_order_details',
          summary:     'Get order details and voucher codes',
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['orderId'], properties: {
            orderId: { type: 'string' },
          }}}}},
          responses: { '200': { description: 'Order details' } },
        },
      },
      '/tools/giftcard_get_order_history': {
        post: {
          operationId: 'giftcard_get_order_history',
          summary:     'Get order history',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
            page:  { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
          }}}}},
          responses: { '200': { description: 'Order list' } },
        },
      },
      '/tools/giftcard_get_payment_report': {
        post: {
          operationId: 'giftcard_get_payment_report',
          summary:     'Get payment and transaction history',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
            page:  { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 20 },
          }}}}},
          responses: { '200': { description: 'Payment transactions' } },
        },
      },
    },
  }
}
