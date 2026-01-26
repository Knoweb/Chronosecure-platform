import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { Plus, Fingerprint, AlertCircle, Trash2 } from 'lucide-react'
import { FingerprintEnrollment } from '@/components/biometric/FingerprintEnrollment'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function EmployeesPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null)
  const [enrollingEmployee, setEnrollingEmployee] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
  })

  const { data: employees, isLoading } = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/employees/${id}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddForm(false)
      setEditingEmployee(null)
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        department: '',
      })
    },
    onError: (error: any) => {
      console.error('Error updating employee:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error: any) => {
      alert('Failed to delete employee: ' + (error.response?.data?.message || error.message))
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  // ... createMutation declaration (keep existing) ...

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // ... existing Create logic ...
      if (!companyId) {
        throw new Error('Company ID is missing. Please log in again.')
      }
      const response = await api.post('/employees', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddForm(false)
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        department: '',
      })
    },
    // ... existing onError ...
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.employeeCode || !formData.firstName || !formData.lastName) {
      alert('Please fill in all required fields (Employee Code, First Name, Last Name)')
      return
    }

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEditClick = (employee: any) => {
    setEditingEmployee(employee.id)
    setFormData({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      department: employee.department || '',
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingEmployee(null)
    setFormData({
      employeeCode: '',
      firstName: '',
      lastName: '',
      email: '',
      department: '',
    })
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
                <h1 className="text-3xl font-bold">Employees</h1>
                <p className="text-muted-foreground mt-1">Manage your employees</p>
              </div>
              <Button
                onClick={() => {
                  setEditingEmployee(null)
                  setFormData({
                    employeeCode: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    department: '',
                  })
                  setShowAddForm(!showAddForm)
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Employee
              </Button>
            </div>

            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ... Alert logic ... */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... Form Inputs (same as before) ... */}
                    {!companyId && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Company ID is missing. Please log out and log in again.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeCode">Employee Code *</Label>
                        <Input
                          id="employeeCode"
                          value={formData.employeeCode}
                          onChange={(e) =>
                            setFormData({ ...formData, employeeCode: e.target.value })
                          }
                          required
                          placeholder="e.g., 001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({ ...formData, department: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? 'Saving...'
                          : (editingEmployee ? 'Update Employee' : 'Create Employee')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Employee List</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading...</p>
                ) : employees?.length === 0 ? (
                  <p className="text-muted-foreground">No employees found</p>
                ) : (
                  <div className="space-y-2">
                    {employees?.map((employee: any) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.employeeCode} • {employee.department || 'No department'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEnrollingEmployee(employee.id)}
                          >
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Enroll Fingerprint
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(employee)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fingerprint Enrollment Modal */}
            {enrollingEmployee && (() => {
              const employee = employees?.find((e: any) => e.id === enrollingEmployee)
              if (!employee) return null

              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Enroll Fingerprint for {employee.firstName} {employee.lastName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FingerprintEnrollment
                      employeeId={employee.id}
                      employeeName={`${employee.firstName} ${employee.lastName}`}
                      employeeCode={employee.employeeCode}
                      onSuccess={() => {
                        setEnrollingEmployee(null)
                        queryClient.invalidateQueries({ queryKey: ['employees'] })
                      }}
                    />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEnrollingEmployee(null)}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        </main>
      </div>
    </div>
  )
}

