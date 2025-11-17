import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import EventDetails from './EventDetails'
import EventDashboard from './EventDashboard'
import Card from '@/components/Card'
import type { Event, Guest } from '@/types'

async function getEvent(eventId: string, userId: string): Promise<Event | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  return data
}

async function getAllEvents(userId: string): Promise<Event[]> {
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

async function getAllGuests(userId: string): Promise<Guest[]> {
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

async function getEventGuests(eventId: string): Promise<Guest[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event guests:', error)
    return []
  }

  return data || []
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [event, allEvents, allGuests, eventGuests] = await Promise.all([
    getEvent(params.id, user.id),
    getAllEvents(user.id),
    getAllGuests(user.id),
    getEventGuests(params.id),
  ])

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <p className="text-muted-foreground">Event not found</p>
        </Card>
      </div>
    )
  }

  return (
    <>
      <EventDetails event={event} />
      <EventDashboard
        event={event}
        allEvents={allEvents}
        allGuests={allGuests}
        eventGuests={eventGuests}
      />
    </>
  )
}

