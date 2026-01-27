import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Calendar, Plus, Clock, RefreshCw, Check, X } from 'lucide-react'
import { EmployeeSearch } from '@/components/ui/employee-search'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TimeOffPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const queryClient = useQueryClient()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/time-off', data, {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] })
      setShowRequestForm(false)
      setFormData({
        employeeId: '',
        startDate: '',
        endDate: '',
        reason: '',
      })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create request')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate || !formData.employeeId) {
      setError('Start date, end date, and employee ID are required')
      return
    }
    createMutation.mutate(formData)
  }

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/time-off/${id}/status`, null, {
        params: { status },
        headers: { 'X-Company-Id': companyId },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] })
    },
    onError: (err: any) => {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message))
    },
  })

  const { data: timeOffRequests, isLoading, refetch } = useQuery({
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

  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const response = await api.get('/employees', {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowRequestForm(!showRequestForm)}
                  variant="outline"
                  className="border border-border shadow-sm text-foreground hover:bg-muted"
                >
                  <Plus className="h-5 w-5 mr-2 stroke-2" />
                  Request Time Off
                </Button>
              </div>
            </div>

            {/* Request Form */}
            {showRequestForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Time Off Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee</Label>
                      <EmployeeSearch
                        employees={employees || []}
                        value={formData.employeeId}
                        onChange={(value) => setFormData({ ...formData, employeeId: value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason</Label>
                      <Input
                        id="reason"
                        placeholder="Enter reason for time off"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="outline"
                        className="border border-border shadow-sm"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRequestForm(false)}
                        className="border border-border shadow-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="clock-outs" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-auto bg-gray-100 p-1 rounded-xl border border-gray-200">
                <TabsTrigger
                  value="requests"
                  className="py-2.5 text-base font-medium rounded-lg border-2 border-transparent data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-200"
                >
                  Leave Requests
                </TabsTrigger>
                <TabsTrigger
                  value="clock-outs"
                  className="py-2.5 text-base font-medium rounded-lg border-2 border-transparent data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-200"
                >
                  Clock-Out History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                {/* Manual Time Off Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : !timeOffRequests || timeOffRequests.filter((r: any) => !r.reason?.includes('Fingerprint Scanned Out')).length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No pending leave requests.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {timeOffRequests.filter((r: any) => !r.reason?.includes('Fingerprint Scanned Out')).map((request: any) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center gap-4">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
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
                            <div className="flex items-center gap-2">
                              {request.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'APPROVED' })}
                                    disabled={updateStatusMutation.isPending}
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'REJECTED' })}
                                    disabled={updateStatusMutation.isPending}
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Badge className={getStatusBadge(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clock-outs">
                {/* Automated Clock Outs */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Clock-Out History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-muted-foreground">Loading...</p>
                    ) : !timeOffRequests || timeOffRequests.filter((r: any) => r.reason?.includes('Fingerprint Scanned Out')).length === 0 ? (
                      <p className="text-muted-foreground text-sm">No recent clock-outs recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {timeOffRequests.filter((r: any) => r.reason?.includes('Fingerprint Scanned Out')).map((request: any) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center gap-4">
                              <Clock className="h-5 w-5 text-black" />
                              <div>
                                <p className="font-medium text-black">{request.employeeName || 'Employee'}</p>
                                <p className="text-sm text-black">
                                  {new Date(request.startDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-black mt-1">{request.reason}</p>
                              </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 pointer-events-none">
                              CLOCKED OUT
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
