import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { buildTikTokAuthUrl } from '@/lib/tiktok'
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
    const state = await generateAndStoreState('tiktok')

    // Build TikTok OAuth URL
    const authUrl = buildTikTokAuthUrl(state)

    // Redirect to TikTok
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('TikTok OAuth start error:', error)
    return NextResponse.redirect(
      new URL('/profile?error=tiktok_auth_failed', request.url)
    )
  }
}

