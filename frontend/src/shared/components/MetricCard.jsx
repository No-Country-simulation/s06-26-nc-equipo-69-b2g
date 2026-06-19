export default function MetricCard({ label, value, sublabel, trend, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-3 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <p className="mt-0.5 text-[11px] font-medium text-green-600">{trend}</p>
      )}
      {sublabel && (
        <p className="mt-0.5 text-[11px] font-mono text-gray-400">{sublabel}</p>
      )}
    </div>
  )
}
