import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { User, Building, Shield, Bell } from 'lucide-react'
import { CompanySettings } from '@/components/settings/CompanySettings'

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${activeTab === tab.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                {activeTab === 'profile' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue={user?.firstName || ''} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue={user?.lastName || ''} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <Button variant="outline" className="border border-border shadow-sm text-foreground hover:bg-muted">
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'company' && (
                  <CompanySettings
                    user={user}
                    setAuth={setAuth}
                  />
                )}

                {activeTab === 'security' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your account security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      <Button variant="outline" className="border border-border shadow-sm text-foreground hover:bg-muted">
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'notifications' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>Configure your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email Notifications</Label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Attendance reminders</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Report generation</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" />
                            <span className="text-sm">Weekly summaries</span>
                          </label>
                        </div>
                      </div>
                      <Button variant="outline" className="border border-border shadow-sm text-foreground hover:bg-muted">
                        Save Preferences
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

