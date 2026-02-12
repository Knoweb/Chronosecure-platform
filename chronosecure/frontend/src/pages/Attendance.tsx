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
import { Clock, Filter, Download, RefreshCw } from 'lucide-react'
import { EmployeeSearch } from '@/components/ui/employee-search'

export default function AttendancePage() {
  const companyId = useAuthStore((state) => state.companyId)
  const getDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [startDate, setStartDate] = useState(getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
  const [endDate, setEndDate] = useState(getDateString(new Date()))
  const [employeeFilter, setEmployeeFilter] = useState('')

  const { data: attendanceLogs, isLoading, refetch } = useQuery({
    queryKey: ['attendance', companyId, startDate, endDate],
    queryFn: async () => {
      // Note: This endpoint needs to be implemented in the backend
      // For now, we'll fetch all logs and filter client-side
      const response = await api.get('/attendance/logs', {
        headers: {
          'X-Company-Id': companyId,
        },
        params: {
          startDate,
          endDate,
        },
      })
      return response.data
    },
    enabled: !!companyId,
    refetchInterval: 2000,
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



  const filteredLogs = attendanceLogs?.filter((log: any) => {
    if (log.eventType === 'CLOCK_OUT') return false // Hide CLOCK_OUT as per user request (shown in Time Off)
    if (!employeeFilter) return true
    return log.employeeId === employeeFilter
  }) || []

  function getEventTypeBadge(eventType: string) {
    const colors: Record<string, string> = {
      CLOCK_IN: 'bg-green-100 text-green-800',
      CLOCK_OUT: 'bg-red-100 text-red-800',
      BREAK_START: 'bg-yellow-100 text-yellow-800',
      BREAK_END: 'bg-blue-100 text-blue-800',
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800'
  }

  const handleExport = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert('No attendance records to export')
      return
    }

    // CSV headers
    const headers = ['Date', 'Time', 'Employee Code', 'Employee Name', 'Event Type']

    // Convert logs to CSV rows
    const rows = filteredLogs.map((log: any) => {
      // Try to find the timestamp - it might be in different formats
      let timestampValue = log.eventTimestamp || log.timestamp || log.createdAt

      // Handle different timestamp formats
      let timestamp: Date
      if (typeof timestampValue === 'number') {
        // Unix timestamp (seconds or milliseconds)
        timestamp = new Date(timestampValue > 10000000000 ? timestampValue : timestampValue * 1000)
      } else if (typeof timestampValue === 'string') {
        // ISO string or other string format
        timestamp = new Date(timestampValue)
      } else if (timestampValue && typeof timestampValue === 'object') {
        // Java Instant object with seconds and nanos
        if ('epochSecond' in timestampValue || 'seconds' in timestampValue) {
          const seconds = timestampValue.epochSecond || timestampValue.seconds || 0
          const nanos = timestampValue.nano || timestampValue.nanos || 0
          timestamp = new Date(seconds * 1000 + nanos / 1000000)
        } else {
          timestamp = new Date(timestampValue)
        }
      } else {
        timestamp = new Date()
      }

      // Format date and time
      const date = !isNaN(timestamp.getTime())
        ? timestamp.toLocaleDateString('en-CA') // YYYY-MM-DD format
        : 'N/A'
      const time = !isNaN(timestamp.getTime())
        ? timestamp.toLocaleTimeString('en-US', { hour12: false }) // HH:MM:SS format
        : 'N/A'

      const employeeCode = log.employeeCode || 'N/A'
      const employeeName = log.employeeName || 'Unknown'
      const eventType = log.eventType || 'N/A'

      return [date, time, employeeCode, employeeName, eventType]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_${startDate}_to_${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                <h1 className="text-3xl font-bold">Attendance <span className="text-sm text-red-500">(v2.1)</span></h1>
                <p className="text-muted-foreground mt-1">View and manage attendance records</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 border border-border shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeFilter">Filter by Employee</Label>
                    <EmployeeSearch
                      employees={employees || []}
                      value={employeeFilter}
                      onChange={setEmployeeFilter}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button
                      className="w-full border border-border shadow-sm"
                      variant="outline"
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading attendance records...</p>
                ) : filteredLogs.length === 0 ? (
                  <p className="text-muted-foreground">No attendance records found for the selected period.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map((log: any) => {
                      const employee = employees?.find((e: any) => e.id === log.employeeId)
                      return (
                        <div
                          key={log.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition gap-3 sm:gap-0"
                        >
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 sm:mt-0 shrink-0" />
                            <div>
                              <p className="font-medium">
                                {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 text-sm text-muted-foreground">
                                <span>{employee?.employeeCode}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{new Date(log.eventTimestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-8 sm:ml-0 mt-1 sm:mt-0">
                            <Badge className={getEventTypeBadge(log.eventType)}>
                              {log.eventType.replace('_', ' ')}
                            </Badge>
                            {log.deviceId && (
                              <span className="text-xs sm:text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">{log.deviceId}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
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

