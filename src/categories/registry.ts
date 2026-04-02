import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { config } from '../config.js'
import { CategoryModule } from '../core/types.js'

const ALL_CATEGORIES: Record<string, () => Promise<{ default: CategoryModule }>> = {
  'giftcard':    () => import('./giftcard/index.js'),
  'lounge':      () => import('./lounge/index.js'),
  'merchandise': () => import('./merchandise/index.js'),
  'charity':     () => import('./charity/index.js'),
  'mobile-topup':() => import('./mobile-topup/index.js'),
}

export async function registerCategories(server: McpServer): Promise<void> {
  for (const name of config.categories) {
    const loader = ALL_CATEGORIES[name]
    if (!loader) {
      console.error(`[xoxoday] Unknown category: "${name}" — skipping`)
      continue
    }
    const mod = await loader()
    mod.default.register(server)
  }
}
