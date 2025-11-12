import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

const TOTAL_STEPS = 4

const TECH_STACK_OPTIONS = [
  'JavaScript/TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C#/.NET',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
]

const DEVELOPMENT_GOAL_OPTIONS = [
  'Break into tech',
  'Land first developer role',
  'Level up to mid-level',
  'Advance to senior developer',
  'Transition to leadership/management',
  'Master a specific technology/framework',
  'Build side projects/portfolio',
]

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

const JOURNALING_TIME_PRESETS = [
  { value: 'End of workday', label: 'End of workday (5-6 PM)' },
  { value: 'Evening reflection', label: 'Evening reflection (8-9 PM)' },
  { value: 'Morning review', label: 'Morning review (8-9 AM)' },
  {
    value: 'No preference',
    label: "No preference (I'll journal when inspired)",
  },
] as const

interface OnboardingData {
  // Step 1
  fullName: string
  age?: number
  currentRole: string
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Principal' | ''

  // Step 2
  mentorshipStyle:
    | 'Structured'
    | 'Exploratory'
    | 'Challenge-driven'
    | 'Reflective'
    | ''
  developmentGoals: string[]
  customGoal: string

  // Step 3
  techStack: string[]
  customTechStack: string
  workEnvironment:
    | 'Individual contributor at company'
    | 'Team lead/manager'
    | 'Freelance/consultant'
    | 'Student/bootcamp'
    | 'Career transition/job seeking'
    | 'Side projects only'
    | ''

  // Step 4
  journalingFrequency:
    | 'Daily'
    | 'Every other day'
    | 'Weekly'
    | 'Custom schedule'
    | ''
  customScheduleDays: (typeof DAYS_OF_WEEK)[number][]
  journalingTime: string
  customTime: string
  notificationPreferences: Array<
    'Push notifications' | 'Email reminders' | 'None'
  >
}

interface OnboardingFlowProps {
  userId: Id<'users'>
}

