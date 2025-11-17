import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Complete onboarding for a user by updating their profile with all onboarding data
 */
export const completeOnboarding = mutation({
  args: {
    userId: v.id('users'),
    fullName: v.string(),
    age: v.optional(v.number()),
    currentRole: v.string(),
    experienceLevel: v.union(
      v.literal('Junior'),
      v.literal('Mid-Level'),
      v.literal('Senior'),
      v.literal('Lead'),
      v.literal('Principal')
    ),
    mentorshipStyle: v.union(
      v.literal('Structured'),
      v.literal('Exploratory'),
      v.literal('Challenge-driven'),
      v.literal('Reflective')
    ),
    developmentGoals: v.array(v.string()),
    techStack: v.array(v.string()),
    workEnvironment: v.union(
      v.literal('Individual contributor at company'),
      v.literal('Team lead/manager'),
      v.literal('Freelance/consultant'),
      v.literal('Student/bootcamp'),
      v.literal('Career transition/job seeking'),
      v.literal('Side projects only')
    ),
    journalingFrequency: v.union(
      v.literal('Daily'),
      v.literal('Every other day'),
      v.literal('Weekly'),
      v.literal('Custom schedule')
    ),
    customScheduleDays: v.optional(
      v.array(
        v.union(
          v.literal('Monday'),
          v.literal('Tuesday'),
          v.literal('Wednesday'),
          v.literal('Thursday'),
          v.literal('Friday'),
          v.literal('Saturday'),
          v.literal('Sunday')
        )
      )
    ),
    journalingTime: v.string(),
    notificationPreferences: v.array(
      v.union(
        v.literal('Push notifications'),
        v.literal('Email reminders'),
        v.literal('None')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Update user with onboarding data
    await ctx.db.patch(args.userId, {
      fullName: args.fullName,
      age: args.age,
      currentRole: args.currentRole,
      experienceLevel: args.experienceLevel,
      mentorshipStyle: args.mentorshipStyle,
      developmentGoals: args.developmentGoals,
      techStack: args.techStack,
      workEnvironment: args.workEnvironment,
      journalingFrequency: args.journalingFrequency,
      customScheduleDays: args.customScheduleDays,
      journalingTime: args.journalingTime,
      notificationPreferences: args.notificationPreferences,
      isOnboarded: true,
      updatedAt: Date.now(),
    })

    // Trigger AI: Generate 8 static prompts (2 per type) for the new user
    await ctx.scheduler.runAfter(0, internal.ai.prompts.generateStaticPrompts, {
      userId: args.userId,
    })

    return { success: true }
  },
})

/**
 * Get user onboarding status
 */
export const getOnboardingStatus = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      return { isOnboarded: false, user: null }
    }

    return {
      isOnboarded: user.isOnboarded ?? false,
      user: {
        fullName: user.fullName,
        age: user.age,
        currentRole: user.currentRole,
        experienceLevel: user.experienceLevel,
        mentorshipStyle: user.mentorshipStyle,
        developmentGoals: user.developmentGoals,
        techStack: user.techStack,
        workEnvironment: user.workEnvironment,
        journalingFrequency: user.journalingFrequency,
        customScheduleDays: user.customScheduleDays,
        journalingTime: user.journalingTime,
        notificationPreferences: user.notificationPreferences,
      },
    }
  },
})
