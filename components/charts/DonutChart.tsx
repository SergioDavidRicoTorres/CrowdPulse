'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface DonutChartData {
  name: string
  value: number
}

interface DonutChartProps {
  data: DonutChartData[]
  total: number
}

const COLORS = ['var(--color-primary)', 'var(--color-muted-foreground)']

export default function DonutChart({ data, total }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          innerRadius={50}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-foreground)',
          }}
          formatter={(value: number) => [`${value}`, '']}
        />
        <Legend
          wrapperStyle={{ color: 'var(--color-foreground)' }}
          formatter={(value) => {
            const item = data.find((d) => d.name === value)
            const percentage = item && total > 0 ? Math.round((item.value / total) * 100) : 0
            return `${value}: ${item?.value || 0} (${percentage}%)`
          }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '24px', fontWeight: 'bold', fill: 'var(--color-foreground)' }}
        >
          {total}
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}

