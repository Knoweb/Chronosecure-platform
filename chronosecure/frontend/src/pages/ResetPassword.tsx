import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/axios'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (!token) {
            setError('Invalid or missing reset token')
            return
        }

        setLoading(true)

        try {
            await api.post(`/auth/reset-password?token=${token}`, { newPassword: password })
            setSubmitted(true)
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (err: any) {
            console.error('Error resetting password:', err)
            setError(err.response?.data?.message || 'Failed to reset password. The link may satisfy expired.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white text-foreground flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-lg space-y-8">
                    <div className="bg-card border rounded-2xl shadow-lg p-10 space-y-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold">Password Reset Successful</h1>
                        <p className="text-muted-foreground">
                            Your password has been securely updated. Redirecting you to login...
                        </p>
                        <Button onClick={() => navigate('/login')} className="w-full h-12 rounded-full bg-slate-900 text-white text-base font-semibold shadow-md hover:bg-slate-800 transition-all">
                            Return to Sign In
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-foreground flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-lg space-y-8">
                <div className="flex items-center justify-between">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to sign in
                    </Link>
                    <Link to="/" className="text-sm text-primary hover:underline font-semibold">
                        ChronoSecure
                    </Link>
                </div>

                <div className="bg-card border rounded-2xl shadow-lg p-10 space-y-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                            <Lock className="h-3 w-3" /> Secure Update
                        </div>
                        <h1 className="text-3xl font-bold">Set new password</h1>
                        <p className="text-muted-foreground text-sm">
                            Please enter your new password below. Ensure it is at least 8 characters long.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-full bg-slate-900 text-white text-base font-semibold shadow-md hover:bg-slate-800 transition-all" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Resetting...
                                </>
                            ) : 'Reset Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
