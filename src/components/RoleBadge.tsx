interface RoleBadgeProps {
  type: 'support' | 'subcontract' | string
  className?: string
}

export default function RoleBadge({ type, className = '' }: RoleBadgeProps) {
  const styles = type === 'support'
    ? 'bg-orange-100 text-orange-700'
    : 'bg-blue-100 text-blue-700'
  const label = type === 'support' ? '応援' : '下請け'

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${styles} ${className}`}>
      {label}
    </span>
  )
}
