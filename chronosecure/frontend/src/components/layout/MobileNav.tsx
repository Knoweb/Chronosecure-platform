import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Clock, LayoutDashboard, Users, Clock as ClockIcon, BarChart3, Settings, Calendar, MapPin, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()
    const user = useAuthStore((state) => state.user)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Attendance', href: '/attendance', icon: ClockIcon },
        { name: 'Time Off', href: '/time-off', icon: Calendar },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Locations', href: '/locations', icon: MapPin },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Settings', href: '/settings', icon: Settings },
    ]

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                <Menu className="h-6 w-6" />
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative flex flex-col w-72 h-full bg-background dark:bg-slate-950 border-r shadow-2xl animate-in slide-in-from-left duration-300 ease-in-out">
                        <div className="p-4 border-b flex items-center justify-between">
                            <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <Clock className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg">ChronoSecure</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="-mr-2">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsOpen(false)}
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
                            <div className="p-4 border-t mt-auto">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
                </div>
            )}
        </div>
    )
}
