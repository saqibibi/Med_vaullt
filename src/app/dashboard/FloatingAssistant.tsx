
'use client'

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from 'react'
import {
    Bot,
    MessageCircle,
    X,
    Send,
    FileText,
    ExternalLink,
    Loader2,
    Minimize2,
    HeartPulse,
    Settings,
    Trash2,
    Grip,
    Eye,
    EyeOff,
} from 'lucide-react'

interface SearchResult {
    id: string
    title: string
    fileName: string
    category: string
    reportDate: string | null
    uploadDate: string
    summary: string | null
    matchingKeywords: string[]
    matchingMeasurements: Array<{
        testName: string
        valueText: string
        valueNumeric: number | null
        unit: string | null
        referenceRange: string | null
        testDate: string | null
    }>
    processingStatus: string
    relevanceScore: number
    openUrl: string
}

interface ChatMessage {
    role: 'user' | 'assistant'
    text: string
    results?: SearchResult[]
}

interface SelectedReport {
    id: string
    title: string
    fileName: string
    url: string
}

type ChatMode = 'finder' | 'health'
type LLMProvider = 'gemini' | 'openai'
type Position = { left: number; top: number }

const FINDER_GREETING: ChatMessage = {
    role: 'assistant',
    text: "Hi! I'm your MedVault assistant. Ask me to find your medical reports, test results, or health records.",
}

