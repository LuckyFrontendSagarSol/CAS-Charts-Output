/**
 * Everything the CAS Output screen works out from the saved record
 * (POST /getLatestCasOutput → models/casoutput on the backend).
 *
 *   schemes[]            one row per CAS scheme (ISIN), folios added together
 *   baseNames[]          the same schemes grouped by ISIN-master base name
 *   summary              name, date, risk profile, model, value, fund count
 *   roleDiagnostic[]     per macro role: current mix, target mix, gap, status
 *   portfolioSnapshot[]  Equity / Debt / Diversifier — current vs recommended
 *   totals               the whole portfolio added up, and the CAS's own total
 *
 * Mixes, returns and weights are fractions — 0.35 is 35%. The backend writes
 * `null` for anything it could not work out, and a null is never a zero here:
 * a scheme with no XIRR did not return nothing, it has no figure.
 */

export const DASH = '—'

export const isNum = value => typeof value === 'number' && Number.isFinite(value)

export const text = value =>
  value === null || value === undefined || value === '' ? DASH : String(value)

const inr = (value, digits) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })

const MINUS = '−'

/** ₹2,26,310.42 — the exact figure, for tables and details. */
export const money = (value, digits = 2) =>
  isNum(value) ? `${value < 0 ? MINUS : ''}₹${inr(Math.abs(value), digits)}` : DASH

/** ₹2.26 L / ₹1.25 Cr — for tiles, axes and bar ends, where space is short.
 *  The exact figure is always one hover or one table away. */
