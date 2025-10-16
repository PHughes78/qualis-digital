# Supabase Setup Guide

Since there's no MCP server available, follow these steps to set up Supabase manually.

## Option 1: Manual Setup (Recommended for Quick Start)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: Care Management System
   - **Database Password**: (choose a strong password)
   - **Region**: Europe West (London) - closest to UK
5. Click "Create new project"

### Step 2: Run Migration Scripts

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left menu
3. Click "New Query"
4. Copy and paste the content from `supabase/migrations/001_initial_schema.sql`
5. Click "Run"
6. Repeat for:
   - `002_row_level_security.sql`
   - `003_functions_and_triggers.sql`

### Step 3: Get API Keys

1. Go to Project Settings (gear icon)
2. Click "API" in the left menu
3. Copy:
   - **Project URL** (under Project URL)
   - **anon/public key** (under Project API keys)
   - **service_role key** (under Project API keys - keep this secret!)

### Step 4: Configure Environment Variables

Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Configure Authentication

1. Go to Authentication > Providers
2. Enable "Email" provider
3. Configure email templates if needed
4. Set up site URL: `http://localhost:3000`
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Your production URL when ready

## Option 2: Supabase CLI (Advanced)

### Installation

```powershell
# Install Supabase CLI
npm install -g supabase

# Or using Scoop (Windows package manager)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Initialize Supabase

```powershell
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Initialize locally
supabase init

# Start local Supabase (optional - for local development)
supabase start

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/lib/database.types.ts
```

### Useful CLI Commands

```powershell
# Check migration status
supabase migration list

# Create new migration
supabase migration new migration_name

# Reset local database
supabase db reset

# View local database
supabase db diff

# Deploy to production
supabase db push
```

## Testing Your Setup

### Test Authentication

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Get Started"
4. Try creating an account
5. Check Supabase Dashboard > Authentication > Users

### Test Database Connection

Create a test file `src/lib/test-supabase.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'

export async function testSupabaseConnection() {
  const supabase = createClient()
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('care_homes')
      .select('count')
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connected successfully!', data)
    return true
  } catch (err) {
    console.error('Supabase connection failed:', err)
    return false
  }
}
```

## Troubleshooting

### Error: "Invalid API key"
- Check your `.env.local` file
- Ensure you copied the correct keys
- Restart your dev server after updating env vars

### Error: "relation does not exist"
- Your migrations haven't run
- Go to SQL Editor and run the migration scripts manually

### Error: "new row violates row-level security policy"
- RLS policies are blocking access
- Check `002_row_level_security.sql` was applied
- Verify user roles are set correctly

### Error: "JWT expired"
- Your session has expired
- Sign out and sign in again
- Check Supabase Auth settings

## Next Steps

After setup is complete:

1. ✅ Create a test user with each role (carer, manager, business_owner)
2. ✅ Create sample care homes
3. ✅ Add test clients
4. ✅ Test the dashboards with real data
5. ✅ Configure email templates for password reset
6. ✅ Set up production environment variables

## Production Checklist

Before going live:

- [ ] Enable RLS on all tables
- [ ] Review all security policies
- [ ] Set up custom SMTP for emails
- [ ] Configure production domain
- [ ] Set up database backups
- [ ] Enable 2FA for admin accounts
- [ ] Review audit logs
- [ ] Set up monitoring and alerts
- [ ] Test all user roles thoroughly
- [ ] Set up staging environment

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
