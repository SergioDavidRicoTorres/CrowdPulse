'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getEventKPIs } from '@/lib/analytics'
import Card from '@/components/Card'
import KPICard from '@/components/KPICard'
import DonutChart from '@/components/charts/DonutChart'
import Table, { TableRow, TableCell } from '@/components/Table'
import Input from '@/components/Input'
import type { Event, Guest } from '@/types'

interface EventDashboardProps {
  event: Event
  allEvents: Event[]
  allGuests: Guest[]
  eventGuests: Guest[]
}

export default function EventDashboard({
  event,
  allEvents,
  allGuests,
  eventGuests,
}: EventDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Compute event KPIs
  const kpis = getEventKPIs(event, allEvents, allGuests)

  // Prepare donut chart data
  const donutData = [
    { name: 'New', value: kpis.uniqueGuests - kpis.returningGuests },
    { name: 'Returning', value: kpis.returningGuests },
  ]

  // Filter and paginate guest list
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) {
      return eventGuests
    }

    const query = searchQuery.toLowerCase()
    return eventGuests.filter(
      (guest) =>
        (guest.name?.toLowerCase().includes(query) ||
          guest.first_name?.toLowerCase().includes(query) ||
          guest.last_name?.toLowerCase().includes(query) ||
          `${guest.first_name || ''} ${guest.last_name || ''}`.toLowerCase().includes(query) ||
          false) ||
        guest.email?.toLowerCase().includes(query) ||
        false
    )
  }, [eventGuests, searchQuery])

  // Sort guests by name
  const sortedGuests = useMemo(() => {
    return [...filteredGuests].sort((a, b) => {
      const nameA = a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || ''
      const nameB = b.name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || ''
      return nameA.localeCompare(nameB)
    })
  }, [filteredGuests])

  const totalPages = Math.ceil(sortedGuests.length / itemsPerPage)
  const paginatedGuests = sortedGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getGuestName = (guest: Guest) => {
    if (guest.name) return guest.name
    const firstName = guest.first_name || ''
    const lastName = guest.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Unknown'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Event Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-foreground">{event.title}</h1>
        <p className="text-muted-foreground mb-1">
          <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
        </p>
        <p className="text-muted-foreground mb-1">
          <strong>Venue:</strong> {event.venue}
        </p>
        {event.description && <p className="text-muted-foreground mt-4">{event.description}</p>}
      </div>

      {/* Row 1: Event-level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Total Guests" value={kpis.totalGuests} />
        <KPICard label="Unique Guests" value={kpis.uniqueGuests} />
        <KPICard
          label="Returning Guests"
          value={kpis.returningGuests}
          subtitle={`${kpis.returningPercentage}% of guests are returning`}
        />
      </div>

      {/* Row 2: Donut chart */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-foreground">New vs returning guests</h2>
        {kpis.totalGuests > 0 ? (
          <DonutChart data={donutData} total={kpis.totalGuests} />
        ) : (
          <p className="text-muted-foreground text-center py-8">No guest data available</p>
        )}
      </Card>

      {/* Row 3: Guest list table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 text-foreground">Guest list</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Imported {eventGuests.length} guest{eventGuests.length !== 1 ? 's' : ''} from CSV
          </p>
          <Input
            label="Search by name or email"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guests..."
            className="max-w-md"
          />
        </div>

        {paginatedGuests.length > 0 ? (
          <>
            <Table headers={['Name', 'Email', 'Phone']}>
              {paginatedGuests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>{getGuestName(guest)}</TableCell>
                  <TableCell>{guest.email || '-'}</TableCell>
                  <TableCell>{guest.phone_number || '-'}</TableCell>
                </TableRow>
              ))}
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, sortedGuests.length)} of {sortedGuests.length} guests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchQuery ? 'No guests found matching your search' : 'No guests yet'}
          </p>
        )}
      </Card>
    </div>
  )
}

