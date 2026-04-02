import { CategoryModule } from '../../core/types.js'

// TODO: Implement mobile top-up tools
// Expected tools: topup_get_operators, topup_get_plans, topup_recharge
const mobileTopup: CategoryModule = {
  name: 'mobile-topup',
  register() {
    console.error('[xoxoday] mobile-topup: coming soon — tools not yet implemented')
  },
}

export default mobileTopup
