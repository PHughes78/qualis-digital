import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

type Topic = 'incident' | 'care_plan'

const TOPIC_PROMPTS: Record<Topic, string> = {
  incident:
    'Provide best-practice guidance for responding to the described care home incident in the UK. Focus on safeguarding, documentation, communication, and follow-up steps. Output 3 concise bullet points.',
  care_plan:
    'Provide best-practice guidance for drafting or updating a UK care home care plan based on the context. Focus on person-centred planning, multidisciplinary collaboration, and compliance considerations. Output 3 concise bullet points.',
}

export async function POST(request: Request) {
  try {
    const { topic, context } = await request.json()

    if (!topic || !TOPIC_PROMPTS[topic as Topic]) {
      return NextResponse.json({ message: 'Invalid topic supplied.' }, { status: 400 })
    }

    const [{ data: settings, error }, { data: practices, error: practicesError }] = await Promise.all([
      supabaseAdmin.from('company_settings').select('chatgpt_api_key').single(),
      supabaseAdmin
        .from('company_best_practices')
        .select('title, summary, content, external_url')
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (error) {
      console.error('guidance: failed to read company settings', error)
      return NextResponse.json({ message: 'Unable to read company settings.' }, { status: 500 })
    }

    if (!settings?.chatgpt_api_key) {
      return NextResponse.json(
        {
          message:
            'AI guidance is not configured yet. Add a ChatGPT API key in Company Settings to enable best-practice tips.',
          needsSetup: true,
        },
        { status: 200 }
      )
    }

    const formattedContext =
      context && typeof context === 'object'
        ? Object.entries(context)
            .filter(([_, value]) => value && String(value).trim().length > 0)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
        : ''

    const practiceSnippets =
      practicesError || !practices || practices.length === 0
        ? ''
        : `\n\nCompany guidance:\n${practices
            .map((practice) => {
              const parts = [practice.title]
              if (practice.summary) parts.push(practice.summary)
              if (practice.content) parts.push(practice.content)
              if (practice.external_url) parts.push(`Reference: ${practice.external_url}`)
              return `- ${parts.join(' — ')}`
            })
            .join('\n')}`

    const prompt = `${TOPIC_PROMPTS[topic as Topic]}\n\nContext:\n${formattedContext || 'No additional context provided.'}${practiceSnippets}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.chatgpt_api_key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an experienced UK care compliance consultant. Be concise, pragmatic, and highlight safeguarding responsibilities.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 250,
      }),
    })

    if (!response.ok) {
      console.error('guidance: OpenAI error', await response.text())
      return NextResponse.json(
        {
          message: 'Unable to fetch guidance from ChatGPT at this time.',
        },
        { status: 502 }
      )
    }

    const completion = await response.json()
    const message: string =
      completion?.choices?.[0]?.message?.content?.trim() ??
      'Guidance currently unavailable. Please review your inputs and try again.'

    return NextResponse.json({ message })
  } catch (error) {
    console.error('guidance: unexpected error', error)
    return NextResponse.json(
      { message: 'Unexpected error generating guidance. Please try again.' },
      { status: 500 }
    )
  }
}
