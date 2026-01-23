import { useQuery } from '@tanstack/react-query'
import { Users, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const companyId = useAuthStore((state) => state.companyId)

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: async () => {
      const [employeesRes] = await Promise.all([
        api.get('/employees'),
      ])
      return {
        totalEmployees: employeesRes.data.length,
        clockedIn: 0,
        clockedOut: 0,
        pendingRequests: 0,
      }
    },
    enabled: !!companyId,
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Total Employees</p>
                    <p className="text-3xl font-bold">{stats?.totalEmployees || 0}</p>
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
                    <p className="text-3xl font-bold">{stats?.clockedIn || 0}</p>
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
                    <p className="text-3xl font-bold">{stats?.clockedOut || 0}</p>
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
                    <p className="text-3xl font-bold">{stats?.pendingRequests || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Today Overview and Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Today's Activity</h3>
                <p className="text-sm text-muted-foreground text-center py-8">No activity today</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Recent Completed</h3>
                <p className="text-sm text-muted-foreground text-center py-8">No completed records</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
