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
  const [isCameraActive, setIsCameraActive] = useState(false)

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
      case 'CLOCK_IN': return 'Clock In'
      case 'BREAK_START': return 'Start Break'
      case 'BREAK_END': return 'End Break'
      case 'CLOCK_OUT': return 'Clock Out'
      default: return 'Log Attendance'
    }
  }

  function getButtonColor(eventType: string): string {
    if (eventType === 'CLOCK_IN' || eventType === 'BREAK_END') {
      </div >
    </div >
  )
    }
