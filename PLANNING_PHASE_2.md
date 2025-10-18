# Phase 2 Planning – Data Model & Supabase Access Layer

This phase focuses on evolving the backend foundation so the CRM can support rich workflows (care plans, incidents, staffing, compliance) with reliable, secure Supabase-powered CRUD. The plan is broken into actionable checklists suitable for Codex Cloud or local execution.

---

## 1. Phase Objectives & Principles

- [x] **Confirm scope**: data model extensions, CRUD APIs, RLS policies, scheduled jobs, observability.  
  - Phase 2 covers Supabase schema evolution (care plans, incidents, staffing, compliance), storage buckets, cron jobs, logging, and the shared TypeScript access layer that powers dashboards and forms.
- [x] **Document design principles**: single source of truth in Supabase, reproducible migrations, tenant isolation, auditability.  
  - Principles: migrations-first workflow, no orphan data, soft-deletes with audit logs, every table protected by RLS, multitenant readiness for multi-home operators, and deterministic seeds for preview environments.
- [x] **Align success criteria**: performance targets, policy coverage, DX for consuming components.  
  - Success: queries under 150 ms for primary lists, 100% CRUD operations behind helper modules, RLS policies mapped to personas, automated migration/test pipeline green, documented API signatures for frontend teams.

## 2. Current State Assessment

- [x] **Review existing schema** (`supabase/migrations`, `database.types.ts`) for tables, relationships, and constraints.  
  - Current tables include profiles, care_homes, clients, care_plans, assessments, handovers, handover_items, incidents, user_care_homes, manager_care_homes, company_settings. Few indexes beyond defaults; no version tables or action logs.
- [x] **Catalogue current Supabase access helpers** in `src/lib`, noting reuse potential and limitations.  
  - Only createBrowserClient/createServerClient wrappers exist; domain pages call Supabase directly via useEffect. No shared services, caching, or typed response helpers.
- [x] **Identify pain points** from Phase 1 audits (duplicate fetching logic, missing policies, lack of versioning) with concrete evidence.  
  - Repeated fetch logic in clients/care-homes/users pages, limited error handling, RLS present only for some tables (company_settings explicit, others assume defaults), no incident escalation structures, no care plan versions, no scheduling entities.

## 3. Data Model Enhancements

- [x] **Define new tables/entities** required for feature pillars (e.g., `care_plan_versions`, `incident_actions`, `shift_templates`, `training_records`, `documents`).  
  - Planned tables: care_plan_versions, care_plan_tasks, care_plan_reviews, incident_actions, incident_followups, shift_templates, shift_assignments, staff_availability, training_records, policy_documents, resident_documents, notification_queue, audit_events, occupancy_snapshots.
- [x] **Specify relationships & constraints** (FKs, cascades, unique indexes) including multi-site tenancy patterns.  
  - FK patterns: every domain record links to care_home_id (nullable for HQ items) and created_by. Unique constraints on active care_plan_versions per resident, incident_actions per incident/assignee, shift template names per site. Cascades limited to archive flags; hard deletes replaced with soft delete columns.
- [x] **Draft RLS policies** per role/persona covering CRUD for each new table.  
  - Carers: read/write only to records tied to assigned homes; restricted update on care_plan_tasks assigned to them. Managers: full CRUD within managed homes. Business owners: cross-home read, limited write for compliance tables. Compliance leads (if separate role) get read across homes plus write on audit artifacts. Service role retains bypass for migrations.
- [x] **Plan supporting storage buckets** and metadata tables for document/asset handling.  
  - Buckets: `resident-docs` (protected), `incident-evidence` (restricted), `policy-files` (owner/compliance). Metadata tables store file name, path, version, linked entity, expiry. Policies align with table RLS using storage POST policies.
- [x] **Design triggers/functions** needed for audit logs, SLA timers, derived metrics.  
  - Triggers: on incident insert to enqueue SLA timers; on care_plan_versions publish audit_events; on training_records change update compliance stats. Functions: `calculate_occupancy_snapshot`, `schedule_notification(recipient, payload, trigger_at)`, `resolve_overdue_tasks`. Cron jobs call functions via Supabase Edge functions.

## 4. Supabase API & Access Layer

