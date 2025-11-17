'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import type { Profile } from '@/types'

interface ProfileFormProps {
  initialData: Profile | null
  userId: string
}

export default function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.display_name || '')
      setOrganizationName(initialData.organization_name || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: displayName || null,
          organization_name: organizationName || null,
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={loading}
      />
      <Input
        label="Organization Name"
        value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)}
        disabled={loading}
      />

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500 text-green-500'
              : 'bg-danger/10 border border-danger text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}

