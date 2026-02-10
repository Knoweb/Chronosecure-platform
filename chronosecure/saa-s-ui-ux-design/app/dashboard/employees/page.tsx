import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { EmployeesTable } from "@/components/employees/employees-table"
import Link from "next/link"

export default async function EmployeesPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) return null

  const { data: employees } = await supabase
    .from("employees")
    .select(
      `
      *,
      departments (name),
      shifts (name, color)
    `,
    )
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce and employee information</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employees/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-9" />
        </div>
      </div>

      <EmployeesTable employees={employees || []} />
    </div>
  )
}
