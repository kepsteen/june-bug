import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@/../convex/_generated/api'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    // If not authenticated, redirect to sign-in
    if (!context.userId) {
      throw redirect({ to: '/sign-in' })
    }

    // If authenticated, we need to check onboarding status
    // Redirect to entries for now, and the entries route will handle onboarding check
    throw redirect({ to: '/entries' })
  },
})
