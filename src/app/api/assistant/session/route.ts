import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const authenticated = !error && Boolean(user)

  return NextResponse.json(
    { authenticated },
    {
      status: authenticated ? 200 : 401,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}