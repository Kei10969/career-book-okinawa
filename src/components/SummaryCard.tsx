interface SummaryCardProps {
  icon: string
  label: string
  value: number
  color?: string
}

export default function SummaryCard({ icon, label, value, color = 'text-gray-900' }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
      <span className="text-2xl mb-1">{icon}</span>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 font-bold mt-0.5">{label}</span>
    </div>
  )
}
