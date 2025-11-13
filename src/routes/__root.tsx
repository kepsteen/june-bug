/// <reference types="vite/client" />
import {
  Outlet,
  createRootRouteWithContext,
  useRouteContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import appCss from '@/styles/app.css?url'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { authClient } from '@/lib/auth-client'
import {
  fetchSession,
  getCookieName,
} from '@convex-dev/better-auth/react-start'
import { getCookie, getRequest } from '@tanstack/react-start/server'
import { seo } from '@/utils/seo'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { createServerFn } from '@tanstack/react-start'
import { ThemeProvider } from '@/contexts/theme-context'

// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { createAuth } = await import('@convex/auth')
  const { session } = await fetchSession(getRequest())
  const sessionCookieName = getCookieName(createAuth)
  const token = getCookie(sessionCookieName)
  return {
    userId: session?.user.id,
    token,
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'JuneBug - Your Personal Journal',
        description: `JuneBug is your personal journaling companion, helping you capture thoughts, memories, and moments.`,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  beforeLoad: async (ctx) => {
    const { userId, token } = await fetchAuth()

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return {
      userId,
      token,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <TanStackDevtools
            plugins={[
              {
                name: 'TanStack Query',
                render: <ReactQueryDevtoolsPanel />,
                defaultOpen: true,
              },
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
                defaultOpen: false,
              },
            ]}
          />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
