import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock } from "lucide-react"

interface KioskSuccessProps {
  action: "clock-in" | "clock-out"
}

export function KioskSuccess({ action }: KioskSuccessProps) {
  return (
    <Card className="w-full max-w-2xl p-12 shadow-2xl text-center">
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-green-600 mb-2">
            {action === "clock-in" ? "Clocked In Successfully!" : "Clocked Out Successfully!"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {action === "clock-in" ? "Have a productive day!" : "Great work today!"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="text-lg">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">Returning to home screen...</p>
        </div>
      </div>
    </Card>
  )
}
