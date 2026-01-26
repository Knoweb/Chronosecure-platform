import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { EmployeeSearch } from '@/components/ui/employee-search'

export default function KioskPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [useFingerprint, setUseFingerprint] = useState(false)
  const [fingerprintVerified, setFingerprintVerified] = useState(false)
  const [verifyingFingerprint, setVerifyingFingerprint] = useState(false)
  const [verifiedEmployee, setVerifiedEmployee] = useState<any>(null)
  const [fingerprintError, setFingerprintError] = useState('')
  const [nextEventType, setNextEventType] = useState<string>('CLOCK_IN')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [generalError, setGeneralError] = useState('')

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

  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const response = await api.get('/employees', {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data
    },
    enabled: !!companyId,
  })

  const selectedEmployee = employees?.find((e: any) => e.id === selectedEmployeeId)
  const employeeCode = selectedEmployee?.employeeCode || ''

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
        setSelectedEmployeeId('')
        setPhoto(null)
        setFingerprintVerified(false)
        setVerifiedEmployee(null)
        stopCamera() // Ensure camera stops
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
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Could not access camera. Please ensure you have granted permissions.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  function capturePhoto() {
    if (videoRef.current && isCameraActive) {
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
      if (!selectedEmployeeId || !photo) {
        setGeneralError('Please select an employee and capture photo')
        return
      }

      try {
        if (!selectedEmployee) {
          setGeneralError('Employee not found')
          return
        }

        // Get next event for this employee
        const nextEventRes = await api.get(
          `/attendance/next-state/${companyId}/${selectedEmployee.id}`
        )
        const eventType = nextEventRes.data

        const photoBase64 = photo.split(',')[1]
        const livenessScore = calculateLivenessScore(photoBase64)

        attendanceMutation.mutate({
          companyId,
          employeeId: selectedEmployee.id,
          eventType,
          photoBase64,
          confidenceScore: livenessScore,
          deviceId: 'web-kiosk',
        })
      } catch (err: any) {
        console.error('Error:', err)
        setGeneralError(err.message || 'An error occurred')
      }
    }
  }

  function getButtonLabel(eventType: string): string {
    switch (eventType) {
      case 'CLOCK_IN': return 'Clock In'
      case 'BREAK_START': return 'Start Break'
      case 'BREAK_END': return 'End Break'
      case 'CLOCK_OUT': return 'Clock Out'
      default: return 'Log Attendance'
    }
  }

  function getButtonColor(eventType: string): string {
    if (eventType === 'CLOCK_IN' || eventType === 'BREAK_END') {
      return 'bg-green-600 hover:bg-green-700'
    }
    return 'bg-blue-600 hover:bg-blue-700'
  }

  return (
    <div className="h-screen bg-background p-4 flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-4">
        <div className="text-center shrink-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Attendance Kiosk</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials and verify your identity
          </p>
        </div>

        {success && (
          <Alert className="bg-green-50 border-green-200 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium ml-2 text-sm">
              Attendance logged successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Column: Input & Verification */}
          <Card className="flex flex-col h-full border-2 shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/20 shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Fingerprint className="h-5 w-5 text-primary" />
                Employee Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-1 flex flex-col overflow-y-auto scrollbar-thin">
              {generalError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1">
                <Label htmlFor="employeeCode" className="text-sm">Employee</Label>
                <EmployeeSearch
                  employees={employees || []}
                  value={selectedEmployeeId}
                  onChange={(val) => {
                    setSelectedEmployeeId(val)
                    setFingerprintVerified(false)
                    setVerifiedEmployee(null)
                  }}
                />
              </div>

              <div className="p-3 bg-muted/30 rounded-lg space-y-2 shrink-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useFingerprint"
                    checked={useFingerprint}
                    onChange={(e) => {
                      setUseFingerprint(e.target.checked)
                      setFingerprintVerified(false)
                      setVerifiedEmployee(null)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <Label htmlFor="useFingerprint" className="cursor-pointer text-sm font-medium">
                    Biometric Auth (Optional)
                  </Label>
                </div>

                {useFingerprint && (
                  <div className="pt-1">
                    {fingerprintVerified && verifiedEmployee ? (
                      <div className="p-2 bg-green-50 text-green-700 border border-green-200 rounded text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="truncate">Verified: {verifiedEmployee.firstName}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {fingerprintError && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
                            {fingerprintError}
                          </div>
                        )}
                        <Button
                          onClick={handleFingerprintVerification}
                          disabled={!employeeCode || verifyingFingerprint}
                          className="w-full h-9 text-xs"
                          variant="secondary"
                        >
                          {verifyingFingerprint ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-3 w-3 mr-2" />
                              Scan Fingerprint
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[200px] flex flex-col space-y-2">
                <div className="flex items-center justify-between shrink-0">
                  <Label className="text-sm">Photo Verification <span className="text-red-500">*</span></Label>
                  {isCameraActive && (
                    <span className="text-[10px] text-red-500 animate-pulse font-bold uppercase">
                      ● Live
                    </span>
                  )}
                </div>

                <div className="relative flex-1 rounded-lg overflow-hidden bg-black/5 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                  {!photo ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover absolute inset-0 ${isCameraActive ? 'block' : 'hidden'}`}
                      />
                      {!isCameraActive && (
                        <div className="text-center p-4 space-y-1">
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">Camera off</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={photo}
                      alt="Captured"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 shrink-0">
                  {!photo ? (
                    isCameraActive ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopCamera}
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Stop
                        </Button>
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          size="sm"
                        >
                          Capture
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startCamera}
                        size="sm"
                        className="col-span-2"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    )
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setPhoto(null)
                        startCamera()
                      }}
                      size="sm"
                      className="col-span-2 text-primary h-8"
                    >
                      Retake Photo
                    </Button>
                  )}
                </div>
              </div>

              {verifiedEmployee && (
                <div className="p-3 bg-blue-50 text-blue-900 rounded border border-blue-200 flex justify-between items-center shrink-0">
                  <span className="text-sm font-medium">Next Action:</span>
                  <span className="font-bold">{getButtonLabel(nextEventType)}</span>
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
                className={`w-full h-12 text-md font-bold shadow-sm shrink-0 ${verifiedEmployee ? getButtonColor(nextEventType) : ''}`}
              >
                {attendanceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  verifiedEmployee ? getButtonLabel(nextEventType) : 'Log Attendance'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right Column: Instructions */}
          <Card className="flex flex-col h-full border shadow-sm bg-muted/10 overflow-hidden">
            <CardHeader className="py-3 px-4 shrink-0">
              <CardTitle className="text-lg">How to use</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 overflow-y-auto scrollbar-thin text-sm flex-1">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
                  Identify Yourself
                </h3>
                <p className="text-muted-foreground pl-7">
                  Enter your unique <strong>Employee Code</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>
                  Verify Identity
                </h3>
                <div className="pl-7 space-y-2">
                  <div className="p-2 bg-white rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-900 text-xs">Option A: Biometrics</p>
                    <p className="text-xs text-muted-foreground">
                      Check box & scan fingerprint/face.
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-100 shadow-sm">
                    <p className="font-medium text-gray-900 text-xs">Option B: Photo</p>
                    <p className="text-xs text-muted-foreground">
                      Take a clear photo of your face.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">3</span>
                  Submit
                </h3>
                <ul className="list-disc pl-11 text-muted-foreground space-y-1 text-xs">
                  <li>Keep face visible.</li>
                  <li>Click <strong>Start Camera</strong> → <strong>Capture</strong>.</li>
                  <li>Click <strong>Log Attendance</strong>.</li>
                </ul>
              </div>

              <div className="pt-4 mt-auto border-t">
                <p className="text-[10px] text-center text-muted-foreground">
                  By using this system, you consent to biometric data processing for attendance verification.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
