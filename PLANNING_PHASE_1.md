# Phase 1 Planning – Care CRM (UK)

This document captures the work items for Phase 1, focused on establishing the product vision and architectural baseline required to build the leading CRM for UK care companies. Each checklist item is intentionally task-sized so it can be handed to Codex Cloud (or another agent) as an actionable work unit.

---

## 1. Persona & Journey Alignment

- [x] **Confirm core personas**: business owner, registered manager, frontline carer, compliance officer (if separate). Capture their goals, pain points, KPIs.  
  - **Business Owner** – Strategic owner/operator overseeing financial health and compliance across multiple homes.  
    - Goals: Occupancy growth, EBITDA margin, positive CQC ratings, brand differentiation.  
    - Pain points: Fragmented reporting, limited visibility into care quality vs. costs, difficulty standardising processes across sites.  
    - KPIs: Occupancy %, agency spend, incident trends, CQC action tracker, net promoter score from families.  
  - **Registered Manager** – Operational leader responsible for day-to-day care delivery and regulatory adherence within a home or group.  
    - Goals: Safe staffing, timely care plans, up-to-date records, successful inspections.  
    - Pain points: Manual rota tweaks, incident follow-up, ensuring documentation is audit-ready, coordinating multidisciplinary teams.  
    - KPIs: Roster fill %, overdue care plans, training compliance, safeguarding response time, inspection readiness score.  
  - **Frontline Carer** – Delivers personal care, records observations, communicates with families and managers.  
    - Goals: Know daily priorities, understand resident needs, quickly log notes, feel supported.  
    - Pain points: Information scattered across sheets/apps, time-consuming documentation, unclear handovers, device access.  
    - KPIs: Tasks completed on time, incident reports filed, resident satisfaction notes, overtime hours.  
  - **Compliance / Quality Lead** (may be the manager or central team).  
    - Goals: Maintain “Good/Outstanding” CQC outcomes, monitor safeguarding, ensure policy adherence.  
    - Pain points: Consolidating evidence for inspections, tracking action plans, keeping staff training current, managing document versions.  
    - KPIs: Inspection action closures, policy review cadence, safeguarding alerts resolved, training completion %.
- [x] **Map primary user journeys** for each persona (onboarding, daily ops, compliance checks, reporting, emergency handling).  
  - **Onboarding**: Invite staff → assign roles → configure company branding/templates → upload initial client records.  
  - **Daily Ops**: Review dashboard metrics → update schedule/rota → carers complete tasks/log notes → managers monitor alerts → family communication.  
  - **Care Plan Review**: Trigger from review date → collate observations/clinical notes → multidisciplinary sign-off → notify carers → archive previous version.  
  - **Incident Escalation**: Carer logs incident (mobile) → manager triages/severity → assign follow-up tasks → notify safeguarding lead → document actions for CQC.  
  - **Compliance Audit**: Quality lead runs compliance dashboard → identify overdue items → export evidence pack → prepare inspection briefing.  
  - **Emergency Handling**: Trigger (falls, infection outbreak) → broadcast instructions → update shift coverage → document actions/outcome in incident log.  
  (Journeys should be storyboarded in detail during discovery workshops; above list sets scope for UX flows.)
- [x] **Prioritise high-value scenarios** (e.g. daily handover, care plan review, incident escalation) that will drive dashboard/KPI design.  
  - Daily handover briefing, rota gaps, overdue care plans, safeguarding incident escalation, training compliance chase, occupancy pipeline.  
  - These become dashboard “hero” modules (e.g., manager sees rota gap cards, business owner sees occupancy vs. target).  
- [x] **Document regulatory touchpoints** (CQC standards, safeguarding reporting) to ensure later features align with UK requirements.  
  - CQC KLOEs (Key Lines of Enquiry) → map to evidence capture modules.  
  - Safeguarding: DSL notification workflow, LA reporting forms, incident categorisation.  
  - Medication (MAR) records integration, capacity and consent documentation, DoLS management.  
  - GDPR: Access controls, audit logs, data retention policies.  
  - Training matrix aligned with Skills for Care/CQC mandatory topics.

