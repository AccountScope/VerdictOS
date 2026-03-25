// Action Engine - Real Execution Control
import { RuleEngine } from './rule-engine'
import { RiskEngine } from './risk-engine'
import { db } from '@/lib/db'
import { AuditLogger } from '@/lib/audit'
import { TokenManager } from '@/lib/tokens'

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type Decision = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL'

export interface ActionResult {
  action_id: string
  allowed: boolean
  decision: Decision
  risk_score: RiskScore
  numeric_score: number
  reason: string
  triggered_rules: string[]
  requires_approval: boolean
  explanation?: string
}

export class ActionEngine {
  private static generateExplanation(risk: RiskScore, riskResult: any, ruleResult: any): string {
    const allRules = [...riskResult.triggeredRules, ...ruleResult.triggered_rules]
    
    if (allRules.length === 0) {
      return 'This action meets all safety requirements and can proceed without approval.'
    }
    
    const ruleDescriptions = allRules.map(rule => {
      // Convert rule IDs to human-readable descriptions
      if (rule.includes('large_transaction')) return 'high-value transaction threshold exceeded'
      if (rule.includes('new_recipient') || rule.includes('new_payee')) return 'payment to new vendor/recipient'
      if (rule.includes('geographic_risk') || rule.includes('sanctions')) return 'high-risk geographic destination'
      if (rule.includes('controlled_substance') || rule.includes('controlled_drug')) return 'controlled substance prescription'
      if (rule.includes('conflict')) return 'potential conflict of interest detected'
      if (rule.includes('privilege')) return 'legally privileged information involved'
      return rule
    })
    
    const uniqueReasons = [...new Set(ruleDescriptions)]
    
    if (risk === 'CRITICAL') {
      return `🚨 Critical risk detected (${riskResult.numericScore}/100): ${uniqueReasons.join(', ')}. This action requires multi-level approval before execution.`
    } else if (risk === 'HIGH') {
      return `⚠️ High risk detected (${riskResult.numericScore}/100): ${uniqueReasons.join(', ')}. Management approval recommended before proceeding.`
    } else if (risk === 'MEDIUM') {
      return `⚡ Medium risk detected (${riskResult.numericScore}/100): ${uniqueReasons.join(', ')}. Review and approval required.`
    } else {
      return `✅ Low risk (${riskResult.numericScore}/100): This action appears safe and can proceed.`
    }
  }

  static async processAction(data: any, clientIndustry?: string, clientRegion?: string): Promise<ActionResult> {
    try {
      // 1. Calculate risk score (with industry + region if provided)
      const riskResult = await RiskEngine.score(data, clientIndustry, clientRegion)
      const risk = riskResult.score
      
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
          triggered_rules: ruleResult.triggered_rules,
          numeric_score: riskResult.numericScore
        }
      })

      // Log action creation to audit trail
      await AuditLogger.logActionCreated(data.client_id, storedAction.id, {
        action_type: data.action_type,
        risk_score: risk,
        decision,
        requested_by: data.requested_by
      })

      // Log decision-specific events
      if (decision === 'ALLOW') {
        await AuditLogger.logActionAllowed(data.client_id, storedAction.id)
      } else if (decision === 'BLOCK') {
        await AuditLogger.logActionBlocked(data.client_id, storedAction.id, reason)
      }
      
      // 5. If requires approval, create approval record and send email
      if (requires_approval) {
        const approval = await db.createApproval({
          action_id: storedAction.id,
          client_id: data.client_id,
          requires_all_steps: true
        })

        const approverEmail = data.approver_email || process.env.DEFAULT_APPROVER_EMAIL
        
        if (!approverEmail) {
          throw new Error('No approver email configured. Set approver_email in action or DEFAULT_APPROVER_EMAIL env variable.')
        }
        
        // Generate secure approval token
        const approvalToken = await TokenManager.createApprovalToken(approval.id, 72) // 72 hour expiry
        
        // Log approval request to audit trail
        await AuditLogger.logApprovalRequested(data.client_id, storedAction.id, approval.id, approverEmail)
        
        // Send approval email with secure token
        try {
          const { sendApprovalEmail } = await import('@/lib/email')
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.verdictos.tech'
          
          await sendApprovalEmail({
            to: approverEmail,
            actionId: storedAction.id,
            actionType: data.action_type,
            riskScore: risk,
            reason,
            approveUrl: `${baseUrl}/api/v1/approvals/${approval.id}/approve?token=${approvalToken}`,
            rejectUrl: `${baseUrl}/api/v1/approvals/${approval.id}/reject?token=${approvalToken}`,
            payload: data.payload
          })
        } catch (emailErr) {
          console.error('[ActionEngine] Failed to send approval email:', emailErr)
          throw new Error('Failed to send approval email. Please check email configuration.')
        }
      }
      
      return {
        action_id: storedAction.id,
        allowed,
        decision,
        risk_score: risk,
        numeric_score: riskResult.numericScore,
        reason,
        triggered_rules: [...ruleResult.triggered_rules, ...riskResult.triggeredRules],
        requires_approval,
        explanation: this.generateExplanation(risk, riskResult, ruleResult)
      }
    } catch (err) {
      console.error('[ActionEngine] Failed to process action:', err)
      throw new Error('Action processing failed')
    }
  }
}
