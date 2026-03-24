import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { db } from '@/lib/db'

// Example CRUD skeleton

export const GET = requireApiKey(async (req: NextRequest) => {
  const clientId = (req as any).clientId
  const rules = await db.listRules(clientId)
  return NextResponse.json({ success: true, data: rules })
})

export const POST = requireApiKey(async (req: NextRequest) => {
  const clientId = (req as any).clientId
  const body = await req.json()
  const rule = await db.createRule({ ...body, client_id: clientId })
  return NextResponse.json({ success: true, data: rule }, { status: 201 })
})

// add PUT/PATCH/DELETE as needed
