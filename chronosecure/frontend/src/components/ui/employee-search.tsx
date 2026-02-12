import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Employee {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
}

interface EmployeeSearchProps {
    employees: Employee[]
    value: string
    onChange: (value: string) => void
}

export function EmployeeSearch({ employees = [], value, onChange }: EmployeeSearchProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Find selected employee object for display
    const selectedEmployee = employees.find((e) => e.id === value)

    // Filter employees based on search term
    const filteredEmployees = employees.filter((employee) => {
        const searchString = `${employee.firstName} ${employee.lastName} ${employee.employeeCode}`.toLowerCase()
        return searchString.includes(searchTerm.toLowerCase())
    })

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal border-input hover:bg-background hover:text-foreground"
                onClick={() => setOpen(!open)}
            >
                {selectedEmployee
                    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.employeeCode})`
                    : "All Employees"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 text-popover-foreground rounded-md border-2 shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-sm focus-visible:ring-1"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        <div
                            className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground mb-1",
                                value === '' && "bg-accent/50"
                            )}
                            onClick={() => {
                                onChange('')
                                setOpen(false)
                                setSearchTerm('')
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === '' ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <span className="font-medium">All Employees</span>
                        </div>
                        {filteredEmployees.length === 0 ? (
                            <div className="py-2 text-center text-sm text-muted-foreground">
                                No employee found.
                            </div>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                        value === employee.id && "bg-accent/50"
                                    )}
                                    onClick={() => {
                                        onChange(employee.id)
                                        setOpen(false)
                                        setSearchTerm('')
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === employee.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span>
                                        {employee.firstName} {employee.lastName} <span className="text-muted-foreground ml-1">({employee.employeeCode})</span>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