export default function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showSummary, setShowSummary] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    age: undefined,
    currentRole: '',
    experienceLevel: '',
    mentorshipStyle: '',
    developmentGoals: [],
    customGoal: '',
    techStack: [],
    customTechStack: '',
    workEnvironment: '',
    journalingFrequency: '',
    customScheduleDays: [],
    journalingTime: '',
    customTime: '',
    notificationPreferences: [],
  })

  // const completeOnboardingMutation = useMutation(
  //   api.onboarding.completeOnboarding,
  // )

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K] extends Array<infer T> ? T : never,
  ) => {
    setFormData((prev) => {
      const array = prev[key] as unknown as any[]
      const newArray = array.includes(value)
        ? array.filter((item) => item !== value)
        : [...array, value]
      return { ...prev, [key]: newArray }
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (
          !formData.fullName.trim() ||
          !formData.currentRole.trim() ||
          !formData.experienceLevel
        ) {
          toast.error('Please fill in all required fields')
          return false
        }
        return true
      case 2:
        if (!formData.mentorshipStyle) {
          toast.error('Please select a mentorship style')
          return false
        }
        const hasGoals =
          formData.developmentGoals.length > 0 || formData.customGoal.trim()
        if (!hasGoals) {
          toast.error('Please select at least one development goal')
          return false
        }
        return true
      case 3:
        if (
          formData.techStack.length === 0 &&
          !formData.customTechStack.trim()
        ) {
          toast.error('Please select at least one technology')
          return false
        }
        if (!formData.workEnvironment) {
          toast.error('Please select your work environment')
          return false
        }
        return true
      case 4:
        if (!formData.journalingFrequency) {
          toast.error('Please select a journaling frequency')
          return false
        }
        if (
          formData.journalingFrequency === 'Custom schedule' &&
          formData.customScheduleDays.length === 0
        ) {
          toast.error('Please select at least one day for your custom schedule')
          return false
        }
        if (!formData.journalingTime && !formData.customTime) {
          toast.error('Please select a preferred journaling time')
          return false
        }
        if (formData.notificationPreferences.length === 0) {
          toast.error('Please select your notification preferences')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === TOTAL_STEPS) {
        setShowSummary(true)
      } else {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false)
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1))
    }
  }

  const handleComplete = async () => {
    try {
      // Prepare final data
      const allGoals = [
        ...formData.developmentGoals,
        ...(formData.customGoal.trim() ? [formData.customGoal] : []),
      ]
      const allTechStack = [
        ...formData.techStack,
        ...(formData.customTechStack.trim() ? [formData.customTechStack] : []),
      ]
      const finalJournalingTime = formData.customTime || formData.journalingTime

      await completeOnboardingMutation({
        userId,
        fullName: formData.fullName,
        age: formData.age,
        currentRole: formData.currentRole,
        experienceLevel: formData.experienceLevel as any,
        mentorshipStyle: formData.mentorshipStyle as any,
        developmentGoals: allGoals,
        techStack: allTechStack,
        workEnvironment: formData.workEnvironment as any,
        journalingFrequency: formData.journalingFrequency as any,
        customScheduleDays:
          formData.journalingFrequency === 'Custom schedule'
            ? formData.customScheduleDays
            : undefined,
        journalingTime: finalJournalingTime,
        notificationPreferences: formData.notificationPreferences,
      })

      toast.success('Onboarding completed! Welcome to June Bug!')
      router.navigate({ to: '/entries' })
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete onboarding. Please try again.')
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100
  const estimatedMinutes = Math.max(1, TOTAL_STEPS - currentStep + 1)

  if (showSummary) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Let's Review Your Profile
            </CardTitle>
            <CardDescription>
              Here's how we'll personalize your journaling experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                <strong>{formData.fullName}</strong>
                {formData.age && `, ${formData.age} years old`} •{' '}
                {formData.experienceLevel} {formData.currentRole} •{' '}
                {formData.workEnvironment}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Mentorship Approach</h3>
              <Badge variant="secondary">{formData.mentorshipStyle}</Badge>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Your Goals</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...formData.developmentGoals,
                  ...(formData.customGoal.trim() ? [formData.customGoal] : []),
                ].map((goal) => (
                  <Badge key={goal} variant="outline">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  ...formData.techStack,
                  ...(formData.customTechStack.trim()
                    ? [formData.customTechStack]
                    : []),
                ].map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Journaling Schedule</h3>
              <p className="text-sm text-muted-foreground">
                We'll send you{' '}
                {formData.journalingFrequency === 'Custom schedule'
                  ? `reminders on ${formData.customScheduleDays.join(', ')}`
                  : `${formData.journalingFrequency.toLowerCase()} reminders`}{' '}
                at {formData.customTime || formData.journalingTime} to reflect
                on your journey as a {formData.experienceLevel}{' '}
                {formData.currentRole}.
              </p>
              {formData.notificationPreferences.includes('None') ? (
                <p className="text-sm text-muted-foreground mt-2">
                  You've opted out of reminders - we trust you'll remember on
                  your own!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Notifications via:{' '}
                  {formData.notificationPreferences.join(', ')}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Edit Details
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Complete Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {TOTAL_STEPS}
          </h2>
          <span className="text-sm text-muted-foreground">
            About {estimatedMinutes} min remaining
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Welcome! Let's Get Started</CardTitle>
              <CardDescription>
                Help us personalize your journaling experience and provide
                relevant guidance tailored to your journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age ?? ''}
                  onChange={(e) =>
                    updateFormData({
                      age: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentRole">
                  Current Role <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currentRole"
                  placeholder="e.g., Frontend Developer, Full Stack Engineer"
                  value={formData.currentRole}
                  onChange={(e) =>
                    updateFormData({ currentRole: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">
                  Experience Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) =>
                    updateFormData({ experienceLevel: value as any })
                  }
                >
                  <SelectTrigger id="experienceLevel">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Principal">Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Mentorship & Growth</CardTitle>
              <CardDescription>
                Understanding your learning style helps us provide better
                guidance and feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Mentorship Style <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.mentorshipStyle}
                  onValueChange={(value) =>
                    updateFormData({ mentorshipStyle: value as any })
                  }
                >
                  <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem
                      value="Structured"
                      id="structured"
                      className="mt-1"
                    />
                    <Label
                      htmlFor="structured"
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-medium">Structured</div>
                      <div className="text-sm text-muted-foreground">
                        Prefer clear guidance and step-by-step plans
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem
                      value="Exploratory"
                      id="exploratory"
                      className="mt-1"
                    />
                    <Label
                      htmlFor="exploratory"
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-medium">Exploratory</div>
                      <div className="text-sm text-muted-foreground">
                        Like to discover and learn through experimentation
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem
                      value="Challenge-driven"
                      id="challenge"
                      className="mt-1"
                    />
                    <Label
                      htmlFor="challenge"
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-medium">Challenge-driven</div>
                      <div className="text-sm text-muted-foreground">
                        Grow best when pushed outside comfort zone
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem
                      value="Reflective"
                      id="reflective"
                      className="mt-1"
                    />
                    <Label
                      htmlFor="reflective"
                      className="cursor-pointer flex-1"
                    >
                      <div className="font-medium">Reflective</div>
                      <div className="text-sm text-muted-foreground">
                        Value deep analysis and thoughtful feedback
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>
                  Development Goals <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select all that apply
                </p>
                <div className="space-y-2">
                  {DEVELOPMENT_GOAL_OPTIONS.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={formData.developmentGoals.includes(goal)}
                        onCheckedChange={() =>
                          toggleArrayItem('developmentGoals', goal)
                        }
                      />
                      <Label
                        htmlFor={goal}
                        className="cursor-pointer font-normal"
                      >
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="customGoal">Custom Goal (Optional)</Label>
                  <Input
                    id="customGoal"
                    placeholder="Enter your own goal..."
                    value={formData.customGoal}
                    onChange={(e) =>
                      updateFormData({ customGoal: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Your Development Context</CardTitle>
              <CardDescription>
                This helps us provide relevant examples and suggestions in your
                reflections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Primary Tech Stack <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select all that apply
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TECH_STACK_OPTIONS.map((tech) => (
                    <div key={tech} className="flex items-center space-x-2">
                      <Checkbox
                        id={tech}
                        checked={formData.techStack.includes(tech)}
                        onCheckedChange={() =>
                          toggleArrayItem('techStack', tech)
                        }
                      />
                      <Label
                        htmlFor={tech}
                        className="cursor-pointer font-normal"
                      >
                        {tech}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="customTechStack">Other Technologies</Label>
                  <Input
                    id="customTechStack"
                    placeholder="e.g., Elixir, Haskell, etc."
                    value={formData.customTechStack}
                    onChange={(e) =>
                      updateFormData({ customTechStack: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workEnvironment">
                  Work Environment <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.workEnvironment}
                  onValueChange={(value) =>
                    updateFormData({ workEnvironment: value as any })
                  }
                >
                  <SelectTrigger id="workEnvironment">
                    <SelectValue placeholder="Select your work environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual contributor at company">
                      Individual contributor at company
                    </SelectItem>
                    <SelectItem value="Team lead/manager">
                      Team lead/manager
                    </SelectItem>
                    <SelectItem value="Freelance/consultant">
                      Freelance/consultant
                    </SelectItem>
                    <SelectItem value="Student/bootcamp">
                      Student/bootcamp
                    </SelectItem>
                    <SelectItem value="Career transition/job seeking">
                      Career transition/job seeking
                    </SelectItem>
                    <SelectItem value="Side projects only">
                      Side projects only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Journaling Preferences</CardTitle>
              <CardDescription>
                Set up your reflection routine to build consistent habits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Journaling Frequency{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.journalingFrequency}
                  onValueChange={(value) =>
                    updateFormData({ journalingFrequency: value as any })
                  }
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="Daily" id="daily" />
                    <Label
                      htmlFor="daily"
                      className="cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <span>Daily</span>
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem
                      value="Every other day"
                      id="everyOtherDay"
                    />
                    <Label
                      htmlFor="everyOtherDay"
                      className="cursor-pointer flex-1"
                    >
                      Every other day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="Weekly" id="weekly" />
                    <Label htmlFor="weekly" className="cursor-pointer flex-1">
                      Weekly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="Custom schedule" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer flex-1">
                      Custom schedule
                    </Label>
                  </div>
                </RadioGroup>

                {formData.journalingFrequency === 'Custom schedule' && (
                  <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                    <Label className="mb-3 block">
                      Select days of the week
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.customScheduleDays.includes(day)}
                            onCheckedChange={() =>
                              toggleArrayItem('customScheduleDays', day)
                            }
                          />
                          <Label
                            htmlFor={day}
                            className="cursor-pointer font-normal"
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="journalingTime">
                  Preferred Journaling Time{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.journalingTime}
                  onValueChange={(value) =>
                    updateFormData({ journalingTime: value })
                  }
                >
                  <SelectTrigger id="journalingTime">
                    <SelectValue placeholder="Select your preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNALING_TIME_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="Custom time">Custom time</SelectItem>
                  </SelectContent>
                </Select>

                {formData.journalingTime === 'Custom time' && (
                  <div className="mt-4">
                    <Label htmlFor="customTime">Enter time (e.g., 14:30)</Label>
                    <Input
                      id="customTime"
                      type="time"
                      value={formData.customTime}
                      onChange={(e) =>
                        updateFormData({ customTime: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>
                  Notification Preferences{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push"
                      checked={formData.notificationPreferences.includes(
                        'Push notifications',
                      )}
                      onCheckedChange={() =>
                        toggleArrayItem(
                          'notificationPreferences',
                          'Push notifications',
                        )
                      }
                    />
                    <Label
                      htmlFor="push"
                      className="cursor-pointer font-normal"
                    >
                      Push notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={formData.notificationPreferences.includes(
                        'Email reminders',
                      )}
                      onCheckedChange={() =>
                        toggleArrayItem(
                          'notificationPreferences',
                          'Email reminders',
                        )
                      }
                    />
                    <Label
                      htmlFor="email"
                      className="cursor-pointer font-normal"
                    >
                      Email reminders
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="none"
                      checked={formData.notificationPreferences.includes(
                        'None',
                      )}
                      onCheckedChange={() =>
                        toggleArrayItem('notificationPreferences', 'None')
                      }
                    />
                    <Label
                      htmlFor="none"
                      className="cursor-pointer font-normal"
                    >
                      None (I'll remember on my own)
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        <div className="px-6 pb-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentStep === TOTAL_STEPS ? 'Review & Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
