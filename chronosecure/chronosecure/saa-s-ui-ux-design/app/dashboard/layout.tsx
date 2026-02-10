import type React from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userProfile={profile} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
