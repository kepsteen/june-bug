import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@/../convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, ArrowLeft, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'

export const Route = createFileRoute('/settings')({
  beforeLoad: async ({ context }) => {
    // Redirect to entries if not authenticated (settings only for authenticated users)
    if (!context.userId) {
      throw redirect({
        to: '/entries',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  // Get current user data
  const { data: currentUser, isLoading } = useQuery(
    convexQuery(api.auth.getCurrentUser, {})
  )

  // Handle logout
  const handleLogout = async () => {
    try {
      await authClient.signOut()
      toast.success('Logged out successfully. You can continue using the app offline.')
      // Reload the page to reset auth state and switch to local storage mode
      window.location.href = '/entries'
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Failed to log out. Please try again.')
    }
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back to entries link */}
        <Link
          to="/entries"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to entries
        </Link>

        {/* Header with theme toggle and sign out */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Left Column - User Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={currentUser.image || ''} alt="User avatar" />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-12 w-12 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">
                    {currentUser.name || 'User'}
                  </h2>
                  {currentUser.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentUser.email}
                    </p>
                  )}
                </div>

                {/* User details from onboarding */}
                {currentUser.isOnboarded && (
                  <div className="space-y-3 pt-4 border-t">
                    {currentUser.fullName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{currentUser.fullName}</p>
                      </div>
                    )}
                    {currentUser.currentRole && (
                      <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="text-sm font-medium">{currentUser.currentRole}</p>
                      </div>
                    )}
                    {currentUser.experienceLevel && (
                      <div>
                        <p className="text-xs text-muted-foreground">Experience Level</p>
                        <p className="text-sm font-medium">{currentUser.experienceLevel}</p>
                      </div>
                    )}
                    {currentUser.workEnvironment && (
                      <div>
                        <p className="text-xs text-muted-foreground">Work Environment</p>
                        <p className="text-sm font-medium">{currentUser.workEnvironment}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings Tabs */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Manage your preferences and account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <div className="py-4">
                      <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Profile settings content will go here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-4">
                    <div className="py-4">
                      <h3 className="text-lg font-medium mb-2">Journaling Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Journaling preferences content will go here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <div className="py-4">
                      <h3 className="text-lg font-medium mb-2">Notification Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Notification settings content will go here
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
