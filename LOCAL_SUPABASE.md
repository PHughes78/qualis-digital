# Local Supabase Instance - Quick Reference

## 🎉 Supabase is Running!

Your local Supabase instance is up and running with all your migrations applied!

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Studio** | http://127.0.0.1:54323 | Database management UI |
| **API** | http://127.0.0.1:54321 | REST & Realtime API |
| **GraphQL** | http://127.0.0.1:54321/graphql/v1 | GraphQL endpoint |
| **Storage** | http://127.0.0.1:54321/storage/v1/s3 | S3-compatible storage |
| **MCP** | http://127.0.0.1:54321/mcp | Model Context Protocol |
| **Mailpit** | http://127.0.0.1:54324 | Email testing |
| **Database** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct DB connection |

### API Keys

```env
# Publishable Key (client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Secret Key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

# S3 Storage Keys
S3_ACCESS_KEY=625729a08b95bf1b7ff351a663f3a23c
S3_SECRET_KEY=850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
S3_REGION=local
```

## Applied Migrations ✅

The following migrations were automatically applied:
1. ✅ `001_initial_schema.sql` - Created all tables, enums, and indexes
2. ✅ `002_row_level_security.sql` - Enabled RLS and security policies
3. ✅ `003_functions_and_triggers.sql` - Database functions and triggers

## Common Commands

### Start Supabase
```bash
npx supabase start
```

### Stop Supabase
```bash
npx supabase stop
```

### View Status
```bash
npx supabase status
```

### View Logs
```bash
npx supabase logs
```

### Reset Database (WARNING: Deletes all data!)
```bash
npx supabase db reset
```

### Create New Migration
```bash
npx supabase migration new migration_name
```

### Apply Pending Migrations
```bash
npx supabase db push
```

### Generate TypeScript Types
```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

## Quick Start Guide

### 1. Open Supabase Studio
Go to http://127.0.0.1:54323 to:
- View your database tables
- Browse data
- Run SQL queries
- Manage authentication
- Configure storage

### 2. Create Test Users
You can create test users for each role:
- Carer
- Manager  
- Business Owner

### 3. Add Test Data
Use the Studio SQL editor or your app to add:
- Care homes
- Clients
- Care plans
- Handovers

### 4. View Emails
All emails sent by your app appear in Mailpit at http://127.0.0.1:54324

## Database Connection Details

**Connection String:**
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Credentials:**
- **User:** postgres
- **Password:** postgres
- **Host:** 127.0.0.1
- **Port:** 54322
- **Database:** postgres

## Next Steps

1. ✅ Local Supabase is running
2. ✅ Migrations are applied
3. ✅ Environment variables configured
4. 🔄 **Restart your Next.js dev server** to pick up new env vars:
   ```bash
   npm run dev
   ```
5. 📝 Create test users via the auth page
6. 🏥 Add test care homes and clients
7. 📊 Test the dashboards with real data

## Troubleshooting

### If Supabase won't start:
```bash
# Make sure Docker Desktop is running
docker ps

# Stop Supabase and start fresh
npx supabase stop
npx supabase start
```

### If migrations fail:
```bash
# Reset and reapply
npx supabase db reset
```

### If you get "port already in use":
```bash
# Stop Supabase
npx supabase stop

# Check what's using the port
netstat -ano | findstr :54321

# Start Supabase again
npx supabase start
```

## Data Persistence

Your data is stored in Docker volumes. It persists across restarts unless you:
- Run `npx supabase stop --no-backup` 
- Run `npx supabase db reset`
- Delete the Docker volumes manually

## Production vs Local

**Local:**
- Use for development
- Data is isolated
- Free unlimited usage
- No internet required

**Production (Cloud):**
- Use supabase.com
- Different API keys
- Managed and backed up
- Update .env.local for production URLs

---

**Happy coding! 🚀**

Your care management system is ready for development with a fully functional local Supabase backend!