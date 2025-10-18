-- Migration: Phase 2 Core Workflow Tables and Policies
-- Adds supporting schema for care plan versioning, incident follow-up, staffing, compliance, and notifications

-- New enums to support workflow states
CREATE TYPE care_plan_version_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE care_plan_task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE care_plan_review_status AS ENUM ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE incident_action_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE shift_assignment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'missed', 'cancelled');
CREATE TYPE availability_type AS ENUM ('available', 'unavailable', 'on_call');
CREATE TYPE training_status AS ENUM ('scheduled', 'in_progress', 'completed', 'expired');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'webhook');
CREATE TYPE notification_status AS ENUM ('queued', 'sending', 'sent', 'failed', 'cancelled');

-- Care plan versioning tables
CREATE TABLE public.care_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status care_plan_version_status NOT NULL DEFAULT 'draft',
  title TEXT,
  summary TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(care_plan_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_care_plan_versions_care_plan ON public.care_plan_versions(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_versions_active ON public.care_plan_versions(is_active);

CREATE TABLE public.care_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_version_id UUID NOT NULL REFERENCES public.care_plan_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status care_plan_task_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_care_plan_tasks_version ON public.care_plan_tasks(care_plan_version_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_tasks_assignee ON public.care_plan_tasks(assigned_to);

CREATE TABLE public.care_plan_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  scheduled_for DATE NOT NULL,
  status care_plan_review_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_care_plan_reviews_care_plan ON public.care_plan_reviews(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_reviews_schedule ON public.care_plan_reviews(scheduled_for);

-- Incident follow-up
CREATE TABLE public.incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status incident_action_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_incident_actions_incident ON public.incident_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_actions_assignee ON public.incident_actions(assigned_to);

CREATE TABLE public.incident_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  recorded_by UUID REFERENCES public.profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  next_review_at TIMESTAMPTZ,
  visibility TEXT CHECK (visibility IN ('internal', 'family', 'regulator')) DEFAULT 'internal'
);

CREATE INDEX IF NOT EXISTS idx_incident_followups_incident ON public.incident_followups(incident_id);

-- Staffing & scheduling tables
CREATE TABLE public.shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID NOT NULL REFERENCES public.care_homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'evening', 'night')),
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  default_staff_count INTEGER NOT NULL DEFAULT 1 CHECK (default_staff_count > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_shift_templates_care_home ON public.shift_templates(care_home_id);

CREATE TABLE public.shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID NOT NULL REFERENCES public.care_homes(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'evening', 'night')),
  shift_template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  status shift_assignment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_care_home ON public.shift_assignments(care_home_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date ON public.shift_assignments(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_assignee ON public.shift_assignments(assigned_to);

CREATE TABLE public.staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  care_home_id UUID REFERENCES public.care_homes(id) ON DELETE SET NULL,
  availability availability_type NOT NULL DEFAULT 'available',
  available_from TIMESTAMPTZ NOT NULL,
  available_to TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CHECK (available_to > available_from)
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON public.staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_home ON public.staff_availability(care_home_id);

-- Compliance & documentation
CREATE TABLE public.training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  provider TEXT,
  status training_status NOT NULL DEFAULT 'scheduled',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_training_records_staff ON public.training_records(staff_id);

CREATE TABLE public.policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  review_date DATE,
  care_home_id UUID REFERENCES public.care_homes(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_policy_documents_care_home ON public.policy_documents(care_home_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_status ON public.policy_documents(status);

CREATE TABLE public.resident_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('care_team', 'family', 'internal')) DEFAULT 'care_team',
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_resident_documents_client ON public.resident_documents(client_id);

-- Notifications & auditing
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id),
  channel notification_channel NOT NULL DEFAULT 'in_app',
  status notification_status NOT NULL DEFAULT 'queued',
  subject TEXT,
  payload JSONB NOT NULL,
  send_after TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON public.notification_queue(recipient_id);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  care_home_id UUID REFERENCES public.care_homes(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_events_home ON public.audit_events(care_home_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON public.audit_events(entity_type, entity_id);

CREATE TABLE public.occupancy_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_home_id UUID NOT NULL REFERENCES public.care_homes(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  occupancy INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  waitlist_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(care_home_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_home ON public.occupancy_snapshots(care_home_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_snapshots_date ON public.occupancy_snapshots(snapshot_date);

-- Enable RLS
ALTER TABLE public.care_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for care plan tables
CREATE POLICY "Business owners manage care plan versions"
  ON public.care_plan_versions
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view care plan versions in their homes"
  ON public.care_plan_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_versions.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Managers manage care plan versions"
  ON public.care_plan_versions
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_versions.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Carers create care plan versions"
  ON public.care_plan_versions
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_versions.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Business owners manage care plan tasks"
  ON public.care_plan_tasks
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view care plan tasks in their homes"
  ON public.care_plan_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_plan_versions cpv
      JOIN public.care_plans cp ON cp.id = cpv.care_plan_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cpv.id = care_plan_tasks.care_plan_version_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Managers manage care plan tasks"
  ON public.care_plan_tasks
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.care_plan_versions cpv
      JOIN public.care_plans cp ON cp.id = cpv.care_plan_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cpv.id = care_plan_tasks.care_plan_version_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Carers update assigned care plan tasks"
  ON public.care_plan_tasks
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'carer' AND
    care_plan_tasks.assigned_to = auth.uid()
  );

CREATE POLICY "Carers create care plan tasks"
  ON public.care_plan_tasks
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.care_plan_versions cpv
      JOIN public.care_plans cp ON cp.id = cpv.care_plan_id
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cpv.id = care_plan_tasks.care_plan_version_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Business owners manage care plan reviews"
  ON public.care_plan_reviews
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view care plan reviews in their homes"
  ON public.care_plan_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_reviews.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Managers manage care plan reviews"
  ON public.care_plan_reviews
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_reviews.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Carers schedule care plan reviews"
  ON public.care_plan_reviews
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.id = care_plan_reviews.care_plan_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

-- Incident policies
CREATE POLICY "Business owners manage incident actions"
  ON public.incident_actions
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view incident actions in their homes"
  ON public.incident_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_actions.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

CREATE POLICY "Managers manage incident actions"
  ON public.incident_actions
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_actions.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

CREATE POLICY "Carers update assigned incident actions"
  ON public.incident_actions
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'carer' AND
    incident_actions.assigned_to = auth.uid()
  );

CREATE POLICY "Carers create incident actions"
  ON public.incident_actions
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_actions.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

CREATE POLICY "Business owners manage incident followups"
  ON public.incident_followups
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view incident followups in their homes"
  ON public.incident_followups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_followups.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

CREATE POLICY "Managers manage incident followups"
  ON public.incident_followups
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_followups.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

CREATE POLICY "Carers create incident followups"
  ON public.incident_followups
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_followups.incident_id
        AND user_has_care_home_access(auth.uid(), i.care_home_id)
    )
  );

-- Staffing policies
CREATE POLICY "Business owners manage shift templates"
  ON public.shift_templates
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view shift templates in their homes"
  ON public.shift_templates
  FOR SELECT
  USING (user_has_care_home_access(auth.uid(), care_home_id));

CREATE POLICY "Managers manage shift templates"
  ON public.shift_templates
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    user_has_care_home_access(auth.uid(), care_home_id)
  );

CREATE POLICY "Business owners manage shift assignments"
  ON public.shift_assignments
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view shift assignments in their homes"
  ON public.shift_assignments
  FOR SELECT
  USING (user_has_care_home_access(auth.uid(), care_home_id) OR shift_assignments.assigned_to = auth.uid());

CREATE POLICY "Managers manage shift assignments"
  ON public.shift_assignments
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    user_has_care_home_access(auth.uid(), care_home_id)
  );

CREATE POLICY "Carers update own shift assignments"
  ON public.shift_assignments
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'carer' AND
    shift_assignments.assigned_to = auth.uid()
  );

CREATE POLICY "Business owners manage staff availability"
  ON public.staff_availability
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Managers manage staff availability"
  ON public.staff_availability
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    (
      staff_availability.staff_id = auth.uid() OR
      (staff_availability.care_home_id IS NOT NULL AND user_has_care_home_access(auth.uid(), staff_availability.care_home_id))
    )
  );

