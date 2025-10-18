import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import type { NotificationChannel } from '@/lib/database.types'

type IncidentCreatedEvent = {
  type: 'incident.created'
  incidentId: string
  careHomeId: string
  details: {
    incidentType: string
    severity: string
    clientName?: string | null
    reporterName?: string | null
    incidentDate: string
  }
}

type CarePlanCreatedEvent = {
  type: 'care_plan.created'
  carePlanId: string
  clientId: string
  details: {
    title: string
    clientName?: string | null
    creatorName?: string | null
    startDate: string
    reviewDate?: string | null
  }
}

type WorkflowEventPayload = IncidentCreatedEvent | CarePlanCreatedEvent

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
    }

    const payload = (await request.json()) as WorkflowEventPayload

    if (!payload?.type) {
      return NextResponse.json({ message: 'Invalid workflow event payload.' }, { status: 400 })
    }

    if (payload.type === 'incident.created') {
      return await handleIncidentCreated(payload, user.id)
    }

    if (payload.type === 'care_plan.created') {
      return await handleCarePlanCreated(payload, user.id)
    }

    return NextResponse.json({ message: `Unsupported workflow event type: ${payload.type}` }, { status: 400 })
  } catch (error) {
    console.error('workflow-events: unexpected error', error)
    return NextResponse.json(
      { message: 'Failed to process workflow automation event.' },
      { status: 500 }
    )
  }
}

async function handleIncidentCreated(event: IncidentCreatedEvent, actorId: string) {
  const { incidentId, careHomeId, details } = event

  if (!incidentId || !careHomeId) {
    return NextResponse.json({ message: 'Incident details incomplete.' }, { status: 400 })
  }

  const careHomeResult = await serviceClient
    .from('care_homes')
    .select('id, name')
    .eq('id', careHomeId)
    .maybeSingle()

  if (careHomeResult.error) {
    console.error('workflow-events: failed to load care home', careHomeResult.error)
    return NextResponse.json(
      { message: 'Unable to load care home for incident workflow.' },
      { status: 500 }
    )
  }

  const careHomeName = careHomeResult.data?.name ?? 'Care Home'
  const clientName = details.clientName ?? 'Resident'

  const notificationSubject = `Incident logged: ${clientName}`
  const notificationMessage = `${details.incidentType} (${details.severity}) recorded for ${clientName} at ${careHomeName}.`

  const recipients = await resolveRecipients(careHomeId, actorId)

  const entityPayload = {
    type: event.type,
    entityType: 'incident',
    entityId: incidentId,
    severity: details.severity,
    incidentType: details.incidentType,
    incidentDate: details.incidentDate,
    clientName,
    reporterName: details.reporterName ?? null,
    careHomeId,
    careHomeName,
    link: `/incidents/${incidentId}`,
  }

  await Promise.all([
    queueNotifications(recipients, actorId, notificationSubject, notificationMessage, entityPayload),
    createAuditEvent({
      actorId,
      careHomeId,
      entityId: incidentId,
      entityType: 'incident',
      description: notificationMessage,
      metadata: entityPayload,
    }),
  ])

  return NextResponse.json({ processed: true }, { status: 200 })
}

async function handleCarePlanCreated(event: CarePlanCreatedEvent, actorId: string) {
  const { carePlanId, clientId, details } = event

  if (!carePlanId || !clientId) {
    return NextResponse.json({ message: 'Care plan details incomplete.' }, { status: 400 })
  }

  const { careHomeId, careHomeName, clientName } = await resolveCareContext(clientId, details.clientName)
  if (!careHomeId) {
    return NextResponse.json({ message: 'Care plan client missing care home context.' }, { status: 400 })
  }

  const recipients = await resolveRecipients(careHomeId, actorId)

  const notificationSubject = `Care plan created: ${clientName}`
  const notificationMessage = `${details.title} drafted for ${clientName} at ${careHomeName}.`

  const entityPayload = {
    type: event.type,
    entityType: 'care_plan',
    entityId: carePlanId,
    title: details.title,
    clientId,
    clientName,
    startDate: details.startDate,
    reviewDate: details.reviewDate ?? null,
    creatorName: details.creatorName ?? null,
    careHomeId,
    careHomeName,
    link: `/care-plans/${carePlanId}`,
  }

  await Promise.all([
    queueNotifications(recipients, actorId, notificationSubject, notificationMessage, entityPayload),
    createAuditEvent({
      actorId,
      careHomeId,
      entityId: carePlanId,
      entityType: 'care_plan',
      description: notificationMessage,
      metadata: entityPayload,
    }),
  ])

  return NextResponse.json({ processed: true }, { status: 200 })
}

