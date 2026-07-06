import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GripHorizontal, Send, Sparkles, X, MapPin, RadioTower } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { askTerritorio } from '../api/datosService'
import useMapPageStore from '@/features/map-page/store/useMapPageStore'

const quickActions = [
  '¿Qué zona debería priorizarse?',
  '¿Dónde hay alta concentración sin cobertura?',
]

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hola, soy el asistente BiT. Preguntame sobre riesgo de exclusión digital, calidad de red o movilidad en la región. Si hacés click en una zona o antena del mapa, uso esa selección como contexto.',
  },
]

const PANEL_MARGIN = 16
const RIGHT_ALIGNED_X = Number.MAX_SAFE_INTEGER

export default function AiChatPanel({ isOpen, onToggle }) {
  const panelRef = useRef(null)
  const dragStateRef = useRef(null)
  const wasOpenRef = useRef(false)
  const [position, setPosition] = useState({ x: RIGHT_ALIGNED_X, y: PANEL_MARGIN })

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
      setPosition(clampPosition({ x: RIGHT_ALIGNED_X, y: PANEL_MARGIN }))
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
        className="absolute bottom-5 right-20 z-20 hidden h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 px-3.5 text-xs font-semibold text-purple-700 shadow-[0_12px_32px_rgba(44,39,80,0.16)] ring-1 ring-purple-100/80 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-purple-50/95 hover:text-purple-800 active:translate-y-0 active:scale-95 md:flex"
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
      style={{ left: position.x, top: position.y, height: 'min(640px, calc(100% - 2rem))' }}
    >
      <AiChatContent
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(92vw,380px)] gap-0 overflow-hidden rounded-r-2xl border-r border-gray-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-[380px]"
      >
        <SheetTitle className="sr-only">Asistente BiT</SheetTitle>
        <AiChatContent onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

function AiChatContent({ dragHandleProps, onClose }) {
  const chatContext = useMapPageStore((s) => s.chatContext)
  const clearChatContext = useMapPageStore((s) => s.clearChatContext)
  const setHighlightedClusters = useMapPageStore((s) => s.setHighlightedClusters)
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputId = useId()
  const scrollAreaRef = useRef(null)

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

      try {
        const res = await askTerritorio(trimmedMessage, chatContext ?? {})

        // Sync the map: highlight (or clear) the zones the AI mentions
        setHighlightedClusters(res.clusters_destacados ?? [])

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.respuesta_ia ?? 'No obtuve respuesta. Intentá de nuevo.',
            fuentes: res.fuentes ?? [],
            destacados: res.clusters_destacados ?? [],
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
    [inputValue, isTyping, chatContext, setHighlightedClusters],
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
        {chatContext?.region || chatContext?.ecgi ? (
          <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-medium text-purple-700">
            {chatContext.region ? <MapPin className="h-3 w-3" /> : <RadioTower className="h-3 w-3" />}
            <span>
              {chatContext.region
                ? chatContext.region.replace(/_/g, ' ')
                : `Antena ${chatContext.ecgi}`}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearChatContext(); }}
              className="ml-1 text-purple-400 hover:text-purple-700"
              aria-label="Quitar contexto de la consulta"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
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

        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleSendMessage(action)}
              disabled={isTyping}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {action}
            </button>
          ))}
        </div>
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
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? 'rounded-tr-sm text-white'
            : 'rounded-tl-sm border border-gray-100 bg-gray-50/80 text-gray-600'
        }`}
        style={isUser ? { backgroundColor: 'var(--bit-purple-deep)' } : undefined}
      >
        {!isUser ? <p className="mb-1 text-[10px] font-semibold text-gray-700">Asistente BiT</p> : null}
        {isUser ? <p>{message.content}</p> : <AssistantText content={message.content} />}

        {message.destacados?.length > 0 ? (
          <p className="mt-1.5 text-[10px] text-blue-600">
            ● {message.destacados.length === 1 ? 'Zona resaltada' : `${message.destacados.length} zonas resaltadas`} en el mapa
          </p>
        ) : null}

        {message.fuentes?.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-200/70 pt-1.5">
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
  const lines = (content ?? '').split('\n')
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
      bullets.push(line.slice(2).trim())
      return
    }

    flushBullets()
    if (/^sugerencia estratégica/i.test(line)) {
      blocks.push({ type: 'suggestion', text: line.replace(/^sugerencia estratégica:?\s*/i, '') })
      return
    }
    blocks.push({ type: 'paragraph', text: line })
  })
  flushBullets()

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'list') {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-1.5">
                  <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300" />
                  <span>{item}</span>
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
        return <p key={i}>{block.text}</p>
      })}
    </div>
  )
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
