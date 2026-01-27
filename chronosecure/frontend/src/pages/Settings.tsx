import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { User, Building, Shield, Bell } from 'lucide-react'
import { CompanySettings } from '@/components/settings/CompanySettings'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'

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
                  <ProfileSettings
                    user={user}
                    setAuth={setAuth}
                  />
                )}

                {activeTab === 'company' && (
                  <CompanySettings
                    user={user}
                    setAuth={setAuth}
                  />
                )}

                {activeTab === 'security' && (
                  <SecuritySettings user={user} />
                )}

                {activeTab === 'notifications' && (
                  <NotificationSettings
                    user={user}
                    setAuth={setAuth}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

