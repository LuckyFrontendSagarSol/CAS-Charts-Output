import { FileSearch } from 'lucide-react'

/** What a page shows when src/data/casOutput.json holds nothing to draw. */
export default function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-beige-line bg-paper px-6 py-16 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-royal/[0.08] text-royal">
        <FileSearch size={22} />
      </span>
      <h2 className="font-display text-[16px] font-extrabold text-ink">No CAS output yet</h2>
      <div className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-mute">
        Paste the response of <code>/getLatestCasOutput</code> into <code>src/data/casOutput.json</code> and it will appear here.
      </div>
    </div>
  )
}
