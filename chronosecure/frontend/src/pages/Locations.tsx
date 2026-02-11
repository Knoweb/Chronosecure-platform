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
import { MapPin, Plus, Building } from 'lucide-react'

export default function LocationsPage() {
  const companyId = useAuthStore((state) => state.companyId)
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zipCode: '',
    timezone: '',
  })
  const [error, setError] = useState('')

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', companyId],
    queryFn: async () => {
      const response = await api.get('/locations', {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data
    },
    enabled: !!companyId,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/locations', data, {
        headers: {
          'X-Company-Id': companyId,
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setShowAddForm(false)
      setFormData({
        name: '',
        address: '',
        city: '',
        zipCode: '',
        timezone: '',
      })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create location')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setError('Location name is required')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Locations</h1>
                <p className="text-muted-foreground mt-1">Manage company locations and offices</p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full md:w-auto border border-border shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {/* Add Location Form */}
            {showAddForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Main Office, Branch Office"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) =>
                            setFormData({ ...formData, zipCode: e.target.value })
                          }
                          placeholder="Zip code"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) =>
                          setFormData({ ...formData, timezone: e.target.value })
                        }
                        placeholder="e.g., America/New_York"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createMutation.isPending} className="border border-border shadow-sm">
                        {createMutation.isPending ? 'Saving...' : 'Save Location'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Locations List */}
            <Card>
              <CardHeader>
                <CardTitle>Company Locations</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading locations...</p>
                ) : !locations || locations.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No locations found.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Add Location" to create a new location.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {locations.map((location: any) => (
                      <div
                        key={location.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold">{location.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {location.address}
                              {location.city && `, ${location.city}`}
                              {location.zipCode && ` ${location.zipCode}`}
                            </p>
                            {location.timezone && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Timezone: {location.timezone}
                              </p>
                            )}
                          </div>
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

