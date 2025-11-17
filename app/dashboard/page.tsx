import { createServerClient } from '@/lib/supabase/server'
import DashboardContent from './DashboardContent'
import Card from '@/components/Card'
import type { Event, Guest } from '@/types'

async function getEvents(userId: string): Promise<Event[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data || []
}

async function getGuests(userId: string): Promise<Guest[]> {
  const supabase = await createServerClient()
  
  // First get all event IDs for this user
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('user_id', userId)

  if (eventsError || !events || events.length === 0) {
    return []
  }

  const eventIds = events.map((e) => e.id)

  // Then get all guests for those events
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .in('event_id', eventIds)

  if (error) {
    console.error('Error fetching guests:', error)
    return []
  }

  return data || []
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [events, guests] = await Promise.all([getEvents(user.id), getGuests(user.id)])

  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card>
          <p className="text-muted-foreground text-center py-8">
            No events yet. Create your first event to get started!
          </p>
        </Card>
      </div>
    )
  }

  return <DashboardContent events={events} guests={guests} />
}

