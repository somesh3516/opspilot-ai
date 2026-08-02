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

type VendorChartProps = {
  data: {
    vendor: string
    total_spending: number
    invoice_count: number
  }[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function VendorChart({
  data,
}: VendorChartProps) {
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
            left: 25,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
          />

          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            fontSize={12}
          />

          <YAxis
            type="category"
            dataKey="vendor"
            width={145}
            fontSize={11}
          />

          <Tooltip
            formatter={(value) => [
              formatCurrency(Number(value)),
              "Total Spending",
            ]}
          />

          <Bar
            dataKey="total_spending"
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}