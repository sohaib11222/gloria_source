import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Button } from './ui/Button'
import { X } from 'lucide-react'

type SourcePanelTab =
  | 'dashboard'
  | 'agreements'
  | 'locations'
  | 'branches'
  | 'location-branches'
  | 'pricing'
  | 'daily-pricing'
  | 'transactions'
  | 'reservations'
  | 'cancellations'
  | 'location-requests'
  | 'support'
  | 'docs'
  | 'settings'

export type PanelTourStep = {
  /** `data-tour` on sidebar control, or `_…` for a closing step with no highlight */
  target: string
  title: string
  description: string
  tab?: SourcePanelTab
  /** When tab is `location-branches`, open supplier endpoint vs manual tools */
  branchImport?: 'endpoint' | 'manual'
}

function isMetaStepTarget(target: string) {
  return target.startsWith('_')
}

const DEFAULT_STEPS: PanelTourStep[] = [
  {
    target: 'nav-dashboard',
    title: 'Overview',
    description: 'Health of your integration, company ID, and quick links. Start here after setup.',
  },
  {
    target: 'nav-agreements',
    title: 'Agreements',
    description: 'Work with agents: offers, agreement references, and activation status.',
  },
  {
    target: 'nav-locations',
    title: 'Locations',
    description: 'Your UN/LOCODE coverage: sync from the adapter, import lists, and manage pickup/drop-off codes.',
  },
  {
    target: 'nav-branches',
    title: 'Manual Branch import',
    description: 'Opens Location & Branches in manual mode: upload branch files, sync from your branch HTTP endpoint, and edit rows.',
    tab: 'location-branches',
    branchImport: 'manual',
  },
  {
    target: 'branches-upload-file',
    title: 'Upload File',
    description: 'Upload branch data manually from a file when you receive updates in batches.',
    tab: 'location-branches',
    branchImport: 'manual',
  },
  {
    target: 'branches-sync-endpoint',
    title: 'Sync (manual branch HTTP)',
    description: 'Pull branch data from the branch import endpoint saved in Settings and merge changes into your branch table.',
    tab: 'location-branches',
    branchImport: 'manual',
  },
  {
    target: 'branches-add-branch',
    title: 'Add Branch',
    description: 'Create a branch record directly from the portal for quick fixes or one-off entries.',
    tab: 'location-branches',
    branchImport: 'manual',
  },
  {
    target: 'nav-location-branches',
    title: 'Location & Branches',
    description: 'Configure the GLORIA location list (HTTP or gRPC), import/sync coverage and detailed branches in one flow.',
    tab: 'location-branches',
    branchImport: 'endpoint',
  },
  {
    target: 'location-branches-configure-endpoint',
    title: 'Configure Endpoint',
    description: 'Set the location-list endpoint and choose HTTP or gRPC. Use Sample & Validate before importing.',
    tab: 'location-branches',
    branchImport: 'endpoint',
  },
  {
    target: 'location-branches-import-endpoint',
    title: 'Import from endpoint',
    description: 'Runs a full import from your supplier endpoint into Gloria coverage and branch data.',
    tab: 'location-branches',
    branchImport: 'endpoint',
  },
  {
    target: 'location-branches-sync-endpoint',
    title: 'Sync from endpoint',
    description: 'Re-fetches and upserts data. Existing rows are updated, new ones are added, and missing rows are not deleted.',
    tab: 'location-branches',
    branchImport: 'endpoint',
  },
  {
    target: 'nav-pricing',
    title: 'Pricing',
    description: 'Availability samples and pricing-related configuration for your source.',
    tab: 'pricing',
  },
  {
    target: 'pricing-format-xml',
    title: 'Pricing format (XML/JSON/gRPC)',
    description: 'Choose how Gloria calls your source: OTA XML, Gloria JSON, or gRPC GetAvailability.',
    tab: 'pricing',
  },
  {
    target: 'pricing-save-endpoint',
    title: 'Save pricing endpoint',
    description: 'Save the endpoint URL for XML/JSON mode so repeated fetch tests use the same saved target.',
    tab: 'pricing',
  },
  {
    target: 'pricing-fetch-store',
    title: 'Fetch & Store',
    description: 'Send the request with the current parameters, parse the supplier response, and store availability samples in Gloria.',
    tab: 'pricing',
  },
  {
    target: 'nav-daily-pricing',
    title: 'Daily Prices',
    description: 'Calendar view of daily rates tied to your pricing samples.',
    tab: 'daily-pricing',
  },
  {
    target: 'nav-transactions',
    title: 'Transactions',
    description: 'Billing movements and subscription-related charges.',
  },
  {
    target: 'nav-reservations',
    title: 'Reservations',
    description: 'Bookings flowing through Gloria for your source.',
  },
  {
    target: 'nav-cancellations',
    title: 'Cancellations',
    description: 'Cancelled reservations and related records.',
  },
  {
    target: 'nav-location-requests',
    title: 'Location Requests',
    description: 'Requests to add or change locations in your coverage.',
  },
  {
    target: 'nav-support',
    title: 'Support',
    description: 'Open tickets and message the Gloria team.',
  },
  {
    target: 'nav-settings',
    title: 'Settings',
    description: 'Company profile, whitelist, and password changes.',
  },
  {
    target: 'nav-docs',
    title: 'Docs',
    description: 'Full-screen API reference and integration guides (opens in a new tab).',
  },
  {
    target: '_summary',
    title: 'Quick recap',
    description:
      'Typical flow: confirm Overview, set up Agreements with agents, then Locations (coverage). Use Location & Branches for GLORIA location list import or manual file / branch-endpoint sync. Then Pricing and Daily Prices as needed, then monitor Reservations/Cancellations and billing in Transactions. Support, Settings, and Docs are always available from this menu.',
  },
]