async function resolveCareContext(clientId: string, fallbackName?: string | null) {
  const { data, error } = await serviceClient
    .from('clients')
    .select('id, first_name, last_name, care_home_id, care_homes(name)')
    .eq('id', clientId)
    .maybeSingle()

  if (error) {
    console.error('workflow-events: failed to resolve client context', error)
    return { careHomeId: null, careHomeName: 'Care Home', clientName: fallbackName ?? 'Resident' }
  }

  const careHomeId = data?.care_home_id ?? null
  const careHomeName = (data as any)?.care_homes?.name ?? 'Care Home'
  const clientName =
    data?.first_name && data?.last_name
      ? `${data.first_name} ${data.last_name}`
      : fallbackName ?? 'Resident'

  return { careHomeId, careHomeName, clientName }
}

async function resolveRecipients(careHomeId: string, actorId: string) {
  const recipients = new Set<string>()

  const [{ data: managerRows, error: managerError }, { data: ownerRows, error: ownerError }] = await Promise.all([
    serviceClient
      .from('manager_care_homes')
      .select('manager_id')
      .eq('care_home_id', careHomeId),
    serviceClient
      .from('profiles')
      .select('id')
      .eq('role', 'business_owner')
      .eq('is_active', true),
  ])

  if (managerError) {
    console.error('workflow-events: failed to load manager recipients', managerError)
  }

  if (ownerError) {
    console.error('workflow-events: failed to load owner recipients', ownerError)
  }

  managerRows?.forEach((row) => {
    if (row.manager_id && row.manager_id !== actorId) {
      recipients.add(row.manager_id)
    }
  })

  ownerRows?.forEach((row) => {
    if (row.id && row.id !== actorId) {
      recipients.add(row.id)
    }
  })

  return Array.from(recipients)
}

async function queueNotifications(
  recipientIds: string[],
  actorId: string,
  subject: string,
  body: string,
  payload: Record<string, unknown>,
  channels: NotificationChannel[] = ['in_app', 'email']
) {
  if (!recipientIds.length) return

  const entityType =
    typeof payload.entityType === 'string' ? (payload.entityType as string) : null
  const entityId =
    typeof payload.entityId === 'string' ? (payload.entityId as string) : null

  const enrichedPayload = {
    ...payload,
    subject,
    body,
  }

  const notifications = recipientIds.flatMap((recipientId) =>
    channels.map((channel) => ({
      recipient_id: recipientId,
      channel,
      status: 'queued' as const,
      subject,
      payload: {
        ...enrichedPayload,
        channel,
      },
      related_entity_type: entityType,
      related_entity_id: entityId,
      created_by: actorId,
    }))
  )

  const { error } = await serviceClient.from('notification_queue').insert(notifications)
  if (error) {
    console.error('workflow-events: failed to queue notifications', error)
  }
}

async function createAuditEvent({
  actorId,
  careHomeId,
  entityType,
  entityId,
  description,
  metadata,
}: {
  actorId: string
  careHomeId: string | null
  entityType: string
  entityId: string
  description: string
  metadata: Record<string, unknown>
}) {
  const { error } = await serviceClient.from('audit_events').insert({
    actor_id: actorId,
    care_home_id: careHomeId,
    entity_type: entityType,
    entity_id: entityId,
    action: 'created',
    description,
    metadata,
  })

  if (error) {
    console.error('workflow-events: failed to create audit event', error)
  }
}
