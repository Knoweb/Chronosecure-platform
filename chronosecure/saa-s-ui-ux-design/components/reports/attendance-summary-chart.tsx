"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface AttendanceRecord {
  clock_in_time: string
  total_hours: number | null
  regular_hours: number | null
  overtime_hours: number | null
}

interface AttendanceSummaryChartProps {
  records: AttendanceRecord[]
}

export function AttendanceSummaryChart({ records }: AttendanceSummaryChartProps) {
  // Group records by date
  const dailyData = records.reduce(
    (acc, record) => {
      const date = new Date(record.clock_in_time).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = {
          date,
          regularHours: 0,
          overtimeHours: 0,
          totalRecords: 0,
        }
      }
      acc[date].regularHours += record.regular_hours || 0
      acc[date].overtimeHours += record.overtime_hours || 0
      acc[date].totalRecords += 1
      return acc
    },
    {} as Record<
      string,
      {
        date: string
        regularHours: number
        overtimeHours: number
        totalRecords: number
      }
    >,
  )

  const chartData = Object.values(dailyData).slice(-14) // Last 14 days

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">No attendance data available</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="regularHours" name="Regular Hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="overtimeHours" name="Overtime Hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
