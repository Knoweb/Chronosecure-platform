import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface RecentAttendanceProps {
  organizationId: string
}

export async function RecentAttendance({ organizationId }: RecentAttendanceProps) {
  const supabase = await getSupabaseServerClient()

  const { data: recentRecords } = await supabase
    .from("attendance_records")
    .select(
      `
      *,
      employees (
        first_name,
        last_name,
        employee_code
      )
    `,
    )
    .eq("organization_id", organizationId)
    .eq("status", "clocked_out")
    .not("total_hours", "is", null)
    .order("clock_out_time", { ascending: false })
    .limit(5)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Recent Completed</h3>
        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {recentRecords && recentRecords.length > 0 ? (
          recentRecords.map((record: any) => (
            <div key={record.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {record.employees?.first_name?.[0]}
                    {record.employees?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {record.employees?.first_name} {record.employees?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{record.employees?.employee_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{record.total_hours?.toFixed(2)}h</p>
                <p className="text-xs text-muted-foreground">{new Date(record.clock_out_time).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No completed records</p>
        )}
      </div>
    </Card>
  )
}
