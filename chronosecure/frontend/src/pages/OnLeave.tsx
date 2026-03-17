import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, UserMinus } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export default function OnLeavePage() {
  const companyId = useAuthStore((state) => state.companyId)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['on-leave-today', companyId],
    queryFn: async () => {
      const response = await api.get('/time-off/requests', {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data || []
    },
    enabled: !!companyId,
  })

  const today = new Date().toISOString().split('T')[0]

  const onLeaveToday = useMemo(() => {
    const leaveRequests = (requests || []).filter((request: any) => {
      if (request.status !== 'APPROVED') return false
      return request.startDate <= today && request.endDate >= today
    })

    const uniqueByEmployee = new Map<string, any>()
    leaveRequests.forEach((request: any) => {
      if (!uniqueByEmployee.has(request.employeeId)) {
        uniqueByEmployee.set(request.employeeId, request)
      }
    })

    return Array.from(uniqueByEmployee.values())
  }, [requests, today])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">On Leave Today</h1>
              <p className="text-muted-foreground mt-1">
                Employees with approved time-off covering today.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserMinus className="h-5 w-5" />
                  On Leave Employees
                  <Badge variant="secondary" className="ml-1">{onLeaveToday.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading on-leave employees...</p>
                ) : onLeaveToday.length === 0 ? (
                  <p className="text-muted-foreground">No employees are on leave today.</p>
                ) : (
                  <div className="space-y-2">
                    {onLeaveToday.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{request.employeeName || 'Employee'}</p>
                          <p className="text-sm text-muted-foreground">{request.reason || 'Approved leave'}</p>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{request.startDate} to {request.endDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
