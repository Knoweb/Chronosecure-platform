import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Calendar, Plus, Clock } from 'lucide-react'

export default function TimeOffPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const [showRequestForm, setShowRequestForm] = useState(false)

  const { data: timeOffRequests, isLoading } = useQuery({
    queryKey: ['timeOff', companyId],
    queryFn: async () => {
      // Note: This endpoint needs to be implemented in the backend
      // For now, return empty array
      try {
        const response = await api.get('/time-off/requests', {
          headers: {
            'X-Company-Id': companyId,
          },
        })
        return response.data
      } catch (error) {
        return []
      }
    },
    enabled: !!companyId,
  })

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Time Off</h1>
                <p className="text-muted-foreground mt-1">Manage time off requests and approvals</p>
              </div>
              <Button onClick={() => setShowRequestForm(!showRequestForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Request Time Off
              </Button>
            </div>

            {/* Request Form */}
            {showRequestForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Time Off Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason</Label>
                      <Input id="reason" placeholder="Enter reason for time off" />
                    </div>
                    <div className="flex gap-2">
                      <Button>Submit Request</Button>
                      <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time Off Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Time Off Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading time off requests...</p>
                ) : !timeOffRequests || timeOffRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No time off requests found.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Request Time Off" to create a new request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeOffRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{request.employeeName || 'Employee'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </p>
                            {request.reason && (
                              <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status}
                        </Badge>
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
