
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `
You are MedVault Health Companion, a friendly general wellness assistant.

Your responsibilities:
- Have natural, supportive, multi-turn conversations.
- Offer general wellness, beginner exercise, sleep, and healthy-habit guidance.
- Ask relevant follow-up questions before personalizing suggestions.
- Consider the user's stated activity level, goals, preferences, and limitations.
- Keep suggestions practical and encourage gradual progress.

Safety rules:
- Do not diagnose, rule out, or claim to identify diseases.
- Do not prescribe medicines or recommend changing medication.
- Do not present general information as a personalized medical diagnosis.
- Do not invent medical facts or claim certainty when uncertain.
- For potentially urgent symptoms, recommend appropriate urgent medical care
  instead of suggesting exercise or trying to manage the situation in chat.
- Tell users to stop exercising if they experience chest pain, fainting,
  severe breathlessness, or other concerning symptoms and seek appropriate care.
- Encourage a qualified healthcare professional for persistent symptoms or
  individualized medical advice.
- Be clear, respectful, and concise. Do not overwhelm the user with questions.
- You are an AI assistant, not a substitute for a healthcare professional.
`

type Provider = 'gemini' | 'openai'

interface Message {
    role: 'user' | 'assistant'
    text: string
}

interface RequestBody {
    provider: Provider
    apiKey: string
    messages: Message[]
}

function getProviderError(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') return undefined

    const obj = value as {
        error?: { message?: unknown }
        message?: unknown
    }

    if (typeof obj.error?.message === 'string') {
        return obj.error.message
    }

    if (typeof obj.message === 'string') {
        return obj.message
    }

    return undefined
}

export async function POST(request: Request) {
    try {
        // Verify the authenticated Supabase user.
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Please log in to use Health Chat.' },
                { status: 401 }
            )
        }

        let body: RequestBody

        try {
            body = (await request.json()) as RequestBody
        } catch {
            return NextResponse.json(
                { error: 'Request body must be valid JSON.' },
                { status: 400 }
            )
        }

        const { provider, apiKey, messages } = body ?? {}

        if (provider !== 'gemini' && provider !== 'openai') {
            return NextResponse.json(
                { error: 'Select a supported AI provider.' },
                { status: 400 }
            )
        }

        if (
            typeof apiKey !== 'string' ||
            apiKey.trim().length < 10 ||
            apiKey.length > 500
        ) {
            return NextResponse.json(
                { error: 'Enter a valid API key.' },
                { status: 400 }
            )
        }

        if (
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > 30
        ) {
            return NextResponse.json(
                { error: 'The conversation is empty or too long.' },
                { status: 400 }
            )
        }

        const safeMessages: Message[] = []

        for (const message of messages) {
            if (
                !message ||
                !['user', 'assistant'].includes(message.role) ||
                typeof message.text !== 'string' ||
                !message.text.trim() ||
                message.text.length > 5000
            ) {
                return NextResponse.json(
                    { error: 'A message is invalid or too long.' },
                    { status: 400 }
                )
            }

            safeMessages.push({
                role: message.role,
                text: message.text.trim(),
            })
        }

        // Send only recent conversation context.
        const conversation = safeMessages.slice(-20)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        let upstream: Response

        try {
            if (provider === 'gemini') {
                // Gemini generateContent API.
                upstream = await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey.trim(),
                        },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: SYSTEM_PROMPT }],
                            },
                            contents: conversation.map((message) => ({
                                role:
                                    message.role === 'assistant'
                                        ? 'model'
                                        : 'user',
                                parts: [{ text: message.text }],
                            })),
                            generationConfig: {
                                maxOutputTokens: 800,
                            },
                        }),
                        signal: controller.signal,
                    }
                )
            } else {
                // OpenAI Chat Completions API.
                upstream = await fetch(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${apiKey.trim()}`,
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [
                                {
                                    role: 'system',
                                    content: SYSTEM_PROMPT,
                                },
                                ...conversation.map((message) => ({
                                    role: message.role,
                                    content: message.text,
                                })),
                            ],
                            max_tokens: 800,
                        }),
                        signal: controller.signal,
                    }
                )
            }
        } finally {
            clearTimeout(timeout)
        }

        const result: unknown = await upstream.json().catch(() => null)

        if (!upstream.ok) {
            const providerMessage =
                getProviderError(result) ??
                'The provider returned no additional error details.'

            // Never log API keys or message content.
            console.error('Health Chat provider error:', {
                provider,
                status: upstream.status,
                message: providerMessage,
            })

            if (upstream.status === 401 || upstream.status === 403) {
                return NextResponse.json(
                    {
                        error:
                            'The API key was rejected. Check the provider, key, and permissions.',
                    },
                    { status: 400 }
                )
            }

            if (upstream.status === 429) {
                return NextResponse.json(
                    {
                        error:
                            'The provider quota or rate limit was reached. Check your usage or try again later.',
                    },
                    { status: 429 }
                )
            }

            if (upstream.status === 503) {
                return NextResponse.json(
                    {
                        error:
                            'Gemini is temporarily unavailable or overloaded. Please try again later or switch providers.',
                    },
                    { status: 503 }
                )
            }

            return NextResponse.json(
                {
                    error: 'The AI provider request failed.',
                    details: providerMessage,
                },
                { status: 502 }
            )
        }

        let reply: string | undefined

        if (provider === 'gemini') {
            // Correct response format for generateContent.
            const geminiResult = result as {
                candidates?: Array<{
                    content?: {
                        parts?: Array<{ text?: string }>
                    }
                }>
            } | null

            reply = geminiResult?.candidates?.[0]?.content?.parts
                ?.map((part) => part.text ?? '')
                .join('')
        } else {
            const openAIResult = result as {
                choices?: Array<{
                    message?: { content?: string | null }
                }>
            } | null

            reply =
                openAIResult?.choices?.[0]?.message?.content ??
                undefined
        }

        if (typeof reply !== 'string' || !reply.trim()) {
            console.error(
                'Health Chat returned an empty or unexpected response.',
                { provider }
            )

            return NextResponse.json(
                {
                    error:
                        'The AI provider returned an empty response. Please try again.',
                },
                { status: 502 }
            )
        }

        return NextResponse.json({ reply: reply.trim() })
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            (error.name === 'TimeoutError' ||
                error.name === 'AbortError')
        ) {
            console.error('Health Chat provider request timed out.')

            return NextResponse.json(
                {
                    error:
                        'The AI provider took too long to respond. Please try again or switch providers.',
                },
                { status: 504 }
            )
        }

        console.error(
            'Health Chat route failure:',
            error instanceof Error
                ? error.message
                : 'Unknown error'
        )

        return NextResponse.json(
            {
                error:
                    'Health Chat request failed. Please try again.',
            },
            { status: 500 }
        )
    }
}
