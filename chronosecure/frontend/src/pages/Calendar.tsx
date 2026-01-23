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
import { Calendar as CalendarIcon, Save, Check, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type CalendarDayType = 'WORKING_DAY' | 'HOLIDAY' | 'WEEKEND'

type CalendarEntry = {
    id: string
    date: string
    type: CalendarDayType
    payMultiplier: number
    description?: string
}

export default function CalendarPage() {
    const companyId = useAuthStore((state) => state.companyId)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [entries, setEntries] = useState<Record<string, CalendarEntry>>({})
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Multi-Select State
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
    const [selectedDates, setSelectedDates] = useState<string[]>([])

    // Dialog Form State
    const [dayType, setDayType] = useState<CalendarDayType>('WORKING_DAY')
    const [payMultiplier, setPayMultiplier] = useState(1.0)
    const [description, setDescription] = useState('')

    useEffect(() => {
        fetchCalendar()
    }, [currentDate, companyId])

    async function fetchCalendar() {
        if (!companyId) return
        setLoading(true)
        try {
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth() + 1
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`
            const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

            const response = await api.get<CalendarEntry[]>('/calendar', {
                params: { startDate, endDate }
            })

            const newEntries: Record<string, CalendarEntry> = {}
            response.data.forEach(e => {
                newEntries[e.date] = e
            })
            setEntries(newEntries)
        } catch (error) {
            console.error('Error fetching calendar:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleDateClick(day: number) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        const dateStr = date.toISOString().split('T')[0]

        if (isMultiSelectMode) {
            if (selectedDates.includes(dateStr)) {
                setSelectedDates(prev => prev.filter(d => d !== dateStr))
            } else {
                setSelectedDates(prev => [...prev, dateStr])
            }
        } else {
            // Single select: Open dialog immediately
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
        // Default to first selected entry's type/multiplier if available, or default
        const firstEntry = entries[selectedDates[0]]
        setDayType(firstEntry?.type || 'WORKING_DAY')
        setPayMultiplier(firstEntry?.payMultiplier || 1.0)
        setDescription('') // Clear description for bulk to prevent confusing data
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
            })

            setIsDialogOpen(false)
            if (!isMultiSelectMode) setSelectedDates([]) // Clear selection if single mode
            fetchCalendar() // Refresh data
        } catch (error) {
            console.error('Error updating calendar:', error)
        }
    }

    function handlePrevMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    function handleNextMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Generate Calendar Grid
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                {/* Main Content: Fixed height, no scroll */}
                <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                    <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col space-y-4">

                        {/* Calendar Header Control */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                                Company Calendar
                            </h1>

                            <div className="flex items-center gap-4">
                                {/* Controls */}
                                <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
                                    <Button
                                        variant={isMultiSelectMode ? "default" : "ghost"}
                                        size="sm"
                                        className={cn("h-8", isMultiSelectMode && "bg-primary text-primary-foreground shadow-md hover:bg-primary/90")}
                                        onClick={() => {
                                            setIsMultiSelectMode(!isMultiSelectMode)
                                            setSelectedDates([])
                                        }}
                                    >
                                        {isMultiSelectMode ? <Check className="h-3 w-3 mr-2" /> : <CalendarIcon className="h-3 w-3 mr-2" />}
                                        {isMultiSelectMode ? "Selection Mode" : "Select"}
                                    </Button>

                                    {isMultiSelectMode && selectedDates.length > 0 && (
                                        <>
                                            <div className="h-4 w-[1px] bg-border mx-1" />
                                            <Button size="sm" onClick={handleConfigureSelected} className="h-8 gap-2 animate-in fade-in zoom-in duration-200">
                                                Configure {selectedDates.length}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setSelectedDates([])}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>

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

                        {/* Calendar Grid Container */}
                        <Card className="flex-1 flex flex-col border shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="flex-1 flex flex-col p-4">
                                {/* Day Names Header */}
                                <div className="grid grid-cols-7 gap-2 mb-2 text-center shrink-0">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">{d}</div>
                                    ))}
                                </div>

                                {/* Days Grid - Flex-1 to fill remaining space */}
                                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2 min-h-0">
                                    {days.map((day, i) => {
                                        const isWeekend = (i % 7 === 0) || (i % 7 === 6)

                                        if (day === null) {
                                            return <div key={i} className={cn("rounded-lg border border-transparent", isWeekend ? "bg-slate-50/30 dark:bg-slate-900/30" : "")} />
                                        }

                                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                        const entry = entries[dateStr]
                                        const isSelected = selectedDates.includes(dateStr)

                                        // Determine Styles
                                        let cardStyle = "bg-card hover:border-primary/50 hover:shadow-md"

                                        if (isSelected) {
                                            cardStyle = "bg-blue-600 text-white shadow-lg scale-95 ring-2 ring-blue-600 ring-offset-1 z-10"
                                        } else if (entry) {
                                            if (entry.type === 'HOLIDAY') cardStyle = "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                                            else if (entry.type === 'WEEKEND') cardStyle = "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                                            else if (entry.type === 'WORKING_DAY') cardStyle = "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40"
                                        } else if (isWeekend) {
                                            cardStyle = "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900"
                                        }

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => handleDateClick(day)}
                                                className={cn(
                                                    "relative rounded-lg p-2 cursor-pointer transition-all duration-200 border flex flex-col justify-between group select-none min-h-0 overflow-hidden",
                                                    cardStyle
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={cn(
                                                        "font-bold text-sm h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                                                        isSelected ? "bg-white/20" : "text-foreground group-hover:bg-black/5 dark:group-hover:bg-white/10"
                                                    )}>{day}</span>

                                                    {entry && entry.payMultiplier !== 1 && !isSelected && (
                                                        <span className="text-[9px] font-bold bg-background/80 px-1.5 py-0.5 rounded-full shadow-sm border">
                                                            {entry.payMultiplier}x
                                                        </span>
                                                    )}
                                                </div>

                                                {entry && (
                                                    <div className="space-y-0.5 mt-1">
                                                        <div className={cn(
                                                            "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] w-fit truncate max-w-full",
                                                            isSelected ? "bg-white/20 text-white" :
                                                                entry.type === 'HOLIDAY' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                                                    entry.type === 'WEEKEND' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" :
                                                                        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                        )}>
                                                            {entry.type.replace('_', ' ')}
                                                        </div>
                                                        {entry.description && (
                                                            <div className="hidden sm:block text-[9px] truncate text-muted-foreground/80 leading-none">
                                                                {entry.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Hover Overlay */}
                                                {!entry && isMultiSelectMode && !isSelected && (
                                                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-primary/5 transition-opacity">
                                                        <div className="bg-background/90 px-2 py-1 rounded text-[10px] font-medium text-primary shadow-sm ring-1 ring-border">
                                                            Select
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Configuration Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="bg-white dark:bg-zinc-950 sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedDates.length > 1
                                        ? `Configure ${selectedDates.length} Days`
                                        : `Configure Date: ${selectedDates[0]}`}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Day Type</Label>
                                    <Select
                                        value={dayType}
                                        onValueChange={(val) => {
                                            setDayType(val as CalendarDayType)
                                            // Auto-set multiplier defaults
                                            if (val === 'HOLIDAY') setPayMultiplier(1.5)
                                            if (val === 'WORKING_DAY') setPayMultiplier(1.0)
                                            if (val === 'WEEKEND') setPayMultiplier(1.0)
                                        }}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950">
                                            <SelectItem value="WORKING_DAY">Working Day</SelectItem>
                                            <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                            <SelectItem value="WEEKEND">Weekend</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Pay Multiplier</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1.0, 1.5, 2.0, 2.5].map(v => (
                                            <div
                                                key={v}
                                                onClick={() => setPayMultiplier(v)}
                                                className={cn(
                                                    "cursor-pointer text-center text-sm py-1 border rounded hover:bg-accent",
                                                    payMultiplier === v ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                                                )}
                                            >
                                                {v}x
                                            </div>
                                        ))}
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        className="mt-2"
                                        value={payMultiplier}
                                        onChange={(e) => setPayMultiplier(parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="e.g. Christmas"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <Button onClick={handleSave} className="w-full">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                </main>
            </div>
        </div>
    )
}
