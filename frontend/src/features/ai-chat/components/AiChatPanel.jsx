import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GripHorizontal, Lock, Plus, Send, Sparkles, Trash2, X, MapPin, RadioTower } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { askTerritorio } from '../api/datosService'
import {
  getConversations,
  getConversationMessages,
  deleteConversation,
} from '../api/conversationsService'
import ModelSelector from './ModelSelector'
import useMapPageStore from '@/features/map-page/store/useMapPageStore'
import useAuthStore from '@/features/auth/store/useAuthStore'
import { signInWithGoogle } from '@/features/auth/lib/googleAuth'
import GoogleIcon from '@/features/auth/components/GoogleIcon'

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hola, soy el asistente BiT. Preguntame sobre riesgo de exclusión digital, calidad de red o movilidad en la región. Si hacés click en una zona o antena del mapa, uso esa selección como contexto.',
  },
]

const PANEL_MARGIN = 16
const INITIAL_PANEL_Y = 96
const MAP_NAVIGATION_PATTERN = /\b(zoom|acerc|mostr|ver|ir|lleva|ubica|ubicá|enfoca|localiza|resalta|marc|señala)\w*\b/i
const ZONE_TERM_PATTERN = /\b(clusteres|clusters|cluster|clústeres|clústers|clúster)\b/gi
const ZONE_WORD_OVERRIDES = {
  PALHOCA: 'Palhoça',
  SAO: 'São',
  SANTO: 'Santo',
  AMARO: 'Amaro',
  SUL: 'Sur',
  NORTE: 'Norte',
  LESTE: 'Este',
  OESTE: 'Oeste',
  CENTRO: 'Centro',
}

export default function AiChatPanel({ isOpen, onToggle }) {
  const panelRef = useRef(null)
  const dragStateRef = useRef(null)
  const wasOpenRef = useRef(false)
  const userId = useAuthStore((s) => s.user?.id)
  const [position, setPosition] = useState({ x: PANEL_MARGIN, y: INITIAL_PANEL_Y })

  const clampPosition = useCallback((nextPosition) => {
    const panel = panelRef.current
    const container = panel?.offsetParent

    if (!panel || !container) {
      return nextPosition
    }

    const maxX = Math.max(PANEL_MARGIN, container.clientWidth - panel.offsetWidth - PANEL_MARGIN)
    const maxY = Math.max(PANEL_MARGIN, container.clientHeight - panel.offsetHeight - PANEL_MARGIN)

    return {
      x: Math.min(Math.max(PANEL_MARGIN, nextPosition.x), maxX),
      y: Math.min(Math.max(PANEL_MARGIN, nextPosition.y), maxY),
    }
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false
      return
    }

    if (!wasOpenRef.current) {
      setPosition(clampPosition({ x: PANEL_MARGIN, y: INITIAL_PANEL_Y }))
      wasOpenRef.current = true
    }
  }, [clampPosition, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const keepInsideContainer = () => {
      setPosition((current) => clampPosition(current))
    }

    keepInsideContainer()
    window.addEventListener('resize', keepInsideContainer)

    return () => window.removeEventListener('resize', keepInsideContainer)
  }, [clampPosition, isOpen])

  const handleDragStart = (event) => {
    if (event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: position.x,
      startY: position.y,
    }
  }

  const handleDragMove = (event) => {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    setPosition(
      clampPosition({
        x: dragState.startX + event.clientX - dragState.originX,
        y: dragState.startY + event.clientY - dragState.originY,
      }),
    )
  }

  const handleDragEnd = (event) => {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    dragStateRef.current = null
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-4 z-20 hidden h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-gradient-to-br from-purple-500 via-purple-700 to-slate-950 px-4 text-xs font-bold text-white shadow-[0_16px_40px_rgba(76,29,149,0.25)] ring-1 ring-purple-200/40 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 md:flex"
        aria-label="Abrir asistente BiT"
      >
        <Sparkles className="h-4 w-4" />
        IA
      </button>
    )
  }

  return (
    <aside
      ref={panelRef}
      className="absolute z-20 hidden max-h-[calc(100%-2rem)] w-[min(calc(100%-2rem),380px)] flex-col rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md md:flex"
      style={{ left: position.x, top: position.y, height: 'min(560px, calc(100% - 7rem))' }}
    >
      <AiChatContent
        key={userId ?? 'anon'}
        dragHandleProps={{
          onPointerDown: handleDragStart,
          onPointerMove: handleDragMove,
          onPointerUp: handleDragEnd,
          onPointerCancel: handleDragEnd,
        }}
        onClose={onToggle}
      />
    </aside>
  )
}