- [x] **Outline service modules** in `src/lib/api` (or similar) encapsulating CRUD for each domain.  
  - Modules: `api/clients`, `api/care-homes`, `api/care-plans`, `api/incidents`, `api/staffing`, `api/compliance`, `api/documents`. Each exposes list/get/create/update/archive and typed DTOs.
- [x] **Decide on server vs. client fetching** patterns (React Server Components, server actions, client hooks) with caching strategy.  
  - Strategy: primary data fetched via server components/server actions for SEO and caching; client hooks (`useCarePlan`, etc.) wrap SWR/TanStack Query for interactive pages. Revalidate using `revalidatePath` after mutations.
- [x] **Define error handling & retry strategy**, standard response shapes, and optimistic update rules.  
  - Central `ApiError` type, helper `handleSupabaseError`, logging to Edge function. Optimistic updates for task completion and roster updates using TanStack Query with rollback on failure. Standard response format includes `data`, `error`, `meta`.
- [x] **Plan notification/scheduling mechanisms** (Supabase Functions, Cron, Webhooks) for reminders and escalations.  
  - Use Supabase Scheduled Functions for daily compliance reminders, immediate webhook triggers for high severity incidents (Teams/Slack). Notification queue table drives email/SMS via Resend/Twilio integration.
- [x] **Create testing approach** for API helpers (unit + integration against local Supabase).  
  - Unit tests mock Supabase client wrappers; integration tests run against local Supabase using seed data and `vitest` or `jest` with setup/teardown scripts. Include contract tests to ensure RLS accessible roles behave as expected.

## 5. Migration & Deployment Workflow

- [x] **Establish migration authoring process** (branching, naming, review checklist, `supabase db lint` integration).  
  - Process: migrations named `YYYYMMDDHHmm_<description>.sql`, authored per feature branch, peer reviewed with checklist covering RLS, indexes, rollback block. CI runs `supabase db lint` and `supabase db diff` to detect drift.
- [x] **Plan seed data & fixtures** for local dev, previews, and automated tests.  
  - Seeds: use `supabase/seed` SQL + TypeScript seeding script to populate demo care homes, residents, staff, training modules, incidents. Provide fixture builder for tests to isolate data per scenario.
- [x] **Define rollback strategy** and versioning for Supabase functions and policies.  
  - Maintain mirrored `down` migrations or explicit `revert` scripts. Store edge function code in repo with semantic version tags. Policies documented with rationale and testing steps; rollback instructions accompany each migration.
- [x] **Document environment configuration needs** (service role keys, storage buckets, cron secrets).  
  - Env checklist: `SUPABASE_SERVICE_ROLE_KEY`, storage bucket config via SQL, Resend/Twilio keys, cron secrets for scheduled functions, feature flag toggles, path for uploading default templates.

## 6. Phase 2 Backlog & Deliverables

- [x] **Convert data model items into migration tasks** (one table/policy set per task).  
  - Example tasks: "Create care plan versioning tables with RLS", "Add incident action log and SLA timers", "Introduce staffing availability schema".
- [x] **Create API implementation tickets** aligned with UI consumers (e.g., "Care plan version CRUD service").  
  - Tickets map to modules: implement `api/care-plans`, `api/incidents`, `api/staffing`, add hooks, integrate optimistic updates, document usage in storybook-style MDX.
- [x] **Schedule cross-cutting tasks** (audit logging, analytics views, monitoring) with owners and dependencies.  
  - Tasks: build audit_events table and logging trigger; add occupancy_snapshot materialized view; set up Logflare/Observability dashboards; integrate Sentry for edge functions.
- [x] **List validation checkpoints** (schema review, load testing, security audit) before moving to Phase 3.  
  - Checkpoints: design review of ERD, RLS penetration test, load test on incident/roster endpoints, QA sign-off on migrations in staging, documentation of APIs for frontend, go/no-go meeting.

---

### Output of Phase 2

By completing this phase we will have:

1. A robust Supabase schema covering all prioritized workflows with enforced RLS.
2. A reusable TypeScript access layer powering dashboards, forms, and automations.
3. Automated migrations, seeds, and policies that keep environments in sync.
4. A ready-to-execute backlog for Phase 3 UI integration and advanced workflow automation.
