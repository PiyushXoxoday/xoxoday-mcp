import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_payment_report',
    'Fetch payment transaction history — wallet credits, debits, invoices, and account adjustments.',
    {
      page:  z.number().int().min(1).optional().default(1).describe('Page number'),
      limit: z.number().int().min(1).max(100).optional().default(20).describe('Transactions per page'),
    },
    async ({ page, limit }) => {
      try {
        const data = await callApi(buildBody('getPaymentReport', { page, limit }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
