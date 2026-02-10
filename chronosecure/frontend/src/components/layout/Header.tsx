import { Button } from '@/components/ui/button'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

import { MobileNav } from './MobileNav'

export function Header() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  function handleSignOut() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 w-full">
      <MobileNav />
      <div className="flex-1" />

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
