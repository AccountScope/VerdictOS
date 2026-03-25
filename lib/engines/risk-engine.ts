// Risk Engine - Industry-Specific Risk Scoring
import fs from 'fs'
import path from 'path'

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface RiskModel {
  industry: string
  rules: Array<{
    id: string
    name: string
    condition: {
      field: string
      operator: string
      value: any
    }
    risk_level: RiskScore
    action: string
    approvers?: string[]
  }>
  scoring: Record<RiskScore, { range: number[], action: string }>
}

export class RiskEngine {
  private static models: Map<string, RiskModel> = new Map()

  // Load industry risk model
  static async loadModel(industry: string): Promise<RiskModel | null> {
    if (this.models.has(industry)) {
      return this.models.get(industry)!
    }

    try {
      const modelPath = path.join(process.cwd(), 'lib', 'risk-models', `${industry}.json`)
      const modelData = fs.readFileSync(modelPath, 'utf-8')
      const model: RiskModel = JSON.parse(modelData)
      this.models.set(industry, model)
      return model
    } catch (error) {
      console.warn(`No risk model found for industry: ${industry}`)
      return null
    }
  }

  // Evaluate a single rule condition
  static evaluateCondition(action: any, condition: any): boolean {
    const { field, operator, value } = condition
    const fieldValue = this.getNestedField(action, field)

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'greater_than':
        return Number(fieldValue) > Number(value)
      case 'less_than':
        return Number(fieldValue) < Number(value)
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'in_client_list':
        // Special case for conflict checks
        const clientList = this.getNestedField(action, value)
        return Array.isArray(clientList) && clientList.includes(fieldValue)
      default:
        return false
    }
  }

  // Get nested field from object (e.g., "payload.amount")
  static getNestedField(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Main scoring function with industry support
  static async score(action: any, industry?: string): Promise<{ score: RiskScore, triggeredRules: string[], numericScore: number }> {
    let numericScore = 0
    const triggeredRules: string[] = []

    // If industry provided, use industry-specific model
    if (industry) {
      const model = await this.loadModel(industry)
      if (model) {
        for (const rule of model.rules) {
          if (this.evaluateCondition(action, rule.condition)) {
            triggeredRules.push(rule.id)
            
            // Add score based on risk level
            switch (rule.risk_level) {
              case 'CRITICAL':
                numericScore += 40
                break
              case 'HIGH':
                numericScore += 30
                break
              case 'MEDIUM':
                numericScore += 20
                break
              case 'LOW':
                numericScore += 10
                break
            }
          }
        }

        // Determine final risk score based on model scoring ranges
        numericScore = Math.min(numericScore, 100) // Cap at 100
        
        if (numericScore >= model.scoring.CRITICAL.range[0]) {
          return { score: 'CRITICAL', triggeredRules, numericScore }
        } else if (numericScore >= model.scoring.HIGH.range[0]) {
          return { score: 'HIGH', triggeredRules, numericScore }
        } else if (numericScore >= model.scoring.MEDIUM.range[0]) {
          return { score: 'MEDIUM', triggeredRules, numericScore }
        } else {
          return { score: 'LOW', triggeredRules, numericScore }
        }
      }
    }

    // Fallback to generic scoring if no industry model
    const highRiskTypes = ['delete', 'transfer_funds', 'send_payment', 'grant_access', 'delete_user']
    const actionType = String(action.action_type || '').toLowerCase()
    
    if (highRiskTypes.some(type => actionType.includes(type))) {
      numericScore += 40
    }
    
    const amount = action.payload?.amount || action.payload?.value || 0
    if (amount > 10000) {
      numericScore += 30
    } else if (amount > 1000) {
      numericScore += 15
    }
    
    const payload = JSON.stringify(action.payload || {}).toLowerCase()
    const sensitiveKeywords = ['password', 'ssn', 'credit_card', 'api_key', 'secret']
    
    if (sensitiveKeywords.some(kw => payload.includes(kw))) {
      numericScore += 20
    }
    
    if (action.metadata?.external === true || action.metadata?.public === true) {
      numericScore += 15
    }
    
    // Determine risk level (generic)
    if (numericScore >= 70) {
      return { score: 'HIGH', triggeredRules, numericScore }
    } else if (numericScore >= 40) {
      return { score: 'MEDIUM', triggeredRules, numericScore }
    } else {
      return { score: 'LOW', triggeredRules, numericScore }
    }
  }
}
