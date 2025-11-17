'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Card from '@/components/Card'
import Button from '@/components/Button'
import KPICard from '@/components/KPICard'
import BarChart from '@/components/charts/BarChart'
import StackedBarChart from '@/components/charts/StackedBarChart'
import Table, { TableRow, TableCell } from '@/components/Table'
import Input from '@/components/Input'
import {
  getDashboardKPIs,
  computeEventGuestCounts,
  computeNewVsReturning,
  computeLoyaltyBuckets,
  computeTopRepeatGuests,
  type TopRepeatGuest,
} from '@/lib/analytics'
import type { Event, Guest } from '@/types'

interface DashboardContentProps {
  events: Event[]
  guests: Guest[]
}

export default function DashboardContent({ events, guests }: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Compute all analytics
  const kpis = getDashboardKPIs(events, guests)
  const eventGuestCounts = computeEventGuestCounts(events, guests)
  const newVsReturning = computeNewVsReturning(events, guests)
  const loyaltyBuckets = computeLoyaltyBuckets(events, guests)
  const topRepeatGuests = computeTopRepeatGuests(events, guests)

  // Filter top repeat guests by search query
  const filteredTopGuests = useMemo(() => {
    if (!searchQuery.trim()) {
      return topRepeatGuests.slice(0, 50)
    }

    const query = searchQuery.toLowerCase()
    return topRepeatGuests
      .filter(
        (guest) =>
          guest.identity.name.toLowerCase().includes(query) ||
          guest.identity.email?.toLowerCase().includes(query) ||
          false
      )
      .slice(0, 50)
  }, [topRepeatGuests, searchQuery])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <Link href="/events/new">
          <Button>Create event</Button>
        </Link>
      </div>

      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total Unique Guests" value={kpis.totalUniqueGuests} />
        <KPICard label="Total Events" value={kpis.totalEvents} />
        <KPICard label="Average Guests per Event" value={kpis.averageGuestsPerEvent} />
        <KPICard
          label="Max Guests at a Single Event"
          value={kpis.maxGuestsAtSingleEvent.count}
          subtitle={kpis.maxGuestsAtSingleEvent.eventTitle || undefined}
        />
      </div>

      {/* Section 2 & 3: Charts in 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Section 2: Guests per event over time */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Guests per event</h2>
          {eventGuestCounts.length > 0 ? (
            <BarChart
              data={eventGuestCounts.map((item) => ({
                label: item.label,
                value: item.guestCount,
              }))}
              dataKey="value"
              tooltipLabel="Guests"
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">No event data available</p>
          )}
        </Card>

        {/* Section 3: New vs returning guests per event */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-foreground">New vs returning guests per event</h2>
          {newVsReturning.length > 0 ? (
            <StackedBarChart
              data={newVsReturning.map((item) => ({
                label: item.label,
                newGuests: item.newGuests,
                returningGuests: item.returningGuests,
              }))}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">No event data available</p>
          )}
        </Card>
      </div>

      {/* Section 4: Guest loyalty distribution */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Guest loyalty distribution</h2>
        {loyaltyBuckets.length > 0 ? (
          <BarChart
            data={loyaltyBuckets.map((item) => ({
              label: item.bucket,
              value: item.count,
            }))}
            dataKey="value"
            tooltipLabel="Guests"
            showValueLabels={true}
          />
        ) : (
          <p className="text-muted-foreground text-center py-8">No guest data available</p>
        )}
      </Card>

      {/* Section 5: Top repeat guests table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Top repeat guests</h2>
          <Input
            label="Search by name or email"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guests..."
            className="max-w-md"
          />
        </div>
        {filteredTopGuests.length > 0 ? (
          <Table
            headers={['Name', 'Email', 'Phone', 'Events attended', 'First event', 'Last event']}
          >
            {filteredTopGuests.map((guest, index) => (
              <TableRow key={`${guest.identity.key}-${index}`}>
                <TableCell>{guest.identity.name || '-'}</TableCell>
                <TableCell>{guest.identity.email || '-'}</TableCell>
                <TableCell>{guest.identity.phoneNumber || '-'}</TableCell>
                <TableCell>{guest.eventsAttended}</TableCell>
                <TableCell>{new Date(guest.firstEventDate).toISOString().split('T')[0]}</TableCell>
                <TableCell>{new Date(guest.lastEventDate).toISOString().split('T')[0]}</TableCell>
              </TableRow>
            ))}
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchQuery ? 'No guests found matching your search' : 'No repeat guests yet'}
          </p>
        )}
      </Card>
    </div>
  )
}

