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

# TikTok OAuth (optional - for social media connections)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback

# Instagram/Meta OAuth (optional - for social media connections)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
IG_REDIRECT_URI=https://yourdomain.com/auth/instagram/callback
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
  api_id TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  ticket_type TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guest_list_files table
CREATE TABLE guest_list_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  guest_count INTEGER NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_accounts table
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  external_user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create index on social_accounts
CREATE INDEX idx_social_accounts_user_platform ON social_accounts(user_id, platform);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_list_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

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

-- Guest list files policies
CREATE POLICY "Users can view own guest list files"
  ON guest_list_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own guest list files"
  ON guest_list_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guest list files"
  ON guest_list_files FOR DELETE
  USING (auth.uid() = user_id);

-- Social accounts policies
CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
  ON social_accounts FOR DELETE
  USING (auth.uid() = user_id);
```

### 5. Set Up Supabase Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `guest-lists`
3. Set the bucket to **Private**
4. Add the following policy to allow users to upload their own files:

```sql
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'guest-lists' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'guest-lists' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'guest-lists' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note:** The storage policy uses `(storage.foldername(name))[1]` because Supabase's `foldername` function returns an array where the first element `[1]` is the first folder in the path (the user ID in our case). The path structure is `{userId}/{filename}`.

### 6. Run the Development Server

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
