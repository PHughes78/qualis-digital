// Supabase Edge Function: process queued notifications and send emails via Resend.
// Invoke manually, via scheduled job, or another workflow trigger.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const resendApiKey = Deno.env.get('RESEND_API_KEY')
const emailFrom = Deno.env.get('NOTIFICATION_EMAIL_FROM') ?? 'Qualis Digital <no-reply@qualis.digital>'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the send-notifications function.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

type NotificationRow = {
  id: string
  recipient_id: string | null
  channel: string
  status: string
  subject: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

type ProfileRow = {
  id: string
  email: string
  first_name: string
  last_name: string
}

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Use POST to trigger email sending.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!resendApiKey) {
    return new Response(JSON.stringify({ message: 'RESEND_API_KEY is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const batchSize = Number(new URL(request.url).searchParams.get('batch') ?? '25')

  const { data: queued, error: queuedError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('channel', 'email')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (queuedError) {
    console.error('send-notifications: failed to load queued notifications', queuedError)
    return new Response(JSON.stringify({ message: 'Unable to load queued notifications.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const notifications = (queued ?? []) as NotificationRow[]

  if (notifications.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: 'No queued email notifications.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const notificationIds = notifications.map((row) => row.id)
  const { error: lockError } = await supabase
    .from('notification_queue')
    .update({ status: 'sending' })
    .in('id', notificationIds)

  if (lockError) {
    console.error('send-notifications: failed to lock notifications', lockError)
    return new Response(JSON.stringify({ message: 'Unable to update notification status.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const recipientIds = Array.from(
    new Set(notifications.map((notification) => notification.recipient_id).filter(Boolean) as string[])
  )

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('id', recipientIds)

  if (profileError) {
    console.error('send-notifications: failed to load recipient profiles', profileError)
    return new Response(JSON.stringify({ message: 'Unable to load recipient profiles.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const profileById = new Map<string, ProfileRow>(profiles?.map((profile) => [profile.id, profile]) ?? [])
  const results: { id: string; status: 'sent' | 'failed'; error?: string }[] = []

  // Add delay between emails to respect rate limits (500ms = 2 requests/second max)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (const notification of notifications) {
    try {
      const profile = notification.recipient_id ? profileById.get(notification.recipient_id) : null

      if (!profile?.email) {
        throw new Error('Recipient email not found.')
      }

      const payload = (notification.payload ?? {}) as Record<string, unknown>
      const subject =
        (notification.subject ?? payload.subject ?? 'Qualis Digital update') as string
      const body = (payload.body ?? JSON.stringify(payload, null, 2)) as string
      const htmlBody = payload.htmlBody as string | undefined

      await sendEmail({
        to: profile.email,
        subject,
        text: body,
        html: htmlBody ?? body.replace(/\n/g, '<br />'),
      })

      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', notification.id)

      results.push({ id: notification.id, status: 'sent' })
      
      // Wait 500ms before next email to respect rate limits
      await delay(500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email.'
      console.error('send-notifications: email send failed', { id: notification.id, message })

      await supabase
        .from('notification_queue')
        .update({
          status: 'failed',
          error_message: message,
        })
        .eq('id', notification.id)

      results.push({ id: notification.id, status: 'failed', error: message })
    }
  }

  const sentCount = results.filter((result) => result.status === 'sent').length
  const failedCount = results.length - sentCount

  return new Response(
    JSON.stringify({
      processed: results.length,
      sent: sentCount,
      failed: failedCount,
      results,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Resend API error (${response.status}): ${errorBody}`)
  }
}

serve(handler)
