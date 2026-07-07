import { useEffect, useId, useState } from 'react'
import { Cpu, Loader2 } from 'lucide-react'
import { getModels, setModel } from '../api/modelsService'
import { setSelectedModel } from '../api/modelStore'

/**
 * Compact model picker shown in the chat header. Loads the whitelist + the
 * caller's current model (the persisted per-user preference when logged in,
 * the server default otherwise). Switching persists server-side for logged-in
 * users and always applies to this session's queries via the model store.
 */
export default function ModelSelector() {
  const selectId = useId()
  const [models, setModels] = useState([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState('loading') // loading | ready | saving | error

  useEffect(() => {
    let active = true

    getModels()
      .then((data) => {
        if (!active) return
        setModels(data.models ?? [])
        setCurrent(data.current ?? '')
        setSelectedModel(data.current ?? null)
        setStatus('ready')
      })
      .catch((err) => {
        if (!active) return
        console.warn('GET /models failed:', err)
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = async (event) => {
    const next = event.target.value
    const previous = current

    setCurrent(next)
    setSelectedModel(next)
    setStatus('saving')

    try {
      const data = await setModel(next)
      setCurrent(data.current ?? next)
      setSelectedModel(data.current ?? next)
      setStatus('ready')
    } catch (err) {
      console.warn('POST /models failed:', err)
      // 401 = anonymous user: the choice can't persist server-side, but it
      // still applies to this session's queries (model store keeps it).
      if (err?.status === 401) {
        setStatus('ready')
        return
      }
      setCurrent(previous) // revert on failure
      setSelectedModel(previous || null)
      setStatus('error')
    }
  }

  if (status === 'loading' || (status === 'error' && models.length === 0)) {
    return null // nothing to pick yet; keep the header clean
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
      <Cpu className="h-3.5 w-3.5 shrink-0 text-purple-500" aria-hidden="true" />
      <label htmlFor={selectId} className="sr-only">
        Modelo de IA
      </label>
      <select
        id={selectId}
        value={current}
        onChange={handleChange}
        disabled={status === 'saving'}
        className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 outline-none transition-colors hover:border-purple-300 focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label ?? model.id}
          </option>
        ))}
      </select>
      {status === 'saving' ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-purple-400" aria-hidden="true" />
      ) : null}
    </div>
  )
}
