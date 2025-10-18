# Qualis Digital - Care Management System

A comprehensive care management system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase for UK care companies.

## Features

- **Role-based Authentication**: Three distinct user roles (Carers, Managers, Business Owners)
- **Care Home Management**: Manage multiple care facilities
- **Client Management**: Comprehensive client profiles and care tracking
- **Care Plans**: Individual care requirements and assessments
- **Handover System**: Seamless shift handovers between staff
- **Incident Reporting**: Track and manage care incidents
- **Compliance Tracking**: CQC compliance and reporting
- **Mobile-friendly**: Responsive design for mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: PostgreSQL with Row Level Security (RLS)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd care-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update with your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_DOCS_BUCKET` (storage bucket for care documents, defaults to `documents`)
     - `MAPBOX_ACCESS_TOKEN` (Places API token used for UK address autocomplete)

4. Set up Supabase database:
   - Create a new project at [Supabase](https://supabase.com)
   - Run the migration scripts in `/supabase/migrations/` in order:
     - `001_initial_schema.sql`
     - `002_row_level_security.sql`
     - `003_functions_and_triggers.sql`
   - Create Supabase Storage buckets and keep them private:
     - `documents` for shared records and attachments
     - `client-pictures` for resident profile photos
   - Configure a Mapbox account and generate a Places API token for address autocomplete.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The system includes the following main tables:

- **profiles**: User profiles linked to Supabase auth
- **care_homes**: Care facility information
- **clients**: Care recipients and their details
- **care_plans**: Individual care requirements
- **assessments**: Health and care assessments
- **handovers**: Shift handover information
- **incidents**: Incident reports
- **user_care_homes**: User-to-care-home assignments

## User Roles

### Carers
- View assigned clients
- Update care plans
- Complete handovers
- Report incidents
- Mobile-optimized interface

### Managers
- Manage care homes
- Oversee staff and clients
- Review incidents and assessments
- Generate reports
- Compliance monitoring

### Business Owners
- Multi-site overview
- Financial reporting
- Strategic business insights
- Organization-wide settings
- CQC compliance tracking

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboards/       # Role-specific dashboards
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── lib/                  # Utilities and configurations
│   └── supabase/         # Supabase client configurations
└── styles/               # Global styles

supabase/
└── migrations/           # Database migration scripts
```

### Key Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

1. Deploy to Vercel, Netlify, or your preferred platform
2. Set up environment variables in your deployment platform
3. Ensure Supabase RLS policies are properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.

---

**Note**: This system is designed specifically for UK care companies and includes features for CQC compliance. Ensure all data handling complies with GDPR and relevant care regulations.
