import { NAV_ITEMS } from '@/constants/nav'

/**
 * Header search over the pages.
 *
 * The index is the nav tree itself — every routable page, its heading, the
 * section it sits under, and a few synonyms (see `keywords` in
 * constants/nav.js). A page added to the nav is searchable with no extra
 * work; a page NOT in the nav has to be added to that file to be found.
 */

/** Higher wins. A hit on the heading always outranks a hit on a synonym. */
const SCORE = {
  exactLabel: 100,
  labelStart: 80,
  labelWord: 70,
  label: 60,
  sectionStart: 45,
  section: 40,
  keywordStart: 30,
  keyword: 20,
}

function scoreItem(item, q) {
  const label = item.label.toLowerCase()
  const section = (item.section ?? '').toLowerCase()
  const keywords = (item.keywords ?? []).map(k => k.toLowerCase())

  if (label === q) return SCORE.exactLabel
  if (label.startsWith(q)) return SCORE.labelStart
  // "column" should find "Metric Column" — match the start of any word too.
  if (label.split(/\s+/).some(word => word.startsWith(q))) return SCORE.labelWord
  if (label.includes(q)) return SCORE.label

  if (section.startsWith(q)) return SCORE.sectionStart
  if (section.includes(q)) return SCORE.section

  if (keywords.some(k => k.startsWith(q))) return SCORE.keywordStart
  if (keywords.some(k => k.includes(q))) return SCORE.keyword

  return 0
}

export function searchPages(query, limit = 6) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return NAV_ITEMS
    .map(item => ({ item, score: scoreItem(item, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map(({ item }) => item)
}
