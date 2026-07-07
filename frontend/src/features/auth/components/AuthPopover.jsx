import { useEffect, useRef, useState } from 'react'

/**
 * Minimal accessible popover: a trigger plus a panel that closes on outside
 * click or Escape. `trigger` and `children` are render props so both the login
 * and user menus can reuse the same open/close behavior.
 */
export default function AuthPopover({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handlePointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((value) => !value), close })}
      {open ? (
        <div
          className={`absolute top-full z-50 mt-2 ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          {children({ close })}
        </div>
      ) : null}
    </div>
  )
}
