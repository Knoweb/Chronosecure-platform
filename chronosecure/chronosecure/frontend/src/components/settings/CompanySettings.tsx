import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/axios'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CompanySettingsProps {
    user: any
    setAuth: (user: any, token: string, companyId?: string) => void
}

export function CompanySettings({ user, setAuth }: CompanySettingsProps) {
    const [companyName, setCompanyName] = useState(user?.companyName || '')
    const [billingAddress, setBillingAddress] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    async function handleSave() {
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.put(`/company/${user.companyId}`, {
                name: companyName,
                billingAddress
            })

            const updatedCompany = response.data

            // Update store
            const token = localStorage.getItem('token')
            if (token) {
                setAuth({
                    ...user,
                    companyName: updatedCompany.name
                }, token, user.companyId)
            }

            setSuccess('Company details updated successfully')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update company details')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Manage your company information</CardDescription>
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
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Input
                        id="subdomain"
                        placeholder="company"
                        defaultValue={user?.subdomain || ''}
                        disabled
                    />
                    <p className="text-xs text-muted-foreground">Subdomain cannot be changed</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Input
                        id="billingAddress"
                        placeholder="Enter billing address"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                    />
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
