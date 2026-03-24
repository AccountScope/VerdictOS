// Rule Engine - Actual Rule Evaluation
import { db } from '@/lib/db'

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH'

export interface RuleEvaluation {
  decision: 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'
  reason: string
  triggered_rules: string[]
}

export class RuleEngine {
  static async evaluate(action: any, risk: RiskScore): Promise<RuleEvaluation> {
    try {
      // Fetch active rules for this client
      const rules = await db.listRules(action.client_id)
      
      const triggered: string[] = []
      let finalDecision: 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL' = 'ALLOW'
      let reason = 'No rules triggered'
      
      // Evaluate each rule
      for (const rule of rules) {
        const definition = rule.definition
        const conditions = definition.conditions || []
        
        // Check if all conditions match
        let allMatch = true
        for (const condition of conditions) {
          const field = condition.field
          const operator = condition.operator
          const value = condition.value
          
          const actualValue = this.getFieldValue(action, field)
          
          if (!this.evaluateCondition(actualValue, operator, value)) {
            allMatch = false
            break
          }
        }
        
        // If rule matches, apply action
        if (allMatch) {
          triggered.push(rule.name)
          const ruleAction = definition.action || 'allow'
          
          if (ruleAction === 'block') {
            finalDecision = 'BLOCK'
            reason = `Blocked by rule: ${rule.name}`
            break // Block immediately
          } else if (ruleAction === 'require_approval') {
            finalDecision = 'REQUIRE_APPROVAL'
            reason = `Approval required by rule: ${rule.name}`
          }
        }
      }
      
      // Default: high-risk actions require approval
      if (risk === 'HIGH' && finalDecision === 'ALLOW') {
        finalDecision = 'REQUIRE_APPROVAL'
        reason = 'High-risk action requires approval'
        triggered.push('default-high-risk-policy')
      }
      
      return {
        decision: finalDecision,
        reason,
        triggered_rules: triggered
      }
    } catch (err) {
      console.error('[RuleEngine] Evaluation failed:', err)
      return {
        decision: 'BLOCK',
        reason: 'Rule evaluation error - defaulting to block',
        triggered_rules: []
      }
    }
  }
  
  private static getFieldValue(obj: any, path: string): any {
    const parts = path.split('.')
    let value = obj
    for (const part of parts) {
      value = value?.[part]
    }
    return value
  }
  
  private static evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected
      case 'contains':
        return String(actual).includes(String(expected))
      case 'greater_than':
        return Number(actual) > Number(expected)
      case 'less_than':
        return Number(actual) < Number(expected)
      case 'not_equals':
        return actual !== expected
      default:
        return false
    }
  }
}
