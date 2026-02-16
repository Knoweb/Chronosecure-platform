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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Edit company</span>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Company</DialogTitle>
                                                            <DialogDescription>
                                                                Manage settings for {company.name}
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="grid gap-4 py-4">

                                                            {/* Copy ID */}
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="id" className="text-right">ID</Label>
                                                                <div className="col-span-3 flex items-center gap-2">
                                                                    <Input id="id" value={company.id} readOnly className="h-8" />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => navigator.clipboard.writeText(company.id)}
                                                                    >
                                                                        Copy
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Subscription Plan */}
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label className="text-right">Plan</Label>
                                                                <div className="col-span-3">
                                                                    <Select
                                                                        defaultValue={company.subscriptionPlan || 'FREE'}
                                                                        onValueChange={(val) => updatePlanMutation.mutate({ id: company.id, plan: val })}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a plan" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="FREE">Free</SelectItem>
                                                                            <SelectItem value="STARTER">Starter</SelectItem>
                                                                            <SelectItem value="PRO">Pro</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>

                                                            {/* Status Toggle */}
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label className="text-right">Status</Label>
                                                                <div className="col-span-3 flex items-center gap-2">
                                                                    <Badge variant={company.active ? "default" : "destructive"}>
                                                                        {company.active ? 'Active' : 'Inactive'}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateStatusMutation.mutate({ id: company.id, isActive: !company.active })}
                                                                    >
                                                                        {company.active ? 'Deactivate' : 'Activate'}
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Danger Zone */}
                                                            <div className="border-t pt-4 mt-2">
                                                                <div className="flex flex-col gap-2">
                                                                    <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                                                                    <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                                                                    <Button
                                                                        variant="destructive"
                                                                        className="w-full"
                                                                        onClick={() => {
                                                                            if (confirm(`Are you sure you want to delete ${company.name}? This will remove all associated data and users.`)) {
                                                                                deleteCompanyMutation.mutate(company.id)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete Company
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button type="button">Done</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
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
