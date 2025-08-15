import React from 'react'
import { ShieldCheck, AlertTriangle, Ban } from 'lucide-react'
import { StatusCounts } from '../../../types/admin/overview'

interface OverviewFiltersProps {
  statusFilter: string | null
  setStatusFilter: (status: string | null) => void
  statusCounts: StatusCounts
}

export const OverviewFilters: React.FC<OverviewFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  statusCounts
}) => {
  return (
    <div className="mb-32 px-8 pt-8 pb-12 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
      <div className="stats-modern">
        <div className="p-1 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl border-2 border-green-300 shadow-md">
          <button
            onClick={() => setStatusFilter(statusFilter === 'eingetragen' ? null : 'eingetragen')}
            className={`btn ${statusFilter === 'eingetragen' ? 'btn-success' : 'btn-outline btn-success'} btn-lg normal-case gap-2 border-0 w-full h-full`}
          >
            <ShieldCheck className="w-5 h-5" />
            Urlaub eingereicht ({statusCounts.eingetragen})
          </button>
        </div>
        <div className="p-1 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl border-2 border-orange-300 shadow-md">
          <button
            onClick={() => setStatusFilter(statusFilter === 'teilweise' ? null : 'teilweise')}
            className={`btn ${statusFilter === 'teilweise' ? 'btn-warning' : 'btn-outline btn-warning'} btn-lg normal-case gap-2 border-0 w-full h-full`}
          >
            <AlertTriangle className="w-5 h-5" />
            Urlaub teilweise eingereicht ({statusCounts.teilweise})
          </button>
        </div>
        <div className="p-1 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl border-2 border-red-300 shadow-md">
          <button
            onClick={() => setStatusFilter(statusFilter === 'nicht-eingetragen' ? null : 'nicht-eingetragen')}
            className={`btn ${statusFilter === 'nicht-eingetragen' ? 'btn-error' : 'btn-outline btn-error'} btn-lg normal-case gap-2 border-0 w-full h-full`}
          >
            <Ban className="w-5 h-5" />
            Urlaub nicht eingereicht ({statusCounts.nichtEingetragen})
          </button>
        </div>
      </div>
      {statusFilter && (
        <div className="text-center mt-6">
          <button
            onClick={() => setStatusFilter(null)}
            className="btn btn-ghost btn-sm normal-case hover:bg-gray-200"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  )
}
