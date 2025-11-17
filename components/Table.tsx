import { ReactNode } from 'react'

interface TableProps {
  headers: string[]
  children: ReactNode
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  children: ReactNode
}

export function TableRow({ children }: TableRowProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: ReactNode
}

export function TableCell({ children }: TableCellProps) {
  return <td className="px-4 py-3 text-sm text-foreground">{children}</td>
}

