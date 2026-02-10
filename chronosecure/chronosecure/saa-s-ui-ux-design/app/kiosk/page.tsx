"use client"

import { useState } from "react"
import { KioskClockIn } from "@/components/kiosk/kiosk-clock-in"
import { KioskSuccess } from "@/components/kiosk/kiosk-success"
import { Clock } from "lucide-react"

export default function KioskPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastAction, setLastAction] = useState<"clock-in" | "clock-out" | null>(null)

  // Update time every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  })

  function handleSuccess(action: "clock-in" | "clock-out") {
    setLastAction(action)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setLastAction(null)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">ChronoSecure Kiosk</span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-8 py-12 flex items-center justify-center">
        {showSuccess && lastAction ? <KioskSuccess action={lastAction} /> : <KioskClockIn onSuccess={handleSuccess} />}
      </div>

      {/* Footer */}
      <div className="border-t bg-card/80 backdrop-blur py-4">
        <div className="container mx-auto px-8 text-center text-sm text-muted-foreground">
          Secure biometric attendance system | For support, contact your administrator
        </div>
      </div>
    </div>
  )
}
