-- Phase 2 Sample Data Seed
-- Safely populates the new workflow tables with representative records for local development and previews.
-- Run in Supabase SQL editor or via `supabase db query < supabase/seeds/phase2_sample_data.sql`.

DO $$
DECLARE
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
  v_owner UUID;
  v_manager UUID;
  v_carer UUID;
  v_care_home UUID;
  v_client UUID;
  v_care_plan UUID;
  v_care_plan_version UUID;
  v_incident UUID;
  v_home_capacity INTEGER;
  v_home_occupancy INTEGER;
BEGIN
  SELECT id INTO v_owner
  FROM public.profiles
  WHERE role = 'business_owner'
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_manager
  FROM public.profiles
  WHERE role = 'manager'
  ORDER BY created_at
  LIMIT 1;

  IF v_manager IS NULL THEN
    v_manager := v_owner;
  END IF;

  SELECT id INTO v_carer
  FROM public.profiles
  WHERE role = 'carer'
  ORDER BY created_at
  LIMIT 1;

  IF v_carer IS NULL THEN
    v_carer := COALESCE(v_manager, v_owner);
  END IF;

  SELECT c.id, c.care_home_id INTO v_client, v_care_home
  FROM public.clients c
  ORDER BY c.created_at
  LIMIT 1;

  IF v_care_home IS NULL THEN
    SELECT id INTO v_care_home
    FROM public.care_homes
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_care_home IS NULL THEN
    RAISE NOTICE 'Phase 2 seed skipped: no care homes available.';
    RETURN;
  END IF;

  SELECT capacity, current_occupancy
  INTO v_home_capacity, v_home_occupancy
  FROM public.care_homes
  WHERE id = v_care_home;

  IF v_client IS NULL THEN
    INSERT INTO public.clients (
      care_home_id,
      nhs_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      postcode,
      emergency_contact_name,
      emergency_contact_phone,
      is_active
    )
    VALUES (
      v_care_home,
      CONCAT('NHS', FLOOR(RANDOM() * 1000000000)::TEXT),
      'Seed',
      'Resident',
      DATE '1940-01-01',
      'other',
      '123 Sample Street',
      'SW1A 1AA',
      'Seed Contact',
      '+441234567890',
      TRUE
    )
    RETURNING id INTO v_client;
  END IF;

  SELECT id INTO v_care_plan
  FROM public.care_plans
  WHERE client_id = v_client
  ORDER BY created_at
  LIMIT 1;

  IF v_care_plan IS NULL THEN
    INSERT INTO public.care_plans (
      client_id,
      created_by,
      title,
      description,
      goals,
      interventions,
      start_date,
      review_date,
      is_active
    )
    VALUES (
      v_client,
      v_manager,
      'Baseline Plan',
      'Seeded care plan for local development',
      'Maintain independence and wellbeing',
      'Provide daily support with hydration, mobility, and medication',
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE + INTERVAL '150 days',
      TRUE
    )
    RETURNING id INTO v_care_plan;
  END IF;

  INSERT INTO public.care_plan_versions (
    care_plan_id,
    version_number,
    status,
    title,
    summary,
    effective_from,
    created_by,
    approved_by,
    approved_at,
    is_active
  )
  VALUES (
    v_care_plan,
    1,
    'active',
    'Active Baseline Plan',
    'Latest approved version seeded for testing',
    v_now - INTERVAL '7 days',
    v_manager,
    v_owner,
    v_now - INTERVAL '6 days',
    TRUE
  )
  ON CONFLICT (care_plan_id, version_number)
  DO NOTHING
  RETURNING id INTO v_care_plan_version;

  IF v_care_plan_version IS NULL THEN
    SELECT id INTO v_care_plan_version
    FROM public.care_plan_versions
    WHERE care_plan_id = v_care_plan
    ORDER BY is_active DESC, version_number DESC
    LIMIT 1;
  END IF;

  IF v_care_plan_version IS NOT NULL THEN
    INSERT INTO public.care_plan_tasks (
      care_plan_version_id,
      title,
      description,
      priority,
      status,
      assigned_to,
      due_date,
      created_by
    )
    SELECT
      v_care_plan_version,
      'Monitor hydration levels',
      'Check fluid intake each shift and record in charts.',
      'high',
      'in_progress',
      v_carer,
      CURRENT_DATE + INTERVAL '1 day',
      v_manager
    WHERE NOT EXISTS (
      SELECT 1 FROM public.care_plan_tasks
      WHERE care_plan_version_id = v_care_plan_version
        AND title = 'Monitor hydration levels'
    );

    INSERT INTO public.care_plan_tasks (
      care_plan_version_id,
      title,
      description,
      priority,
      status,
      assigned_to,
      due_date,
      created_by
    )
    SELECT
      v_care_plan_version,
      'Physiotherapy exercises',
      'Assist resident with prescribed mobility exercises twice daily.',
      'medium',
      'pending',
      v_carer,
      CURRENT_DATE + INTERVAL '2 days',
      v_manager
    WHERE NOT EXISTS (
      SELECT 1 FROM public.care_plan_tasks
      WHERE care_plan_version_id = v_care_plan_version
        AND title = 'Physiotherapy exercises'
    );

    INSERT INTO public.care_plan_reviews (
      care_plan_id,
      scheduled_for,
      status,
      notes,
      created_by,
      reminder_sent_at
    )
    SELECT
      v_care_plan,
      CURRENT_DATE + INTERVAL '30 days',
      'scheduled',
      'Auto-seeded review reminder.',
      v_manager,
      NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM public.care_plan_reviews
      WHERE care_plan_id = v_care_plan
        AND scheduled_for = CURRENT_DATE + INTERVAL '30 days'
    );
  END IF;

  SELECT id INTO v_incident
  FROM public.incidents
  WHERE care_home_id = v_care_home
  ORDER BY created_at
  LIMIT 1;

  IF v_incident IS NOT NULL THEN
    INSERT INTO public.incident_actions (
      incident_id,
      title,
      description,
      status,
      assigned_to,
      due_at,
      created_by
    )
    SELECT
      v_incident,
      'Review risk assessment',
      'Update risk assessment following the recent incident.',
      'in_progress',
      v_manager,
      v_now + INTERVAL '2 days',
      v_owner
    WHERE NOT EXISTS (
      SELECT 1 FROM public.incident_actions
      WHERE incident_id = v_incident
        AND title = 'Review risk assessment'
    );

    INSERT INTO public.incident_followups (
      incident_id,
      note,
      recorded_by,
      recorded_at,
      next_review_at,
      visibility
    )
    SELECT
      v_incident,
      'Checked-in with resident and staff, no further issues noted.',
      v_manager,
      v_now,
      v_now + INTERVAL '3 days',
      'internal'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.incident_followups
      WHERE incident_id = v_incident
        AND note LIKE 'Checked-in with resident%'
    );
  END IF;

  INSERT INTO public.shift_templates (
    care_home_id,
    name,
    description,
    shift_type,
    starts_at,
    ends_at,
    default_staff_count,
    created_by
  )
  SELECT
    v_care_home,
    'Day Shift Core Coverage',
    'Baseline template for daytime staffing.',
    'day',
    TIME '07:00',
    TIME '15:00',
    4,
    v_manager
  WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_templates
    WHERE care_home_id = v_care_home
      AND name = 'Day Shift Core Coverage'
  );

  INSERT INTO public.shift_assignments (
    care_home_id,
    shift_date,
    shift_type,
    shift_template_id,
    assigned_to,
    status,
    notes,
    created_by
  )
  SELECT
    v_care_home,
    CURRENT_DATE,
    'day',
    st.id,
    v_carer,
    'confirmed',
    'Seeded rota entry for dashboard metrics.',
    v_manager
  FROM public.shift_templates st
  WHERE st.care_home_id = v_care_home
    AND st.name = 'Day Shift Core Coverage'
    AND NOT EXISTS (
      SELECT 1 FROM public.shift_assignments
      WHERE care_home_id = v_care_home
        AND shift_date = CURRENT_DATE
        AND shift_type = 'day'
        AND assigned_to = v_carer
    )
  LIMIT 1;

  INSERT INTO public.staff_availability (
    staff_id,
    care_home_id,
    availability,
    available_from,
    available_to,
    notes,
    created_by
  )
  SELECT
    v_carer,
    v_care_home,
    'available',
    v_now + INTERVAL '1 day',
    v_now + INTERVAL '1 day 8 hours',
    'Seeded availability block for rota planning.',
    v_manager
  WHERE NOT EXISTS (
    SELECT 1 FROM public.staff_availability
    WHERE staff_id = v_carer
      AND available_from::date = (v_now + INTERVAL '1 day')::date
  );

  INSERT INTO public.training_records (
    staff_id,
    training_name,
    provider,
    status,
    due_date,
    completed_at,
    certificate_url,
    notes,
    created_by
  )
  SELECT
    v_carer,
    'Safeguarding Level 2',
    'In-house',
    'completed',
    CURRENT_DATE - INTERVAL '365 days',
    v_now - INTERVAL '200 days',
    NULL,
    'Seeded training record for compliance dashboard.',
    v_manager
  WHERE NOT EXISTS (
    SELECT 1 FROM public.training_records
    WHERE staff_id = v_carer
      AND training_name = 'Safeguarding Level 2'
  );

  INSERT INTO public.policy_documents (
    title,
    description,
    file_path,
    version,
    status,
    published_at,
    review_date,
    care_home_id,
    created_by
  )
  SELECT
    'Infection Control Policy',
    'Seeded policy document with review date.',
    'policy/infection-control-v1.pdf',
    '1.0',
    'published',
    v_now - INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '180 days',
    NULL,
    v_owner
  WHERE NOT EXISTS (
    SELECT 1 FROM public.policy_documents
    WHERE title = 'Infection Control Policy'
  );

  INSERT INTO public.resident_documents (
    client_id,
    title,
    document_type,
    file_path,
    visibility,
    uploaded_by,
    uploaded_at,
    notes
  )
  SELECT
    v_client,
    'Care Plan Summary',
    'care_plan_summary',
    'residents/' || v_client || '/care-plan-summary.pdf',
    'care_team',
    v_manager,
    v_now,
    'Seeded document for resident record preview.'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.resident_documents
    WHERE client_id = v_client
      AND document_type = 'care_plan_summary'
  );

  INSERT INTO public.notification_queue (
    recipient_id,
    channel,
    status,
    subject,
    payload,
    send_after,
    related_entity_type,
    related_entity_id,
    created_by
  )
  SELECT
    v_carer,
    'in_app',
    'queued',
    'Upcoming Care Plan Review',
    jsonb_build_object(
      'message',
      'Care plan review scheduled in 30 days.',
      'care_plan_id',
      v_care_plan
    ),
    v_now + INTERVAL '12 hours',
    'care_plan',
    v_care_plan,
    v_manager
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_queue
    WHERE recipient_id = v_carer
      AND related_entity_type = 'care_plan'
      AND related_entity_id = v_care_plan
  );

  INSERT INTO public.audit_events (
    actor_id,
    care_home_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata,
    created_at
  )
  SELECT
    v_manager,
    v_care_home,
    'care_plan_version',
    v_care_plan_version,
    'care_plan_version_published',
    'Seeded audit event for new care plan version.',
    jsonb_build_object(
      'version_number', 1,
      'care_plan_id', v_care_plan
    ),
    v_now
  WHERE v_care_plan_version IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.audit_events
      WHERE entity_type = 'care_plan_version'
        AND entity_id = v_care_plan_version
    );

  INSERT INTO public.occupancy_snapshots (
    care_home_id,
    snapshot_date,
    occupancy,
    capacity,
    waitlist_count,
    generated_at
  )
  SELECT
    v_care_home,
    CURRENT_DATE,
    COALESCE(v_home_occupancy, 0),
    COALESCE(v_home_capacity, 0),
    2,
    v_now
  WHERE NOT EXISTS (
    SELECT 1 FROM public.occupancy_snapshots
    WHERE care_home_id = v_care_home
      AND snapshot_date = CURRENT_DATE
  );

  RAISE NOTICE 'Phase 2 seed complete.';
END;
$$;
