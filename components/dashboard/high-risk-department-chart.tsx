"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type HighRiskDepartmentData = {
  department: string
  high_risk_count: number
}

type HighRiskDepartmentChartProps = {
  data: HighRiskDepartmentData[]
}

export function HighRiskDepartmentChart({
  data,
}: HighRiskDepartmentChartProps) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            bottom: 10,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            type="number"
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="department"
            width={110}
          />

          <Tooltip
            formatter={(value) => [
              Number(value),
              "High-Risk Invoices",
            ]}
          />

          <Bar
            dataKey="high_risk_count"
            radius={[0, 6, 6, 0]}
            fill="var(--chart-3)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}