import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export function LoginForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, userId, email: userEmail, companyId, role, firstName, lastName, companyName, subdomain } = response.data

      setAuth(
        {
          id: userId,
          email: userEmail,
          firstName,
          lastName,
          role,
          companyId,
          companyName,
          subdomain,
        },
        token,
        companyId
      )
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-12 rounded-full bg-slate-900 text-white text-base font-semibold shadow-md hover:bg-slate-800 transition-all" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}


