// Action Engine
// Processes actions, assigns risk, triggers rules, stores to DB
import { RuleEngine } from './rule-engine'
import { RiskEngine } from './risk-engine'
import { db } from '@/lib/db'

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH'
export type RuleResult = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'

export class ActionEngine {
  static async processAction(action: any): Promise<{ risk: RiskScore, rule: RuleResult, stored: any }> {
    let risk: RiskScore = 'LOW'
    let rule: RuleResult = 'ALLOW'
    let stored = null
    try {
      // Assign risk
      risk = await RiskEngine.score(action)
      // Evaluate rules
      rule = await RuleEngine.evaluate(action, risk)
      // Store action with risk & rule result
      stored = await db.insertAction({ ...action, risk_score: risk, rule_result: rule })
    } catch (err) {
      // Log errors
      console.error('[ActionEngine] Failed to process action:', err)
      throw err
    }
    return { risk, rule, stored }
  }
}
