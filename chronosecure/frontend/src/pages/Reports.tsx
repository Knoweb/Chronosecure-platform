import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmployeeSearch } from '@/components/ui/employee-search'
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

  async function downloadCostReport() {
    try {
      const response = await api.get('/reports/company/cost', {
        params: { startDate, endDate },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cost-report-${startDate}-to-${endDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error downloading cost report:', err)
      alert('Failed to download cost report')
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">Generate and download attendance reports</p>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Date Range</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Company Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground min-h-[44px]">
                    Download comprehensive attendance report for all employees.
                  </p>
                  <Button
                    onClick={downloadCompanyReport}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Company Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Cost Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground min-h-[44px]">
                    Daily breakdown of active employee costs ($1.00 base + $0.50/extra).
                  </p>
                  <Button
                    onClick={downloadCostReport}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Cost Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm md:col-span-2 xl:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle>Employee Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Download attendance report for a selected employee.</p>
                  <div className="space-y-2">
                    <Label>Select Employee</Label>
                    <EmployeeSearch
                      employees={employees || []}
                      value={selectedEmployeeId}
                      onChange={setSelectedEmployeeId}
                    />
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

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Report Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground pt-0">
                <p>• Company reports include all employees' attendance data for the selected date range</p>
                <p>• Reports are generated in Excel format (.xlsx) and include total and categorized hours</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

