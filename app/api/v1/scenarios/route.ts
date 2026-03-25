import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { ScenarioManager } from '@/lib/scenarios/scenario-manager'
import { supabase } from '@/lib/db'

// GET /api/v1/scenarios - List all scenarios (built-in + custom)
export const GET = requireApiKey(async (req: NextRequest) => {
  try {
    const clientId = (req as any).clientId
    
    // Get client industry
    const { data: client } = await supabase
      .from('clients')
      .select('industry')
      .eq('id', clientId)
      .single()
    
    const industry = client?.industry || 'fintech'
    
    // Get built-in scenarios
    const builtIn = ScenarioManager.getScenarios(industry)
    
    // Get custom scenarios
    const custom = await ScenarioManager.loadCustomScenarios(clientId)
    
    return NextResponse.json({
      success: true,
      data: {
        built_in: builtIn,
        custom: custom,
        total: builtIn.length + custom.length
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})

// POST /api/v1/scenarios - Create custom scenario
export const POST = requireApiKey(async (req: NextRequest) => {
  try {
    const clientId = (req as any).clientId
    const body = await req.json()
    
    // Validate required fields
    if (!body.scenario_id || !body.name || !body.pattern) {
      return NextResponse.json({ 
        error: 'Missing required fields: scenario_id, name, pattern' 
      }, { status: 400 })
    }
    
    // Create scenario object
    const scenario = {
      id: body.scenario_id,
      name: body.name,
      description: body.description || '',
      industry: body.industry || 'custom',
      pattern: body.pattern,
      auto_approve: body.auto_approve || false,
      approval_rules: body.approval_rules || {}
    }
    
    // Save to database
    await ScenarioManager.saveCustomScenario(clientId, scenario)
    
    return NextResponse.json({
      success: true,
      data: scenario
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
})
