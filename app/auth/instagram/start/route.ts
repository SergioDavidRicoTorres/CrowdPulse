import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { buildInstagramAuthUrl } from '@/lib/instagram'
import { generateAndStoreState } from '@/lib/oauth-state'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Generate and store CSRF state
    const state = await generateAndStoreState('instagram')

    // Build Instagram (Facebook) OAuth URL
    const authUrl = buildInstagramAuthUrl(state)

    // Redirect to Facebook Login
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Instagram OAuth start error:', error)
    return NextResponse.redirect(
      new URL('/profile?error=instagram_auth_failed', request.url)
    )
  }
}

