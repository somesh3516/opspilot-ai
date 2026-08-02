"use client"

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type RiskData = {
  risk: string
  count: number
}

type RiskChartProps = {
  data: RiskData[]
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
]

export function RiskChart({
  data,
}: RiskChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="risk"
            cx="50%"
            cy="50%"
            outerRadius={105}
            label={(props) => {
              const entry = props.payload as RiskData | undefined

              if (!entry) {
                return ""
              }

              return `${entry.risk}: ${entry.count}`
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.risk}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}