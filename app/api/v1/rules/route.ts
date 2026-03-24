import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/auth'
import { db } from '@/lib/db'

// Example CRUD skeleton

export const GET = requireApiKey(async () => {
  const rules = await db.listRules()
  return NextResponse.json(rules)
})

export const POST = requireApiKey(async (req: NextRequest) => {
  const data = await req.json()
  const rule = await db.createRule(data)
  return NextResponse.json(rule, { status: 201 })
})

// add PUT/PATCH/DELETE as needed
