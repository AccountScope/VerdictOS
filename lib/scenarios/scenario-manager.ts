// Scenario Manager - Handle multiple pre-defined scenarios
import { supabase } from '../db'

export interface ActionScenario {
  id: string
  name: string
  description: string
  industry: string
  pattern: {
    action_type: string
    conditions: Array<{
      field: string
      operator: string
      value: any
    }>
  }
  auto_approve: boolean
  approval_rules?: {
    required_approvers: string[]
    approval_chain?: string[]
    timeout_hours?: number
    escalation?: {
      after_hours: number
      escalate_to: string[]
    }
  }
}

export class ScenarioManager {
  // Built-in scenario templates
  static readonly DEFAULT_SCENARIOS: Record<string, ActionScenario[]> = {
    fintech: [
      {
        id: 'fintech.regular_payroll',
        name: 'Regular Payroll',
        description: 'Recurring payroll payments to known employees',
        industry: 'fintech',
        pattern: {
          action_type: 'send_payment',
          conditions: [
            { field: 'payload.category', operator: 'equals', value: 'payroll' },
            { field: 'payload.is_recurring', operator: 'equals', value: true }
          ]
        },
        auto_approve: true
      },
      {
        id: 'fintech.large_vendor_payment',
        name: 'Large Vendor Payment',
        description: 'High-value payments to established vendors',
        industry: 'fintech',
        pattern: {
          action_type: 'send_payment',
          conditions: [
            { field: 'payload.amount', operator: 'greater_than', value: 50000 },
            { field: 'payload.vendor_history', operator: 'equals', value: 'established' }
          ]
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['cfo'],
          timeout_hours: 24,
          escalation: {
            after_hours: 4,
            escalate_to: ['ceo']
          }
        }
      },
      {
        id: 'fintech.new_vendor_setup',
        name: 'New Vendor Setup',
        description: 'Adding new vendor to payment system',
        industry: 'fintech',
        pattern: {
          action_type: 'create_vendor',
          conditions: []
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['finance_manager', 'compliance_officer'],
          approval_chain: ['finance_manager', 'cfo'],
          timeout_hours: 48
        }
      },
      {
        id: 'fintech.wire_transfer',
        name: 'Wire Transfer',
        description: 'International wire transfers',
        industry: 'fintech',
        pattern: {
          action_type: 'wire_transfer',
          conditions: []
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['cfo', 'ceo'],
          approval_chain: ['finance_manager', 'cfo', 'ceo'],
          timeout_hours: 12
        }
      }
    ],
    healthcare: [
      {
        id: 'healthcare.routine_prescription',
        name: 'Routine Prescription',
        description: 'Standard prescriptions for known conditions',
        industry: 'healthcare',
        pattern: {
          action_type: 'prescribe_medication',
          conditions: [
            { field: 'payload.medication_class', operator: 'equals', value: 'routine' },
            { field: 'payload.patient_history', operator: 'equals', value: 'existing' }
          ]
        },
        auto_approve: true
      },
      {
        id: 'healthcare.controlled_substance',
        name: 'Controlled Substance',
        description: 'Prescriptions for controlled substances',
        industry: 'healthcare',
        pattern: {
          action_type: 'prescribe_medication',
          conditions: [
            { field: 'payload.controlled_substance', operator: 'equals', value: true }
          ]
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['supervising_physician', 'pharmacy_manager'],
          timeout_hours: 2
        }
      },
      {
        id: 'healthcare.patient_data_access',
        name: 'Patient Data Access',
        description: 'Access to protected health information',
        industry: 'healthcare',
        pattern: {
          action_type: 'access_patient_records',
          conditions: []
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['privacy_officer'],
          timeout_hours: 1
        }
      }
    ],
    legal: [
      {
        id: 'legal.standard_document_review',
        name: 'Standard Document Review',
        description: 'Review of non-privileged documents',
        industry: 'legal',
        pattern: {
          action_type: 'review_document',
          conditions: [
            { field: 'payload.privileged', operator: 'equals', value: false }
          ]
        },
        auto_approve: true
      },
      {
        id: 'legal.court_filing',
        name: 'Court Filing',
        description: 'Filing documents with court',
        industry: 'legal',
        pattern: {
          action_type: 'file_court_document',
          conditions: []
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['senior_partner'],
          approval_chain: ['associate', 'senior_partner'],
          timeout_hours: 12
        }
      },
      {
        id: 'legal.conflict_check',
        name: 'Conflict of Interest Check',
        description: 'New client conflict check',
        industry: 'legal',
        pattern: {
          action_type: 'onboard_client',
          conditions: []
        },
        auto_approve: false,
        approval_rules: {
          required_approvers: ['conflicts_officer', 'managing_partner'],
          timeout_hours: 24
        }
      }
    ]
  }

  // Match action against scenarios
  static async matchScenario(action: any, clientIndustry: string): Promise<ActionScenario | null> {
    const scenarios = this.DEFAULT_SCENARIOS[clientIndustry] || []
    
    for (const scenario of scenarios) {
      // Check if action_type matches
      if (action.action_type !== scenario.pattern.action_type) {
        continue
      }
      
      // Check if all conditions match
      let allMatch = true
      for (const condition of scenario.pattern.conditions) {
        const fieldValue = this.getNestedField(action, condition.field)
        
        if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
          allMatch = false
          break
        }
      }
      
      if (allMatch) {
        return scenario
      }
    }
    
    return null
  }

  // Get nested field value
  private static getNestedField(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Evaluate condition
  private static evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected
      case 'not_equals':
        return actual !== expected
      case 'greater_than':
        return Number(actual) > Number(expected)
      case 'less_than':
        return Number(actual) < Number(expected)
      case 'contains':
        return String(actual).includes(String(expected))
      case 'in':
        return Array.isArray(expected) && expected.includes(actual)
      default:
        return false
    }
  }

  // Get all scenarios for an industry
  static getScenarios(industry: string): ActionScenario[] {
    return this.DEFAULT_SCENARIOS[industry] || []
  }

  // Save custom scenario for client
  static async saveCustomScenario(clientId: string, scenario: ActionScenario): Promise<void> {
    const { error } = await supabase
      .from('action_scenarios')
      .insert({
        client_id: clientId,
        scenario_id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        pattern: scenario.pattern,
        auto_approve: scenario.auto_approve,
        approval_rules: scenario.approval_rules || {}
      })

    if (error) {
      throw new Error(`Failed to save scenario: ${error.message}`)
    }
  }

  // Load client custom scenarios
  static async loadCustomScenarios(clientId: string): Promise<ActionScenario[]> {
    const { data, error } = await supabase
      .from('action_scenarios')
      .select('*')
      .eq('client_id', clientId)

    if (error) {
      console.error('Failed to load custom scenarios:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.scenario_id,
      name: row.name,
      description: row.description,
      industry: row.industry || 'custom',
      pattern: row.pattern,
      auto_approve: row.auto_approve,
      approval_rules: row.approval_rules
    }))
  }
}