export function MobileAiChatSheet({ open, onOpenChange }) {
  const userId = useAuthStore((s) => s.user?.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(92vw,380px)] gap-0 overflow-hidden rounded-r-2xl border-r border-gray-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-[380px]"
      >
        <SheetTitle className="sr-only">Asistente BiT</SheetTitle>
        <AiChatContent key={userId ?? 'anon'} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

function AiChatContent({ dragHandleProps, onClose }) {
  const chatContext = useMapPageStore((s) => s.chatContext)
  const clearChatContext = useMapPageStore((s) => s.clearChatContext)
  const removeChatRegion = useMapPageStore((s) => s.removeChatRegion)
  const clusterProperties = useMapPageStore((s) => s.clusterProperties)
  const setHighlightedClusters = useMapPageStore((s) => s.setHighlightedClusters)
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversations, setConversations] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const inputId = useId()
  const scrollAreaRef = useRef(null)
  const chatRegions = getChatContextRegions(chatContext)

  const refreshConversations = useCallback(async () => {
    try {
      const data = await getConversations()
      setConversations(data.conversations ?? [])
      return data.conversations ?? []
    } catch (err) {
      console.warn('GET /conversations failed:', err)
      return []
    }
  }, [])

  const selectConversation = useCallback(async (id) => {
    setConversationId(id)
    try {
      const data = await getConversationMessages(id)
      const turns = (data.messages ?? []).map((m) => ({
        id: `srv-${m.id}`,
        role: m.role,
        content: m.content,
      }))
      setMessages(turns.length > 0 ? turns : initialMessages)
    } catch (err) {
      console.warn('GET /conversations/:id/messages failed:', err)
      setMessages(initialMessages)
    }
  }, [])

  const startNewConversation = useCallback(() => {
    setConversationId(null)
    setMessages(initialMessages)
  }, [])

  const handleDeleteConversation = useCallback(async () => {
    if (!conversationId) return
    try {
      await deleteConversation(conversationId)
      setConversations((current) => current.filter((c) => c.id !== conversationId))
      startNewConversation()
    } catch (err) {
      console.warn('DELETE /conversations/:id failed:', err)
    }
  }, [conversationId, startNewConversation])

  // The transcript lives server-side per conversation: on login, load the
  // thread list and resume the most recent one. Logout/user switches remount
  // this component (keyed by user id in the parents), so state never leaks
  // between accounts.
  useEffect(() => {
    if (!user) return undefined

    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState runs after the fetch resolves, never synchronously
    refreshConversations().then((list) => {
      if (active && list[0]?.id) selectConversation(list[0].id)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current

    if (!scrollArea) {
      return
    }

    scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSendMessage = useCallback(
    async (message = inputValue) => {
      const trimmedMessage = message.trim()

      if (!trimmedMessage || isTyping) {
        return
      }

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmedMessage,
      }

      setMessages((currentMessages) => [...currentMessages, userMessage])
      setInputValue('')
      setIsTyping(true)

      const requestedClusters = findRequestedClusters(trimmedMessage, clusterProperties)
      if (requestedClusters.length > 0) {
        setHighlightedClusters(requestedClusters)
      }

      // Send the recent visible turns so the AI keeps the conversation thread
      // (the welcome message and error bubbles add nothing).
      const history = messages
        .filter((m) => !m.isError && m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }))

      try {
        const res = await askTerritorio(
          trimmedMessage,
          buildBackendChatContext(chatContext),
          history,
          conversationId,
        )
        const highlightedClusters = res.clusters_destacados?.length
          ? res.clusters_destacados
          : requestedClusters

        // Sync the map: highlight (or clear) the zones the AI mentions
        setHighlightedClusters(highlightedClusters)

        // First message of a fresh chat: the backend created the thread.
        if (res.conversation_id && res.conversation_id !== conversationId) {
          setConversationId(res.conversation_id)
          refreshConversations()
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.respuesta_ia ?? 'No obtuve respuesta. Intentá de nuevo.',
            fuentes: res.fuentes ?? [],
            destacados: highlightedClusters,
          },
        ])
      } catch (err) {
        console.warn('POST /datos failed:', err)
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content:
              'No pude consultar los datos en este momento. Verificá tu conexión e intentá de nuevo en unos segundos.',
            isError: true,
          },
        ])
      } finally {
        setIsTyping(false)
      }
    },
    [
      inputValue,
      isTyping,
      messages,
      conversationId,
      refreshConversations,
      chatContext,
      clusterProperties,
      setHighlightedClusters,
    ],
  )

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex touch-none items-center justify-between border-b border-gray-100 px-4 py-3 md:cursor-grab md:active:cursor-grabbing"
        aria-label="Mover asistente BiT"
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            IA
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
              Asistente BiT
              {dragHandleProps ? <GripHorizontal className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" /> : null}
            </p>
            <p className="text-[10px] text-gray-400">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              conectado a Visent CDRView
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar asistente BiT"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!user ? (
        <LoginRequired />
      ) : (
        <>
          <ModelSelector />

          <ConversationsBar
            conversations={conversations}
            conversationId={conversationId}
            onSelect={selectConversation}
            onNew={startNewConversation}
            onDelete={handleDeleteConversation}
          />

          {chatRegions.length > 0 || chatContext?.ecgi ? (
            <ChatContextBar
              regions={chatRegions}
              ecgi={chatContext?.ecgi}
              onRemoveRegion={removeChatRegion}
              onClear={clearChatContext}
            />
          ) : null}

          <div
            ref={scrollAreaRef}
            className="sidebar-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4"
            aria-live="polite"
            aria-label="Conversación con el asistente BiT"
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping ? <TypingIndicator /> : null}
          </div>

          <div className="shrink-0 border-t border-gray-100 p-3">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
              <label htmlFor={inputId} className="sr-only">
                Mensaje para el asistente BiT
              </label>
              <input
                id={inputId}
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Preguntale al territorio..."
                className="min-w-0 flex-1 bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none"
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: 'var(--bit-purple-deep)' }}
                aria-label="Enviar pregunta"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Login wall: the chat spends AI credits and personalizes per user. */
