import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export function SignupForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form data
      if (!formData.fullName.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }
      if (!formData.email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }
      if (!formData.password || formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        setLoading(false)
        return
      }
      if (!formData.companyName.trim()) {
        setError('Company name is required')
        setLoading(false)
        return
      }

      // Split fullName into firstName and lastName
      const nameParts = formData.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName // If no last name, use first name

      console.log('Submitting signup:', { email: formData.email, firstName, lastName, companyName: formData.companyName })

      const response = await api.post('/auth/signup', {
        email: formData.email.trim(),
        password: formData.password,
        firstName,
        lastName,
        companyName: formData.companyName.trim(),
      })

      console.log('Signup response:', response.data)

      const { token, userId, email: userEmail, companyId, role, firstName: respFirstName, lastName: respLastName } = response.data
      
      setAuth(
        {
          id: userId,
          email: userEmail,
          firstName: respFirstName,
          lastName: respLastName,
          role: role || 'COMPANY_ADMIN',
          companyId,
        },
        token,
        companyId
      )
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      if (err.response) {
        // Server responded with error
        const errorData = err.response.data
        let errorMessage = 'An error occurred during sign up'
        
        // Check for message field first (most common)
        if (errorData?.message) {
          errorMessage = errorData.message
        } 
        // Check for error field
        else if (errorData?.error) {
          errorMessage = errorData.error
        } 
        // Check for errors array (validation errors)
        else if (errorData?.errors) {
          if (Array.isArray(errorData.errors)) {
            // If it's an array, get the first error message
            const firstError = errorData.errors[0]
            errorMessage = typeof firstError === 'string' ? firstError : Object.values(firstError)[0] as string
          } else if (typeof errorData.errors === 'object') {
            // If it's an object with field errors, get the first one
            const firstErrorKey = Object.keys(errorData.errors)[0]
            errorMessage = `${firstErrorKey}: ${errorData.errors[firstErrorKey]}`
          }
        } 
        // Check if errorData is a string
        else if (errorData && typeof errorData === 'string') {
          errorMessage = errorData
        } 
        // Fallback to status-based messages
        else {
          if (err.response.status === 400) {
            errorMessage = 'Invalid request. Please check your input.'
          } else if (err.response.status === 409) {
            errorMessage = 'Email already exists. Please use a different email.'
          } else if (err.response.status === 500) {
            errorMessage = errorData?.message || 'Server error. Please try again later.'
          } else {
            errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`
          }
        }
        
        setError(errorMessage)
        } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request)
        setError('Unable to connect to server. Please make sure the backend is running on http://localhost:8080')
      } else {
        // Something else happened
        console.error('Error setting up request:', err.message)
        setError(err.message || 'An error occurred during sign up')
      }
      
      // Log full error for debugging
      console.error('Full error object:', {
        error: err,
        response: err.response,
        request: err.request,
        message: err.message,
        stack: err.stack
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>Check your email for a confirmation link to complete your registration.</AlertDescription>
      </Alert>
    )
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
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Acme Corporation"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}

