<!-- UK Care Management System Instructions for GitHub Copilot -->

# Qualis Digital - Care Management System - Copilot Instructions

This is a comprehensive care management system for UK care companies built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Project Overview
- **System Name**: Qualis Digital
- **Primary Goal**: Create a complete care management platform similar to NourishCare's Better Care system
- **Target Users**: Care companies in the UK managing residential care homes and clients
- **User Roles**: Carers, Managers, Business Owners (each with dedicated dashboards)
- **Core Features**: 
  - Role-based authentication and authorization
  - Care home management
  - Client management and profiles
  - Care plans and assessments
  - Handover systems between shifts
  - Incident reporting
  - Compliance tracking

## Technical Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time subscriptions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with custom role-based access control
- **UI Components**: Shadcn/ui components
- **Icons**: Lucide React icons

## Database Schema (Key Tables)
- `profiles` - User profiles linked to Supabase auth
- `user_roles` - Role assignments (carer, manager, business_owner)
- `care_homes` - Care facility information
- `clients` - Care recipients
- `care_plans` - Individual care requirements
- `assessments` - Health and care assessments
- `handovers` - Shift handover information
- `incidents` - Incident reports

## Development Guidelines
1. **Authentication**: Always check user roles before displaying content
2. **Database**: Use Supabase client with Row Level Security (RLS)
3. **UI/UX**: Follow NHS Digital Service Manual guidelines where applicable
4. **Components**: Create reusable components for common care management tasks
5. **TypeScript**: Maintain strict type safety throughout
6. **Responsive**: Ensure mobile-friendly design for carers on mobile devices

## Progress Tracking
- [x] Project initialization
- [x] Copilot instructions created
- [ ] Next.js project scaffolding
- [ ] Supabase configuration
- [ ] Database migrations
- [ ] Authentication system
- [ ] Role-based dashboards
- [ ] Care management features