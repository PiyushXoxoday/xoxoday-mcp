import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { callApi, buildBody } from '../../../core/client.js'
import { ok, err } from '../../../core/types.js'

export function register(server: McpServer) {
  server.tool(
    'giftcard_get_filters',
    'Get available filters for the Xoxoday gift card catalog. Returns countries, currencies, voucher categories, product types, and price ranges. Pass country + currencyCode to get only categories that have products in that specific market — avoids showing empty categories in a UI dropdown.',
    {
      filterGroupCode: z.string()
        .optional()
        .describe('Specific filter group code to fetch. Omit to get all groups. Known values: country, currencyCode, voucher_category, product_category, price, amazon_india, lounge, merchandise, mile_category, payouts, topup, custom_catalog'),
      country: z.string()
        .optional()
        .describe('Country filterValueCode e.g. "usa", "india" — when provided with currencyCode, voucher_category list is filtered to only categories that have products in this market'),
      currencyCode: z.string()
        .optional()
        .describe('Currency code e.g. "USD", "INR" — when provided with country, filters voucher_category to only categories available in this market'),
    },
    async ({ filterGroupCode, country, currencyCode }) => {
      try {
        const data = await callApi(buildBody('getFilters', {
          ...(filterGroupCode && { filterGroupCode }),
        }))

        // If market context provided, cross-reference voucher_category with actual products
        const needsCrossRef = (country || currencyCode) &&
          (!filterGroupCode || filterGroupCode === 'voucher_category')

        if (needsCrossRef) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const groups: any[] = (data as any)?.data?.getFilters?.data ?? []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vcGroup: any = groups.find((g: any) => g.filterGroupCode === 'voucher_category')

          if (vcGroup) {
            // Fetch products for this market to discover which categories have products
            const mktFilters: { key: string; value: string }[] = []
            if (country)      mktFilters.push({ key: 'country',      value: country })
            if (currencyCode) mktFilters.push({ key: 'currencyCode', value: currencyCode })

            // C1: Use limit 500 so markets with >100 products don't miss categories on page 2+
            const vouchersData = await callApi(buildBody('getVouchers', {
              filters:      mktFilters,
              page:         1,
              limit:        500,
              exchangeRate: 1,
            }))

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products: any[] = (vouchersData as any)?.data?.getVouchers?.data ?? []

            // Collect unique category display names from product.categories (comma-separated)
            const availableCategories = new Set<string>()
            for (const p of products) {
              const cats = (p.categories ?? '').split(',').map((c: string) => c.trim()).filter(Boolean)
              cats.forEach((c: string) => availableCategories.add(c))
            }

            // Keep only categories that appear in the market's products
            vcGroup.filters = vcGroup.filters.filter(
              (f: { filterValue: string }) => availableCategories.has(f.filterValue),
            )
          }
        }

        return ok(data)
      } catch (e) {
        return err((e as Error).message)
      }
    }
  )
}
