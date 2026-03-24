import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Example Postgres pool export (if needed)
// import { Pool } from 'pg'
// export const pgPool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = {
  insertAction: async (data: any) => {
    const { data: action, error } = await supabase
      .from('actions')
      .insert({
        client_id: data.client_id,
        action_type: data.action_type,
        payload: data.payload,
        metadata: data.metadata || {},
        requested_by: data.requested_by,
        idempotency_key: data.idempotency_key,
        status: 'pending',
        risk_score: 'LOW', // TODO: Calculate risk
        requires_approval: false // TODO: Apply rules
      })
      .select()
      .single()

    if (error) throw error
    return action
  },

  setApproval: async (actionId: string, decision: string) => {
    const { data, error } = await supabase
      .from('actions')
      .update({ status: decision })
      .eq('id', actionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  listRules: async (clientId: string) => {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)

    if (error) throw error
    return data
  },

  createRule: async (data: any) => {
    const { data: rule, error } = await supabase
      .from('rules')
      .insert({
        client_id: data.client_id,
        name: data.name,
        definition: data.definition,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return rule
  }
}
