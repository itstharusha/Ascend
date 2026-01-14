"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserStore } from "@/lib/stores/user-store"
import { useTheme } from "next-themes"
import { Loader2, Shield, Bell, Palette, User, Globe } from "lucide-react"
import { toast } from "sonner"
import { updateNotificationPreferences, changePassword } from "@/lib/api/user"
import { fetchTimezones } from "@/lib/api/meta"
import type { TimezoneOption } from "@/lib/api/meta"

export default function SettingsPage() {
  const { user, updateUser, isLoading } = useUserStore()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [timezone, setTimezone] = useState(user?.timezone || "UTC")
  const [isSaving, setIsSaving] = useState(false)
  const [timezones, setTimezones] = useState<TimezoneOption[]>([])
  const [tzLoading, setTzLoading] = useState(true)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(user?.notificationPreferences?.emailNotifications ?? true)
  const [marketingEmails, setMarketingEmails] = useState(user?.notificationPreferences?.marketingEmails ?? false)
  const [consultationUpdates, setConsultationUpdates] = useState(user?.notificationPreferences?.consultationUpdates ?? true)
  const [weeklyDigest, setWeeklyDigest] = useState(user?.notificationPreferences?.weeklyDigest ?? true)

  useEffect(() => {
    // Sync local form state when user is loaded/refreshed
    setName(user?.name || "")
    setEmail(user?.email || "")
    setTimezone(user?.timezone || "UTC")
    setEmailNotifications(user?.notificationPreferences?.emailNotifications ?? true)
    setMarketingEmails(user?.notificationPreferences?.marketingEmails ?? false)
    setConsultationUpdates(user?.notificationPreferences?.consultationUpdates ?? true)
    setWeeklyDigest(user?.notificationPreferences?.weeklyDigest ?? true)
  }, [user])

  useEffect(() => {
    let cancelled = false
    setTzLoading(true)
    fetchTimezones()
      .then((tzs) => {
        if (!cancelled) setTimezones(tzs)
      })
      .catch(() => {
        if (!cancelled) setTimezones([{ value: "UTC", label: "UTC" }])
      })
      .finally(() => {
        if (!cancelled) setTzLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateUser({ name, email, timezone })
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      await updateNotificationPreferences({
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
        consultation_updates: consultationUpdates,
        weekly_digest: weeklyDigest,
      })
      toast.success("Notification preferences saved!")
    } catch (error) {
      toast.error("Failed to save notification preferences")
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("current-password") as string
    const newPassword = formData.get("new-password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      await changePassword(currentPassword, newPassword)
      toast.success("Password updated successfully!")
      e.currentTarget.reset()
    } catch (error) {
      toast.error("Failed to update password. Please check your current password.")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-6">
                {/* Avatar Display */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.image || "/professional-headshot.png"} alt={user?.name} />
                    <AvatarFallback className="text-lg">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone} disabled={tzLoading}>
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="gradient-primary text-primary-foreground" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Consultation Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified when your consultation is ready</p>
                </div>
                <Switch checked={consultationUpdates} onCheckedChange={setConsultationUpdates} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of your activity</p>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive news and product updates</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="gradient-primary text-primary-foreground" onClick={handleSaveNotifications}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how Ascend looks on your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === "light" ? "border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="h-20 rounded bg-white border border-gray-200 mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === "dark" ? "border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="h-20 rounded bg-gray-900 border border-gray-700 mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-4 rounded-lg border-2 transition-colors ${theme === "system" ? "border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="h-20 rounded bg-gradient-to-r from-white to-gray-900 border border-gray-300 mb-2" />
                    <p className="text-sm font-medium">System</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" name="current-password" type="password" placeholder="••••••••" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" name="new-password" type="password" placeholder="••••••••" required minLength={8} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required minLength={8} />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button type="submit" form="password-form" className="gradient-primary text-primary-foreground">
                  Update Password
                </Button>
              </CardFooter>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
