import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronDown, X } from 'lucide-react'
import { NAV_ITEMS as navItems } from '@/constants/nav'
import { PROFILE as profile } from '@/utils/user'
import logoW from '@/assets/logo/logo-white.png'

/**
 * A routable nav entry. `nested` renders the tighter, indented treatment used
 * for a group's children.
 */
function NavLeaf({ item, isNarrow, nested = false, onNavigate }) {
  const { to, label, icon: Icon } = item

  return (
    <NavLink
      to={to}
      // Routes are flat, and /fund-snapshot is a prefix of its sibling pages —
      // without this the parent path lights up alongside the real one.
      end
      onClick={onNavigate}
      title={isNarrow ? label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center rounded-xl font-display transition-all duration-200',
          nested ? 'gap-2.5 py-2 pl-3 pr-3 text-[13px] font-semibold' : 'gap-3 px-3 py-2.5 text-sm font-semibold',
          isNarrow ? 'justify-center' : '',
          isActive
            ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
            : 'text-white/60 hover:bg-white/[0.07] hover:text-white',
        ].filter(Boolean).join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* The gold marker slides between links rather than cross-fading, so
              the eye follows it. */}
          {isActive && (
            <motion.span
              layoutId="nav-marker"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-on-dark"
            />
          )}
          <Icon
            size={nested ? 16 : 18}
            className={[
              'shrink-0 transition-transform duration-200 group-hover:scale-110',
              isActive ? 'text-gold-on-dark' : '',
            ].filter(Boolean).join(' ')}
          />
          {!isNarrow && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

/**
 * An expandable section of nav entries. Open state follows the route by
 * default — land on /masters/category and Masters is already open — until the
 * visitor toggles it themselves, after which their choice wins.
 *
 * Collapsed to the icon rail there is no room for the children, so the header
 * expands the sidebar instead of toggling in place.
 */
function NavGroup({ item, isNarrow, mobile, onClose, onExpandSidebar }) {
  const { label, icon: Icon, children } = item
  const { pathname } = useLocation()

  const hasActiveChild = children.some(child => pathname === child.to)
  const [manuallyOpen, setManuallyOpen] = useState(null)
  const open = manuallyOpen ?? hasActiveChild

  const handleClick = () => {
    if (isNarrow) {
      // Expanding the rail and opening the group in one click, so the icon is
      // not a dead control.
      setManuallyOpen(true)
      onExpandSidebar?.()
      return
    }
    setManuallyOpen(!open)
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-expanded={isNarrow ? undefined : open}
        title={isNarrow ? label : undefined}
        className={[
          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
          'font-display text-sm font-semibold transition-all duration-200',
          isNarrow ? 'justify-center' : '',
          hasActiveChild
            ? 'text-white'
            : 'text-white/60 hover:bg-white/[0.07] hover:text-white',
        ].filter(Boolean).join(' ')}
      >
        {/* Collapsed, the group carries the active marker on behalf of the
            child that is hidden with it. */}
        {isNarrow && hasActiveChild && (
          <motion.span
            layoutId="nav-marker"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-on-dark"
          />
        )}
        <Icon
          size={18}
          className={[
            'shrink-0 transition-transform duration-200 group-hover:scale-110',
            hasActiveChild ? 'text-gold-on-dark' : '',
          ].filter(Boolean).join(' ')}
        />
        {!isNarrow && (
          <>
            <span className="truncate">{label}</span>
            <ChevronDown
              size={15}
              className={`ml-auto shrink-0 text-white/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && !isNarrow && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* The rail ties the children back to their header. */}
            <div className="ml-[21px] mt-1.5 flex flex-col gap-1 border-l border-white/10 pl-2.5">
              {children.map(child => (
                <li key={child.to}>
                  <NavLeaf
                    item={child}
                    isNarrow={false}
                    nested
                    onNavigate={mobile ? onClose : undefined}
                  />
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * The navy rail. One component serves both the fixed desktop sidebar and the
 * mobile drawer — `mobile` swaps the collapse control for a close button and
 * forces the expanded width, since a collapsed drawer makes no sense.
 */
export default function Sidebar({ collapsed = false, onToggle, mobile = false, onClose }) {
  const isNarrow = collapsed && !mobile

  return (
    <aside
      className={[
        'relative flex h-full flex-col overflow-hidden',
        'bg-[linear-gradient(165deg,var(--sidebar-top)_0%,var(--sidebar-mid)_48%,var(--sidebar-bottom)_100%)]',
        'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isNarrow ? 'w-[84px]' : 'w-[264px]',
      ].join(' ')}
    >
      {/* Ambient depth: a faint grid and two slow-drifting brand orbs, the same
          treatment the login panel uses. Purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[oklch(52%_0.14_265/0.35)] blur-[60px]"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -bottom-20 -right-14 h-52 w-52 rounded-full bg-[oklch(72%_0.115_82/0.18)] blur-[60px]"
      />

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      {/* Collapsed, there is no room for the toggle beside the logo, so the row
          becomes a column and the toggle sits under it. */}
      <div
        className={[
          'relative z-10 flex shrink-0 border-b border-white/10',
          isNarrow ? 'flex-col items-center gap-2.5 px-3 py-3' : 'h-[72px] items-center gap-3 px-4',
        ].join(' ')}
      >
        <div className="relative shrink-0 rounded-xl bg-white/10 p-1.5 ring-1 ring-white/15">
          <img src={logoW} alt="InvestSmart" className="h-8 w-8 object-contain" />
          <span
            aria-hidden="true"
            className="sheen animate-shimmer pointer-events-none absolute inset-0 rounded-xl"
          />
        </div>

        {!isNarrow && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="min-w-0 leading-none"
          >
            <p className="font-display text-[15px] font-extrabold tracking-tight text-white">
              INVEST<span className="text-gold-on-dark">SMART</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              RM Panel
            </p>
          </motion.div>
        )}

        {mobile ? (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={[
              'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/55',
              'transition-colors hover:bg-white/10 hover:text-white',
              isNarrow ? '' : 'ml-auto',
            ].filter(Boolean).join(' ')}
          >
            <ChevronLeft
              size={17}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="scroll-slim relative z-10 flex-1 overflow-y-auto px-3 py-5">
        {!isNarrow && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Sections
          </p>
        )}

        <ul className="flex flex-col gap-1.5">
          {navItems.map((item, i) => (
            <motion.li
              key={item.id ?? item.to}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              {item.children ? (
                <NavGroup
                  item={item}
                  isNarrow={isNarrow}
                  mobile={mobile}
                  onClose={onClose}
                  onExpandSidebar={onToggle}
                />
              ) : (
                <NavLeaf item={item} isNarrow={isNarrow} onNavigate={mobile ? onClose : undefined} />
              )}
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* ── Footer · the dummy user ───────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 border-t border-white/10 p-3">
        {!isNarrow ? (
          <div className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 font-display text-[12px] font-bold text-gold-on-dark ring-1 ring-white/15">
                {profile.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[13px] font-bold capitalize text-white">
                  {profile.name}
                </p>
                <p className="truncate text-[11px] text-white/45">{profile.role}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span
              title={`${profile.name} · ${profile.role}`}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 font-display text-[12px] font-bold text-gold-on-dark ring-1 ring-white/15"
            >
              {profile.initials}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
