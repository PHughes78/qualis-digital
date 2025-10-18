# Phase 3 Planning – UI Integration & Workflow Automation

Phase 3 focuses on wiring the enhanced Supabase backend into polished, role-specific UX, while automating key workflows (notifications, analytics, routing). This roadmap builds on Phase 1 and 2 deliverables; the tasks are sized for Codex Cloud execution or local sprint work.

---

## 1. Phase Objectives & Success Criteria

- [ ] **Confirm primary goals**: ship Argon-level dashboards, end-to-end CRUD with Supabase services, notifications automation.
- [ ] **Define UX polish metrics**: time-to-insight per persona, task completion friction, mobile fluency benchmarks.
- [ ] **Set validation requirements**: lighthouse/performance thresholds, accessibility score, regression test coverage, analytics fidelity.

## 2. Current State Review

- [ ] **Catalogue existing UI components** updated in Phase 1/2 (dashboards, cards, tables) noting what remains to adopt new theme.
- [ ] **Audit Supabase access layer** tasks queued from Phase 2 (service modules, hooks) and note available endpoints.
- [ ] **Check data completeness**: ensure seed data covers user stories for carer/manager/business owner flows.

## 3. Dashboard & Page Integration

- [ ] **Map backend metrics to UI components** for each persona dashboard (carer, manager, business owner, compliance).
- [ ] **Prioritise dashboard widgets** (stat tiles, charts, tables, timelines) with data requirements and interactions.
- [ ] **Plan detail pages & modals** (incident workflow, care plan version view, roster management) including forms and validations.
- [ ] **Design responsive/mobile states** for core flows (task lists, incident logging, care-plan updates).

## 4. Workflow Automation & Notifications

- [ ] **Identify automation triggers** (care plan reminders, incident SLAs, training expiries, occupancy alerts) and map to Supabase functions/cron.
- [ ] **Define notification channels** (in-app, email, SMS, webhooks) with templates and opt-in logic.
- [ ] **Outline audit & analytics events** to track workflow usage and compliance metrics.
- [ ] **Plan operational dashboards** (activity feeds, notification queue monitor, SLA status boards).

## 5. Cross-cutting Concerns

- [ ] **Accessibility pass**: ensure semantic markup, keyboard nav, ARIA states across new components.
- [ ] **Performance budget**: target load times for dashboards, use memoisation/caching where needed.
- [ ] **Error/empty states**: design consistent fallback UI for missing data, network issues.
- [ ] **Security & policy alignment**: confirm UI respects Supabase RLS (no hidden actions), handle permission denials gracefully.

## 6. Backlog & Execution Planning

- [ ] **Break features into sprintable tasks** (UI component work, Supabase integration, automation functions).
- [ ] **Define testing strategy**: unit tests for services/hooks, integration tests (Playwright/Cypress) covering major workflows.
- [ ] **Schedule QA & stakeholder demos**: checkpoints after each persona dashboard lands.
- [ ] **List go-live prerequisites**: content review, documentation updates, support training, telemetry setup.

---

### Phase 3 Deliverables

By completing Phase 3 we will have:

1. Production-ready dashboards and workflow pages aligned with the Argon-inspired design system.
2. Fully integrated CRUD flows using the Phase 2 Supabase services, with seed data and tests verifying behavior.
3. Automated notifications, audit events, and occupancy insights powering proactive operations.
4. An actionable backlog of UI/automation tasks ready for execution in subsequent sprints or Codex Cloud runs.

