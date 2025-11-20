'use client'

import Link from 'next/link'
import Button from '@/components/Button'
import Card from '@/components/Card'
import type { SocialAccount } from '@/types'

interface ConnectionsProps {
  tiktokAccount: SocialAccount | null
  instagramAccount: SocialAccount | null
}

export default function Connections({
  tiktokAccount,
  instagramAccount,
}: ConnectionsProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4 text-foreground">Connections</h2>
      <div className="space-y-4">
        {/* TikTok Connection */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-sm">TT</span>
            </div>
            <div>
              <p className="font-medium text-foreground">TikTok</p>
              {tiktokAccount ? (
                <p className="text-sm text-muted-foreground">
                  Connected as @{tiktokAccount.username || tiktokAccount.display_name || tiktokAccount.external_user_id}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected yet</p>
              )}
            </div>
          </div>
          {tiktokAccount ? (
            <Button variant="secondary" disabled>
              Connected
            </Button>
          ) : (
            <Link href="/auth/tiktok/start">
              <Button>Connect TikTok</Button>
            </Link>
          )}
        </div>

        {/* Instagram Connection */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">IG</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Instagram</p>
              {instagramAccount ? (
                <p className="text-sm text-muted-foreground">
                  Connected as @{instagramAccount.username || instagramAccount.display_name || instagramAccount.external_user_id}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected yet</p>
              )}
            </div>
          </div>
          {instagramAccount ? (
            <Button variant="secondary" disabled>
              Connected
            </Button>
          ) : (
            <Link href="/auth/instagram/start">
              <Button>Connect Instagram</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