export const moneyShort = value => {
  if (!isNum(value)) return DASH
  const abs = Math.abs(value)
  const sign = value < 0 ? MINUS : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`
  return `${sign}₹${abs.toFixed(0)}`
}

/** Axis ticks are round numbers — ₹10K, ₹2L, ₹1Cr — so no decimals to carry. */
export const moneyTick = value => {
  if (!isNum(value)) return DASH
  const trim = n => String(Number(n.toFixed(2)))
  if (value >= 1e7) return `₹${trim(value / 1e7)}Cr`
  if (value >= 1e5) return `₹${trim(value / 1e5)}L`
  if (value >= 1e3) return `₹${trim(value / 1e3)}K`
  return `₹${trim(value)}`
}

/** A fraction as a percentage. A non-zero value too small to show at this
 *  precision says so, rather than printing a misleading 0.0%. */
export const pct = (value, digits = 1) => {
  if (!isNum(value)) return DASH
  const scaled = value * 100
  const floor = 10 ** -digits
  if (scaled !== 0 && Math.abs(scaled) < floor) return `${scaled < 0 ? '>−' : '<'}${floor}%`
  return `${scaled < 0 ? MINUS : ''}${Math.abs(scaled).toFixed(digits)}%`
}

/** Same, with the sign always shown — for gaps and returns. */
export const signedPct = (value, digits = 1) =>
  isNum(value) && value > 0 ? `+${pct(value, digits)}` : pct(value, digits)

export const num = (value, digits = 2) => (isNum(value) ? inr(value, digits) : DASH)

/** Green for up, red for down, nothing for flat or missing. Marked important:
 *  it always lands on an element that already has its own ink colour. */
export const signClass = value =>
  !isNum(value) || value === 0
    ? ''
    : value > 0
      ? 'text-[var(--quote-up)]!'
      : 'text-[var(--quote-down)]!'

/* ── Labels the backend uses for its catch-all groups ─────────────────── */

/** Role Diagnostic row for schemes with no (known) macro role. */
export const NO_MACRO_ROLE = '(no macro role)'
/** Base Name group for schemes the ISIN master does not have. */
export const NOT_IN_ISIN_MASTER = '(not in ISIN master)'
/** Any other dimension left blank on a scheme. */
export const NOT_STATED = 'Not stated'

/* ── Role band status ──────────────────────────────────────────────────── */

/**
 * How far a role's current mix may sit from its target and still be "Within
 * Band" — 10 percentage points either side. This is the backend's rule
 * (ROLE_BAND_MARGIN in pdfextractcontroller.js) copied here: the API sends each
 * role's `status` but not the range behind it, so the shaded band the charts
 * draw comes from this one constant. If the backend's margin changes, change
 * it here too — or have the API send it and read it from the output instead.
 * The status badges never depend on it; they are the API's own verdict.
 */
export const ROLE_BAND_MARGIN = 0.1

export const ROLE_STATUS = {
  WITHIN: 'Within Band',
  BELOW: 'Below Band',
  ABOVE: 'Above Band',
}

/** Shared table styles for the chart table-views and the holdings table. */
export const TH =
  'whitespace-nowrap border-b border-beige-line px-3 pb-2.5 pt-1 text-left font-display text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-mute'
export const TD = 'border-b border-beige-line/70 px-3 py-2.5 text-[13px] text-ink-soft'

/* ── Chart colours ─────────────────────────────────────────────────────── */

/**
 * One rule for every CAS chart:
 *
 *   colour      = which asset class / role family a mark belongs to
 *   fill style  = time — solid is today, a hollow outline or a dark tick is
 *                 the target. Colour never means "current vs target".
 *   green/amber = status only (STATUS_TONE) — never an asset class, never the
 *                 target series
 *   gaps        = neutral: grey text with ▲ ▼, because a rebalance is neither
 *                 a gain nor a loss
 *
 * The same role or group has the same colour in every chart.
 */

/** Neutral chart chrome, tuned to the cream page. */
export const CHART = {
  card: '#FDFAF5',
  track: '#F1EBE2',
  grid: '#E5DED3',
  zero: '#9A9186',
  target: '#1F2937',
  band: '#E9E4DA',
  ink: '#1F1B16',
  inkSoft: '#6B6459',
}

/** Equity is indigo, debt steel blue, diversifier muted violet. */
const FAMILY_COLORS = { equity: '#3446A6', debt: '#6F93C9', diversifier: '#8C7BC0' }

/** A shade of its family's colour for each role the model has. */
const ROLE_COLORS = {
  EQ_LargeCore: '#2C3A8F',
  EQ_GrowthCore: '#4A5BC4',
  EQ_Tactical: '#8391DB',
  FI_Core: '#5E86BF',
  FI_Tactical_Liquidity: '#9DB8DD',
  DV_HY_Diversifiers: '#8C7BC0',
}

/** Anything that belongs to no family — "(no macro role)", "Not in any group". */
export const NEUTRAL_COLOR = '#9A9186'
/** Whatever part of 100% no group accounts for. Neutral — it is not a series. */
export const REMAINDER_COLOR = '#d6d1c4'
/** The brand navy, for single-series marks outside the allocation charts. */
export const MARK = '#202E86'

/** A role or group name → its family, by the prefix or the word in it. */
export const familyOf = name => {
  const value = String(name ?? '')
  if (/^eq[_\s-]|equity/i.test(value)) return 'equity'
  if (/^fi[_\s-]|debt|fixed/i.test(value)) return 'debt'
  if (/^dv[_\s-]|diversif|hybrid/i.test(value)) return 'diversifier'
  return null
}

/** A macro role's colour: its own shade, else its family's, else neutral. */
export const roleColor = role => ROLE_COLORS[role] ?? FAMILY_COLORS[familyOf(role)] ?? NEUTRAL_COLOR

/** A Portfolio Snapshot group's colour — the family's aggregate shade. */
export const groupColor = metric => FAMILY_COLORS[familyOf(metric)] ?? NEUTRAL_COLOR

/**
 * Status tones — badges, the dumbbell's connector and the gap bars only.
 * `line` is for marks; `text` on `bg` clears 4.5:1. Always shown with an icon
 * and a word, never colour alone.
 */
export const STATUS_TONE = {
  ok: { text: '#2E6B45', bg: '#E8F3EC', border: '#BFDCC9', line: '#3E8A5C' },
  act: { text: '#8A5A12', bg: '#FBF1DF', border: '#E6C98F', line: '#B7791F' },
  none: { text: '#6B6459', bg: '#F1EBE2', border: '#E7E0D5', line: '#9A9186' },
}

export const statusTone = status =>
  status === ROLE_STATUS.WITHIN
    ? STATUS_TONE.ok
    : status === ROLE_STATUS.BELOW || status === ROLE_STATUS.ABOVE
      ? STATUS_TONE.act
      : STATUS_TONE.none

/** White or dark ink, whichever reads on this fill (#rrggbb). */
export const inkOn = hex => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(String(hex).slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // White needs 4.5:1 on the fill; past this luminance it no longer has it.
  return luminance > 0.183 ? CHART.ink : '#ffffff'
}

/** A gap as percentage points, unsigned: 0.182 → "18.2 pp". */
export const pp = value => (isNum(value) ? `${Math.abs(value * 100).toFixed(1)} pp` : DASH)

/** A change with its direction and no judgement: "▲ 4.4 pp" / "▼ 23.8 pp". */
export const deltaPp = value => {
  if (!isNum(value)) return DASH
  if (Math.abs(value * 100) < 0.05) return '0.0 pp'
  return `${value > 0 ? '▲' : '▼'} ${pp(value)}`
}

/* ── Record → a shape every view can trust ─────────────────────────────── */

const list = value => (Array.isArray(value) ? value : [])

/**
 * Arrays default to empty, and every scheme gets a stable `id` — ISINs can
 * repeat (the same ISIN under two PANs) or be missing, so the index keeps them
 * apart for React keys and for the detail dialog.
 */
export function normalizeCasOutput(record) {
  if (!record || typeof record !== 'object') return null
  return {
    ...record,
    investor: record.investor ?? {},
    fundSnapshot: record.fundSnapshot ?? {},
    summary: record.summary ?? {},
    totals: record.totals ?? {},
    schemes: list(record.schemes).map((scheme, index) => ({
      ...scheme,
      folioNos: list(scheme?.folioNos),
      id: `${scheme?.isin ?? 'no-isin'}-${index}`,
    })),
    baseNames: list(record.baseNames).map(group => ({
      ...group,
      macroRoles: list(group?.macroRoles),
      isins: list(group?.isins),
      casSchemeNames: list(group?.casSchemeNames),
      plans: list(group?.plans),
      options: list(group?.options),
      amcs: list(group?.amcs),
    })),
    roleDiagnostic: list(record.roleDiagnostic),
    portfolioSnapshot: list(record.portfolioSnapshot),
  }
}

/* ── Adding schemes up ─────────────────────────────────────────────────── */

/** Sum of a field, or null when no row has it — the backend's `sumOf`. */
const sumOf = (rows, field) =>
  rows.some(row => isNum(row[field]))
    ? rows.reduce((sum, row) => sum + (isNum(row[field]) ? row[field] : 0), 0)
    : null

/**
 * The same figures the backend puts in `totals`, for any subset of schemes.
 * Absolute return is market ÷ cost − 1 exactly as there. XIRR is not here on
 * purpose: it needs the cash flows, which the saved output does not keep.
 */
export function aggregate(schemes) {
  const costValue = sumOf(schemes, 'costValue')
  const marketValue = sumOf(schemes, 'marketValue')
  return {
    count: schemes.length,
    investedValue: sumOf(schemes, 'investedValue'),
    costValue,
    marketValue,
    marketValueCas: sumOf(schemes, 'marketValueCas'),
    gain: costValue !== null && marketValue !== null ? marketValue - costValue : null,
    absoluteReturn: costValue ? (marketValue ?? 0) / costValue - 1 : null,
    sipAmount: sumOf(schemes, 'sipAmount'),
    sipCount: schemes.filter(scheme => scheme.sipActive).length,
  }
}

/* ── Dimensions a scheme can be grouped and filtered by ────────────────── */

const orStated = value => (value === null || value === undefined || value === '' ? NOT_STATED : String(value))

export const DIMENSIONS = [
  { key: 'baseName', label: 'Fund (base name)', get: s => s.baseName || NOT_IN_ISIN_MASTER },
  { key: 'amc', label: 'AMC', get: s => orStated(s.amc) },
  { key: 'macroRole', label: 'Macro role', get: s => s.macroRole || NO_MACRO_ROLE },
  { key: 'plan', label: 'Plan', get: s => orStated(s.plan) },
  { key: 'option', label: 'Option', get: s => orStated(s.option) },
  { key: 'registrar', label: 'Registrar', get: s => orStated(s.registrar) },
  { key: 'holdingMode', label: 'Holding mode', get: s => orStated(s.holdingMode) },
]

export const dimensionByKey = key => DIMENSIONS.find(d => d.key === key) ?? DIMENSIONS[0]

/** Largest market value first; a group with no value at all goes last. */
const byValue = (a, b) =>
  (isNum(b.marketValue) ? b.marketValue : -Infinity) -
    (isNum(a.marketValue) ? a.marketValue : -Infinity) || a.label.localeCompare(b.label)

/**
 * Schemes → one row per value of the dimension, with the group's schemes kept
 * on it so a click can open them. `share` is the group's part of `total`.
 */
export function groupSchemes(schemes, dimension, total) {
  const groups = new Map()
  for (const scheme of schemes) {
    const label = dimension.get(scheme)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(scheme)
  }
  return [...groups.entries()]
    .map(([label, rows]) => {
      const figures = aggregate(rows)
      return {
        key: label,
        label,
        schemes: rows,
        ...figures,
        share: total && isNum(figures.marketValue) ? figures.marketValue / total : null,
      }
    })
    .sort(byValue)
}

/** Distinct values of a dimension as Select options, most-held first. */
export function optionsFor(schemes, dimension) {
  const counts = new Map()
  for (const scheme of schemes) {
    const label = dimension.get(scheme)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: `${value} (${count})` }))
}

/* ── Filters ───────────────────────────────────────────────────────────── */

export const EMPTY_FILTERS = { query: '', amc: '', macroRole: '', plan: '', sip: '' }

export const SIP_OPTIONS = [
  { value: 'active', label: 'SIP active' },
  { value: 'none', label: 'No SIP' },
]

export const isFiltered = filters =>
  Object.keys(EMPTY_FILTERS).some(key => String(filters[key] ?? '').trim() !== '')

/** Every name a scheme goes by, plus its codes — what the search box matches. */
const searchText = scheme =>
  [
    scheme.casSchemeName, scheme.isinMasterSchemeName, scheme.amfiSchemeName,
    scheme.baseName, scheme.isin, scheme.amc, scheme.macroRole, ...scheme.folioNos,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export function filterSchemes(schemes, filters) {
  const query = filters.query.trim().toLowerCase()
  return schemes.filter(scheme => {
    if (query && !searchText(scheme).includes(query)) return false
    for (const key of ['amc', 'macroRole', 'plan']) {
      if (filters[key] && dimensionByKey(key).get(scheme) !== filters[key]) return false
    }
    if (filters.sip === 'active' && !scheme.sipActive) return false
    if (filters.sip === 'none' && scheme.sipActive) return false
    return true
  })
}

/* ── Role Diagnostic ↔ schemes ─────────────────────────────────────────── */

/**
 * The schemes behind one Role Diagnostic row. The backend's "(no macro role)"
 * row holds every scheme whose role is missing *or* is not one of the roles
 * it listed, so that row is worked out the same way here.
 */
export function schemesForRole(schemes, role, diagnostic) {
  if (role !== NO_MACRO_ROLE) return schemes.filter(scheme => scheme.macroRole === role)
  const listed = new Set(diagnostic.map(row => row.role).filter(r => r && r !== NO_MACRO_ROLE))
  return schemes.filter(scheme => !scheme.macroRole || !listed.has(scheme.macroRole))
}

/* ── Axis helpers ──────────────────────────────────────────────────────── */

/** ~`count` round tick values covering [min, max]. */
export function niceTicks(min, max, count = 5) {
  if (!isNum(min) || !isNum(max)) return []
  if (min === max) return [min]
  const raw = (max - min) / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * power).find(s => raw <= s) ?? raw
  const ticks = []
  for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step) {
    ticks.push(Number(value.toFixed(12)))
  }
  return ticks
}

/* ── What the charts draw ──────────────────────────────────────────────── */

export const REMAINDER_LABEL = 'Not in any group'

/**
 * Portfolio Snapshot → what every asset-mix view draws. Each group takes its
 * family's colour (equity, debt, diversifier — read from its name), and
 * `bars` holds the Current / Recommended splits with the part no group covers
 * (holdings with no macro role) as a neutral remainder.
 */
export function buildAllocation(snapshot) {
  const groups = snapshot.map(row => ({
    ...row,
    label: text(row.metric),
    family: familyOf(row.metric),
    color: groupColor(row.metric),
  }))
  const sum = key => groups.reduce((total, group) => total + (isNum(group[key]) ? group[key] : 0), 0)
  const hasTarget = groups.some(group => isNum(group.recommended))
  const bar = (key, name) => {
    const rest = 1 - sum(key)
    return {
      name,
      segments: [
        ...groups.map(group => ({ label: group.label, value: group[key], color: group.color })),
        ...(rest > 0.0005 ? [{ label: REMAINDER_LABEL, value: rest, color: REMAINDER_COLOR, remainder: true }] : []),
      ].filter(segment => isNum(segment.value) && segment.value > 0),
    }
  }
  return { groups, hasTarget, bars: [bar('current', 'Current'), ...(hasTarget ? [bar('recommended', 'Recommended')] : [])] }
}

/** Role Diagnostic rows, each with the schemes behind it and its place in the
 *  backend's order (the risk profile's own sheet order). */
export const buildRoleRows = (diagnostic, schemes) =>
  diagnostic.map((row, index) => ({
    ...row,
    order: index,
    schemes: schemesForRole(schemes, row.role, diagnostic),
  }))

/** The dialog's figures for one role row. */
export const roleFigures = row => {
  const figures = aggregate(row.schemes)
  return { ...figures, invested: figures.investedValue ?? figures.costValue }
}

/** Tooltip lines for a role — shared with the other role views. */
export const roleValueTipRows = row => {
  const f = roleFigures(row)
  return [
    { label: 'market value', value: moneyShort(f.marketValue) },
    { label: 'invested', value: moneyShort(f.invested) },
    { label: 'gain', value: moneyShort(f.gain) },
    { label: 'abs. return', value: signedPct(f.absoluteReturn, 2) },
  ]
}

/* ── Holding shades ────────────────────────────────────────────────────── */

const HOLDING_DARK = '#202E86'
const HOLDING_LIGHT = '#B4BDEB'

const mixHex = (from, to, t) => {
  const channel = (hex, i) => parseInt(hex.slice(i, i + 2), 16)
  return `#${[1, 3, 5]
    .map(i => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t).toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * A holding's colour by its size within its group: the largest market value is
 * the deepest indigo, and each smaller one is lighter in proportion to its
 * value. A holding with no value takes the lightest shade.
 */
export const holdingShade = (value, max) =>
  isNum(value) && value > 0 && max > 0
    ? mixHex(HOLDING_DARK, HOLDING_LIGHT, 1 - Math.min(value / max, 1))
    : HOLDING_LIGHT

/** The same shade washed towards white — a holding's second series. */
export const tintOf = (hex, amount = 0.5) => mixHex(hex, '#ffffff', amount)

/** The two ends of the holding scale, for legends. */
export const HOLDING_SHADES = { dark: HOLDING_DARK, light: HOLDING_LIGHT }