function LoginRequired() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
        <Lock className="h-4 w-4 text-purple-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-800">Iniciá sesión para hablar con BiT</p>
      <p className="max-w-[260px] text-xs text-gray-500">
        El asistente guarda tus conversaciones y personaliza las respuestas con tu historial.
      </p>
      <button
        type="button"
        onClick={signInWithGoogle}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar con Google
      </button>
    </div>
  )
}

/** Thread switcher: resume, start or delete conversations (ChatGPT-style). */
function ConversationsBar({ conversations, conversationId, onSelect, onNew, onDelete }) {
  const selectId = useId()

  return (
    <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2">
      <label htmlFor={selectId} className="sr-only">
        Conversaciones
      </label>
      <select
        id={selectId}
        value={conversationId ?? ''}
        onChange={(event) => (event.target.value ? onSelect(event.target.value) : onNew())}
        className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none transition-colors hover:border-purple-300 focus:border-purple-400"
      >
        <option value="">Nueva conversación…</option>
        {conversations.map((conversation) => (
          <option key={conversation.id} value={conversation.id}>
            {conversation.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onNew}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Nueva conversación"
        title="Nueva conversación"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!conversationId}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Borrar conversación"
        title="Borrar conversación"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? 'rounded-tr-sm text-white'
            : 'rounded-tl-sm border border-gray-200 bg-white text-gray-700 shadow-sm'
        }`}
        style={isUser ? { backgroundColor: 'var(--bit-purple-deep)' } : undefined}
      >
        {!isUser ? <p className="mb-2 text-[10px] font-semibold text-gray-700">Asistente BiT</p> : null}
        {isUser ? <p>{message.content}</p> : <AssistantText content={message.content} />}

        {message.destacados?.length > 0 ? (
          <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
            ● {message.destacados.length === 1 ? 'Zona resaltada' : `${message.destacados.length} zonas resaltadas`} en el mapa
          </p>
        ) : null}

        {message.fuentes?.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-200/70 pt-2">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Fuentes:</span>
            {message.fuentes.map((fuente) => (
              <span
                key={fuente}
                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] text-gray-500"
              >
                {fuente}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Renders the AI answer as readable blocks: consecutive "- " lines become a
 * bullet list and the closing "Sugerencia Estratégica" gets its own callout.
 */
function AssistantText({ content }) {
  const lines = sanitizeAssistantText(content).split('\n')
  const blocks = []
  let bullets = []

  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push({ type: 'list', items: bullets })
      bullets = []
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) return

    if (line.startsWith('- ') || line.startsWith('• ')) {
      bullets.push(parseBullet(line.slice(2).trim()))
      return
    }

    flushBullets()
    const normalizedLine = stripMarkdown(line)
    if (/^sugerencia estratégica/i.test(normalizedLine)) {
      blocks.push({
        type: 'suggestion',
        text: normalizedLine.replace(/^sugerencia estratégica:?\s*/i, ''),
      })
      return
    }
    blocks.push({ type: 'paragraph', text: normalizedLine })
  })
  flushBullets()

  return (
    <div className="space-y-2.5 [text-wrap:pretty]">
      {blocks.map((block, i) => {
        if (block.type === 'list') {
          return (
            <ul key={i} className="space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/90 to-white px-2.5 py-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    {item.label ? (
                      <p className="font-semibold text-purple-950">{item.label}</p>
                    ) : null}
                    {item.risk ? (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${riskBadgeClass(item.risk)}`}>
                        {item.risk}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-gray-700">{item.text}</p>
                  {item.metrics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.metrics.map((metric) => (
                        <span
                          key={metric}
                          className="rounded-full border border-purple-100 bg-white/85 px-2 py-0.5 text-[9px] font-semibold text-purple-700"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'suggestion') {
          return (
            <div key={i} className="rounded-lg border-l-[3px] border-green-500 bg-green-50/70 px-2.5 py-2">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700">
                Sugerencia estratégica
              </p>
              <p className="text-gray-700">{block.text}</p>
            </div>
          )
        }
        return <p key={i} className="text-gray-700">{block.text}</p>
      })}
    </div>
  )
}

