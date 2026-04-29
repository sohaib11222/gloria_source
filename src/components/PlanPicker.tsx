import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { subscriptionApi, Plan, PlanInterval } from '../api/subscription'
import { CreditCard } from 'lucide-react'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function intervalLabel(interval: PlanInterval): string {
  switch (interval) {
    case 'WEEKLY':
      return 'Weekly'
    case 'MONTHLY':
      return 'Monthly'
    case 'YEARLY':
      return 'Yearly'
    default:
      return interval
  }
}

function getPlanDisplayPriceCents(plan: Plan): number {
  return (plan.pricePerBranchCents ?? 0) > 0 ? (plan.pricePerBranchCents as number) : plan.amountCents
}

const INTERVAL_ORDER: PlanInterval[] = ['WEEKLY', 'MONTHLY', 'YEARLY']

export const PlanPicker: React.FC = () => {
  const [branchCount, setBranchCount] = useState<number>(1)
  const [interval, setInterval] = useState<PlanInterval | ''>('')
  const [planId, setPlanId] = useState<string>('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.listPlans(),
  })

  const plans = (plansData?.items ?? []).filter((p: Plan) => p.active)

  const plansByInterval = useMemo(() => {
    const map = new Map<PlanInterval, Plan[]>()
    for (const p of plans) {
      const list = map.get(p.interval) ?? []
      list.push(p)
      map.set(p.interval, list)
    }
    return map
  }, [plans])

  const intervalOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: '', label: 'Select billing period' }]
    for (const iv of INTERVAL_ORDER) {
      const list = plansByInterval.get(iv)
      if (list?.length) {
        opts.push({ value: iv, label: intervalLabel(iv) })
      }
    }
    return opts
  }, [plansByInterval])

  const plansForInterval = interval ? plansByInterval.get(interval as PlanInterval) ?? [] : []

  useEffect(() => {
    if (!interval) {
      setPlanId('')
      return
    }
    const list = plansByInterval.get(interval as PlanInterval) ?? []
    if (list.length === 0) {
      setPlanId('')
      return
    }
    setPlanId((prev) => (list.some((p) => p.id === prev) ? prev : list[0].id))
  }, [interval, plansByInterval])

  const selectedPlan = plans.find((p) => p.id === planId)
  const pricePerBranch = selectedPlan ? getPlanDisplayPriceCents(selectedPlan) : 0
  const totalPerPeriodCents = Math.round(branchCount * pricePerBranch)
  const maxBranches =
    selectedPlan && selectedPlan.branchLimit > 0 ? selectedPlan.branchLimit : 100_000

  const handleSubscribe = async () => {
    if (!selectedPlan || !planId) {
      toast.error('Choose how many branches you need and a billing period.')
      return
    }
    const qty = Math.max(1, Math.floor(branchCount))
    if (selectedPlan.branchLimit > 0 && qty > selectedPlan.branchLimit) {
      toast.error(`This plan allows at most ${selectedPlan.branchLimit} branches. Lower the count or pick another plan.`)
      return
    }
    setCheckoutLoading(true)
    try {
      const base = `${window.location.origin}${window.location.pathname || '/source'}`
      const successUrl = `${base}?tab=dashboard&checkout=success`
      const cancelUrl = `${base}?tab=dashboard`
      const { url } = await subscriptionApi.createCheckoutSession(planId, successUrl, cancelUrl, qty)
      if (url) {
        window.location.href = url
      } else {
        toast.error('No checkout URL returned.')
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Checkout failed. Try again or contact support.'
      toast.error(typeof msg === 'string' ? msg : 'Checkout failed.')
      setCheckoutLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto border-2 border-amber-200 bg-amber-50">
        <CardContent className="py-8 text-center">
          <p className="text-amber-900 font-medium">No plans available. Please contact support.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex p-3 bg-indigo-100 rounded-xl mb-4">
          <CreditCard className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to import branches</h2>
        <p className="text-gray-600">
          Choose how many branches you want covered on your subscription, then pick weekly, monthly, or yearly billing.
          Pricing is set in the admin billing area (per branch, EUR). Secure payment opens in Stripe Checkout (EUR).
        </p>
      </div>

      <Card className="max-w-lg mx-auto border-2 border-indigo-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Input
            label="Number of branches"
            type="number"
            min={1}
            max={maxBranches}
            value={branchCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              setBranchCount(Number.isFinite(v) ? Math.max(1, v) : 1)
            }}
            helperText={
              selectedPlan && selectedPlan.branchLimit > 0
                ? `This plan allows up to ${selectedPlan.branchLimit} branches on one subscription.`
                : 'Locations are unlimited; only branches count toward this quota.'
            }
          />

          <Select
            label="Billing period"
            value={interval}
            onChange={(e) => {
              setInterval((e.target.value as PlanInterval) || '')
            }}
            options={intervalOptions}
          />

          {plansForInterval.length > 1 && (
            <Select
              label="Plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              options={plansForInterval.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          )}

          {selectedPlan && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Plan</span>
                <span className="font-medium text-gray-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Price per branch / {intervalLabel(selectedPlan.interval).toLowerCase()}</span>
                <span className="font-medium text-gray-900">{formatPrice(pricePerBranch)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Branches</span>
                <span className="font-medium text-gray-900">{Math.max(1, Math.floor(branchCount))}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Estimated total per billing period (EUR)</span>
                <span className="font-bold text-indigo-700">{formatPrice(totalPerPeriodCents)}</span>
              </div>
              <p className="text-xs text-gray-500 pt-1">
                Stripe charges the line total in the plan currency (EUR). Taxes may be added at checkout if
                configured in Stripe.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleSubscribe}
            disabled={!selectedPlan || checkoutLoading}
            loading={checkoutLoading}
          >
            Continue to Stripe Checkout (EUR)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
