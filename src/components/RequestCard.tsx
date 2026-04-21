import Link from 'next/link'
import type { Request } from '@/types/database'
import RoleBadge from './RoleBadge'

interface RequestCardProps {
  request: Request
  linkPrefix: '/u' | '/b'
}

export default function RequestCard({ request, linkPrefix }: RequestCardProps) {
  return (
    <Link href={`${linkPrefix}/requests/${request.id}`}>
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-3 active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-2 mb-2">
          <RoleBadge type={request.type} />
          {request.is_urgent && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
              🔥 急募
            </span>
          )}
        </div>
        <h3 className="font-bold text-base text-gray-900 mb-1">{request.title}</h3>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span>📍 {request.area}</span>
          <span>🔧 {request.trade}</span>
          {request.daily_rate && <span>💰 {request.daily_rate.toLocaleString()}円/日</span>}
          {request.headcount && <span>👥 {request.headcount}名</span>}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {request.period_start} 〜 {request.period_end}
        </div>
        {request._count && (
          <div className="text-xs text-gray-400 mt-1">
            応募 {request._count.applications}件
          </div>
        )}
      </div>
    </Link>
  )
}
