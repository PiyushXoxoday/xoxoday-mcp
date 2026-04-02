import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CategoryModule } from '../../core/types.js'

// Tools
import * as getFilters       from './tools/get-filters.js'
import * as getVouchers      from './tools/get-vouchers.js'
import * as getBalance       from './tools/get-balance.js'
import * as placeOrder       from './tools/place-order.js'
import * as bulkPlaceOrder   from './tools/bulk-place-order.js'
import * as getOrderDetails  from './tools/get-order-details.js'
import * as getOrderHistory  from './tools/get-order-history.js'
import * as getPaymentReport from './tools/get-payment-report.js'

// Prompts
import * as b2cStore          from './prompts/b2c-store.js'
import * as loyaltyPortal     from './prompts/loyalty-portal.js'
import * as corporateGifting  from './prompts/corporate-gifting.js'

const giftcard: CategoryModule = {
  name: 'giftcard',
  register(server: McpServer) {
    getFilters.register(server)
    getVouchers.register(server)
    getBalance.register(server)
    placeOrder.register(server)
    bulkPlaceOrder.register(server)
    getOrderDetails.register(server)
    getOrderHistory.register(server)
    getPaymentReport.register(server)

    b2cStore.register(server)
    loyaltyPortal.register(server)
    corporateGifting.register(server)

    console.error('[xoxoday] giftcard: 8 tools + 3 prompts registered')
  },
}

export default giftcard
