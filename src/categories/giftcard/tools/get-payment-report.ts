import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_payment_report',
    'Fetch payment transaction history — wallet credits, debits, invoices, and account adjustments. startDate and endDate are required.',
    {
      startDate: z.string().describe('Start date in YYYY-MM-DD format e.g. "2025-01-01"'),
      endDate:   z.string().describe('End date in YYYY-MM-DD format e.g. "2026-04-03"'),
      page:      z.number().int().min(1).optional().default(1).describe('Page number'),
      limit:     z.number().int().min(1).max(100).optional().default(20).describe('Transactions per page'),
    },
    async ({ startDate, endDate, page, limit }) => {
      try {
        const data = await callApi(buildBody('getPaymentReport', { startDate, endDate, page, limit }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
