// Risk Scoring Engine
// Heuristics: volume (actions/hour), type sensitivity, metadata patterns
// Returns: LOW, MEDIUM, HIGH
export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH'

export class RiskEngine {
  static async score(action: any): Promise<RiskScore> {
    // Example heuristics
    let score: RiskScore = 'LOW'
    try {
      // Volume-based (stub, assumes userActionsLastHour supplied externally)
      if (action.userActionsLastHour && action.userActionsLastHour > 50) score = 'HIGH'
      // Type sensitivity
      if (['DELETE', 'TRANSFER'].includes(action.type)) score = 'HIGH'
      // Metadata pattern
      if (action.meta && action.meta.suspicious) score = 'MEDIUM'
      // Simple escalation
      if (score === 'LOW' && action.amount && action.amount > 5000) score = 'MEDIUM'
    } catch (err) {
      console.error('[RiskEngine] Risk scoring error', err)
      score = 'MEDIUM'
    }
    return score
  }
}