function getTargetEl(target: string): HTMLElement | null {
  return document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
}

export interface SourcePanelTourProps {
  open: boolean
  onClose: () => void
  /** Called when user finishes last step or skips (for persisting “seen”) */
  onComplete?: () => void
  steps?: PanelTourStep[]
  onStepChangeTab?: (tab: SourcePanelTab, opts?: { branchImport?: 'endpoint' | 'manual' }) => void
}

export const SourcePanelTour: React.FC<SourcePanelTourProps> = ({
  open,
  onClose,
  onComplete,
  steps = DEFAULT_STEPS,
  onStepChangeTab,
}) => {
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  const step = steps[index]

  const finish = useCallback(() => {
    onComplete?.()
    onClose()
  }, [onComplete, onClose])

  const handleSkip = useCallback(() => finish(), [finish])

  const updateRect = useCallback(() => {
    if (!open || !step) {
      setBox(null)
      return
    }
    if (isMetaStepTarget(step.target)) {
      setBox(null)
      return
    }
    const el = getTargetEl(step.target)
    if (!el) {
      setBox(null)
      return
    }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const r = el.getBoundingClientRect()
    const pad = 8
    setBox({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    })
  }, [open, step])

  useLayoutEffect(() => {
    updateRect()
  }, [updateRect, index])

  useEffect(() => {
    if (!open || !step?.tab || !onStepChangeTab) return
    onStepChangeTab(step.tab, step.branchImport ? { branchImport: step.branchImport } : undefined)
  }, [open, step, onStepChangeTab])

  useEffect(() => {
    if (!open) return
    const onResize = () => updateRect()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open, updateRect])

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleSkip])

  const handleNext = () => {
    if (index >= steps.length - 1) {
      finish()
      return
    }
    let next = index + 1
    while (
      next < steps.length &&
      !isMetaStepTarget(steps[next].target) &&
      !steps[next].tab &&
      !getTargetEl(steps[next].target)
    ) {
      next++
    }
    if (next >= steps.length) {
      finish()
      return
    }
    setIndex(next)
  }

  const handleBack = () => {
    if (index <= 0) return
    let prev = index - 1
    while (
      prev >= 0 &&
      !isMetaStepTarget(steps[prev].target) &&
      !steps[prev].tab &&
      !getTargetEl(steps[prev].target)
    ) {
      prev--
    }
    if (prev < 0) return
    setIndex(prev)
  }

  if (!open) return null

  const missing = step && !isMetaStepTarget(step.target) && !getTargetEl(step.target)

  return (
    <div className="fixed inset-0 z-[240] pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="panel-tour-title">
      {box && (
        <div
          className="absolute rounded-lg border-4 border-blue-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.72)] transition-all duration-200 ease-out pointer-events-none"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        />
      )}
      {!box && (
        <div className="absolute inset-0 bg-slate-900/75" aria-hidden />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                Step {index + 1} of {steps.length}
              </p>
              <h2 id="panel-tour-title" className="text-lg font-bold text-gray-900">
                {step?.title ?? 'Tour'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              aria-label="Close tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {missing ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              This step targets a sidebar item that is not visible (try desktop width or open the mobile menu). You can skip or use Next to continue.
            </p>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{step?.description}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleSkip}>
              Skip tour
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleBack} disabled={index <= 0}>
                Back
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleNext}>
                {index >= steps.length - 1 ? 'Done' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const SOURCE_PANEL_TOUR_STORAGE_KEY = (companyId: string) => `source_panel_tour_done_v1_${companyId}`
