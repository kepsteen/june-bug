import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import OnboardingFlow from '@/components/OnboardingFlow'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'
import { useEffect } from 'react'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context }) => {
    // Redirect to entries if not authenticated (onboarding is only for authenticated users)
    if (!context.userId) {
      throw redirect({
        to: '/entries',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const context = Route.useRouteContext()
  const navigate = useNavigate()

  // Get current user data to get the database user ID and check onboarding status
  const { data: currentUser, isLoading } = useQuery(
    convexQuery(api.auth.getCurrentUser, {})
  )

  // Redirect to entries if already onboarded
  useEffect(() => {
    if (currentUser && currentUser.isOnboarded) {
      navigate({ to: '/entries' })
    }
  }, [currentUser, navigate])

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow userId={currentUser._id as Id<'users'>} />
    </div>
  )
}
