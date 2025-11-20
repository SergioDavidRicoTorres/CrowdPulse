import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import GuestListFiles from './GuestListFiles'
import Connections from './Connections'
import Card from '@/components/Card'
import type { SocialAccount } from '@/types'

async function getProfile(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
  }

  return data
}

async function getSocialAccounts(userId: string): Promise<{
  tiktokAccount: SocialAccount | null
  instagramAccount: SocialAccount | null
}> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .in('platform', ['tiktok', 'instagram'])

  if (error) {
    console.error('Error fetching social accounts:', error)
    return { tiktokAccount: null, instagramAccount: null }
  }

  const tiktokAccount =
    data?.find((account) => account.platform === 'tiktok') || null
  const instagramAccount =
    data?.find((account) => account.platform === 'instagram') || null

  return { tiktokAccount, instagramAccount }
}

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [profile, socialAccounts] = await Promise.all([
    getProfile(user.id),
    getSocialAccounts(user.id),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Profile</h1>
      
      <div className="space-y-6">
        {/* Profile Information Section */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Profile Information</h2>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="text-foreground">{user.email}</p>
          </div>
          <ProfileForm initialData={profile} userId={user.id} />
        </Card>

        {/* Connections Section */}
        <Connections
          tiktokAccount={socialAccounts.tiktokAccount}
          instagramAccount={socialAccounts.instagramAccount}
        />

        {/* Events Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Events</h2>
          <GuestListFiles userId={user.id} />
        </div>
      </div>
    </div>
  )
}

