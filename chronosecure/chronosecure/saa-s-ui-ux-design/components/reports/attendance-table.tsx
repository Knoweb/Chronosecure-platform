"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface AttendanceRecord {
  id: string
  clock_in_time: string
  clock_out_time: string | null
  total_hours: number | null
  regular_hours: number | null
  overtime_hours: number | null
  status: string
  employees: {
    first_name: string
    last_name: string
    employee_code: string
    departments: {
      name: string
    } | null
  } | null
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  function formatTime(timeString: string | null) {
    if (!timeString) return "-"
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatDate(timeString: string) {
    return new Date(timeString).toLocaleDateString()
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Regular</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length > 0 ? (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {record.employees?.first_name} {record.employees?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{record.employees?.employee_code}</p>
                  </div>
                </TableCell>
                <TableCell>{record.employees?.departments?.name || "-"}</TableCell>
                <TableCell>{formatDate(record.clock_in_time)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatTime(record.clock_in_time)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatTime(record.clock_out_time)}
                  </div>
                </TableCell>
                <TableCell className="font-mono">{record.regular_hours?.toFixed(2) || "-"}h</TableCell>
                <TableCell className="font-mono">{record.overtime_hours?.toFixed(2) || "-"}h</TableCell>
                <TableCell className="font-semibold font-mono">{record.total_hours?.toFixed(2) || "-"}h</TableCell>
                <TableCell>
                  <Badge variant={record.status === "clocked_out" ? "default" : "secondary"} className="capitalize">
                    {record.status.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                No attendance records found for this period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
