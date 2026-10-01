import { useMemo } from 'react'
import casOutputJson from '@/data/casOutput.json'
import { normalizeCasOutput } from '@/components/charts/casOutputData'

/**
 * The CAS output every page draws from — read from src/data/casOutput.json,
 * not an API. Paste the response of POST /getLatestCasOutput into that file:
 * either the whole envelope (`{ success, message, data }`) or just the record
 * inside `data` works.
 *
 * Returns `{ status, output }`; `status` is 'ready' | 'empty' (the file holds
 * no record).
 */
const recordOf = json => (json && typeof json === 'object' && 'data' in json ? json.data : json)

export default function useCasOutput() {
  return useMemo(() => {
    const output = normalizeCasOutput(recordOf(casOutputJson))
    const hasData = output && (output.portfolioSnapshot.length || output.roleDiagnostic.length)
    return hasData ? { status: 'ready', output } : { status: 'empty', output: null }
  }, [])
}
