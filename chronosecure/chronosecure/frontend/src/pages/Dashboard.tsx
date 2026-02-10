import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, CheckCircle2, Clock, Calendar, Check, X } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const companyId = useAuthStore((state) => state.companyId)

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: async () => {
      const response = await api.get('/attendance/today-stats', {
        headers: { 'X-Company-Id': companyId }
      })
      return response.data
    },
    enabled: !!companyId,
  })

  const queryClient = useQueryClient()

  const { data: pendingRequests } = useQuery({
    queryKey: ['pendingTimeOff', companyId],
    queryFn: async () => {
      const response = await api.get('/time-off/requests', {
        headers: { 'X-Company-Id': companyId }
      })
      // Filter for standard PENDING status if backend returns all
      return response.data?.filter((r: any) => r.status === 'PENDING') || []
    },
    enabled: !!companyId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/time-off/${id}/status`, null, {
        params: { status },
        headers: { 'X-Company-Id': companyId },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTimeOff'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
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
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {!pendingRequests || pendingRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{request.employeeName || 'Employee'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.startDate).toLocaleDateString()} - {request.reason || 'Time Off'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-full bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                              onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'APPROVED' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-full bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                              onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'REJECTED' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
