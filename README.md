# CrowdPulse

A minimal MVP analytics platform for event organisers built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- User authentication (email + password)
- Dashboard with event listing
- Event CRUD operations
- CSV upload for guest lists
- Profile management
- Light/dark mode toggle

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **CSV Parsing**: PapaParse

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  ticket_type TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- Guests policies
CREATE POLICY "Users can view guests of own events"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert guests to own events"
  ON guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guests of own events"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests of own events"
  ON guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.user_id = auth.uid()
    )
  );
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication page
│   ├── dashboard/         # Dashboard page
│   ├── profile/           # Profile page
│   ├── events/           # Event pages
│   │   ├── new/          # Create event
│   │   └── [id]/         # Event details
│   └── layout.tsx        # Root layout
├── components/            # Reusable UI components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client setup
│   ├── auth.ts           # Auth helpers
│   ├── csv.ts            # CSV parsing
│   └── theme.ts          # Theme management
└── types/                # TypeScript type definitions
```

## CSV Upload Format

The CSV parser looks for columns with case-insensitive matching:

- **Name**: Any column containing "name" (excluding "email")
- **Email**: Any column containing "email"
- **Ticket Type**: Any column containing "ticket" or "type"

All other columns are stored in the `raw_data` JSONB field for future use.

Example CSV:

```csv
Name,Email,Ticket Type
John Doe,john@example.com,VIP
Jane Smith,jane@example.com,Standard
```

## Next Steps

- Implement advanced analytics and visualizations
- Add more event management features
- Enhance CSV parsing with custom column mapping
- Add file storage for CSV backups
- Implement event sharing and collaboration

## License

MIT
