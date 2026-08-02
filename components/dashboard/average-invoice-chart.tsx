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

type AverageInvoiceData = {
  department: string
  average_amount: number
}

type AverageInvoiceChartProps = {
  data: AverageInvoiceData[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function AverageInvoiceChart({
  data,
}: AverageInvoiceChartProps) {
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
            tickFormatter={(value) =>
              formatCurrency(Number(value))
            }
          />

          <YAxis
            type="category"
            dataKey="department"
            width={110}
          />

          <Tooltip
            formatter={(value) => [
              formatCurrency(Number(value)),
              "Average Invoice",
            ]}
          />

          <Bar
            dataKey="average_amount"
            radius={[0, 6, 6, 0]}
            fill="var(--chart-2)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}