export interface Profile {
  id: string
  display_name: string | null
  organization_name: string | null
  created_at: string
}

export interface Event {
  id: string
  user_id: string
  title: string
  date: string
  venue: string
  description: string | null
  created_at: string
}

export interface Guest {
  id: string
  event_id: string
  api_id: string | null
  name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_number: string | null
  ticket_type: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface GuestListFile {
  id: string
  user_id: string
  event_id: string | null
  file_name: string
  file_size: number
  guest_count: number
  storage_path: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      guests: {
        Row: Guest
        Insert: Omit<Guest, 'id' | 'created_at'>
        Update: Partial<Omit<Guest, 'id' | 'created_at'>>
      }
      guest_list_files: {
        Row: GuestListFile
        Insert: Omit<GuestListFile, 'id' | 'created_at'>
        Update: Partial<Omit<GuestListFile, 'id' | 'created_at'>>
      }
    }
  }
}

