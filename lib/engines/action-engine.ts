// Action Engine - Real Execution Control
import { RuleEngine } from './rule-engine'
import { RiskEngine } from './risk-engine'
import { db } from '@/lib/db'

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH'
export type Decision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'

export interface ActionResult {
  action_id: string
  allowed: boolean
  decision: Decision
  risk_score: RiskScore
  reason: string
  triggered_rules: string[]
  requires_approval: boolean
}

export class ActionEngine {
  static async processAction(data: any): Promise<ActionResult> {
    try {
      // 1. Calculate risk score
      const risk = await RiskEngine.score(data)
      
      // 2. Evaluate rules
      const ruleResult = await RuleEngine.evaluate(data, risk)
      
      // 3. Determine decision
      let decision: Decision = 'ALLOW'
      let allowed = true
      let reason = 'Action allowed'
      let requires_approval = false
      
      if (ruleResult.decision === 'BLOCK') {
        decision = 'BLOCK'
        allowed = false
        reason = ruleResult.reason || 'Action blocked by policy'
      } else if (ruleResult.decision === 'REQUIRE_APPROVAL') {
        decision = 'REQUIRE_APPROVAL'
        allowed = false // Cannot execute until approved
        requires_approval = true
        reason = ruleResult.reason || 'Action requires approval'
      } else {
        decision = 'ALLOW'
        allowed = true
        reason = 'Action meets all policy requirements'
      }
      
      // 4. Store action with decision
      const storedAction = await db.insertAction({
        ...data,
        risk_score: risk,
        status: allowed ? 'allowed' : (requires_approval ? 'pending_approval' : 'blocked'),
        requires_approval,
        metadata: {
          ...data.metadata,
          decision,
          reason,
          triggered_rules: ruleResult.triggered_rules
        }
      })
      
      // 5. If requires approval, create approval record
      if (requires_approval) {
        await db.createApproval({
          action_id: storedAction.id,
          client_id: data.client_id,
          requires_all_steps: true
        })
      }
      
      return {
        action_id: storedAction.id,
        allowed,
        decision,
        risk_score: risk,
        reason,
        triggered_rules: ruleResult.triggered_rules,
        requires_approval
      }
    } catch (err) {
      console.error('[ActionEngine] Failed to process action:', err)
      throw new Error('Action processing failed')
    }
  }
}
