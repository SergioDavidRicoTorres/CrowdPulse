'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StackedBarChartData {
  label: string
  newGuests: number
  returningGuests: number
  [key: string]: string | number
}

interface StackedBarChartProps {
  data: StackedBarChartData[]
}

export default function StackedBarChart({ data }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
          interval={0}
        />
        <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-foreground)',
          }}
          labelStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
          formatter={(value: number, name: string, props: any) => {
            const total = props.payload.newGuests + props.payload.returningGuests
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return [`${value} (${percentage}%)`, name === 'newGuests' ? 'New' : 'Returning']
          }}
        />
        <Legend
          wrapperStyle={{ color: 'var(--color-foreground)' }}
          formatter={(value) => (value === 'newGuests' ? 'New' : 'Returning')}
        />
        <Bar
          dataKey="newGuests"
          stackId="a"
          fill="var(--color-primary)"
          radius={[0, 0, 0, 0]}
          name="New"
        />
        <Bar
          dataKey="returningGuests"
          stackId="a"
          fill="var(--color-muted-foreground)"
          radius={[4, 4, 0, 0]}
          name="Returning"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

