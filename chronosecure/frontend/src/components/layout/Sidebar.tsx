import { Link, useLocation } from 'react-router-dom'
import { Clock, LayoutDashboard, Users, CheckCircle2, BarChart3, Settings, Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const navigation = [
    // ... same nav items ... 
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: Users,
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Clock,
    },
    {
      name: 'Time Off',
      href: '/time-off',
      icon: Calendar,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
    {
      name: 'Locations',
      href: '/locations',
      icon: MapPin,
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 border-r bg-card flex-col hidden md:flex shrink-0 h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative bg-slate-900 p-2 rounded-lg shadow-md">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
            AttendWatch
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-slate-900 text-white font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate font-medium">
                {user.companyName || user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
