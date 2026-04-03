import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_voucher',
    'Get full details for a single gift card product — brand logo, all denominations, description, T&C, redemption instructions, loyalty conversion rate. Filter by productName (exact name from giftcard_get_vouchers) and optionally currencyCode to get the right variant. NOTE: productId filter is not supported by the Xoxoday API; use productName + currencyCode instead.',
    {
      productName:  z.string().describe('Exact product name from giftcard_get_vouchers response e.g. "Amazon.com Gift Card"'),
      currencyCode: z.string().optional().describe('Currency code to get the correct regional variant e.g. "USD", "INR"'),
    },
    async ({ productName, currencyCode }) => {
      try {
        const filters: { key: string; value: string }[] = [
          { key: 'productName', value: productName },
        ]
        if (currencyCode) filters.push({ key: 'currencyCode', value: currencyCode })

        const data = await callApi(buildBody('getVouchers', {
          filters,
          page:  1,
          limit: 1,
        }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
