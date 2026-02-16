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
import { Building2, CheckCircle, XCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SuperAdminDashboard() {
    const queryClient = useQueryClient()

    // Fetch all companies
    const { data: companies, isLoading } = useQuery({
        queryKey: ['super-admin-companies'],
        queryFn: async () => {
            const response = await api.get('/super-admin/companies')
            return response.data
        },
    })

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.patch(`/super-admin/companies/${id}/status`, null, {
                params: { isActive }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] })
            alert('Company status updated')
        },
        onError: () => alert('Failed to update status')
    })

    // Update Plan Mutation
    const updatePlanMutation = useMutation({
        mutationFn: async ({ id, plan }: { id: string; plan: string }) => {
            await api.patch(`/super-admin/companies/${id}/plan`, null, {
                params: { plan }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] })
            alert('Subscription plan updated')
        },
        onError: () => alert('Failed to update plan')
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

    const activeCompanies = companies?.filter((c: any) => c.isActive).length || 0
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
                                        <TableHead>Subdomain</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies?.map((company: any) => (
                                        <TableRow key={company.id}>
                                            <TableCell className="font-medium">{company.name}</TableCell>
                                            <TableCell>{company.subdomain}.attendwatch.com</TableCell>
                                            <TableCell>
                                                <Badge variant={company.isActive ? "default" : "destructive"}>
                                                    {company.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {company.subscriptionPlan || 'FREE'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="lucide lucide-more-horizontal h-4 w-4"
                                                            >
                                                                <circle cx="12" cy="12" r="1" />
                                                                <circle cx="19" cy="12" r="1" />
                                                                <circle cx="5" cy="12" r="1" />
                                                            </svg>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(company.id)}>
                                                            Copy ID
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: company.id, isActive: true })}>
                                                            Mark Active
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: company.id, isActive: false })}>
                                                            Mark Inactive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Subscription</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => updatePlanMutation.mutate({ id: company.id, plan: 'FREE' })}>
                                                            Set to FREE
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updatePlanMutation.mutate({ id: company.id, plan: 'STARTER' })}>
                                                            Set to STARTER
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updatePlanMutation.mutate({ id: company.id, plan: 'PRO' })}>
                                                            Set to PRO
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel className="text-red-500">Danger Zone</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            className="text-red-500 focus:text-red-500 focus:bg-red-50"
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to PERMANENTLY delete this company? This action cannot be undone.')) {
                                                                    deleteCompanyMutation.mutate(company.id)
                                                                }
                                                            }}
                                                        >
                                                            Delete Company
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
