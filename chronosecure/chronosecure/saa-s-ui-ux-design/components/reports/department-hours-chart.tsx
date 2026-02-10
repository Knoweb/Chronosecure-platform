"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AttendanceRecord {
  total_hours: number | null
  employees: {
    departments: {
      name: string
    } | null
  } | null
}

interface DepartmentHoursChartProps {
  records: AttendanceRecord[]
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export function DepartmentHoursChart({ records }: DepartmentHoursChartProps) {
  // Group hours by department
  const departmentData = records.reduce(
    (acc, record) => {
      const deptName = record.employees?.departments?.name || "Unassigned"
      if (!acc[deptName]) {
        acc[deptName] = 0
      }
      acc[deptName] += record.total_hours || 0
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(departmentData).map(([name, hours]) => ({
    name,
    value: Number(hours.toFixed(1)),
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">No department data available</div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
