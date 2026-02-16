import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Download, Loader2 } from 'lucide-react'

interface AdminUser {
    id: string
    email: string
    firstName: string
    lastName: string
}

interface CompanyDetails {
    id: string
    name: string
    subdomain: string
    billingAddress: string
    active: boolean
    subscriptionPlan: string
    createdAt: string
    admins: AdminUser[]
}

interface CompanyEditDialogProps {
    companyId: string | null
    isOpen: boolean
    onClose: () => void
}

export function CompanyEditDialog({ companyId, isOpen, onClose }: CompanyEditDialogProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState("details")

    // Fetch Company Details
    const { data: company, isLoading } = useQuery({
        queryKey: ['company-details', companyId],
        queryFn: async () => {
            if (!companyId) return null
            const response = await api.get(`/super-admin/companies/${companyId}`)
            return response.data as CompanyDetails
        },
        enabled: !!companyId && isOpen
    })

    // Update Plan Mutation
    const updatePlanMutation = useMutation({
        mutationFn: async (plan: string) => {
            if (!companyId) return
            await api.patch(`/super-admin/companies/${companyId}/plan`, null, {
                params: { plan }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-details', companyId] })
            queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] })
            alert('Plan updated successfully')
        }
    })

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async (isActive: boolean) => {
            if (!companyId) return
            await api.patch(`/super-admin/companies/${companyId}/status`, null, {
                params: { isActive }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-details', companyId] })
            queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] })
            alert('Status updated successfully')
        }
    })

    // Download Report Handler
    const handleDownloadReport = async () => {
        try {
            const response = await api.get(`/super-admin/companies/${companyId}/cost-report`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cost-report-${company?.name}-${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Failed to download report', error)
            alert('Failed to download report')
        }
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Company: {company?.name}</DialogTitle>
                    <DialogDescription>
                        View and edit company details, manage admins, and reports.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : company ? (
                    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="admins">Admins</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>

                        {/* DETAILS TAB */}
                        <TabsContent value="details" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input value={company.name} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subdomain</Label>
                                    <Input value={company.subdomain + ".attendwatch.com"} readOnly className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company ID</Label>
                                    <div className="flex gap-2">
                                        <Input value={company.id} readOnly className="font-mono text-xs" />
                                        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(company.id)}>Copy</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Created At</Label>
                                    <Input value={new Date(company.createdAt).toLocaleDateString()} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscription Plan</Label>
                                    <Select
                                        defaultValue={company.subscriptionPlan || "FREE"}
                                        onValueChange={(val) => updatePlanMutation.mutate(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FREE">Free</SelectItem>
                                            <SelectItem value="STARTER">Starter</SelectItem>
                                            <SelectItem value="PRO">Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-4 pt-2">
                                        <Badge variant={company.active ? "default" : "destructive"}>
                                            {company.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button
                                            variant={company.active ? "destructive" : "default"}
                                            size="sm"
                                            onClick={() => updateStatusMutation.mutate(!company.active)}
                                        >
                                            {company.active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Billing Address</Label>
                                    <Input value={company.billingAddress || ""} placeholder="No address set" readOnly />
                                </div>
                            </div>
                        </TabsContent>

                        {/* ADMINS TAB */}
                        <TabsContent value="admins" className="space-y-4 py-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {company.admins.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                    No admins found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            company.admins.map((admin) => (
                                                <TableRow key={admin.id}>
                                                    <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                                                    <TableCell>{admin.email}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(admin.email)}>Copy Email</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* REPORTS TAB */}
                        <TabsContent value="reports" className="space-y-4 py-4">
                            <div className="rounded-lg border p-4 bg-muted/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Cost & Usage Report</h3>
                                        <p className="text-sm text-muted-foreground">Download monthly usage and estimated cost report.</p>
                                    </div>
                                    <Button onClick={handleDownloadReport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Report
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="p-8 text-center text-red-500">Failed to load company details</div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
