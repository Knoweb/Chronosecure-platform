"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Camera, Loader2, CheckCircle2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface KioskClockInProps {
  onSuccess: (action: "clock-in" | "clock-out") => void
}

export function KioskClockIn({ onSuccess }: KioskClockInProps) {
  const [step, setStep] = useState<"enter-id" | "scan-fingerprint" | "photo-capture">("enter-id")
  const [employeeCode, setEmployeeCode] = useState("")
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingRecord, setExistingRecord] = useState<any>(null)

  async function handleEmployeeCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Find employee by code
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("employee_code", employeeCode)
        .eq("status", "active")
        .single()

      if (employeeError || !employeeData) {
        throw new Error("Employee not found or inactive")
      }

      setEmployee(employeeData)

      // Check if employee is already clocked in today
      const today = new Date().toISOString().split("T")[0]
      const { data: todayRecord } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeData.id)
        .gte("clock_in_time", `${today}T00:00:00`)
        .eq("status", "clocked_in")
        .single()

      if (todayRecord) {
        setExistingRecord(todayRecord)
      }

      setStep("scan-fingerprint")
    } catch (err: any) {
      setError(err.message || "Failed to verify employee")
    } finally {
      setLoading(false)
    }
  }

  async function handleFingerprintScan() {
    setError("")
    setLoading(true)

    try {
      // Simulate fingerprint scan
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setStep("photo-capture")
    } catch (err: any) {
      setError("Fingerprint verification failed")
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoCapture() {
    setError("")
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (existingRecord) {
        // Clock out
        const clockOutTime = new Date()
        const clockInTime = new Date(existingRecord.clock_in_time)
        const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
        const regularHours = Math.min(totalHours, 8)
        const overtimeHours = Math.max(totalHours - 8, 0)

        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({
            clock_out_time: clockOutTime.toISOString(),
            clock_out_biometric_verified: true,
            total_hours: totalHours,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
            status: "clocked_out",
          })
          .eq("id", existingRecord.id)

        if (updateError) throw updateError

        onSuccess("clock-out")
      } else {
        // Clock in
        const { error: insertError } = await supabase.from("attendance_records").insert({
          organization_id: employee.organization_id,
          employee_id: employee.id,
          clock_in_time: new Date().toISOString(),
          clock_in_biometric_verified: true,
          status: "clocked_in",
        })

        if (insertError) throw insertError

        onSuccess("clock-in")
      }

      // Reset form
      setTimeout(() => {
        setStep("enter-id")
        setEmployeeCode("")
        setEmployee(null)
        setExistingRecord(null)
      }, 3000)
    } catch (err: any) {
      setError("Failed to record attendance")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl p-12 shadow-2xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Enter Employee Code */}
      {step === "enter-id" && (
        <div className="space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome</h2>
            <p className="text-muted-foreground text-lg">Enter your employee ID to continue</p>
          </div>

          <form onSubmit={handleEmployeeCodeSubmit} className="space-y-6">
            <Input
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="Enter Employee ID"
              className="text-center text-2xl h-16 font-mono"
              autoFocus
              required
              disabled={loading}
            />

            <Button type="submit" size="lg" className="w-full h-14 text-lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2: Fingerprint Scan */}
      {step === "scan-fingerprint" && employee && (
        <div className="space-y-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {employee.first_name[0]}
                {employee.last_name[0]}
              </span>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-muted-foreground">{employee.position || "Employee"}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Fingerprint className="h-20 w-20 text-primary" />
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-32 w-32 animate-spin text-primary/20" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {existingRecord ? "Scan to Clock Out" : "Scan to Clock In"}
              </h3>
              <p className="text-muted-foreground">Place your finger on the scanner</p>
            </div>
          </div>

          {!loading && (
            <Button onClick={handleFingerprintScan} size="lg" className="w-full h-14 text-lg">
              Simulate Fingerprint Scan
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Photo Capture */}
      {step === "photo-capture" && employee && (
        <div className="space-y-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">Fingerprint Verified</h2>
              <p className="text-muted-foreground">
                {employee.first_name} {employee.last_name}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="h-48 w-48 rounded-lg bg-muted border-4 border-primary flex items-center justify-center">
                {loading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                ) : (
                  <Camera className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Photo Verification</h3>
              <p className="text-muted-foreground">Look at the camera for photo capture</p>
            </div>
          </div>

          {!loading && (
            <Button onClick={handlePhotoCapture} size="lg" className="w-full h-14 text-lg">
              <Camera className="h-5 w-5 mr-2" />
              Capture Photo
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
