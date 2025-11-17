'use client'

import Link from 'next/link'
import Card from '@/components/Card'
import Button from '@/components/Button'
import type { Event } from '@/types'

interface EventDetailsProps {
  event: Event
}

export default function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-6">
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Guest List Management</h2>
          <p className="text-muted-foreground mb-4">
            To upload and manage guest list CSV files, please go to your{' '}
            <Link href="/profile" className="text-primary hover:underline">
              Profile page
            </Link>
            .
          </p>
          <Link href="/profile">
            <Button>Go to Profile</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

