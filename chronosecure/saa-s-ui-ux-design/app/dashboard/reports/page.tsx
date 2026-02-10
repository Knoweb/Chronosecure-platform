import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { AttendanceSummaryChart } from "@/components/reports/attendance-summary-chart"
import { DepartmentHoursChart } from "@/components/reports/department-hours-chart"
import { AttendanceTable } from "@/components/reports/attendance-table"

export default async function ReportsPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) return null

  // Get date range for current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  // Fetch attendance records for the current month
  const { data: attendanceRecords } = await supabase
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
    .gte("clock_in_time", startOfMonth)
    .lte("clock_in_time", endOfMonth)
    .order("clock_in_time", { ascending: false })

  // Calculate summary stats
  const totalHours = attendanceRecords?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0
  const totalOvertimeHours = attendanceRecords?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0
  const averageHoursPerDay = attendanceRecords ? totalHours / Math.max(attendanceRecords.length, 1) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">View attendance reports and workforce analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Select Period
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Total Hours</p>
            <p className="text-3xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Overtime Hours</p>
            <p className="text-3xl font-bold">{totalOvertimeHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Avg Hours/Day</p>
            <p className="text-3xl font-bold">{averageHoursPerDay.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">Attendance Summary</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="details">Detailed Records</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Attendance Overview</h3>
            <AttendanceSummaryChart records={attendanceRecords || []} />
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hours by Department</h3>
            <DepartmentHoursChart records={attendanceRecords || []} />
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
            <AttendanceTable records={attendanceRecords || []} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
