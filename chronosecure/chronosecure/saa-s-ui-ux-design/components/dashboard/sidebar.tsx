"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, LayoutDashboard, Users, ClockIcon, BarChart3, Settings, Calendar, MapPin, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  userProfile: any
}

export function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Employees",
      href: "/dashboard/employees",
      icon: Users,
    },
    {
      name: "Attendance",
      href: "/dashboard/attendance",
      icon: ClockIcon,
    },
    {
      name: "Time Off",
      href: "/dashboard/time-off",
      icon: Calendar,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      name: "Locations",
      href: "/dashboard/locations",
      icon: MapPin,
    },
    {
      name: "Kiosks",
      href: "/dashboard/kiosks",
      icon: Monitor,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">ChronoSecure</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {userProfile && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {userProfile.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userProfile.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{userProfile.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
