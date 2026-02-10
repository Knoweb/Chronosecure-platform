import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Users, Clock, CheckCircle2, Calendar } from "lucide-react"
import { RecentAttendance } from "@/components/dashboard/recent-attendance"
import { TodayOverview } from "@/components/dashboard/today-overview"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) return null

  // Fetch dashboard stats
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")

  const today = new Date().toISOString().split("T")[0]

  const { count: clockedInToday } = await supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .gte("clock_in_time", `${today}T00:00:00`)
    .eq("status", "clocked_in")

  const { count: clockedOutToday } = await supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .gte("clock_in_time", `${today}T00:00:00`)
    .eq("status", "clocked_out")

  const { count: pendingTimeOff } = await supabase
    .from("time_off_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Employees</p>
              <p className="text-3xl font-bold">{totalEmployees || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Clocked In</p>
              <p className="text-3xl font-bold">{clockedInToday || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Clocked Out</p>
              <p className="text-3xl font-bold">{clockedOutToday || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Pending Requests</p>
              <p className="text-3xl font-bold">{pendingTimeOff || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Today Overview and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <TodayOverview organizationId={profile.organization_id} />
        <RecentAttendance organizationId={profile.organization_id} />
      </div>
    </div>
  )
}
