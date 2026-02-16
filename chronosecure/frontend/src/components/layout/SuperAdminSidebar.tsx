import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function SuperAdminSidebar() {
    const location = useLocation()
    const user = useAuthStore((state) => state.user)

    const navigation = [
        {
            name: 'All Clients',
            href: '/super-admin',
            icon: LayoutDashboard,
        },
        // Add more Super Admin links here later (e.g. System Settings, Logs)
    ]

    return (
        <div className="w-64 border-r bg-card flex-col hidden md:flex shrink-0 h-screen sticky top-0">
            <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="relative bg-slate-900 p-2 rounded-lg shadow-md">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <span className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        AttendWatch
                        <span className="block text-xs text-foreground font-mono font-medium tracking-normal mt-1 text-slate-500">SUPER ADMIN</span>
                    </span>
                </div>
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
                <div className="p-4 border-t bg-slate-50/50">
                    <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                            <AvatarFallback className="bg-slate-900 text-white font-semibold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-900">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {user.role?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
