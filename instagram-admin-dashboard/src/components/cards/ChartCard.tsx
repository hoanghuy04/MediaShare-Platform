interface ChartCardProps {
  title: string
  description?: string
  actionSlot?: React.ReactNode
  children: React.ReactNode
}

export const ChartCard = ({ title, description, actionSlot, children }: ChartCardProps) => {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        {actionSlot}
      </div>
      <div className="h-64">{children}</div>
    </section>
  )
}

