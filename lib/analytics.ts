import type { Event, Guest } from "@/types";

export interface GuestIdentity {
  key: string;
  email: string | null;
  name: string;
  phoneNumber: string | null;
}

export interface EventGuestData {
  eventId: string;
  label: string;
  guestCount: number;
  newGuests: number;
  returningGuests: number;
}

export interface LoyaltyBucket {
  bucket: string;
  count: number;
}

export interface TopRepeatGuest {
  identity: GuestIdentity;
  eventsAttended: number;
  firstEventDate: string;
  lastEventDate: string;
}

/**
 * Get a unique identity key for a guest
 * Primary: email if available
 * Fallback: first_name + last_name + phone_number
 */
export function getGuestIdentity(guest: Guest): GuestIdentity {
  const email = guest.email?.trim().toLowerCase() || null;
  const firstName = guest.first_name?.trim() || "";
  const lastName = guest.last_name?.trim() || "";
  const phoneNumber = guest.phone_number?.trim() || null;
  const name =
    guest.name?.trim() || `${firstName} ${lastName}`.trim() || "Unknown";

  // Primary key: email
  if (email) {
    return {
      key: email,
      email,
      name,
      phoneNumber,
    };
  }

  // Fallback key: first_name + last_name + phone_number
  const fallbackKey = `${firstName}|${lastName}|${
    phoneNumber || ""
  }`.toLowerCase();
  return {
    key: fallbackKey,
    email: null,
    name,
    phoneNumber,
  };
}

/**
 * Build a map of guest identities to their event attendance
 */
export function buildGuestIdentityMap(
  events: Event[],
  guests: Guest[]
): Map<
  string,
  {
    identity: GuestIdentity;
    eventIds: Set<string>;
    firstSeen: string;
    lastSeen: string;
  }
> {
  const identityMap = new Map<
    string,
    {
      identity: GuestIdentity;
      eventIds: Set<string>;
      firstSeen: string;
      lastSeen: string;
    }
  >();

  // Sort events by date for chronological processing
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const event of sortedEvents) {
    const eventGuests = guests.filter((g) => g.event_id === event.id);
    const eventDate = event.date;

    for (const guest of eventGuests) {
      const identity = getGuestIdentity(guest);
      const existing = identityMap.get(identity.key);

      if (existing) {
        existing.eventIds.add(event.id);
        if (eventDate < existing.firstSeen) {
          existing.firstSeen = eventDate;
        }
        if (eventDate > existing.lastSeen) {
          existing.lastSeen = eventDate;
        }
      } else {
        identityMap.set(identity.key, {
          identity,
          eventIds: new Set([event.id]),
          firstSeen: eventDate,
          lastSeen: eventDate,
        });
      }
    }
  }

  return identityMap;
}

/**
 * Compute guest counts per event
 */
export function computeEventGuestCounts(
  events: Event[],
  guests: Guest[]
): Array<{ eventId: string; label: string; guestCount: number }> {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sortedEvents.map((event) => {
    const eventGuests = guests.filter((g) => g.event_id === event.id);
    const dateStr = new Date(event.date).toISOString().split("T")[0];
    const label = `${dateStr} – ${event.title}`;

    return {
      eventId: event.id,
      label,
      guestCount: eventGuests.length,
    };
  });
}

/**
 * Compute new vs returning guests per event
 */
export function computeNewVsReturning(
  events: Event[],
  guests: Guest[]
): EventGuestData[] {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const identityMap = buildGuestIdentityMap(events, guests);
  const seenIdentities = new Set<string>();

  return sortedEvents.map((event) => {
    const eventGuests = guests.filter((g) => g.event_id === event.id);
    const dateStr = new Date(event.date).toISOString().split("T")[0];
    const label = `${dateStr} – ${event.title}`;

    let newGuests = 0;
    let returningGuests = 0;

    for (const guest of eventGuests) {
      const identity = getGuestIdentity(guest);
      if (seenIdentities.has(identity.key)) {
        returningGuests++;
      } else {
        newGuests++;
        seenIdentities.add(identity.key);
      }
    }

    return {
      eventId: event.id,
      label,
      guestCount: eventGuests.length,
      newGuests,
      returningGuests,
    };
  });
}

/**
 * Compute loyalty distribution buckets
 */
