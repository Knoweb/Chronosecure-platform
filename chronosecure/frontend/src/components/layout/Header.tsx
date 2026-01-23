import { Button } from '@/components/ui/button'
import { Bell, Search, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees, attendance..." className="pl-9 bg-background" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
