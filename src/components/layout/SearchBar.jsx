import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CornerDownLeft, SearchX } from 'lucide-react'
import { searchPages } from '@/utils/search'
import useOnClickOutside from '@/hooks/useOnClickOutside'
import Highlight from '@/components/ui/Highlight'

export default function SearchBar() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const boxRef = useRef(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => searchPages(query), [query])
  const showPanel = open && query.trim().length > 0

  // Ctrl/⌘+K from anywhere focuses the field.
  useEffect(() => {
    const onKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // A click anywhere else dismisses the panel without clearing what was typed.
  const closePanel = useCallback(() => setOpen(false), [])
  useOnClickOutside(boxRef, closePanel, showPanel)

  const go = item => {
    navigate(item.to)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleChange = e => {
    setQuery(e.target.value)
    setActiveIndex(0)
    setOpen(true)
  }

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      if (query) {
        setQuery('')
        setOpen(false)
      } else {
        inputRef.current?.blur()
      }
      return
    }

    if (!showPanel || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[activeIndex])
    }
  }

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
      />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="page-search-results"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search pages…"
        aria-label="Search pages"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="h-10 w-52 rounded-xl border border-beige-line bg-beige/60 pl-9 pr-12 text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink-mute focus:w-72 focus:border-royal focus:bg-white"
      />
      {/* Shortcut hint, hidden once there is something to read in the field. */}
      {!query && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-beige-line bg-paper px-1.5 py-0.5 font-display text-[10px] font-bold text-ink-mute">
          Ctrl K
        </kbd>
      )}

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-[340px] origin-top-right overflow-hidden rounded-2xl border border-beige-line bg-paper shadow-[0_24px_60px_-24px_rgba(8,15,46,0.45)]"
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
                <SearchX size={20} className="text-ink-mute" />
                <p className="text-[13px] text-ink-mute">
                  No pages match “<span className="font-semibold text-ink-soft">{query.trim()}</span>”
                </p>
              </div>
            ) : (
              <>
                <p className="border-b border-beige-line px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
                  Pages
                </p>
                <ul id="page-search-results" role="listbox" className="p-1.5">
                  {results.map((item, i) => {
                    const Icon = item.icon
                    const active = i === activeIndex
                    return (
                      <li key={item.to} role="option" aria-selected={active}>
                        <button
                          onClick={() => go(item)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={[
                            'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                            active ? 'bg-beige' : 'hover:bg-beige/60',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                              active ? 'bg-royal text-white' : 'bg-royal/[0.08] text-royal',
                            ].join(' ')}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-[13.5px] font-bold text-ink">
                              <Highlight text={item.label} query={query} />
                            </span>
                            {item.section && (
                              <span className="mt-0.5 block truncate text-[11.5px] text-ink-mute">
                                {item.section} › {item.label}
                              </span>
                            )}
                          </span>
                          {active && (
                            <CornerDownLeft size={14} className="shrink-0 text-ink-mute" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