## 2. Feature Pillar Definition

- [x] **Audit current feature surface**: list what already exists for clients, care homes, staff, care plans, incidents, handovers, scheduling, settings.  
  - **Clients** (`src/app/clients`) – list view with filters/search, client profiles and creation workflow, medical profile fields, linkage to care homes.  
  - **Care Homes** (`src/app/care-homes`) – site directory with key stats, create/edit forms, manager assignments, Supabase-driven relationships.  
  - **Care Plans** (`src/app/care-plans`) – catalogue with status filters, detail scafolding for plan reviews (needs richer workflow).  
  - **Handovers** (`src/app/handovers`) – timeline of shift reports with filtering by date/home.  
  - **Incidents** (`src/app/incidents`) – logging interface capturing type/severity, list management.  
  - **Users/Staffing** (`src/app/users`) – invite, edit, and role assignment flows; links carers/managers to homes.  
  - **Scheduling** – rota data structures exist; UI provides basic calendar cards awaiting full scheduling logic.  
  - **Settings** (`src/app/settings/company`) – company branding, logos, theme toggles via context provider.  
  - **Dashboards** – role-driven dashboards (carer/manager/business owner) served through `src/app/dashboard/page.tsx`.  
  - **Auth & Profile** – Supabase auth integration, profile settings page, protected route wrapper.  
- [x] **Identify gaps vs. target pillars** (client management, staffing, care plans, incidents, compliance analytics, branding).  
  - Client management: no assessment history, document storage, family communication portal, lifecycle tracking.  
  - Staffing: missing shift templates, availability input, agency cost management, timesheets, automated rota optimisation.  
  - Care plans: requires version control, approvals, reminders, attachments, signature capture, outcome tracking.  
  - Incidents/safeguarding: add SLA tracking, action plans, regulatory export packs, analytics to spot trends.  
  - Compliance analytics: need inspection readiness dashboards, training matrices, policy management, audit evidence repository.  
  - Branding/customisation: deeper white-labelling, per-tenant theme controls, branded reporting.  
  - Mobile field usage: optimise offline/quick entry for carers.  
- [x] **Define success metrics** and leading indicators for each pillar (e.g., overdue care plans, incident resolution time).  
  - Client Management: admission cycle time, % residents with up-to-date assessments, family satisfaction score.  
  - Staffing: rota fill %, overtime hours, agency spend %, time to fill shift gaps.  
  - Care Plans: review compliance %, outstanding action items count, resident outcome improvement score.  
  - Incidents: mean time to close, overdue safeguarding actions, incident rate per 100 bed days, repeat incident flagging.  
  - Compliance: training completion %, audit action closure rate, inspection readiness index, document currency.  
  - Financial/Occupancy: occupancy %, revenue vs. forecast, arrears, cost per resident day.  
- [x] **Produce a north-star dashboard sketch** covering cross-pillar metrics per persona.  
  - Business Owner: multi-site occupancy heatmap, revenue vs. target, incident trend, CQC action tracker, staffing cost variance.  
  - Registered Manager: today’s rota gaps, overdue care plans, incident queue, training compliance alerts, resident risk watchlist, inspection checklist progress.  
  - Carer: shift briefing, priority residents, task checklist, handover timeline, quick log actions (incident/note/medication).  
  - Compliance Lead: safeguarding status board, policy review reminders, training matrix, audit evidence cards, inspection calendar.  
  - (Wireframes to be produced in Phase 1 output; bullet list defines required modules/metrics.)

## 3. Technical Baseline Audit

- [x] **Catalogue the existing component library** (shadcn primitives, custom components) noting reuse opportunities and missing pieces for the new UI system.  
  - Base shadcn components under `src/components/ui` (button, card, badge, dropdown, form, input, tabs, etc.) with Argon-inspired theming.  
  - Custom primitives: `enhanced-card`, `theme-toggle`, dashboard layout, ProtectedRoute.  
  - Context-driven wrappers (`ThemeProvider`, `CompanySettingsProvider`, `AuthProvider`) provide app-wide state.  
  - Missing pieces for the roadmap: advanced data tables (sorting/pagination), charts, timeline feeds, schedule/rota components, multi-step form wizard, notification toasts.  
