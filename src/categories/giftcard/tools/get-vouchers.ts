import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_vouchers',
    'Fetch the Xoxoday gift card catalog. Returns products with brand logos (imageUrl), denominations (valueDenominations), pricing, loyalty conversion rates, and full product details. Filter by country, currency, category, price range, or product name. Use giftcard_get_filters first to get valid filter values.',
    {
      country:      z.string().optional().describe('filterValueCode from giftcard_get_filters country group e.g. "usa", "india", "uk" (lowercase country names, NOT ISO codes)'),
      currencyCode: z.string().optional().describe('Currency code e.g. "USD", "INR", "GBP" — use filterValueCode from giftcard_get_filters currencyCode group'),
      category:     z.string().optional().describe('voucher_category filterValueCode from giftcard_get_filters'),
      minPrice:     z.number().optional().describe('Minimum denomination value'),
      maxPrice:     z.number().optional().describe('Maximum denomination value'),
      productName:  z.string().optional().describe('Search by product/brand name'),
      deliveryType: z.enum(['realtime', 'delayed']).optional().describe('Delivery speed'),
      page:         z.number().int().min(1).optional().default(1).describe('Page number'),
      limit:        z.number().int().min(1).max(100).optional().default(20).describe('Results per page'),
      sortField:    z.string().optional().describe('Field to sort by e.g. "name"'),
      sortOrder:    z.enum(['ASC', 'DESC']).optional().describe('Sort direction'),
    },
    async ({ country, currencyCode, category, minPrice, maxPrice, productName, deliveryType, page, limit, sortField, sortOrder }) => {
      try {
        const filters: Array<{ key: string; value: string }> = []
        if (country)      filters.push({ key: 'country',      value: country })
        if (currencyCode) filters.push({ key: 'currencyCode', value: currencyCode })
        if (category)     filters.push({ key: 'voucher_category', value: category })
        if (minPrice)     filters.push({ key: 'minPrice',     value: String(minPrice) })
        if (maxPrice)     filters.push({ key: 'maxPrice',     value: String(maxPrice) })
        if (productName)  filters.push({ key: 'productName',  value: productName })
        if (deliveryType) filters.push({ key: 'deliveryType', value: deliveryType })

        const data = await callApi(buildBody('getVouchers', {
          filters,
          page:        page ?? 1,
          limit:       limit ?? 20,
          exchangeRate: 1,
          ...(sortField && { sort: { field: sortField, order: sortOrder ?? 'ASC' } }),
        }))
        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
