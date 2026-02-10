import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/axios'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface NotificationSettingsProps {
    user: any
    setAuth: (user: any, token: string, companyId?: string) => void
}

export function NotificationSettings({ user, setAuth }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState({
        attendanceReminders: true,
        reportGeneration: true,
        weeklySummaries: false
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (user?.notificationPreferences) {
            try {
                const prefs = JSON.parse(user.notificationPreferences)
                setPreferences(prefs)
            } catch (e) {
                // Fallback to defaults
            }
        }
    }, [user])

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    async function handleSave() {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const preferencesJson = JSON.stringify(preferences)
            const response = await api.put(`/users/${user.id}`, {
                notificationPreferences: preferencesJson
            })

            const updatedUser = response.data

            // Update store
            const token = localStorage.getItem('token')
            if (token) {
                setAuth({
                    ...user,
                    ...updatedUser
                }, token, user.companyId)
            }

            setSuccess('Notification preferences saved successfully')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save preferences')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label>Email Notifications</Label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.attendanceReminders}
                                onChange={() => handleToggle('attendanceReminders')}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Attendance reminders</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.reportGeneration}
                                onChange={() => handleToggle('reportGeneration')}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Report generation</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.weeklySummaries}
                                onChange={() => handleToggle('weeklySummaries')}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Weekly summaries</span>
                        </label>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="border border-border shadow-sm text-foreground hover:bg-muted"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        'Save Preferences'
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
