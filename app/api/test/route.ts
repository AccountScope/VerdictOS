import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Test database connection
    const { data: testClient, error } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1)
      .single()
    
    return NextResponse.json({
      status: 'ok',
      body_received: body,
      db_test: error ? `Error: ${error.message}` : 'Connected',
      client_sample: testClient
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
