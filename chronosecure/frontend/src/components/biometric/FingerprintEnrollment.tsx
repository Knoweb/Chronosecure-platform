import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Fingerprint, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import {
  enrollFingerprint,
  hasBiometricCapability,
  isWebAuthnSupported,
  generateFingerprintHashFallback,
} from '@/lib/biometric'

interface FingerprintEnrollmentProps {
  employeeId: string
  employeeName: string
  employeeCode: string
  onSuccess?: () => void
}

export function FingerprintEnrollment({
  employeeId,
  employeeName,
  employeeCode,
  onSuccess,
}: FingerprintEnrollmentProps) {
  const companyId = useAuthStore((state) => state.companyId)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const enrollmentMutation = useMutation({
    mutationFn: async (data: { employeeId: string; fingerprintTemplateHash: string; grantConsent: boolean }) => {
      return api.post('/biometric/enroll', data, {
        headers: {
          'X-Company-Id': companyId,
        },
      })
    },
    onSuccess: () => {
      setSuccess(true)
      setError('')
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to enroll fingerprint')
      setSuccess(false)
    },
  })

  async function checkBiometricSupport() {
    if (!isWebAuthnSupported()) {
      setBiometricSupported(false)
      return
    }

    const hasBiometric = await hasBiometricCapability()
    setBiometricSupported(hasBiometric)
  }

  async function handleEnroll() {
    setEnrolling(true)
    setError('')
    setSuccess(false)

    try {
      // Check biometric support first
      if (biometricSupported === null) {
        await checkBiometricSupport()
      }

      let fingerprintHash: string

      if (biometricSupported) {
        // Use WebAuthn for biometric enrollment
        const result = await enrollFingerprint(employeeId, employeeName)
        if (!result.success) {
          throw new Error(result.error || 'Failed to enroll fingerprint')
        }
        fingerprintHash = result.fingerprintHash
      } else {
        // Fallback: Use simple hash generation (for testing)
        // In production, this should prompt for actual fingerprint scanner
        fingerprintHash = generateFingerprintHashFallback(employeeCode)
      }

      // Send to backend
      enrollmentMutation.mutate({
        employeeId,
        fingerprintTemplateHash: fingerprintHash,
        grantConsent: true, // BIPA: Explicit consent
      })
    } catch (err: any) {
      setError(err.message || 'Failed to enroll fingerprint')
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Fingerprint Enrollment
        </CardTitle>
        <CardDescription>
          Enroll a fingerprint for secure biometric authentication. BIPA compliant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>Fingerprint enrolled successfully!</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {biometricSupported === null && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the button below to check if your device supports biometric authentication.
            </p>
            <Button onClick={checkBiometricSupport} variant="outline" className="w-full">
              Check Biometric Support
            </Button>
          </div>
        )}

        {biometricSupported === false && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your device does not support biometric authentication. Using fallback method for testing.
            </AlertDescription>
          </Alert>
        )}

        {biometricSupported === true && (
          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Biometric authentication is available. You can use Touch ID, Face ID, Windows Hello, or a USB fingerprint reader.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleEnroll}
          disabled={enrolling || enrollmentMutation.isPending}
          className="w-full"
        >
          {enrolling || enrollmentMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enrolling...
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4 mr-2" />
              Enroll Fingerprint
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          <strong>BIPA Compliance:</strong> By enrolling, you grant explicit consent for biometric data collection.
          Your fingerprint template will be encrypted and stored securely. You can revoke consent at any time.
        </p>
      </CardContent>
    </Card>
  )
}

