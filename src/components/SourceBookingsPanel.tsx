import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Search, RefreshCw } from 'lucide-react'
import { sourceBookingsApi, SourceBookingView } from '../api/sourceBookings'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

function formatBookingTableDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm')
  } catch {
    return iso
  }
}

function locLabel(unlocode: string | null | undefined): string {
  if (!unlocode) return '—'
  return unlocode
}

export interface SourceBookingsPanelProps {
  view: SourceBookingView
  title: string
  description: string
}

export const SourceBookingsPanel: React.FC<SourceBookingsPanelProps> = ({ view, title, description }) => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['source-bookings', view],
    queryFn: () => sourceBookingsApi.list({ view, limit: 150, offset: 0 }),
  })

  const rows = data?.items ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((b) => {
      const hay = [
        b.id,
        b.supplierBookingRef,
        b.agentBookingRef,
        b.agreementRef,
        b.agentCompanyName,
        b.customerName,
        b.contact,
        b.pickupUnlocode,
        b.dropoffUnlocode,
        b.status,
        b.vehicleMakeModel,
        b.vehicleClass,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search])

  const statusDot = (status: string) => {
    const s = (status || '').toUpperCase()
    const cancelled = s === 'CANCELLED'
    return (
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${cancelled ? 'bg-red-500' : 'bg-emerald-500'}`}
        title={s}
        aria-label={s}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, agent, customer, location…"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {String(
            (error as any)?.response?.data?.message ||
              (error instanceof Error ? error.message : '') ||
              'Failed to load bookings'
          )}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide border-b border-gray-200">
                <th className="px-3 py-2 w-8" />
                <th className="px-3 py-2 whitespace-nowrap">Created</th>
                <th className="px-3 py-2 whitespace-nowrap">Supplier ref</th>
                <th className="px-3 py-2 whitespace-nowrap">Pickup</th>
                <th className="px-3 py-2">Pickup loc</th>
                <th className="px-3 py-2 whitespace-nowrap">Return</th>
                <th className="px-3 py-2">Return loc</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2 whitespace-nowrap">Agent ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No bookings in this view yet. When an agent creates or cancels a booking against your source, it appears here.
                  </td>
                </tr>
              ) : (
                filtered.map((b, idx) => {
                  const rowBg =
                    (b.status || '').toUpperCase() === 'CANCELLED'
                      ? 'bg-orange-50/80'
                      : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                  return (
                    <tr key={b.id} className={rowBg}>
                      <td className="px-3 py-2 align-middle">{statusDot(b.status)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
                        {formatBookingTableDate(b.createdAt)}
                      </td>
                      <td className="px-3 py-2 font-mono text-blue-700 whitespace-nowrap">
                        {b.supplierBookingRef || b.id.slice(0, 12)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
                        {formatBookingTableDate(b.pickupDateTime)}
                      </td>
                      <td className="px-3 py-2 text-gray-800 max-w-[200px]">{locLabel(b.pickupUnlocode)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-800 tabular-nums">
                        {formatBookingTableDate(b.dropoffDateTime)}
                      </td>
                      <td className="px-3 py-2 text-gray-800 max-w-[200px]">{locLabel(b.dropoffUnlocode)}</td>
                      <td className="px-3 py-2 text-gray-900">{b.customerName || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 break-all max-w-[180px]">{b.contact || '—'}</td>
                      <td className="px-3 py-2 text-gray-900 font-medium">{b.agentCompanyName}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {b.agentBookingRef || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && rows.length > 0 && (
        <p className="text-xs text-gray-500">
          Showing {filtered.length} of {rows.length} loaded
          {data?.total != null && data.total > rows.length ? ` (${data.total} total)` : ''}.
        </p>
      )}
    </div>
  )
}
