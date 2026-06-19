const variants = {
  red: 'bg-red-100 text-red-700 border-red-200',
  orange: 'bg-amber-100 text-amber-700 border-amber-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
}

const dotColors = {
  red: 'bg-red-500',
  orange: 'bg-amber-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
}

export default function StatusBadge({ label, variant = 'gray', dot = true, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {label}
    </span>
  )
}
