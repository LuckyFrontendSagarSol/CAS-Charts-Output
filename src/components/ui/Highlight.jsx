/**
 * Marks the matched run inside a string, so the reason a row or result came
 * back is obvious. Falls back to the plain text when there is no match.
 */
export default function Highlight({ text, query }) {
  const value = String(text ?? '')
  const q = query.trim()
  const at = q ? value.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at === -1) return value

  return (
    <>
      {value.slice(0, at)}
      <mark className="rounded-[3px] bg-gold/35 px-0.5 text-ink">
        {value.slice(at, at + q.length)}
      </mark>
      {value.slice(at + q.length)}
    </>
  )
}
