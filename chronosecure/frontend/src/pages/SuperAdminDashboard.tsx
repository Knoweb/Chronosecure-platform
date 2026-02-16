import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/axios'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Building2, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react'
import { CompanyEditDialog } from '@/components/super-admin/CompanyEditDialog'

export default function SuperAdminDashboard() {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Fetch all companies
    const { data: companies, isLoading } = useQuery({
        queryKey: ['super-admin-companies'],
        queryFn: async () => {
            const response = await api.get('/super-admin/companies')
            return response.data
        },
    })

    // Delete Company Mutation
    const deleteCompanyMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/super-admin/companies/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] })
            alert('Company deleted successfully')
        },
        onError: () => alert('Failed to delete company')
    })

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    const activeCompanies = companies?.filter((c: any) => c.active).length || 0
    const totalCompanies = companies?.length || 0

    return (
        <div className="flex min-h-screen bg-background">
            {/* 
         TODO: We might need a SuperAdminSidebar later. 
         For now, reusing Sidebar but ideally SuperAdmin should contain different links.
         You can create a `SuperAdminSidebar` component if needed.
      */}
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-4 md:p-6 space-y-6">

                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage all registered clients and subscriptions.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalCompanies}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeCompanies}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inactive/Churned</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalCompanies - activeCompanies}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Clients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company Name</TableHead>

                                        <TableHead>Status</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies?.map((company: any) => (
                                        <TableRow key={company.id}>
                                            <TableCell className="font-medium">{company.name}</TableCell>

                                            <TableCell>
                                                <Badge variant={company.active ? "default" : "destructive"}>
                                                    {company.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {company.subscriptionPlan || 'FREE'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${company.name}?`)) {
                                                            deleteCompanyMutation.mutate(company.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete company</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setSelectedCompanyId(company.id)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit company</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>

            <CompanyEditDialog
                companyId={selectedCompanyId}
                isOpen={!!selectedCompanyId}
                onClose={() => setSelectedCompanyId(null)}
            />
        </div>
    )
}

