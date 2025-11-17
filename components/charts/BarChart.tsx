'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'

interface BarChartData {
  label: string
  value: number
  [key: string]: string | number
}

interface BarChartProps {
  data: BarChartData[]
  dataKey: string
  xAxisLabel?: string
  yAxisLabel?: string
  tooltipLabel?: string
  color?: string
  showValueLabels?: boolean
}

export default function BarChart({
  data,
  dataKey,
  xAxisLabel,
  yAxisLabel,
  tooltipLabel,
  color = 'var(--color-primary)',
  showValueLabels = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: showValueLabels ? 20 : 5, right: 30, left: 20, bottom: 60 }}>
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
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
          {showValueLabels && (
            <LabelList
              dataKey={dataKey}
              position="top"
              style={{ fill: 'var(--color-foreground)', fontSize: 12 }}
            />
          )}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

