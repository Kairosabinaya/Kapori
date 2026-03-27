import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function MetricCard({ icon: Icon, label, value, unit, trend, trendValue, highlight, onClick }) {
  const progressPercent = typeof value === 'number' ? Math.min(value, 100) : 0

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      className={clsx(
        'card p-5 cursor-pointer relative overflow-hidden',
        highlight && 'border-amber-400 border-2'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-kapori-50 rounded-xl">
            {Icon && <Icon className="w-5 h-5 text-kapori-600" />}
          </div>
          <span className="text-sm text-gray-500 font-medium">{label}</span>
        </div>
        {trendValue && (
          <span className={clsx(
            'text-xs font-semibold flex items-center gap-0.5',
            trend === 'up' ? 'text-green-600' : 'text-red-500'
          )}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <span className="text-sm text-gray-400 font-medium">{unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={clsx(
            'h-full rounded-full',
            highlight ? 'bg-amber-400' : 'bg-kapori-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}
