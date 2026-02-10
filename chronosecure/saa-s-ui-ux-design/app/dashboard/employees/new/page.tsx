import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AddEmployeeForm } from "@/components/employees/add-employee-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewEmployeePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) return null

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", profile.organization_id)

  const { data: shifts } = await supabase.from("shifts").select("*").eq("organization_id", profile.organization_id)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Employee</h1>
          <p className="text-muted-foreground mt-1">Enter employee details and biometric information</p>
        </div>
      </div>

      <AddEmployeeForm organizationId={profile.organization_id} departments={departments || []} shifts={shifts || []} />
    </div>
  )
}