CREATE POLICY "Users view their availability"
  ON public.staff_availability
  FOR SELECT
  USING (
    staff_availability.staff_id = auth.uid() OR
    user_has_care_home_access(auth.uid(), staff_availability.care_home_id)
  );

CREATE POLICY "Carers manage own availability"
  ON public.staff_availability
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'carer' AND
    staff_availability.staff_id = auth.uid()
  );

-- Compliance policies
CREATE POLICY "Business owners manage training records"
  ON public.training_records
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Managers manage training records"
  ON public.training_records
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.user_care_homes uch
      WHERE uch.user_id = training_records.staff_id
        AND user_has_care_home_access(auth.uid(), uch.care_home_id)
    )
  );

CREATE POLICY "Users view own training records"
  ON public.training_records
  FOR SELECT
  USING (training_records.staff_id = auth.uid());

CREATE POLICY "Business owners manage policy documents"
  ON public.policy_documents
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view policy documents for their homes"
  ON public.policy_documents
  FOR SELECT
  USING (
    policy_documents.care_home_id IS NULL OR
    user_has_care_home_access(auth.uid(), policy_documents.care_home_id)
  );

CREATE POLICY "Managers manage policy documents for their homes"
  ON public.policy_documents
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    (
      policy_documents.care_home_id IS NULL OR
      user_has_care_home_access(auth.uid(), policy_documents.care_home_id)
    )
  );

