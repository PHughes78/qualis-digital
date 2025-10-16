# Supabase MCP Configuration Guide

If you've installed the Supabase MCP server, you need to configure it so GitHub Copilot can access it.

## Step 1: Check if Supabase MCP is Installed

Run this in your terminal:

```powershell
# Check for Supabase CLI
supabase --version

# Check for npx supabase
npx supabase --version
```

## Step 2: Configure MCP Server

### Option A: VS Code User Settings

1. Open VS Code Settings (Ctrl + ,)
2. Search for "MCP" or "Model Context Protocol"
3. Add Supabase MCP configuration

### Option B: Create MCP Config File

Create a file `.vscode/mcp-settings.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "--project-ref",
        "YOUR_PROJECT_REF",
        "--access-token",
        "YOUR_ACCESS_TOKEN"
      ]
    }
  }
}
```

### Option C: Using Supabase CLI

If you have Supabase CLI installed:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "supabase",
      "args": ["mcp", "serve"]
    }
  }
}
```

## Step 3: Get Your Supabase Credentials

You'll need:
- **Project Reference**: From your Supabase project URL
- **Access Token**: From Supabase Dashboard > Settings > API

## Step 4: Test the Connection

After configuration, restart VS Code and I should be able to:
- Query your database directly
- See table schemas
- Run SQL queries
- Manage migrations
- View RLS policies

## Alternative: Manual Setup (Current Approach)

Since MCP might not be configured yet, we can continue using:
1. Supabase JavaScript client (already configured ✅)
2. Migration scripts (already created ✅)
3. Manual database setup via Supabase Dashboard

## What MCP Would Enable

With Supabase MCP configured, I could:
- ✅ Query your database structure directly
- ✅ Generate TypeScript types from your live database
- ✅ Test queries before adding them to code
- ✅ View actual data for debugging
- ✅ Create migrations based on schema changes
- ✅ Check RLS policies in real-time

## Installing Supabase MCP Server

If not installed, run:

```powershell
# Install Supabase MCP Server globally
npm install -g @supabase/mcp-server

# Or use npx (no installation needed)
npx @supabase/mcp-server --help
```

## Troubleshooting

**If MCP isn't working:**
1. Ensure Supabase project exists
2. Verify API credentials are correct
3. Check VS Code has MCP extension enabled
4. Restart VS Code after configuration changes
5. Check VS Code Output panel for MCP errors

**Current Status:**
- ✅ Supabase packages installed in project
- ✅ Client configuration complete
- ❓ MCP server not accessible to Copilot (yet)
- ✅ Can proceed with manual setup

Would you like to:
1. Continue with manual Supabase setup? (Fastest)
2. Configure MCP server for enhanced development?