- [x] **Review current data access patterns** (Supabase client usage, server actions, context providers) and highlight inconsistencies or anti-patterns.  
  - Supabase client factories in `src/lib/supabase/client.ts` (browser) and `server.ts` (server components/actions).  
  - Pages/components mostly call Supabase directly inside `useEffect` with client-side fetching; limited use of server components or caching.  
  - Contexts (`AuthContext`, `CompanySettingsContext`) wrap Supabase calls but lack centralised error/loading management; multiple pages reimplement similar fetch logic.  
  - Need shared data-access hooks/services per domain (clients, incidents, rota) plus mutation helpers with optimistic updates and error handling.  
- [x] **Inspect Supabase schema & policies**: document existing tables, RLS rules, stored procedures/functions, and note deficits for the planned features.  
  - Core tables: `profiles`, `care_homes`, `clients`, `care_plans`, `assessments`, `handovers`, `handover_items`, `incidents`, `user_care_homes`, `company_settings`, `manager_care_homes`.  
  - RLS enabled via `002_row_level_security.sql`; policies exist for company settings and manager assignments (008). Need review for incidents, care plans, etc. to ensure role scopes.  
  - No stored procedures/functions beyond defaults; future requirements include analytics views (occupancy, incidents), scheduling helpers, triggers for audit logging.  
  - Storage bucket `company-logos`; need additional buckets for resident documents, incident attachments with RLS.  
- [x] **Assess authentication & role propagation** (AuthContext, Supabase auth helpers) for readiness to enforce role-based UI + API access.  
  - Auth handled via Supabase OAuth/session; `AuthContext` fetches `profiles` to determine role and status.  
  - Role used to guard dashboards and nav; policies rely on `profiles.role`. Need to ensure RLS mirrors UI restrictions.  
  - On sign-out, context clears state and redirects; no granular permission checks in components yet (e.g., button-level).  
  - Gaps: absence of middleware enforcing role on API routes, missing audit logging, limited error handling for expired sessions.  
  - Recommendation: centralise permission helpers (`canManageCarePlans`, etc.), add middleware for server routes, ensure Supabase policies align with persona capabilities.

## 4. Product Requirements Backlog

- [x] **Compile feature briefs** for each persona-driven journey (problem, desired outcomes, UX notes, dependencies).  
  - **Daily Ops Dashboard (Manager)** – Problem: Managers lack consolidated view of shift coverage, incidents, and compliance tasks. Desired outcome: actionable dashboard with rota gaps, incident queue, training alerts. UX: modular cards, quick actions; dependencies: staffing data, incident API.  
  - **Carer Task & Handover Flow** – Problem: Carers juggle paper notes and disparate systems. Outcome: mobile-friendly task list, handover timeline, quick logging. UX: swipeable tasks, voice note upload; dependencies: tasks table, media storage, permissions.  
  - **Care Plan Lifecycle** – Problem: Reviews fall overdue; approval steps unclear. Outcome: versioned care plans with reminders, multidisciplinary sign-off, history. UX: timeline, structured sections, e-sign; dependencies: plan_versions table, notification service.  
  - **Incident Escalation & Safeguarding** – Problem: follow-up actions and regulatory reporting manual. Outcome: severity-based workflow, SLA tracking, export packs. UX: guided form, action assignments, export buttons; dependencies: incident_actions table, PDF templates.  
  - **Compliance & Training Matrix** – Problem: Quality leads compile evidence manually. Outcome: dashboard tracking policies, audits, training completion. UX: matrix view, filters, downloadable evidence. Dependencies: training records schema, document storage.  
  - **Occupancy & Finance Insights (Owner)** – Problem: Owners lack real-time view of occupancy/revenue. Outcome: multi-site analytics with forecasting. UX: charts, trend cards. Dependencies: occupancy_history table, financial feeds/API.  
