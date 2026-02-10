import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: string
}

export function StatsCard({ title, value, icon: Icon, trend, color = "primary" }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </Card>
  )
}
