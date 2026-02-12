import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/axios'
import { Calendar as CalendarIcon, Check, X, Users, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
// Tabs removed as they were unused

type CalendarDayType = 'WORKING_DAY' | 'HOLIDAY' | 'WEEKEND'

type CalendarEntry = {
    id: string
    date: string
    type: CalendarDayType
    payMultiplier: number
    description?: string
}

type EmployeeCalendarEntry = {
    date: string
    dayType: CalendarDayType
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'FUTURE'
    checkInTime?: string
    checkOutTime?: string
    leaveReason?: string
    payMultiplier?: number
    companyDescription?: string
}

export default function CalendarPage() {
    const companyId = useAuthStore((state) => state.companyId)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [entries, setEntries] = useState<Record<string, CalendarEntry>>({})
    const [employeeEntries, setEmployeeEntries] = useState<Record<string, EmployeeCalendarEntry>>({})
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<EmployeeCalendarEntry | null>(null)
    const [selectedDateStr, setSelectedDateStr] = useState<string>('')
    // loading state removed as unused

    // View Mode
    const [viewMode, setViewMode] = useState<'COMPANY' | 'EMPLOYEE'>('COMPANY')
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

    // Multi-Select State (Company Mode)
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
    const [selectedDates, setSelectedDates] = useState<string[]>([])

    // Dialog Form State
    const [dayType, setDayType] = useState<CalendarDayType>('WORKING_DAY')
    const [payMultiplier, setPayMultiplier] = useState(1.0)
    const [description, setDescription] = useState('')

    // Fetch Employees
    const { data: employees } = useQuery({
        queryKey: ['employees', companyId],
        queryFn: async () => {
            const response = await api.get('/employees', {
                headers: { 'X-Company-Id': companyId }
            })
            return response.data
        },
        enabled: !!companyId,
    })

    useEffect(() => {
        if (viewMode === 'COMPANY') {
            fetchCompanyCalendar()
        } else if (viewMode === 'EMPLOYEE' && selectedEmployeeId) {
            fetchEmployeeCalendar()
        }
    }, [currentDate, companyId, viewMode, selectedEmployeeId])

    async function fetchCompanyCalendar() {
        if (!companyId) return
        try {
            const { startDate, endDate } = getMonthRange()

            const response = await api.get<CalendarEntry[]>('/calendar', {
                params: { startDate, endDate },
                headers: { 'X-Company-Id': companyId }
            })

            const newEntries: Record<string, CalendarEntry> = {}
            response.data.forEach(e => {
                newEntries[e.date] = e
            })
            setEntries(newEntries)
        } catch (error) {
            console.error('Error fetching calendar:', error)
        }
    }

    async function fetchEmployeeCalendar() {
        if (!companyId || !selectedEmployeeId) return
        try {
            const { startDate, endDate } = getMonthRange()

            const response = await api.get<EmployeeCalendarEntry[]>(`/calendar/employee/${selectedEmployeeId}`, {
                params: { startDate, endDate },
                headers: { 'X-Company-Id': companyId }
            })

            const newEntries: Record<string, EmployeeCalendarEntry> = {}
            response.data.forEach(e => {
                newEntries[e.date] = e
            })
            setEmployeeEntries(newEntries)
        } catch (error) {
            console.error('Error fetching employee calendar:', error)
        }
    }

    function getMonthRange() {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
        return { startDate, endDate }
    }

    function handleDateClick(day: number) {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        if (viewMode === 'EMPLOYEE') {
            // Open Read-Only Dialog
            setSelectedDateStr(dateStr)
            setSelectedEntry(employeeEntries[dateStr] || null)
            setViewDialogOpen(true)
            return
        }

        if (isMultiSelectMode) {
            if (selectedDates.includes(dateStr)) {
                setSelectedDates(prev => prev.filter(d => d !== dateStr))
            } else {
                setSelectedDates(prev => [...prev, dateStr])
            }
        } else {
            const entry = entries[dateStr]
            setSelectedDates([dateStr])
            setDayType(entry?.type || 'WORKING_DAY')
            setPayMultiplier(entry?.payMultiplier || 1.0)
            setDescription(entry?.description || '')
            setIsDialogOpen(true)
        }
    }

    function handleConfigureSelected() {
        if (selectedDates.length === 0) return
        const firstEntry = entries[selectedDates[0]]
        setDayType(firstEntry?.type || 'WORKING_DAY')
        setPayMultiplier(firstEntry?.payMultiplier || 1.0)
        setDescription('')
        setIsDialogOpen(true)
    }

    async function handleSave() {
        if (selectedDates.length === 0 || !companyId) return
        try {
            await api.post('/calendar', {
                dates: selectedDates,
                type: dayType,
                payMultiplier,
                description
            }, {
                headers: { 'X-Company-Id': companyId }
            })
            setIsDialogOpen(false)
            if (!isMultiSelectMode) setSelectedDates([])
            fetchCompanyCalendar()
        } catch (error) {
            console.error('Error updating calendar:', error)
        }
    }

    // Navigation
    function handlePrevMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
    function handleNextMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Grid Gen (Modified for Monday Start)
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    // Align to Monday start (0=Mon, ... 6=Sun)
    // Standard getDay(): 0=Sun, 1=Mon, 2=Tue...
    // Wanted: 0=Mon, 1=Tue... 6=Sun
    // Formula: (day + 6) % 7
    const startOffset = (firstDayOfMonth + 6) % 7

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const days = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    // -- RENDER HELPERS --

    const formatUtcTime = (dateStr: string, timeStr?: string) => {
        if (!timeStr) return '--:--'
        try {
            const cleanTime = timeStr.trim()
            const time = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime

            // Create date object treating input as UTC
            const utcDate = new Date(`${dateStr}T${time}Z`)

            if (isNaN(utcDate.getTime())) return timeStr

            // Format to local time
            const timeFormatted = utcDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

            // Check if date shifted (e.g. UTC 20:00 -> IST 01:30 Next Day)
            const inputDate = new Date(dateStr)
            const entryDate = new Date(utcDate)

            // Normalize dates to compare just the calendar day
            entryDate.setHours(0, 0, 0, 0)
            inputDate.setHours(0, 0, 0, 0)

            if (entryDate.getTime() > inputDate.getTime()) {
                return `${timeFormatted} (+1)`
            }
            if (entryDate.getTime() < inputDate.getTime()) {
                return `${timeFormatted} (-1)`
            }

            return timeFormatted
        } catch { return timeStr }
    }

    const getEmployeeCellStyle = (entry?: EmployeeCalendarEntry, isWeekend?: boolean) => {
        if (!entry) return isWeekend ? "bg-orange-100 dark:bg-orange-900/40" : "bg-card"

        switch (entry.status) {
            case 'PRESENT': return "bg-emerald-200 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700"
            case 'LEAVE': return "bg-amber-200 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700"
            case 'ABSENT': return "bg-red-200 dark:bg-red-900/60 border-red-300 dark:border-red-700"
            case 'HOLIDAY': return "bg-purple-200 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700"
            case 'WEEKEND': return "bg-orange-200 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700"
            case 'FUTURE': return "bg-slate-100 dark:bg-slate-800"
            default: return "bg-card"
        }
    }

    return (
        <div className="flex h-[100dvh] md:h-screen bg-background text-foreground overflow-auto md:overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col md:overflow-hidden">
                <Header />
                <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 md:overflow-hidden">
                    <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col space-y-4">

                        {/* Header / Config Bar */}
                        <div className="flex flex-col xl:flex-row justify-between items-center gap-4 shrink-0">
                            <div className='flex flex-col md:flex-row gap-4 items-center'>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <CalendarIcon className="h-6 w-6 text-primary" />
                                    {viewMode === 'COMPANY' ? 'Company Calendar' : 'Employee View'}
                                </h1>

                                {/* View Mode Toggle */}
                                <div className="flex bg-background border p-1 rounded-lg shadow-sm">
                                    <Button
                                        size="sm"
                                        variant={viewMode === 'COMPANY' ? "secondary" : "ghost"}
                                        onClick={() => setViewMode('COMPANY')}
                                        className={cn(viewMode === 'COMPANY' && "bg-primary/10 text-primary")}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={viewMode === 'EMPLOYEE' ? "secondary" : "ghost"}
                                        onClick={() => setViewMode('EMPLOYEE')}
                                        className={cn(viewMode === 'EMPLOYEE' && "bg-primary/10 text-primary")}
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Employee
                                    </Button>
                                </div>

                                {viewMode === 'EMPLOYEE' && (
                                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                        <SelectTrigger className="w-[200px] bg-background">
                                            <SelectValue placeholder="Select Employee" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950">
                                            {employees?.map((emp: any) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Company Controls */}
                                {viewMode === 'COMPANY' && (
                                    <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
                                        <Button
                                            variant={isMultiSelectMode ? "default" : "ghost"}
                                            size="sm"
                                            className={cn("h-8", isMultiSelectMode && "bg-blue-600 text-white shadow-md hover:bg-blue-700")}
                                            onClick={() => {
                                                setIsMultiSelectMode(!isMultiSelectMode)
                                                setSelectedDates([])
                                            }}
                                        >
                                            {isMultiSelectMode ? <Check className="h-3 w-3 mr-2" /> : <CalendarIcon className="h-3 w-3 mr-2" />}
                                            {isMultiSelectMode ? "Selection Active" : "Multi-Select"}
                                        </Button>

                                        {isMultiSelectMode && selectedDates.length > 0 && (
                                            <>
                                                <div className="h-4 w-[1px] bg-border mx-1" />
                                                <Button size="sm" onClick={handleConfigureSelected} className="h-8 gap-2">
                                                    Configure {selectedDates.length}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSelectedDates([])}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex gap-2 items-center bg-background border rounded-lg p-1 shadow-sm">
                                    <Button onClick={handlePrevMonth} variant="ghost" size="icon" className="h-8 w-8">◀</Button>
                                    <div className="w-28 text-center font-semibold text-sm">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </div>
                                    <Button onClick={handleNextMonth} variant="ghost" size="icon" className="h-8 w-8">▶</Button>
                                </div>
                            </div>
                        </div>

                        {/* Legend - Moved to Top - UPDATED COLORS */}
                        <div className="flex flex-wrap gap-4 text-xs font-medium bg-background border rounded-lg p-2 shadow-sm shrink-0 items-center justify-center">
                            <span className="text-muted-foreground mr-2 font-bold uppercase tracking-wider">Legend:</span>
                            {viewMode === 'COMPANY' ? (
                                <>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300 shadow-sm"></div>Working Day</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-purple-200 border border-purple-300 shadow-sm"></div>Holiday</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-200 border border-orange-300 shadow-sm"></div>Weekend</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-blue-600 border border-blue-600 shadow-sm"></div>Selected</div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300 shadow-sm"></div>Present</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-200 border border-red-300 shadow-sm"></div>Absent</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-amber-200 border border-amber-300 shadow-sm"></div>Leave</div>
                                    <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-purple-200 border border-purple-300 shadow-sm"></div>Holiday</div>
                                </>
                            )}
                        </div>

                        {/* Grid */}
                        <Card className="flex-1 flex flex-col border shadow-lg bg-background/50 backdrop-blur-sm md:overflow-hidden">
                            <CardContent className="flex-1 flex flex-col p-2 pb-20 md:p-4 md:pb-4 overflow-x-auto md:overflow-auto">
                                <div className="flex-1 flex flex-col w-full md:min-w-0">
                                    <div className="flex flex-col flex-1 h-full min-h-0">
                                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2 text-center shrink-0">
                                            {/* CHANGED TO MONDAY START */}
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                                <div key={d} className="font-bold text-muted-foreground uppercase text-[10px] md:text-[10px] tracking-wider">
                                                    {d}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-0.5 md:gap-2 min-h-0">
                                            {days.map((day, i) => {
                                                // Monday Start: Col 5=Sat, Col 6=Sun
                                                const isWeekend = (i % 7 === 5) || (i % 7 === 6)

                                                if (day === null) return <div key={i} className={cn("rounded-lg border border-transparent", isWeekend ? "bg-orange-100/50 dark:bg-orange-900/20" : "")} />

                                                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

                                                if (viewMode === 'EMPLOYEE') {
                                                    // EMPLOYEE VIEW
                                                    const empEntry = employeeEntries[dateStr]
                                                    let style = getEmployeeCellStyle(empEntry, isWeekend)
                                                    // Default Weekend Style in Employee View if no explicit entry (Use Stonger Color)
                                                    if (!empEntry && isWeekend) style = "bg-orange-200 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800"

                                                    return (
                                                        <div key={i} onClick={() => handleDateClick(day)} className={cn("rounded-lg p-1 md:p-2 border flex flex-col justify-start md:justify-between overflow-hidden relative group transition-colors cursor-pointer min-h-[85px] md:h-full", style)}>
                                                            <div className="flex justify-between items-start">
                                                                <span className={cn("font-bold text-[11px] md:text-sm h-5 w-5 md:h-6 md:w-6 flex items-center justify-center rounded-full bg-white/40 shadow-sm")}>{day}</span>
                                                                <div className="flex gap-0.5 md:gap-1 flex-wrap justify-end">
                                                                    {empEntry && empEntry.status === 'LEAVE' && <span className="text-[9px] md:text-[9px] font-bold bg-amber-400 text-amber-950 px-1 rounded shadow-sm leading-none">LV</span>}
                                                                    {empEntry && empEntry.status === 'HOLIDAY' && <span className="text-[9px] md:text-[9px] font-bold bg-purple-400 text-purple-950 px-1 rounded shadow-sm leading-none">HOL</span>}
                                                                    {((!empEntry && isWeekend) || (empEntry?.status === 'WEEKEND')) && <span className="text-[9px] md:text-[9px] font-bold bg-orange-300 text-orange-950 px-1 rounded shadow-sm leading-none">WK</span>}
                                                                </div>
                                                            </div>

                                                            {empEntry && (
                                                                <div className="block space-y-1 md:space-y-0.5 mt-1 font-medium leading-tight">
                                                                    {empEntry.status === 'PRESENT' && (
                                                                        <>
                                                                            <div className="leading-none">
                                                                                <span className="text-[9px] md:text-xs text-emerald-800 dark:text-emerald-200 block md:inline">IN</span>
                                                                                <span className="text-[11px] md:text-xs font-bold text-emerald-950 dark:text-emerald-50 block md:inline md:ml-1">{formatUtcTime(dateStr, empEntry.checkInTime)?.split(' ')[0]}</span>
                                                                            </div>
                                                                            <div className="leading-none">
                                                                                <span className="text-[9px] md:text-xs text-emerald-800 dark:text-emerald-200 block md:inline">OUT</span>
                                                                                <span className="text-[11px] md:text-xs font-bold text-emerald-950 dark:text-emerald-50 block md:inline md:ml-1">{formatUtcTime(dateStr, empEntry.checkOutTime)?.split(' ')[0]}</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {empEntry.status === 'ABSENT' && <div className="text-[10px] md:text-xs text-red-700 font-bold leading-none">ABSENT</div>}
                                                                    {empEntry.status === 'LEAVE' && <div className="text-[10px] md:text-xs text-amber-900 dark:text-amber-100 truncate font-semibold leading-none" title={empEntry.leaveReason}>{empEntry.leaveReason}</div>}
                                                                    {empEntry.companyDescription && <div className="text-[10px] md:text-xs text-purple-900 dark:text-purple-100 truncate font-semibold leading-none">{empEntry.companyDescription}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                } else {
                                                    // COMPANY VIEW
                                                    const entry = entries[dateStr]
                                                    const isSelected = selectedDates.includes(dateStr)
                                                    let cardStyle = "bg-card hover:border-primary/50 hover:shadow-md"

                                                    if (isSelected) {
                                                        cardStyle = "bg-blue-600 text-white shadow-lg scale-95 ring-2 ring-blue-600 ring-offset-1 z-10"
                                                    } else if (entry) {
                                                        // STRONGER COLORS
                                                        if (entry.type === 'HOLIDAY') cardStyle = "bg-purple-200 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700 hover:bg-purple-300"
                                                        else if (entry.type === 'WEEKEND') cardStyle = "bg-orange-200 dark:bg-orange-900/60 border-orange-300 dark:border-orange-700 hover:bg-orange-300"
                                                        else if (entry.type === 'WORKING_DAY') cardStyle = "bg-emerald-200 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-300"
                                                    } else if (isWeekend) {
                                                        // DEFAULT WEEKEND COLOR (FORCED & STRONGER)
                                                        cardStyle = "bg-orange-200/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 hover:bg-orange-300"
                                                    }

                                                    return (
                                                        <div key={i} onClick={() => handleDateClick(day)} className={cn("rounded-lg p-1 md:p-2 cursor-pointer transition-all border flex flex-col justify-start md:justify-between relative select-none aspect-square md:aspect-auto md:h-full", cardStyle)}>
                                                            <div className="flex justify-between items-start">
                                                                <span className={cn("font-bold text-[11px] md:text-sm h-5 w-5 md:h-6 md:w-6 flex items-center justify-center rounded-full transition-colors", isSelected ? "bg-white/20" : "bg-white/30 shadow-sm")}>{day}</span>
                                                                {entry && entry.payMultiplier !== 1 && (
                                                                    <span className={cn("inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full border", isSelected ? "bg-white/20 border-white/30" : "bg-white/50 border-white/20")}>
                                                                        {entry.payMultiplier}x
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {entry ? (
                                                                <div className="block space-y-0.5 mt-1">
                                                                    <div className={cn("text-[9px] font-bold uppercase tracking-wide w-full text-center whitespace-normal leading-tight", isSelected ? "text-white" : "text-foreground/70")}>
                                                                        {entry.type.replace('_', ' ')}
                                                                    </div>
                                                                    {entry.description && <div className="text-[9px] truncate opacity-90 font-medium">{entry.description}</div>}
                                                                </div>
                                                            ) : isWeekend && (
                                                                <div className="block space-y-0.5 mt-1 opacity-70">
                                                                    <div className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] w-fit bg-orange-300/50 text-orange-900 border border-orange-400/30">
                                                                        <span className="md:hidden">WKND</span>
                                                                        <span className="hidden md:inline">WEEKEND</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                }
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Dialog (Same as before) */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="bg-white dark:bg-zinc-950 sm:max-w-sm">
                            <DialogHeader><DialogTitle>Configure Dates</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={dayType} onValueChange={(val: any) => {
                                        setDayType(val)
                                        if (val === 'HOLIDAY') setPayMultiplier(1.5); else setPayMultiplier(1.0)
                                    }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="WORKING_DAY">Working Day</SelectItem>
                                            <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                            <SelectItem value="WEEKEND">Weekend</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Multiplier</Label>
                                    <Input type="number" step="0.1" value={payMultiplier} onChange={(e) => setPayMultiplier(parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                                <Button onClick={handleSave} className="w-full">Save</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Read-Only Details Dialog */}
                    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                        <DialogContent className="bg-white dark:bg-zinc-950 sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>{new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                {!selectedEntry ? (
                                    <p className="text-muted-foreground">No specific status recorded for this day.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                            <span className="font-medium text-sm">Status</span>
                                            <span className={cn("px-2 py-1 rounded text-xs font-bold",
                                                selectedEntry.status === 'PRESENT' && "bg-emerald-100 text-emerald-800",
                                                selectedEntry.status === 'ABSENT' && "bg-red-100 text-red-800",
                                                selectedEntry.status === 'LEAVE' && "bg-amber-100 text-amber-800",
                                                selectedEntry.status === 'HOLIDAY' && "bg-purple-100 text-purple-800",
                                            )}>{selectedEntry.status}</span>
                                        </div>

                                        {selectedEntry.status === 'PRESENT' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground mb-1">Check In</div>
                                                    <div className="font-bold text-lg text-emerald-700">{formatUtcTime(selectedDateStr, selectedEntry.checkInTime)}</div>
                                                </div>
                                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground mb-1">Check Out</div>
                                                    <div className="font-bold text-lg text-emerald-700">{formatUtcTime(selectedDateStr, selectedEntry.checkOutTime)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedEntry.leaveReason && (
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                <div className="text-xs text-amber-900 font-semibold mb-1">Leave Reason</div>
                                                <div className="text-sm text-amber-800">{selectedEntry.leaveReason}</div>
                                            </div>
                                        )}

                                        {selectedEntry.companyDescription && (
                                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="text-xs text-purple-900 font-semibold mb-1">Event</div>
                                                <div className="text-sm text-purple-800">{selectedEntry.companyDescription}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button variant="outline" className="w-full" onClick={() => setViewDialogOpen(false)}>Close</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                </main>
            </div>
        </div>
    )
}
