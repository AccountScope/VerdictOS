// Rule Engine
// Supports equals, contains, greater_than, less_than operators
// Returns: ALLOW, BLOCK, REQUIRE_APPROVAL
import { db } from '@/lib/db'

export type RuleOperator = 'equals' | 'contains' | 'greater_than' | 'less_than'
export type RuleResult = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'

export class RuleEngine {
  static async evaluate(action: any, risk: string): Promise<RuleResult> {
    // Load rules for correct client
    let rules: any[] = []
    try {
      rules = await db.listRules(action.client_id)
    } catch (err) {
      console.error('[RuleEngine] Error loading rules for client', err)
    }
    // Evaluate each rule
    for (const rule of rules) {
      const def = rule.definition as {
        field: string
        operator: RuleOperator
        value: any
        result: RuleResult
      }
      let passed = false
      switch (def.operator) {
        case 'equals':
          passed = action[def.field] === def.value
          break
        case 'contains':
          passed = (action[def.field] || '').includes(def.value)
          break
        case 'greater_than':
          passed = action[def.field] > def.value
          break
        case 'less_than':
          passed = action[def.field] < def.value
          break
      }
      if (passed) return def.result
    }
    // Heuristic: high risk always requires approval
    if (risk === 'HIGH') return 'REQUIRE_APPROVAL'
    return 'ALLOW'
  }
}
