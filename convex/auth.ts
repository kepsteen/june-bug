import { betterAuth } from 'better-auth'
import {
  AuthFunctions,
  createClient,
  GenericCtx,
} from '@convex-dev/better-auth'
// import { anonymous, emailOTP, magicLink, twoFactor } from 'better-auth/plugins'
import { twoFactor } from 'better-auth/plugins'
import { convex } from '@convex-dev/better-auth/plugins'
import {
  sendEmailVerification,
  sendMagicLink,
  sendOTPVerification,
  sendResetPassword,
} from './email'
import { requireActionCtx } from '@convex-dev/better-auth/utils'
import { components, internal } from './_generated/api'
import betterAuthSchema from './betterAuth/schema'
import { query, QueryCtx } from './_generated/server'
import { DataModel, Id } from './_generated/dataModel'
import { asyncMap, withoutSystemFields } from 'convex-helpers'

// This implementation is upgraded to 0.8 Local Install with no
// database migration required. It continues the pattern of writing
// userId to the Better Auth users table and maintaining a separate
// users table for application data.

const siteUrl = process.env.SITE_URL

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel, typeof betterAuthSchema>(
  components.betterAuth,
  {
    authFunctions,
    local: {
      schema: betterAuthSchema,
    },
    verbose: true,
    triggers: {
      user: {
        onCreate: async (ctx, authUser) => {
          console.log('onCreate trigger fired for user:', authUser._id)
          const now = Date.now()

          // Handle missing or empty email from OAuth providers (e.g., GitHub private emails)
          const email = authUser.email || `user-${authUser._id}@placeholder.local`

          try {
            const userId = await ctx.db.insert('users', {
              email,
              isOnboarded: false,
              createdAt: now,
              updatedAt: now,
            })
            console.log('Successfully created user in users table:', userId)
            await authComponent.setUserId(ctx, authUser._id, userId)
            console.log('Successfully linked auth user to app user')
          } catch (error) {
            console.error('Failed to create user in onCreate trigger:', error)
            console.error('authUser data:', { id: authUser._id, email: authUser.email, name: authUser.name })
            throw error // Re-throw to prevent silent failure
          }
        },
        onUpdate: async (ctx, newUser, oldUser) => {
          if (oldUser.email === newUser.email) {
            return
          }
          // Only update email if userId exists (user was properly created)
          if (newUser.userId) {
            await ctx.db.patch(newUser.userId as Id<'users'>, {
              email: newUser.email || undefined,
              updatedAt: Date.now(),
            })
          }
        },
        onDelete: async (ctx, authUser) => {
          const user = await ctx.db.get(authUser.userId as Id<'users'>)
          if (!user) {
            return
          }
          const todos = await ctx.db
            .query('todos')
            .withIndex('userId', (q) => q.eq('userId', user._id))
            .collect()
          await asyncMap(todos, async (todo) => {
            await ctx.db.delete(todo._id)
          })
          await ctx.db.delete(user._id)
        },
      },
    },
  },
)

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) =>
  betterAuth({
    baseURL: siteUrl,
    logger: {
      disabled: optionsOnly,
    },
    database: authComponent.adapter(ctx),
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(requireActionCtx(ctx), {
          to: user.email,
          url,
        })
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(requireActionCtx(ctx), {
          to: user.email,
          url,
        })
      },
    },
    socialProviders: {
      ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: process.env.GITHUB_CLIENT_ID,
              clientSecret: process.env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
      //   ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      //     ? {
      //         google: {
      //           clientId: process.env.GOOGLE_CLIENT_ID,
      //           clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      //         },
      //       }
      //     : {}),
    },
    user: {
      deleteUser: {
        enabled: true,
      },
      additionalFields: {
        foo: {
          type: 'string',
          required: false,
        },
      },
    },
    plugins: [
      // magicLink({
      //   sendMagicLink: async ({ email, url }) => {
      //     await sendMagicLink(requireActionCtx(ctx), {
      //       to: email,
      //       url,
      //     })
      //   },
      // }),
      // emailOTP({
      //   async sendVerificationOTP({ email, otp }) {
      //     await sendOTPVerification(requireActionCtx(ctx), {
      //       to: email,
      //       code: otp,
      //     })
      //   },
      // }),
      twoFactor(),
      // anonymous(),
      convex(),
    ],
  })

// Below are example functions for getting the current user
// Feel free to edit, omit, etc.
export const safeGetUser = async (ctx: QueryCtx) => {
  const authUser = await authComponent.safeGetAuthUser(ctx)
  if (!authUser) {
    return
  }
  const user = await ctx.db.get(authUser.userId as Id<'users'>)
  if (!user) {
    return
  }
  return { ...user, ...withoutSystemFields(authUser) }
}

export const getUser = async (ctx: QueryCtx) => {
  const user = await safeGetUser(ctx)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return safeGetUser(ctx)
  },
})
