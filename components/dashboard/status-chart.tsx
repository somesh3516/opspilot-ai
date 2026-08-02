"use client"

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type StatusData = {
  status: string
  count: number
}

type StatusChartProps = {
  data: StatusData[]
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
]

export function StatusChart({
  data,
}: StatusChartProps) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={110}
            paddingAngle={3}
            label={(props) => {
              const entry = props.payload as StatusData | undefined

              if (!entry) {
                return ""
              }

              return `${entry.status}: ${entry.count}`
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.status}
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