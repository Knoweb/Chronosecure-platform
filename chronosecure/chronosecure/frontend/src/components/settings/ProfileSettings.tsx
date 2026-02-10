import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/axios'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProfileSettingsProps {
    user: any
    setAuth: (user: any, token: string, companyId?: string) => void
}

export function ProfileSettings({ user, setAuth }: ProfileSettingsProps) {
    const [firstName, setFirstName] = useState(user?.firstName || '')
    const [lastName, setLastName] = useState(user?.lastName || '')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    async function handleSave() {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.put(`/users/${user.id}`, {
                firstName,
                lastName
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

            setSuccess('Profile updated successfully')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                        'Save Changes'
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
