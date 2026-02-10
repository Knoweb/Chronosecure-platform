import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Download } from "lucide-react"
import { AttendanceTable } from "@/components/reports/attendance-table"

export default async function AttendancePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) return null

  // Get today's attendance
  const today = new Date().toISOString().split("T")[0]

  const { data: todayAttendance } = await supabase
    .from("attendance_records")
    .select(
      `
      *,
      employees (
        first_name,
        last_name,
        employee_code,
        departments (name)
      )
    `,
    )
    .eq("organization_id", profile.organization_id)
    .gte("clock_in_time", `${today}T00:00:00`)
    .order("clock_in_time", { ascending: false })

  const clockedIn = todayAttendance?.filter((r) => r.status === "clocked_in").length || 0
  const clockedOut = todayAttendance?.filter((r) => r.status === "clocked_out").length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track employee attendance and work hours</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Select Date
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Currently Clocked In</p>
            <p className="text-4xl font-bold">{clockedIn}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Clocked Out</p>
            <p className="text-4xl font-bold">{clockedOut}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Total Today</p>
            <p className="text-4xl font-bold">{clockedIn + clockedOut}</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search attendance records..." className="pl-9" />
        </div>
      </div>

      {/* Attendance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
        <AttendanceTable records={todayAttendance || []} />
      </Card>
    </div>
  )
}