CREATE POLICY "Business owners manage resident documents"
  ON public.resident_documents
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view resident documents for their clients"
  ON public.resident_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = resident_documents.client_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Managers manage resident documents"
  ON public.resident_documents
  FOR ALL
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = resident_documents.client_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

CREATE POLICY "Carers upload resident documents"
  ON public.resident_documents
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'carer' AND
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = resident_documents.client_id
        AND user_has_care_home_access(auth.uid(), c.care_home_id)
    )
  );

-- Notification and audit policies
CREATE POLICY "Business owners manage notification queue"
  ON public.notification_queue
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view notifications addressed to them"
  ON public.notification_queue
  FOR SELECT
  USING (notification_queue.recipient_id = auth.uid());

CREATE POLICY "Managers view notifications for their teams"
  ON public.notification_queue
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'manager' AND
    EXISTS (
      SELECT 1 FROM public.user_care_homes uch
      WHERE uch.user_id = notification_queue.recipient_id
        AND user_has_care_home_access(auth.uid(), uch.care_home_id)
    )
  );

CREATE POLICY "Business owners manage audit events"
  ON public.audit_events
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view audit events for their homes"
  ON public.audit_events
  FOR SELECT
  USING (
    audit_events.care_home_id IS NULL OR
    user_has_care_home_access(auth.uid(), audit_events.care_home_id)
  );

-- Occupancy snapshots policies
CREATE POLICY "Business owners manage occupancy snapshots"
  ON public.occupancy_snapshots
  FOR ALL
  USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users view occupancy snapshots for their homes"
  ON public.occupancy_snapshots
  FOR SELECT
  USING (user_has_care_home_access(auth.uid(), care_home_id));

-- Triggers for updated_at columns
CREATE TRIGGER update_care_plan_versions_updated_at
  BEFORE UPDATE ON public.care_plan_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_tasks_updated_at
  BEFORE UPDATE ON public.care_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_reviews_updated_at
  BEFORE UPDATE ON public.care_plan_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_actions_updated_at
  BEFORE UPDATE ON public.incident_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at
  BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at
  BEFORE UPDATE ON public.shift_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at
  BEFORE UPDATE ON public.staff_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON public.training_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_documents_updated_at
  BEFORE UPDATE ON public.policy_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.care_plan_versions IS 'Historical versions of resident care plans with approval workflow metadata';
COMMENT ON TABLE public.care_plan_tasks IS 'Tasks derived from care plans to guide daily care delivery';
COMMENT ON TABLE public.care_plan_reviews IS 'Scheduled and completed care plan review records';
COMMENT ON TABLE public.incident_actions IS 'Follow-up actions for incidents including assignee and status';
COMMENT ON TABLE public.incident_followups IS 'Narrative follow-up notes and review reminders for incidents';
COMMENT ON TABLE public.shift_templates IS 'Reusable staffing templates per care home';
COMMENT ON TABLE public.shift_assignments IS 'Individual staff shift assignments and statuses';
COMMENT ON TABLE public.staff_availability IS 'Availability declarations from staff members';
COMMENT ON TABLE public.training_records IS 'Training compliance tracking for staff members';
COMMENT ON TABLE public.policy_documents IS 'Operational policies and procedures with versioning metadata';
COMMENT ON TABLE public.resident_documents IS 'Resident-specific documents stored in protected buckets';
COMMENT ON TABLE public.notification_queue IS 'Queued notifications for users, processed by scheduled workers';
COMMENT ON TABLE public.audit_events IS 'Immutable audit log of key user actions';
COMMENT ON TABLE public.occupancy_snapshots IS 'Daily occupancy metrics for each care home';
