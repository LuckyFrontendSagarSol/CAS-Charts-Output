import { useCallback, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, ChevronDown, UserRound } from 'lucide-react'
import { NAV_ITEMS } from '@/constants/nav'
import { PROFILE as profile } from '@/utils/user'
import useOnClickOutside from '@/hooks/useOnClickOutside'
import useEscapeKey from '@/hooks/useEscapeKey'
import SearchBar from './SearchBar'

export default function Topbar({ onOpenDrawer }) {
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // A dropdown that can only be dismissed by re-clicking its own trigger is a
  // trap for both mouse and keyboard users.
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useOnClickOutside(menuRef, closeMenu, menuOpen)
  useEscapeKey(closeMenu, menuOpen)

  const current = NAV_ITEMS.find(item => item.to === location.pathname)

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 border-b border-beige-line bg-paper/85 px-4 backdrop-blur-xl sm:px-6">
      {/* Drawer trigger — mobile and tablet only */}
      <button
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-beige-line text-ink-soft transition-colors hover:border-royal hover:text-royal lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Where you are. The Masters screens carry no title block of their own,
          so this is the page's heading rather than a label above it — one line,
          sized to read as one, with the gold rule holding the brand accent the
          old eyebrow used to. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="h-7 w-[3px] shrink-0 rounded-full bg-gold-deep"
          aria-hidden="true"
        />
        <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-royal sm:text-[22px]">
          {current?.label ?? 'InvestSmart'}
        </h1>
      </div>

      {/* Jumps to any page in the admin — see utils/search.js */}
      <SearchBar />

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2.5 rounded-xl border border-beige-line py-1.5 pl-1.5 pr-2 transition-all duration-200 hover:border-royal sm:pr-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-royal font-display text-[12px] font-bold text-white">
            {profile.initials}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[130px] truncate font-display text-[13px] font-bold capitalize text-ink">
              {profile.name}
            </span>
            <span className="block text-[11px] text-ink-mute">{profile.role}</span>
          </span>
          <ChevronDown
            size={15}
            className={`hidden text-ink-mute transition-transform duration-200 sm:block ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[calc(100%+10px)] w-60 origin-top-right overflow-hidden rounded-2xl border border-beige-line bg-paper shadow-[0_24px_60px_-24px_rgba(8,15,46,0.45)]"
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-royal text-white">
                  <UserRound size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[13px] font-bold capitalize text-ink">
                    {profile.name}
                  </p>
                  <p className="truncate text-[11px] text-ink-mute">{profile.username}</p>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
