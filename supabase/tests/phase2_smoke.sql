-- Phase 2 Smoke Tests
-- Run after seeding to confirm the new tables contain data and relationships resolve.

-- Care plan version & tasks
SELECT
  cpv.care_plan_id,
  cpv.version_number,
  cpv.status,
  COUNT(cpt.id) AS task_count,
  MAX(cpv.created_at) AS created_at
FROM public.care_plan_versions cpv
LEFT JOIN public.care_plan_tasks cpt
  ON cpt.care_plan_version_id = cpv.id
GROUP BY cpv.care_plan_id, cpv.version_number, cpv.status
ORDER BY created_at DESC
LIMIT 5;

-- Upcoming care plan reviews
SELECT care_plan_id, scheduled_for, status
FROM public.care_plan_reviews
WHERE scheduled_for >= CURRENT_DATE
ORDER BY scheduled_for
LIMIT 5;

-- Incident follow-up actions
SELECT ia.incident_id, ia.title, ia.status, ia.due_at
FROM public.incident_actions ia
ORDER BY ia.created_at DESC
LIMIT 5;

-- Staffing overview
SELECT
  sa.care_home_id,
  sa.shift_date,
  sa.shift_type,
  sa.status,
  sa.assigned_to
FROM public.shift_assignments sa
ORDER BY sa.shift_date DESC, sa.created_at DESC
LIMIT 5;

-- Compliance snapshot
SELECT training_name, status, staff_id, completed_at
FROM public.training_records
ORDER BY completed_at DESC NULLS LAST
LIMIT 5;

-- Notification queue
SELECT recipient_id, channel, status, send_after
FROM public.notification_queue
ORDER BY created_at DESC
LIMIT 5;

-- Occupancy snapshot
SELECT care_home_id, snapshot_date, occupancy, capacity, waitlist_count
FROM public.occupancy_snapshots
ORDER BY snapshot_date DESC
LIMIT 5;