export function computeLoyaltyBuckets(
  events: Event[],
  guests: Guest[]
): LoyaltyBucket[] {
  const identityMap = buildGuestIdentityMap(events, guests);
  const buckets: Record<string, number> = {
    "1 event": 0,
    "2 events": 0,
    "3 events": 0,
    "4+ events": 0,
  };

  for (const { eventIds } of Array.from(identityMap.values())) {
    const count = eventIds.size;
    if (count === 1) {
      buckets["1 event"]++;
    } else if (count === 2) {
      buckets["2 events"]++;
    } else if (count === 3) {
      buckets["3 events"]++;
    } else {
      buckets["4+ events"]++;
    }
  }

  return [
    { bucket: "1 event", count: buckets["1 event"] },
    { bucket: "2 events", count: buckets["2 events"] },
    { bucket: "3 events", count: buckets["3 events"] },
    { bucket: "4+ events", count: buckets["4+ events"] },
  ];
}

/**
 * Compute top repeat guests
 */
export function computeTopRepeatGuests(
  events: Event[],
  guests: Guest[]
): TopRepeatGuest[] {
  const identityMap = buildGuestIdentityMap(events, guests);
  const topGuests: TopRepeatGuest[] = [];

  for (const { identity, eventIds, firstSeen, lastSeen } of Array.from(
    identityMap.values()
  )) {
    if (eventIds.size > 1) {
      // Only include guests who attended more than one event
      topGuests.push({
        identity,
        eventsAttended: eventIds.size,
        firstEventDate: firstSeen,
        lastEventDate: lastSeen,
      });
    }
  }

  // Sort by events attended descending, then by name
  topGuests.sort((a, b) => {
    if (b.eventsAttended !== a.eventsAttended) {
      return b.eventsAttended - a.eventsAttended;
    }
    return a.identity.name.localeCompare(b.identity.name);
  });

  return topGuests;
}

/**
 * Get dashboard KPIs
 */
export function getDashboardKPIs(
  events: Event[],
  guests: Guest[]
): {
  totalUniqueGuests: number;
  totalEvents: number;
  averageGuestsPerEvent: number;
  maxGuestsAtSingleEvent: { count: number; eventTitle: string | null };
} {
  const identityMap = buildGuestIdentityMap(events, guests);
  const totalUniqueGuests = identityMap.size;
  const totalEvents = events.length;

  // Compute average guests per event
  const totalGuestRows = guests.length;
  const averageGuestsPerEvent =
    totalEvents > 0 ? Math.round(totalGuestRows / totalEvents) : 0;

  // Find max guests at a single event
  let maxCount = 0;
  let maxEventTitle: string | null = null;

  for (const event of events) {
    const eventGuestCount = guests.filter(
      (g) => g.event_id === event.id
    ).length;
    if (eventGuestCount > maxCount) {
      maxCount = eventGuestCount;
      maxEventTitle = event.title;
    }
  }

  return {
    totalUniqueGuests,
    totalEvents,
    averageGuestsPerEvent,
    maxGuestsAtSingleEvent: {
      count: maxCount,
      eventTitle: maxEventTitle,
    },
  };
}

/**
 * Get event-level KPIs
 */
export function getEventKPIs(
  event: Event,
  allEvents: Event[],
  allGuests: Guest[]
): {
  totalGuests: number;
  uniqueGuests: number;
  returningGuests: number;
  returningPercentage: number;
} {
  const eventGuests = allGuests.filter((g) => g.event_id === event.id);
  const totalGuests = eventGuests.length;

  // Get unique identities for this event
  const eventIdentitySet = new Set<string>();
  for (const guest of eventGuests) {
    const identity = getGuestIdentity(guest);
    eventIdentitySet.add(identity.key);
  }
  const uniqueGuests = eventIdentitySet.size;

  // Count returning guests (appeared in earlier events)
  const sortedEvents = [...allEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const eventIndex = sortedEvents.findIndex((e) => e.id === event.id);
  const earlierEvents = sortedEvents.slice(0, eventIndex);

  const earlierEventIds = new Set(earlierEvents.map((e) => e.id));
  const earlierGuests = allGuests.filter((g) =>
    earlierEventIds.has(g.event_id)
  );
  const earlierIdentities = new Set<string>();
  for (const guest of earlierGuests) {
    const identity = getGuestIdentity(guest);
    earlierIdentities.add(identity.key);
  }

  let returningGuests = 0;
  for (const guest of eventGuests) {
    const identity = getGuestIdentity(guest);
    if (earlierIdentities.has(identity.key)) {
      returningGuests++;
    }
  }

  const returningPercentage =
    uniqueGuests > 0 ? Math.round((returningGuests / uniqueGuests) * 100) : 0;

  return {
    totalGuests,
    uniqueGuests,
    returningGuests,
    returningPercentage,
  };
}
