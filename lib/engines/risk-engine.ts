// Risk Engine - Real Risk Scoring
export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH'

export class RiskEngine {
  static async score(action: any): Promise<RiskScore> {
    let score = 0
    
    // 1. Check action type
    const highRiskTypes = ['delete', 'transfer_funds', 'send_payment', 'grant_access', 'delete_user']
    const actionType = String(action.action_type || '').toLowerCase()
    
    if (highRiskTypes.some(type => actionType.includes(type))) {
      score += 40
    }
    
    // 2. Check payload for high-value transactions
    const amount = action.payload?.amount || action.payload?.value || 0
    if (amount > 10000) {
      score += 30
    } else if (amount > 1000) {
      score += 15
    }
    
    // 3. Check for sensitive data
    const payload = JSON.stringify(action.payload || {}).toLowerCase()
    const sensitiveKeywords = ['password', 'ssn', 'credit_card', 'api_key', 'secret']
    
    if (sensitiveKeywords.some(kw => payload.includes(kw))) {
      score += 20
    }
    
    // 4. Check metadata for external actions
    if (action.metadata?.external === true || action.metadata?.public === true) {
      score += 15
    }
    
    // 5. Determine risk level
    if (score >= 50) {
      return 'HIGH'
    } else if (score >= 25) {
      return 'MEDIUM'
    } else {
      return 'LOW'
    }
  }
}
