import { useQuery } from '@tanstack/react-query'
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
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations', companyId],
    queryFn: async () => {
      // Note: This endpoint needs to be implemented in the backend
      // For now, return empty array
      try {
        const response = await api.get('/locations', {
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Locations</h1>
                <p className="text-muted-foreground mt-1">Manage company locations and offices</p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Location Name</Label>
                      <Input id="name" placeholder="e.g., Main Office, Branch Office" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="Street address" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="City" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input id="zipCode" placeholder="Zip code" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" placeholder="e.g., America/New_York" />
                    </div>
                    <div className="flex gap-2">
                      <Button>Save Location</Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
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

