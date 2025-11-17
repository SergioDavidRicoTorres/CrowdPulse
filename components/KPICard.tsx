import Card from './Card'

interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
}

export default function KPICard({ label, value, subtitle }: KPICardProps) {
  return (
    <Card>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl md:text-4xl font-bold text-foreground">{value.toLocaleString()}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </Card>
  )
}