function ChatContextBar({ regions, ecgi, onRemoveRegion, onClear }) {
  const hasMultipleRegions = regions.length > 1

  return (
    <div className="border-b border-purple-100 bg-purple-50/60 px-4 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-700">
          Contexto de consulta
          {hasMultipleRegions ? ` · ${regions.length} zonas` : ''}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] font-semibold text-purple-500 transition-colors hover:text-purple-800"
        >
          Limpiar
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {regions.map((region) => (
          <ContextChip
            key={region}
            icon={<MapPin className="h-3 w-3" aria-hidden="true" />}
            label={formatZoneLabel(region)}
            onRemove={() => onRemoveRegion(region)}
            removeLabel={`Quitar zona ${formatZoneLabel(region)} del contexto`}
          />
        ))}

        {ecgi ? (
          <ContextChip
            icon={<RadioTower className="h-3 w-3" aria-hidden="true" />}
            label={`Antena ${ecgi}`}
            onRemove={onClear}
            removeLabel="Quitar antena del contexto"
          />
        ) : null}
      </div>
    </div>
  )
}

function ContextChip({ icon, label, onRemove, removeLabel }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-purple-700 shadow-sm ring-1 ring-purple-100">
      {icon}
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="-mr-0.5 rounded-full text-purple-400 transition-colors hover:bg-purple-100 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
        aria-label={removeLabel}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  )
}

