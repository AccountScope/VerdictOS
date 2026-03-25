import { NextRequest, NextResponse } from 'next/server'
import { TokenManager } from '@/lib/tokens'
import { supabase } from '@/lib/db'

// TEST ONLY - Generate token for approval testing
export async function POST(req: NextRequest) {
  try {
    const { approval_id } = await req.json()
    
    if (!approval_id) {
      return NextResponse.json({ error: 'Missing approval_id' }, { status: 400 })
    }
    
    // Delete existing token (for testing)
    await supabase
      .from('approval_tokens')
      .delete()
      .eq('approval_id', approval_id)
    
    // Generate a fresh token
    const token = await TokenManager.createApprovalToken(approval_id, 1) // 1 hour expiry
    
    return NextResponse.json({
      success: true,
      approval_id,
      token,
      approve_url: `https://api.verdictos.tech/api/v1/approvals/${approval_id}/approve?token=${token}`,
      reject_url: `https://api.verdictos.tech/api/v1/approvals/${approval_id}/reject?token=${token}`
    })
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message 
    }, { status: 500 })
  }
}
