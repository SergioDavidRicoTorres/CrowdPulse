/**
 * OAuth state management helpers for CSRF protection
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const STATE_COOKIE_NAME = 'oauth_state'
const STATE_COOKIE_MAX_AGE = 600 // 10 minutes

/**
 * Generate and store a CSRF state token
 */
export async function generateAndStoreState(platform: string): Promise<string> {
  const state = randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  
  cookieStore.set(`${STATE_COOKIE_NAME}_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_COOKIE_MAX_AGE,
    path: '/',
  })

  return state
}

/**
 * Validate and consume a CSRF state token
 */
export async function validateAndConsumeState(
  platform: string,
  receivedState: string
): Promise<boolean> {
  const cookieStore = await cookies()
  const storedState = cookieStore.get(`${STATE_COOKIE_NAME}_${platform}`)?.value

  if (!storedState || storedState !== receivedState) {
    return false
  }

  // Consume the state by deleting the cookie
  cookieStore.delete(`${STATE_COOKIE_NAME}_${platform}`)

  return true
}