function stripMarkdown(text) {
  return text.replace(/\*\*/g, '').trim()
}

function parseBullet(text) {
  const clean = stripMarkdown(text)
  const match = clean.match(/^([^:]{2,80}):\s*(.+)$/)
  const label = match ? formatZoneLabel(match[1]) : ''
  const body = match ? match[2] : clean
  return {
    label,
    text: body,
    metrics: extractMiniMetrics(body),
    risk: extractRiskLevel(`${label} ${body}`),
  }
}

function sanitizeAssistantText(text) {
  return (text ?? '')
    .replace(ZONE_TERM_PATTERN, (match) => {
      const lower = match.toLowerCase()
      return lower.endsWith('s') || lower.endsWith('es') ? 'zonas' : 'zona'
    })
    .replace(/\b[A-Z0-9]+(?:_[A-Z0-9]+)+\b/g, formatZoneLabel)
}

function getChatContextRegions(context) {
  return [...new Set([...(context?.regions ?? []), context?.region].filter(Boolean))]
}

function buildBackendChatContext(context) {
  const regions = getChatContextRegions(context)

  return {
    ...(regions[0] ? { region: regions[0] } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    ...(context?.ecgi ? { ecgi: context.ecgi } : {}),
  }
}

function formatZoneLabel(value = '') {
  return value
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase()
      if (ZONE_WORD_OVERRIDES[upper]) return ZONE_WORD_OVERRIDES[upper]
      if (/^BR\d+$/i.test(word)) return upper
      if (/^\d+$/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function extractMiniMetrics(text) {
  const metrics = []
  const metricPattern = /(?:\b\d+(?:[.,]\d+)?\s?%|\b\d+(?:[.,]\d+)?\s?(?:usuarios|antenas|km|Mbps|GB|MB)\b|\bscore\s*[:=]?\s*\d+(?:[.,]\d+)?)/gi
  for (const match of text.matchAll(metricPattern)) {
    const metric = match[0].replace(/\s+/g, ' ').trim()
    if (!metrics.includes(metric)) metrics.push(metric)
    if (metrics.length === 3) break
  }
  return metrics
}

function extractRiskLevel(text) {
  const match = text.match(/riesgo\s+(alto|medio|bajo)|\b(alto|medio|bajo)\b/i)
  return match ? (match[1] ?? match[2]).toUpperCase() : ''
}

function riskBadgeClass(risk) {
  if (risk === 'ALTO') return 'bg-red-100 text-red-700'
  if (risk === 'MEDIO') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function findRequestedClusters(message, clusterProperties) {
  if (!MAP_NAVIGATION_PATTERN.test(message) || !clusterProperties) {
    return []
  }

  const normalizedMessage = normalizeSearchText(message)
  const clusters = Object.values(clusterProperties)
  const zoneMatches = clusters.filter((props) => {
    const clusterName = props.cluster ?? ''
    return [clusterName, formatZoneLabel(clusterName)].some((candidate) => textIncludesCandidate(normalizedMessage, candidate))
  })

  const matches = zoneMatches.length > 0
    ? zoneMatches
    : clusters.filter((props) => textIncludesCandidate(normalizedMessage, props.municipio))

  return matches.map((props) => props.cluster).filter(Boolean).slice(0, 3)
}

function textIncludesCandidate(normalizedText, candidate) {
  const normalizedCandidate = normalizeSearchText(candidate)
  return normalizedCandidate.length >= 4 && normalizedText.includes(normalizedCandidate)
}

function normalizeSearchText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim()
}

const TYPING_PHRASES = [
  'Consultando los datos del territorio…',
  'Cruzando riesgo, red y demografía…',
  'Analizando las zonas relevantes…',
  'Preparando la respuesta…',
]

function TypingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % TYPING_PHRASES.length)
    }, 2500)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-xl rounded-tl-sm border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs text-gray-500">
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-purple-400 [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-purple-400 [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-purple-400 [animation-delay:300ms]" />
        </span>
        {TYPING_PHRASES[phraseIndex]}
      </div>
    </div>
  )
}
