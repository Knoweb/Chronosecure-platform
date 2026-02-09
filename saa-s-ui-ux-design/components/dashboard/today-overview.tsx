import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface TodayOverviewProps {
  organizationId: string
}

export async function TodayOverview({ organizationId }: TodayOverviewProps) {
  const supabase = await getSupabaseServerClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: todayRecords } = await supabase
    .from("attendance_records")
    .select(
      `
      *,
      employees (
        first_name,
        last_name,
        photo_url
      )
    `,
    )
    .eq("organization_id", organizationId)
    .gte("clock_in_time", `${today}T00:00:00`)
    .order("clock_in_time", { ascending: false })
    .limit(5)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Today's Activity</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {todayRecords && todayRecords.length > 0 ? (
          todayRecords.map((record: any) => (
            <div key={record.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {record.employees?.photo_url ? (
                    <img
                      src={record.employees.photo_url || "/placeholder.svg"}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {record.employees?.first_name?.[0]}
                      {record.employees?.last_name?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {record.employees?.first_name} {record.employees?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.clock_in_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant={record.status === "clocked_in" ? "default" : "secondary"}>
                {record.status === "clocked_in" ? "In" : "Out"}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No activity today</p>
        )}
      </div>
    </Card>
  )
}
