import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function filterStrings(
  options: readonly string[],
  query: string,
  initialVisible: number,
  maxFiltered: number,
): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return options.slice(0, initialVisible)
  const prefix: string[] = []
  const contains: string[] = []
  for (const c of options) {
    const cl = c.toLowerCase()
    if (cl.startsWith(q)) {
      prefix.push(c)
      if (prefix.length >= maxFiltered) break
    }
  }
  if (prefix.length >= maxFiltered) return prefix
  for (const c of options) {
    const cl = c.toLowerCase()
    if (cl.includes(q) && !cl.startsWith(q)) {
      contains.push(c)
      if (prefix.length + contains.length >= maxFiltered) break
    }
  }
  return [...prefix, ...contains].slice(0, maxFiltered)
}

export type SearchableStringPickerProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  /** When the user picks a row or blurs with a value different from the value at focus (case-insensitive). */
  onCommit?: (v: string) => void
  options: string[]
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  helperText?: string
  emptyListHint?: string
  initialVisible?: number
  maxFiltered?: number
  /** Max length for free-typed value */
  maxLength?: number
}

export function SearchableStringPicker({
  id,
  value,
  onChange,
  onCommit,
  options,
  loading,
  disabled,
  placeholder,
  helperText,
  emptyListHint,
  initialVisible = 60,
  maxFiltered = 200,
  maxLength = 80,
}: SearchableStringPickerProps) {
  const baseId = id ?? 'searchable-string-picker'
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const valueAtFocusRef = useRef('')

  const suggestions = useMemo(
    () => filterStrings(options, value, initialVisible, maxFiltered),
    [options, value, initialVisible, maxFiltered],
  )

  const maybeCommit = useCallback(
    (next: string) => {
      if (!onCommit) return
      const a = next.trim().toLowerCase()
      const b = valueAtFocusRef.current.trim().toLowerCase()
      if (a !== b) onCommit(next)
    },
    [onCommit],
  )

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
  }, [value, open, suggestions.length])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open, suggestions])

  const pick = useCallback(
    (item: string) => {
      onChange(item)
      maybeCommit(item)
      setOpen(false)
    },
    [onChange, maybeCommit],
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

  const onBlurInput = () => {
    queueMicrotask(() => {
      if (rootRef.current?.contains(document.activeElement)) return
      setOpen(false)
      maybeCommit(value)
    })
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
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        onFocus={() => {
          valueAtFocusRef.current = value
          setOpen(true)
        }}
        onBlur={onBlurInput}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-listbox` : undefined}
        aria-autocomplete="list"
        role="combobox"
      />
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={`${baseId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {suggestions.map((item, idx) => (
            <li key={`${item}-${idx}`} role="presentation">
              <button
                type="button"
                role="option"
                data-idx={idx}
                aria-selected={idx === highlight}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 ${idx === highlight ? 'bg-blue-100' : ''}`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && value.trim() && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
          {emptyListHint ?? 'No matches — you can keep your typed value if it is correct.'}
        </div>
      )}
      {(loading || helperText) && (
        <p className="mt-1 text-[11px] text-gray-500">{loading ? 'Loading suggestions…' : helperText}</p>
      )}
    </div>
  )
}