- [x] **Break down briefs into deliverable epics / stories** suitable for Codex Cloud, ordered by dependency (data model → API → UI).  
  - Epic example (Care Plans):  
    1. **Data** – create `care_plan_versions`, `care_plan_tasks`, triggers for audit trail.  
    2. **API** – Supabase RPC/helpers for version CRUD, reminder scheduling.  
    3. **UI** – version timeline component, edit form with autosave, approval modal.  
  - Epic (Incident Escalation): tables (`incident_actions`, `incident_alerts`), policies → helper modules → UI (wizard, SLA tracker).  
  - Each story sized for Codex Cloud: e.g., “Implement Supabase migrations for incident actions + policies”, “Build incident workflow form component”, “Add incident SLA analytics card”.  
- [x] **Flag cross-cutting concerns** (accessibility, localisation, analytics, notifications) and determine where they fit in subsequent phases.  
  - Accessibility: enforce WCAG (focus states, keyboard nav) while refactoring components; include in DoD.  
  - Localisation: prepare text resources for UK English baseline, plan i18n scaffolding in Phase 2.  
  - Analytics/Observability: instrument key events (task completion, incident escalation) and add logging pipeline in Phase 2/3.  
  - Notifications: central service (in-app + email/SMS) defined during Supabase function work in Phase 2.  
- [x] **Establish DoD (Definition of Done)** covering design sign-off, Supabase migration/documentation, testing, and rollout notes.  
  - DoD: (1) Figma spec approved; (2) Supabase migrations merged with rollback + RLS policies documented; (3) Unit/integration tests added; (4) Lint/tests pass; (5) Release notes + user training snippet; (6) Analytics events tagged; (7) Accessibility checks passed; (8) Feature toggle strategy defined if partial rollout.  
  - Include requirements checklist template in future tickets so Codex Cloud outputs align.

## 5. Execution Logistics

- [x] **Choose collaboration tooling**: documentation conventions, ticket structure for Codex Cloud, review cadence.  
  - Documentation: centralise strategy docs in `/docs` (Markdown in repo) with matching Notion workspace for stakeholder-friendly summaries; enforce change log entries per feature.  
  - Ticketing: each Codex Cloud task links back to a `docs/tasks/<id>.md` brief containing context, acceptance criteria, dependencies, DoD checklist.  
  - Review cadence: twice-weekly async review via PR comments + Friday live sync (30 min) to unblock larger design decisions; daily Slack/Teams standup thread for progress.  
- [x] **Set up branching/CI expectations** (naming, lint/test requirements, preview deployments).  
  - Branch naming: `feature/<epic>-<short-desc>`, `fix/<issue>`, `chore/<task>`; protect `main` with required status checks.  
  - CI: GitHub Actions running `npm run lint`, `npm run test`, Supabase migration validation (`supabase db lint`) and preview build; failures block merge.  
  - Preview deployments: Vercel preview per PR with Supabase branch database (or seeded schema) to validate UI + data flows; gated approval before production promotes.  
  - Merge strategy: squash merge after review approvals; rollback plan documented per release.  
- [x] **Create a visual roadmap** (high-level timeline or Kanban swimlanes) communicating Phase 1 milestones and handoffs to Phase 2.  
  - Roadmap tool: FigJam/Miro board outlining swimlanes for Personas, Feature Pillars, Technical Audit, Backlog, Execution setup; color-coded for Design vs Engineering vs Ops.  
  - Milestones:  
    1. Week 1 – Personas/journeys signed off.  
    2. Week 2 – Feature pillars + technical audit complete.  
    3. Week 3 – Requirements backlog + DoD finalised.  
    4. Week 4 – Execution logistics locked; Phase 2 kickoff.  
  - Hand-off package: export board + Markdown summary committed to repo (`docs/roadmap/phase1.md`) for traceability.

---

### Output of Phase 1

By completing the checklist above we will have:

1. Clear persona-driven product direction aligned with UK care sector regulations.
2. A prioritised backlog of design and engineering work, ready for execution agents.
3. A documented technical inventory highlighting gaps to resolve in Phase 2.
4. Working agreements on process, documentation, and quality standards.

This foundation ensures subsequent phases can move rapidly while staying anchored to the needs of care providers, compliance, and the Supabase-backed technical stack. Once Phase 1 items are checked off, proceed to Phase 2 (data model and Supabase access layer).
