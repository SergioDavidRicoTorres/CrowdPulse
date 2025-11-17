import { createServerClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth')
  }
  return user
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }
}

