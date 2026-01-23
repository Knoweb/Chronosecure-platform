import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Download, User } from 'lucide-react'

type Employee = {
  id: string
  firstName: string
  lastName: string
  employeeCode: string
}

export default function ReportsPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: employees } = useQuery({
    queryKey: ['employees', companyId],
    queryFn: async () => {
      const response = await api.get<Employee[]>('/employees')
      return response.data
    },
    enabled: !!companyId,
  })

  async function downloadCompanyReport() {
    try {
      const response = await api.get('/reports/company', {
        params: { startDate, endDate },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `company-report-${startDate}-to-${endDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error downloading report:', err)
      alert('Failed to download report')
    }
  }

  async function downloadEmployeeReport() {
    if (!selectedEmployeeId) return
    try {
      const response = await api.get(`/reports/employee/${selectedEmployeeId}`, {
        params: { startDate, endDate },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const emp = employees?.find((e) => e.id === selectedEmployeeId)
      const empName = emp ? `${emp.firstName}-${emp.lastName}` : 'employee'
      link.setAttribute(
        'download',
        `attendance-report-${empName}-${startDate}-to-${endDate}.xlsx`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error downloading employee report:', err)
      alert('Failed to download employee report')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground mt-1">
                Generate and download attendance reports
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Date Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download comprehensive attendance report for all employees.
                    </p>
                    <Button onClick={downloadCompanyReport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Company Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Employee Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Employee</Label>
                      <Select
                        value={selectedEmployeeId}
                        onValueChange={setSelectedEmployeeId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName} ({employee.employeeCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={downloadEmployeeReport}
                      variant="outline"
                      className="w-full"
                      disabled={!selectedEmployeeId}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Download Employee Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Company reports include all employees' attendance data for the selected
                  date range
                </p>
                <p>
                  • Reports are generated in Excel format (.xlsx) and include total hours,
                  weekday hours, weekend hours, and public holiday hours
                </p>
                <p>• Reports can be used for payroll processing and compliance audits</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

