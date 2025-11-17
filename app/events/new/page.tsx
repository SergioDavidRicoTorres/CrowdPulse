'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'

export default function NewEventPage() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create an event')
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title,
          date,
          venue,
          description: description || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/events/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Create New Event</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            disabled={loading}
          />
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger text-danger text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

