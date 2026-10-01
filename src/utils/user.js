import { DUMMY_USER } from '@/constants/user'

/** First letters of the display name, for the avatar placeholder. */
export function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'IS'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

/** The profile the sidebar footer and header menu render. */
export const PROFILE = { ...DUMMY_USER, initials: initialsOf(DUMMY_USER.name) }
