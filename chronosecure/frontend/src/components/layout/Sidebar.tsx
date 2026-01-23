import { Link, useLocation } from 'react-router-dom'
import { Clock, LayoutDashboard, Users, Clock as ClockIcon, BarChart3, Settings, Calendar, MapPin, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const navigation = [
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
      icon: ClockIcon,
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
      name: 'Kiosks',
      href: '/kiosk',
      icon: Monitor,
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
    <div className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">ChronoSecure</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
                {user.lastName?.[0] || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
