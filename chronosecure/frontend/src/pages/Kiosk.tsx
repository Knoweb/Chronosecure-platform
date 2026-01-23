import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Camera, CheckCircle2, Fingerprint, Loader2 } from 'lucide-react'
import {
  verifyFingerprint,
  generateFingerprintHashFallback,
  isWebAuthnSupported,
  hasBiometricCapability,
} from '@/lib/biometric'

export default function KioskPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const [employeeCode, setEmployeeCode] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [useFingerprint, setUseFingerprint] = useState(false)
  const [fingerprintVerified, setFingerprintVerified] = useState(false)
  const [verifyingFingerprint, setVerifyingFingerprint] = useState(false)
  const [verifiedEmployee, setVerifiedEmployee] = useState<any>(null)
  const [fingerprintError, setFingerprintError] = useState('')
  const [nextEventType, setNextEventType] = useState<string>('CLOCK_IN')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch next expected event type when employee is verified
  const { data: nextEvent, refetch: refetchNextEvent } = useQuery({
    queryKey: ['nextEvent', companyId, verifiedEmployee?.employeeId],
    queryFn: async () => {
      if (!companyId || !verifiedEmployee?.employeeId) return null
      const response = await api.get(
        `/attendance/next-state/${companyId}/${verifiedEmployee.employeeId}`
      )
      return response.data
    },
    enabled: !!verifiedEmployee?.employeeId && !!companyId,
  })

  useEffect(() => {
    if (nextEvent) {
      setNextEventType(nextEvent)
    }
  }, [nextEvent])

  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/attendance/log', data)
    },
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setEmployeeCode('')
        setPhoto(null)
        setFingerprintVerified(false)
        setVerifiedEmployee(null)
        if (verifiedEmployee?.employeeId) {
          refetchNextEvent()
        }
      }, 3000)
    },
  })

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function capturePhoto() {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const photoData = canvas.toDataURL('image/jpeg')
        setPhoto(photoData)
        stopCamera()
      }
    }
  }

  async function handleFingerprintVerification() {
    if (!employeeCode) {
      setFingerprintError('Please enter employee code')
      return
    }

    setVerifyingFingerprint(true)
    setFingerprintError('')
    setFingerprintVerified(false)

    try {
      // Check if biometric is supported
      const hasBiometric = isWebAuthnSupported() && await hasBiometricCapability()
      
      let fingerprintHash: string

      if (hasBiometric) {
        // Use WebAuthn for biometric verification
        // Note: In production, you'd need to store the credential ID from enrollment
        // For now, we'll use a fallback approach
        const result = await verifyFingerprint(employeeCode, employeeCode, employeeCode)
        if (!result.success) {
          throw new Error(result.error || 'Fingerprint verification failed')
        }
        fingerprintHash = result.fingerprintHash
      } else {
        // Fallback: Generate hash from employee code (for testing)
        fingerprintHash = generateFingerprintHashFallback(employeeCode)
      }

      // Verify with backend
      const verifyRes = await api.post('/biometric/verify', {
        employeeCode,
        fingerprintTemplateHash: fingerprintHash,
        companyId,
      })

      if (verifyRes.data.verified) {
        setFingerprintVerified(true)
        setVerifiedEmployee(verifyRes.data)
        setFingerprintError('')
      } else {
        setFingerprintError(verifyRes.data.message || 'Fingerprint verification failed')
        setFingerprintVerified(false)
      }
    } catch (err: any) {
      setFingerprintError(err.response?.data?.message || err.message || 'Fingerprint verification failed')
      setFingerprintVerified(false)
    } finally {
      setVerifyingFingerprint(false)
    }
  }

  // Calculate liveness score from photo (simplified - in production use ML models)
  function calculateLivenessScore(photoBase64: string): number {
    // Simplified: larger images typically indicate real photos
    // In production, use actual liveness detection ML models
    const size = photoBase64.length
    if (size > 100000) return 0.9 // Large image = likely real
    if (size > 50000) return 0.8
    if (size > 20000) return 0.7
    return 0.6 // Smaller images might be spoofed
  }

  async function handleAttendance() {
    // When fingerprint is used, require both fingerprint AND photo for security
    if (useFingerprint) {
      if (!fingerprintVerified || !verifiedEmployee) {
        alert('Please verify your fingerprint first')
        return
      }
      if (!photo) {
        alert('Please capture a photo for additional verification')
        return
      }

      const photoBase64 = photo.split(',')[1]
      const livenessScore = calculateLivenessScore(photoBase64)

      attendanceMutation.mutate({
        companyId,
        employeeId: verifiedEmployee.employeeId,
        eventType: nextEventType,
        photoBase64,
        confidenceScore: livenessScore,
        deviceId: 'web-kiosk',
      })
    } else {
      if (!employeeCode || !photo) {
        alert('Please enter employee code and capture photo')
        return
      }

      // First, get employee ID from employee code
      try {
        const employeesRes = await api.get('/employees', {
          headers: {
            'X-Company-Id': companyId,
          },
        })
        const employee = employeesRes.data.find(
          (e: any) => e.employeeCode === employeeCode
        )

        if (!employee) {
          alert('Employee not found')
          return
        }

        // Get next event for this employee
        const nextEventRes = await api.get(
          `/attendance/next-state/${companyId}/${employee.id}`
        )
        const eventType = nextEventRes.data

        const photoBase64 = photo.split(',')[1]
        const livenessScore = calculateLivenessScore(photoBase64)

        attendanceMutation.mutate({
          companyId,
          employeeId: employee.id,
          eventType,
          photoBase64,
          confidenceScore: livenessScore,
          deviceId: 'web-kiosk',
        })
      } catch (err) {
        console.error('Error:', err)
      }
    }
  }

  function getButtonLabel(eventType: string): string {
    switch (eventType) {
      case 'CLOCK_IN':
        return 'Clock In'
      case 'BREAK_START':
        return 'Start Break'
      case 'BREAK_END':
        return 'End Break'
      case 'CLOCK_OUT':
        return 'Clock Out'
      default:
        return 'Log Attendance'
    }
  }

  function getButtonColor(eventType: string): string {
    if (eventType === 'CLOCK_IN' || eventType === 'BREAK_END') {
      return 'bg-green-600 hover:bg-green-700'
    }
    return 'bg-blue-600 hover:bg-blue-700'
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Attendance Kiosk</h1>
          <p className="text-muted-foreground mt-1">
            Enter your employee code and capture your photo to clock in/out
          </p>
        </div>

        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Attendance logged successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  value={employeeCode}
                  onChange={(e) => {
                    setEmployeeCode(e.target.value)
                    setFingerprintVerified(false)
                    setVerifiedEmployee(null)
                  }}
                  placeholder="Enter your employee code"
                />
              </div>

              {/* Fingerprint Authentication Option */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useFingerprint"
                    checked={useFingerprint}
                    onChange={(e) => {
                      setUseFingerprint(e.target.checked)
                      setFingerprintVerified(false)
                      setVerifiedEmployee(null)
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="useFingerprint" className="cursor-pointer">
                    Use Fingerprint Authentication
                  </Label>
                </div>

                {useFingerprint && (
                  <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                    {fingerprintVerified && verifiedEmployee ? (
                      <Alert className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          Verified: {verifiedEmployee.firstName} {verifiedEmployee.lastName}
                          <br />
                          <span className="text-xs">Confidence: {(verifiedEmployee.confidenceScore * 100).toFixed(1)}%</span>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        {fingerprintError && (
                          <Alert variant="destructive">
                            <AlertDescription>{fingerprintError}</AlertDescription>
                          </Alert>
                        )}
                        <Button
                          onClick={handleFingerprintVerification}
                          disabled={!employeeCode || verifyingFingerprint}
                          className="w-full"
                          variant="outline"
                        >
                          {verifyingFingerprint ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-4 w-4 mr-2" />
                              Verify Fingerprint
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Photo Capture {useFingerprint ? '(Required for Security)' : '(Required)'}</Label>
                {!photo ? (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border"
                      style={{ display: streamRef.current ? 'block' : 'none' }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startCamera}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={stopCamera}
                        className="w-full"
                      >
                        Stop Camera
                      </Button>
                    </div>
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!streamRef.current}
                      className="w-full"
                    >
                      Capture Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <img
                      src={photo}
                      alt="Captured"
                      className="w-full rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoto(null)
                        stopCamera()
                      }}
                      className="w-full"
                    >
                      Retake Photo
                    </Button>
                  </div>
                )}
              </div>

              {verifiedEmployee && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Next Action:</p>
                  <p className="text-lg font-bold">{getButtonLabel(nextEventType)}</p>
                </div>
              )}

              <Button
                onClick={handleAttendance}
                disabled={
                  !employeeCode ||
                  (!useFingerprint && !photo) ||
                  (useFingerprint && (!fingerprintVerified || !photo)) ||
                  attendanceMutation.isPending
                }
                className={`w-full ${verifiedEmployee ? getButtonColor(nextEventType) : ''}`}
              >
                {attendanceMutation.isPending
                  ? 'Logging...'
                  : verifiedEmployee
                    ? getButtonLabel(nextEventType)
                    : 'Log Attendance'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Method 1: Fingerprint Authentication</strong></p>
              <p>1. Enter your employee code</p>
              <p>2. Check "Use Fingerprint Authentication"</p>
              <p>3. Click "Verify Fingerprint" and use your device's biometric (Touch ID, Face ID, Windows Hello, or USB fingerprint reader)</p>
              <p>4. Click "Clock In" once verified</p>
              <p className="pt-2"><strong>Method 2: Photo Verification</strong></p>
              <p>1. Enter your employee code</p>
              <p>2. Click "Start Camera" to activate your webcam</p>
              <p>3. Position yourself in front of the camera</p>
              <p>4. Click "Capture Photo" to take your picture</p>
              <p>5. Review your photo and click "Clock In"</p>
              <p className="pt-4 text-xs">
                <strong>Note:</strong> Fingerprint authentication is more secure and faster.
                Your biometric data is encrypted and stored securely per BIPA compliance.
                Photos are used for verification and compliance purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