const HEALTH_GREETING: ChatMessage = {
    role: 'assistant',
    text: "Hi! I'm your MedVault Health Companion. We can talk about exercise, sleep, nutrition, and general wellness. What would you like help with?",
}

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [openingReportId, setOpeningReportId] = useState<string | null>(null)
    const [selectedReport, setSelectedReport] =
        useState<SelectedReport | null>(null)

    // Each mode has its own conversation.
    const [activeMode, setActiveMode] = useState<ChatMode>('finder')
    const [messages, setMessages] = useState<ChatMessage[]>([
        FINDER_GREETING,
    ])
    const [healthMessages, setHealthMessages] = useState<ChatMessage[]>([
        HEALTH_GREETING,
    ])

    // Prototype API settings. The key is memory-only and is lost on refresh.
    const [provider, setProvider] = useState<LLMProvider>('gemini')
    const [apiKey, setApiKey] = useState('')
    const [settingsKey, setSettingsKey] = useState('')
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)

    // Draggable widget position.
    const [position, setPosition] = useState<Position | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const widgetRef = useRef<HTMLDivElement>(null)

    const dragRef = useRef({
        active: false,
        moved: false,
        pointerX: 0,
        pointerY: 0,
        left: 0,
        top: 0,
    })

    const suppressClickRef = useRef(false)

    const activeMessages =
        activeMode === 'finder' ? messages : healthMessages

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        })
    }, [messages, healthMessages, loading, activeMode])

    useEffect(() => {
        if (isOpen && !selectedReport && !settingsOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen, selectedReport, settingsOpen, activeMode])

    // Drag the launcher or the chatbot header.
    const startDrag = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (event.button !== 0) return

            const target = event.target as HTMLElement
            const isLauncher = Boolean(
                target.closest('[data-draggable-launcher]')
            )

            // Do not start dragging when clicking interactive header controls.
            if (
                !isLauncher &&
                target.closest('button, input, select, textarea, a')
            ) {
                return
            }

            const rect = widgetRef.current?.getBoundingClientRect()
            if (!rect) return

            event.preventDefault()

            dragRef.current = {
                active: true,
                moved: false,
                pointerX: event.clientX,
                pointerY: event.clientY,
                left: rect.left,
                top: rect.top,
            }

            const onMove = (moveEvent: PointerEvent) => {
                if (!dragRef.current.active) return

                const dx = moveEvent.clientX - dragRef.current.pointerX
                const dy = moveEvent.clientY - dragRef.current.pointerY

                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    dragRef.current.moved = true
                }

                if (!dragRef.current.moved) return

                const currentRect =
                    widgetRef.current?.getBoundingClientRect()

                const width = currentRect?.width ?? 390
                const height = currentRect?.height ?? 80

                const left = Math.max(
                    8,
                    Math.min(
                        window.innerWidth - width - 8,
                        dragRef.current.left + dx
                    )
                )

                const top = Math.max(
                    8,
                    Math.min(
                        window.innerHeight - height - 8,
                        dragRef.current.top + dy
                    )
                )

                setPosition({ left, top })
            }

            const onUp = () => {
                dragRef.current.active = false

                if (dragRef.current.moved) {
                    suppressClickRef.current = true
                    window.setTimeout(() => {
                        suppressClickRef.current = false
                    }, 0)
                }

                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerup', onUp)
                window.removeEventListener('pointercancel', onUp)
            }

            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp)
            window.addEventListener('pointercancel', onUp)
        },
        []
    )

    function openWidget() {
        if (suppressClickRef.current) return

        if (position) {
            const width = Math.min(390, window.innerWidth - 16)
            const height = Math.min(680, window.innerHeight - 16)

            setPosition({
                left: Math.max(
                    8,
                    Math.min(window.innerWidth - width - 8, position.left)
                ),
                top: Math.max(
                    8,
                    Math.min(window.innerHeight - height - 8, position.top)
                ),
            })
        }

        setIsOpen(true)
    }

    // Existing report-finder functionality.
    async function sendMessage() {
        const query = input.trim()
        if (!query || loading) return

        setInput('')
        setMessages((previous) => [
            ...previous,
            { role: 'user', text: query },
        ])
        setLoading(true)

        try {
            const response = await fetch('/api/assistant/chat-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            })

            if (response.status === 401) {
                setMessages((previous) => [
                    ...previous,
                    {
                        role: 'assistant',
                        text: 'Your session has expired. Please log in again to search your reports.',
                    },
                ])
                return
            }

            const data = await response.json()

            if (!response.ok) {
                const details = data.details ? `\nDetails: ${data.details}` : ''

                throw new Error(
                    (data.error || 'Unable to get an AI response.') + details
                )
            }

            const results: SearchResult[] = Array.isArray(data.results)
                ? data.results
                : []

            const count = data.count ?? results.length

            const reply =
                results.length === 0
                    ? "I couldn't find a matching report. Try a test name such as hemoglobin, a category, or a report filename."
                    : `I found ${count} matching report${count === 1 ? '' : 's'}. Here are the most relevant results:`

            setMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    text: reply,
                    results: results.slice(0, 5),
                },
            ])
        } catch (error) {
            console.error('MedVault assistant search failed:', error)

            setMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    text: 'Something went wrong while searching. Please try again.',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    // New LLM-powered Health Chat.
    async function sendHealthMessage() {
        const query = input.trim()
        if (!query || loading) return

        if (!apiKey.trim()) {
            setSettingsKey('')
            setSettingsOpen(true)
            return
        }

        const conversation: ChatMessage[] = [
            ...healthMessages,
            { role: 'user', text: query },
        ]

        setInput('')
        setHealthMessages(conversation)
        setLoading(true)

        try {
            const response = await fetch('/api/health-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    messages: conversation
                        // The initial greeting is UI-only.
                        .filter(
                            (message, index) =>
                                !(index === 0 && message.role === 'assistant')
                        )
                        .map(({ role, text }) => ({ role, text })),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || 'Unable to get an AI response.'
                )
            }

            setHealthMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    text: data.reply,
                },
            ])
        } catch (error) {
            setHealthMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    text:
                        error instanceof Error
                            ? error.message
                            : 'Something went wrong. Please try again.',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    // Open a report inside the MedVault interface.
    async function handleViewReport(report: SearchResult) {
        if (openingReportId) return

        setOpeningReportId(report.id)

        try {
            const response = await fetch(
                `/api/reports/${encodeURIComponent(report.id)}/open?json=true`
            )

            const data = await response.json()

            if (!response.ok || !data.url) {
                throw new Error(
                    data.error || 'Unable to open this report.'
                )
            }

            setSelectedReport({
                id: report.id,
                title: report.title || report.fileName || 'Medical report',
                fileName: report.fileName || '',
                url: data.url,
            })
        } catch (error) {
            console.error('Failed to open report:', error)

            setMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    text: 'Unable to open this report. Please try again.',
                },
            ])
        } finally {
            setOpeningReportId(null)
        }
    }

    function clearCurrentChat() {
        const confirmed = window.confirm(
            activeMode === 'finder'
                ? 'Clear the report finder conversation? Your medical reports will not be deleted.'
                : 'Clear the Health Chat conversation?'
        )

        if (!confirmed) return

        if (activeMode === 'finder') {
            setMessages([FINDER_GREETING])
        } else {
            setHealthMessages([HEALTH_GREETING])
        }
    }

    function saveApiKey() {
        const key = settingsKey.trim()

        if (key.length < 10) {
            window.alert('Please enter a valid API key.')
            return
        }

        setApiKey(key)
        setSettingsOpen(false)
        setSettingsKey('')
        setShowApiKey(false)
    }

    function closeReportViewer() {
        setSelectedReport(null)
    }

    const fileName = selectedReport?.fileName ?? ''
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)
    const isPdf = /\.pdf$/i.test(fileName)

    return (
        <>
            {/* Draggable floating chatbot */}
            <div
                ref={widgetRef}
                className={`fixed z-[100] ${position ? '' : 'bottom-6 right-4 md:right-6'
                    }`}
                style={
                    position
                        ? {
                            left: position.left,
                            top: position.top,
                        }
                        : undefined
                }
            >
                {isOpen && (
                    <section
                        className="mb-3 flex h-[min(620px,calc(100dvh-32px))] w-[min(390px,calc(100vw-16px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        aria-label="MedVault assistant"
                    >
                        {/* Header can be dragged */}
                        <header
                            onPointerDown={startDrag}
                            className="cursor-grab touch-none bg-slate-900 px-4 py-4 text-white active:cursor-grabbing"
                            title="Drag to move the chatbot"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                        <Bot className="h-6 w-6" />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold">
                                            MedVault Assistant
                                        </h2>
                                        <p className="text-xs text-slate-300">
                                            {activeMode === 'finder'
                                                ? 'Search your medical records'
                                                : 'Your wellness companion'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Minimize chatbot"
                                    className="rounded-lg p-2 hover:bg-white/10"
                                >
                                    <Minimize2 className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Separate modes in the same chatbot */}
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveMode('finder')}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition ${activeMode === 'finder'
                                            ? 'bg-white text-slate-900'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <FileText className="h-4 w-4" />
                                    Report Finder
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveMode('health')}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition ${activeMode === 'health'
                                            ? 'bg-white text-slate-900'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <HeartPulse className="h-4 w-4" />
                                    AI Health Chat
                                </button>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                    <Grip className="h-3 w-3" />
                                    Drag header to move
                                </span>

                                <div className="flex gap-1">
                                    {activeMode === 'health' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSettingsKey('')
                                                setSettingsOpen(true)
                                            }}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                            API Settings
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={clearCurrentChat}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Clear chat
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Conversation */}
                        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
                            {activeMessages.map((message, index) => (
                                <div
                                    key={`${activeMode}-${index}`}
                                    className={`flex ${message.role === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-sm ${message.role === 'user'
                                                ? 'rounded-br-sm bg-slate-900 text-white'
                                                : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">
                                            {message.text}
                                        </p>

                                        {/* Report cards appear only in Finder mode */}
                                        {activeMode === 'finder' &&
                                            message.results &&
                                            message.results.length > 0 && (
                                                <div className="mt-3 space-y-3">
                                                    {message.results.map(
                                                        (report) => (
                                                            <article
                                                                key={report.id}
                                                                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="break-words font-semibold text-slate-900">
                                                                            {report.title ||
                                                                                report.fileName}
                                                                        </h3>

                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            {report.category ||
                                                                                'Medical document'}
                                                                        </p>

                                                                        {report.reportDate && (
                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                Report
                                                                                date:{' '}
                                                                                {
                                                                                    report.reportDate
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {report.summary && (
                                                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                                                        {report.summary.length >
                                                                            180
                                                                            ? `${report.summary.slice(
                                                                                0,
                                                                                180
                                                                            )}...`
                                                                            : report.summary}
                                                                    </p>
                                                                )}

                                                                {report.matchingMeasurements?.length >
                                                                    0 && (
                                                                        <div className="mt-2 space-y-1">
                                                                            {report.matchingMeasurements
                                                                                .slice(
                                                                                    0,
                                                                                    3
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        measurement,
                                                                                        i
                                                                                    ) => (
                                                                                        <p
                                                                                            key={`${measurement.testName}-${i}`}
                                                                                            className="text-xs text-slate-700"
                                                                                        >
                                                                                            <span className="font-medium">
                                                                                                {
                                                                                                    measurement.testName
                                                                                                }
                                                                                                :
                                                                                            </span>{' '}
                                                                                            {measurement.valueText ??
                                                                                                measurement.valueNumeric ??
                                                                                                'Value unavailable'}
                                                                                            {measurement.unit
                                                                                                ? ` ${measurement.unit}`
                                                                                                : ''}
                                                                                        </p>
                                                                                    )
                                                                                )}
                                                                        </div>
                                                                    )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleViewReport(
                                                                            report
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        openingReportId !==
                                                                        null
                                                                    }
                                                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {openingReportId ===
                                                                        report.id ? (
                                                                        <>
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                            Opening...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            View
                                                                            report
                                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </article>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {activeMode === 'finder'
                                        ? 'Searching your reports...'
                                        : 'Thinking...'}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input form */}
                        <form
                            onSubmit={(event) => {
                                event.preventDefault()

                                if (activeMode === 'finder') {
                                    void sendMessage()
                                } else {
                                    void sendHealthMessage()
                                }
                            }}
                            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
                        >
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(event) =>
                                    setInput(event.target.value)
                                }
                                placeholder={
                                    activeMode === 'finder'
                                        ? 'Search your medical reports...'
                                        : 'Ask about exercise, sleep, or wellness...'
                                }
                                maxLength={5000}
                                disabled={loading}
                                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                                aria-label={
                                    activeMode === 'finder'
                                        ? 'Search medical reports'
                                        : 'Message Health Companion'
                                }
                            />

                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                aria-label="Send message"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                    </section>
                )}

                {/* Animated, draggable launcher */}
                {!isOpen && (
                    <button
                        type="button"
                        onPointerDown={startDrag}
                        onClick={openWidget}
                        data-draggable-launcher
                        aria-label="Open MedVault assistant; drag to move"
                        title="Drag to move"
                        className="group relative flex h-14 w-14 touch-none items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-transform duration-200 hover:scale-110 hover:bg-slate-700 active:scale-95"
                    >
                        <span className="absolute inset-0 rounded-full border-2 border-slate-400/70 animate-ping motion-reduce:animate-none" />
                        <MessageCircle className="relative h-6 w-6 animate-pulse motion-reduce:animate-none" />
                    </button>
                )}
            </div>

            {/* API key settings modal */}
            {settingsOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="health-api-settings-title"
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2
                                    id="health-api-settings-title"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Health Chat API Settings
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Configure the AI provider for this page
                                    session.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                aria-label="Close API settings"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="health-provider"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    AI provider
                                </label>

                                <select
                                    id="health-provider"
                                    value={provider}
                                    onChange={(event) =>
                                        setProvider(
                                            event.target.value as LLMProvider
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-600"
                                >
                                    <option value="gemini">
                                        Google Gemini
                                    </option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="health-api-key"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    {provider === 'gemini'
                                        ? 'Gemini API key'
                                        : 'OpenAI API key'}
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        id="health-api-key"
                                        type={showApiKey ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={settingsKey}
                                        onChange={(event) =>
                                            setSettingsKey(event.target.value)
                                        }
                                        placeholder="Paste your API key"
                                        maxLength={500}
                                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-600"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowApiKey((value) => !value)
                                        }
                                        aria-label={
                                            showApiKey
                                                ? 'Hide API key'
                                                : 'Show API key'
                                        }
                                        className="rounded-xl border border-slate-300 px-3 text-slate-700 hover:bg-slate-50"
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    The key stays in React memory and is sent
                                    to the Health Chat API when you send a
                                    message. It is not saved to Supabase or
                                    browser storage. Refreshing the page clears
                                    it.
                                </p>

                                {apiKey && (
                                    <p className="mt-2 text-xs font-medium text-emerald-700">
                                        A key is currently configured in
                                        memory. Saving a new key replaces it.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSettingsOpen(false)
                                        setSettingsKey('')
                                        setShowApiKey(false)
                                    }}
                                    className="flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={saveApiKey}
                                    disabled={settingsKey.trim().length < 10}
                                    className="flex-1 rounded-xl bg-slate-900 px-3 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Save key
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Full-screen report viewer inside MedVault */}
            {selectedReport && (
                <div
                    className="fixed inset-0 z-[200] flex flex-col bg-slate-950"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Viewing ${selectedReport.title}`}
                >
                    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-700 bg-slate-900 px-4 py-4 text-white sm:px-6">
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold sm:text-base">
                                {selectedReport.title}
                            </h2>
                            <p className="truncate text-xs text-slate-400">
                                {selectedReport.fileName}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeReportViewer}
                            aria-label="Close report viewer"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-800 p-2 sm:p-4">
                        {isImage ? (
                            <img
                                src={selectedReport.url}
                                alt={selectedReport.title}
                                className="h-full w-full rounded-lg object-contain"
                            />
                        ) : isPdf ? (
                            <iframe
                                src={`${selectedReport.url}#toolbar=0&navpanes=0`}
                                title={selectedReport.title}
                                className="h-full w-full rounded-lg bg-white"
                            />
                        ) : (
                            <div className="max-w-md px-6 text-center text-white">
                                <FileText className="mx-auto mb-4 h-14 w-14 text-slate-400" />
                                <h3 className="text-lg font-semibold">
                                    Preview unavailable
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    This file type cannot be previewed here.
                                    Visit the History page to access the
                                    available document actions.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
