import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@/../convex/_generated/api'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    // Always redirect to entries (works for both authenticated and unauthenticated users)
    // The entries route will handle onboarding checks for authenticated users
    throw redirect({ to: '/entries' })
  },
})
