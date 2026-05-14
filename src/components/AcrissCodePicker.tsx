import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_SIPP_ACRISS_CODES } from '../data/acrissCodes'

const INITIAL_VISIBLE = 80
const MAX_FILTERED = 250

function mergeCodes(custom: string[]): string[] {
  if (!custom.length) return [...ALL_SIPP_ACRISS_CODES]
  const set = new Set<string>(ALL_SIPP_ACRISS_CODES as readonly string[] as string[])
  for (const c of custom) {
    const u = c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (u.length >= 2 && u.length <= 8) set.add(u)
  }
  return [...set].sort()
}

function filterCodes(codes: readonly string[], query: string): string[] {
  const q = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!q) return codes.slice(0, INITIAL_VISIBLE)
  const prefix: string[] = []
  const contains: string[] = []
  for (const c of codes) {
    if (c.startsWith(q)) {
      prefix.push(c)
      if (prefix.length >= MAX_FILTERED) break
    }
  }
  if (prefix.length >= MAX_FILTERED) return prefix
  for (const c of codes) {
    if (c.includes(q) && !c.startsWith(q)) {
      contains.push(c)
      if (prefix.length + contains.length >= MAX_FILTERED) break
    }
  }
  return [...prefix, ...contains].slice(0, MAX_FILTERED)
}

export type AcrissCodePickerProps = {
  id?: string
  value: string
  onChange: (code: string) => void
  customCodes: string[]
  disabled?: boolean
}

export function AcrissCodePicker({ id, value, onChange, customCodes, disabled }: AcrissCodePickerProps) {
  const baseId = id ?? 'acriss-code-picker'
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const allMerged = useMemo(() => mergeCodes(customCodes), [customCodes])
  const suggestions = useMemo(() => filterCodes(allMerged, value), [allMerged, value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    setHighlight(0)
  }, [value, open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open, suggestions])

  const pick = useCallback(
    (code: string) => {
      onChange(code)
      setOpen(false)
    },
    [onChange],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      pick(suggestions[highlight] ?? suggestions[0])
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <input
        id={baseId}
        type="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Type to search (e.g. CDAR)…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-acriss-listbox` : undefined}
        aria-autocomplete="list"
        role="combobox"
      />
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={`${baseId}-acriss-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {suggestions.map((code, idx) => (
            <li key={code} role="presentation">
              <button
                type="button"
                role="option"
                data-idx={idx}
                aria-selected={idx === highlight}
                className={`w-full px-3 py-1.5 text-left font-mono text-sm hover:bg-blue-50 ${
                  idx === highlight ? 'bg-blue-100' : ''
                }`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(code)}
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && value.trim() && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
          No preset match — use <strong>New ACRISS</strong> to add this code.
        </div>
      )}
      <p className="mt-1 text-[11px] text-gray-500">
        {value.trim()
          ? `${suggestions.length} match${suggestions.length === 1 ? '' : 'es'} · full catalog is searchable`
          : `Showing first ${INITIAL_VISIBLE} codes (A–Z) — type to narrow`}
      </p>
    </div>
  )
}
