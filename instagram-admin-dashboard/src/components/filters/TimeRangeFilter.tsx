import type { TimeRange } from '../../types'

const options: { label: string; value: TimeRange }[] = [
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
]

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export const TimeRangeFilter = ({ value, onChange }: TimeRangeFilterProps) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
    {options.map((option) => (
      <button
        key={option.value}
        className={`rounded-full px-3 py-1 transition ${
          option.value === value ? 'bg-brand-gradient text-white shadow-card' : 'text-slate-500 hover:text-slate-800'
        }`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
)

