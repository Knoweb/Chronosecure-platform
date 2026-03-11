import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, CheckCircle2, Clock, Calendar, Check, X, Fingerprint, UserMinus, Activity, ExternalLink, ShieldCheck } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
  const [showScannerDialog, setShowScannerDialog] = useState(false)
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

  const launchScanner = () => {
    setShowScannerDialog(true)
  }

  const confirmLaunch = () => {
    setShowScannerDialog(false)
    window.location.href = `fingerprint://enroll?companyId=${companyId}`
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back! Here's what's happening today.
                </p>
              </div>
              <Button onClick={launchScanner} variant="outline" className="gap-2 mr-4 mt-2">
                <Fingerprint className="h-4 w-4" />
                Launch Scanner
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <Card className="p-4 md:p-6">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Total Employees</p>
                    <p className="text-xl md:text-3xl font-bold">{stats?.totalEmployees || 0}</p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center self-end md:self-auto shrink-0">
                    <Users className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Clocked In</p>
                    <p className="text-xl md:text-3xl font-bold">{stats?.clockedIn || 0}</p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-green-500/10 flex items-center justify-center self-end md:self-auto shrink-0">
                    <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-green-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Clocked Out</p>
                    <p className="text-xl md:text-3xl font-bold">{stats?.clockedOut || 0}</p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center self-end md:self-auto shrink-0">
                    <Clock className="h-4 w-4 md:h-6 md:w-6 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Absent (Today)</p>
                    <p className="text-xl md:text-3xl font-bold">{stats?.absent || 0}</p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-red-500/10 flex items-center justify-center self-end md:self-auto shrink-0">
                    <UserMinus className="h-4 w-4 md:h-6 md:w-6 text-red-600 dark:text-red-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Pending Requests</p>
                    <p className="text-xl md:text-3xl font-bold">{stats?.pendingRequests || 0}</p>
                  </div>
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg bg-orange-500/10 flex items-center justify-center self-end md:self-auto shrink-0">
                    <Calendar className="h-4 w-4 md:h-6 md:w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Today Overview and Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Activity</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity today</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentActivity.map((log: any) => (
                        <div key={log.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {log.employeeName || log.employeeCode}
                            </p>
                            <p className="text-xs text-muted-foreground flex gap-2 items-center">
                              <span>
                                {log.eventType === 'CLOCK_IN' ? 'Clocked In'
                                  : log.eventType === 'CLOCK_OUT' ? 'Clocked Out'
                                    : log.eventType === 'BREAK_START' ? 'Started Break'
                                      : 'Ended Break'}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(log.eventTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
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

      {/* ── Fingerprint Launch Dialog ── */}
      <Dialog open={showScannerDialog} onOpenChange={setShowScannerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center gap-2 pt-2">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Open Fingerprint Scanner?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground max-w-xs">
              This will launch the <span className="font-semibold text-foreground">ChronoSecure Fingerprint App</span> on your computer. Please make sure it is installed before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="mx-4 rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-start gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">Your biometric data is processed locally and never stored in raw form.</span>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 pb-2 px-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowScannerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={confirmLaunch}
            >
              <ExternalLink className="h-4 w-4" />
              Open App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
