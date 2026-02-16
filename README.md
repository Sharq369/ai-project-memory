# AI Memory Manager - Simple Version

Simple Next.js app to save text memories to Supabase.

## Setup

1. **Create Supabase Project**
   - Go to supabase.com
   - Create new project
   - Run the SQL in `supabase/schema.sql`
   - Copy your URL and anon key

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials

3. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

4. **Open** http://localhost:3000

## Structure

- `lib/supabase.ts` - Supabase client
- `app/dashboard/page.tsx` - Main dashboard with save functionality
- `supabase/schema.sql` - Database schema

## Database

Single table: `memories`
- id (uuid)
- user_id (uuid) 
- content (text)
- tag (text, optional)
- created_at (timestamp)
- updated_at (timestamp)

RLS enabled - users can only see their own memories.
