interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; style: string }> = {
  pending: { label: '申請中', style: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '成立', style: 'bg-green-100 text-green-700' },
  rejected: { label: '却下', style: 'bg-red-100 text-red-700' },
  open: { label: '募集中', style: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '審査中', style: 'bg-yellow-100 text-yellow-700' },
  matched: { label: '成立', style: 'bg-green-100 text-green-700' },
  closed: { label: '終了', style: 'bg-gray-100 text-gray-500' },
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, style: 'bg-gray-100 text-gray-500' }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${config.style} ${className}`}>
      {config.label}
    </span>
  )
}
