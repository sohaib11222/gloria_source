import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { subscriptionApi, Plan } from '../api/subscription'
import { CreditCard, Check } from 'lucide-react'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

function intervalLabel(interval: string): string {
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

export const PlanPicker: React.FC = () => {
  const [startingPlanId, setStartingPlanId] = useState<string | null>(null)

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.listPlans(),
  })

  const plans = (plansData?.items ?? []).filter((p: Plan) => p.active)

  const handleSubscribe = async (planId: string) => {
    setStartingPlanId(planId)
    try {
      const base = `${window.location.origin}${window.location.pathname || '/source'}`
      const successUrl = `${base}?tab=dashboard&checkout=success`
      const cancelUrl = `${base}?tab=dashboard`
      const { url } = await subscriptionApi.createCheckoutSession(planId, successUrl, cancelUrl)
      if (url) {
        window.location.href = url
      }
    } catch (e) {
      console.error('Checkout session failed:', e)
      setStartingPlanId(null)
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a plan</h2>
        <p className="text-gray-600">
          Select a plan to import branches and locations. You can change or cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="border-2 border-gray-200 hover:border-indigo-300 transition-colors flex flex-col"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-sm text-gray-500">{intervalLabel(plan.interval)}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(plan.pricePerBranchCents ?? plan.amountCents)}
              </div>
              <p className="text-xs text-gray-500 mb-4">per branch per {plan.interval.toLowerCase().replace('ly', '')}</p>
              <p className="text-sm text-gray-600 mb-4">
                Pay per branch. Add as many branches as you need; you can add more anytime.
              </p>
              <div className="mt-auto pt-4">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!startingPlanId}
                  loading={startingPlanId === plan.id}
                >
                  {startingPlanId === plan.id ? (
                    'Redirecting…'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
