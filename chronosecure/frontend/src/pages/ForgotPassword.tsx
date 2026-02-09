import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/axios'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(false)
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (error) {
      console.error('Error sending reset link:', error)
      // For security reasons, we don't want to reveal if the email exists or not,
      // so we show the success message regardless, or a generic error if it's a network issue.
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
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
              Security-first recovery
            </div>
            <h1 className="text-3xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your work email. If the account exists, we’ll send a secure reset link. For GDPR/BIPA safety, we do
              not disclose account existence.
            </p>
          </div>

          {submitted && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                If the account exists, a reset link has been sent. Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full bg-slate-900 text-white text-base font-semibold shadow-md hover:bg-slate-800 transition-all" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Compliance: No account enumeration; secure links expire; audit trail is recorded on the server.</p>
            <p>Need help? <Link to="/signup" className="text-primary hover:underline">Contact your admin or create an account</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

