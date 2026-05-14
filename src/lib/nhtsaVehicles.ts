/**
 * NHTSA vPIC (Vehicle Product Information Catalog) — public read API, no key.
 * @see https://vpic.nhtsa.dot.gov/api/
 *
 * Coverage is US-market oriented but includes most global brands sold in the US.
 */

const VPIC_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'

type VpicMakeRow = { Make_Name?: string }
type VpicModelRow = { Model_Name?: string }

function uniqueSorted(names: string[]): string[] {
  const set = new Set<string>()
  for (const n of names) {
    const t = n.trim()
    if (t) set.add(t)
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export async function fetchNhtsaMakes(): Promise<string[]> {
  const res = await fetch(`${VPIC_BASE}/GetAllMakes?format=json`, { method: 'GET' })
  if (!res.ok) throw new Error(`VPIC GetAllMakes failed (${res.status})`)
  const json = (await res.json()) as { Results?: VpicMakeRow[] }
  const rows = json.Results ?? []
  const names = rows.map((r) => String(r.Make_Name ?? ''))
  return uniqueSorted(names)
}

export async function fetchNhtsaModelsForMake(make: string): Promise<string[]> {
  const q = make.trim()
  if (!q) return []
  const res = await fetch(`${VPIC_BASE}/GetModelsForMake/${encodeURIComponent(q)}?format=json`, { method: 'GET' })
  if (!res.ok) throw new Error(`VPIC GetModelsForMake failed (${res.status})`)
  const json = (await res.json()) as { Results?: VpicModelRow[] }
  const rows = json.Results ?? []
  const names = rows.map((r) => String(r.Model_Name ?? ''))
  return uniqueSorted(names)
}
