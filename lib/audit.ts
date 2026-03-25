import { supabase } from './db'

export interface AuditEventData {
  client_id: string
  action_id?: string
  approval_id?: string
  event_type: string
  event_data?: Record<string, any>
  actor?: string
  ip_address?: string
  user_agent?: string
}

export class AuditLogger {
  static async log(data: AuditEventData): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_events')
        .insert({
          client_id: data.client_id,
          action_id: data.action_id || null,
          approval_id: data.approval_id || null,
          event_type: data.event_type,
          event_data: data.event_data || {},
          actor: data.actor || 'system',
          ip_address: data.ip_address || null,
          user_agent: data.user_agent || null
        })

      if (error) {
        console.error('[AuditLogger] Failed to log event:', error)
        // Don't throw - audit failures shouldn't break the main flow
      }
    } catch (err) {
      console.error('[AuditLogger] Exception logging audit event:', err)
    }
  }

  // Convenience methods for common events
  static async logActionCreated(clientId: string, actionId: string, data: any) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      event_type: 'action.created',
      event_data: {
        action_type: data.action_type,
        risk_score: data.risk_score,
        decision: data.decision
      },
      actor: data.requested_by
    })
  }

  static async logActionAllowed(clientId: string, actionId: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      event_type: 'action.allowed',
      event_data: {}
    })
  }

  static async logActionBlocked(clientId: string, actionId: string, reason: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      event_type: 'action.blocked',
      event_data: { reason }
    })
  }

  static async logApprovalRequested(clientId: string, actionId: string, approvalId: string, approverEmail: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      approval_id: approvalId,
      event_type: 'approval.requested',
      event_data: { approver_email: approverEmail }
    })
  }

  static async logApprovalApproved(clientId: string, actionId: string, approvalId: string, approver: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      approval_id: approvalId,
      event_type: 'approval.approved',
      event_data: {},
      actor: approver
    })
  }

  static async logApprovalRejected(clientId: string, actionId: string, approvalId: string, approver: string, reason?: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      approval_id: approvalId,
      event_type: 'approval.rejected',
      event_data: { reason: reason || 'No reason provided' },
      actor: approver
    })
  }

  static async logActionExecuted(clientId: string, actionId: string) {
    await this.log({
      client_id: clientId,
      action_id: actionId,
      event_type: 'action.executed',
      event_data: {}
    })
  }
}
