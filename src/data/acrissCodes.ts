/**
 * ACRISS / SIPP four-letter vehicle codes used in car rental and OTA.
 * Generated as the full cartesian product of standard position-1–4 character sets
 * (same structure as industry SIPP tables). No external API required.
 *
 * @see https://en.wikipedia.org/wiki/ACRISS
 */
const CAT = 'MNEHCDIJSRFGPULWOX' as const // category
const TYPE = 'BCDWVLSTFJXPQZ' as const // type / doors
const TRANS = 'MNCABDUZHIX' as const // transmission / drive
const FUEL = 'RNDQHECISVZLXUOTM' as const // fuel / AC / misc

function buildAllSippCodes(): string[] {
  const out: string[] = []
  for (const a of CAT) {
    for (const b of TYPE) {
      for (const c of TRANS) {
        for (const d of FUEL) {
          out.push(`${a}${b}${c}${d}`)
        }
      }
    }
  }
  out.sort()
  return out
}

/** ~44k valid 4-letter SIPP shapes; use with search / scroll, not full render. */
export const ALL_SIPP_ACRISS_CODES: readonly string[] = buildAllSippCodes()
