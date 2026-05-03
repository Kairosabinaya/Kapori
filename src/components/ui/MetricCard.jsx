import { motion } from 'framer-motion'
import clsx from 'clsx'
import { SENSOR_THRESHOLDS, classifyMetric } from '../../lib/sensor-thresholds'

// Compact tile untuk satu pembacaan sensor di grid Overview.
// Tidak pakai progress bar - status sudah dikomunikasikan via warna ikon/border/
// nilai. Hint rentang ideal ditampilkan sebagai teks kecil saja.
export default function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  metricKey,
  onClick,
}) {
  const t = metricKey ? SENSOR_THRESHOLDS[metricKey] : null
  const status = classifyMetric(value, metricKey)
  const highlight = status === 'critical'
  const warning = status === 'warning'

  const idealLabel = t
    ? t.monotonic === 'higher-better' ? `Ideal ≥ ${t.optimalMin}${t.unit}`
    : t.monotonic === 'lower-better'  ? `Ideal ≤ ${t.optimalMax}${t.unit}`
    : `Ideal ${t.optimalMin}–${t.optimalMax}${t.unit}`
    : null

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      className={clsx(
        'card p-5 cursor-pointer relative overflow-hidden',
        highlight && 'border-red-300 border-2',
        warning && !highlight && 'border-amber-300 border-2'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx(
            'p-2 rounded-xl shrink-0',
            highlight ? 'bg-red-50' : warning ? 'bg-amber-50' : 'bg-kapori-50'
          )}>
            {Icon && <Icon className={clsx(
              'w-5 h-5',
              highlight ? 'text-red-600' : warning ? 'text-amber-600' : 'text-kapori-600'
            )} />}
          </div>
          <span className="text-sm text-gray-500 font-medium truncate">{label}</span>
        </div>
        {trendValue && (
          <span className={clsx(
            'text-xs font-semibold flex items-center gap-0.5 shrink-0',
            trend === 'up' ? 'text-green-600' : 'text-red-500'
          )}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={clsx(
          'text-3xl font-bold tabular-nums',
          highlight ? 'text-red-600' : warning ? 'text-amber-600' : 'text-gray-800'
        )}>
          {value ?? '-'}
        </span>
        <span className="text-sm text-gray-400 font-medium">{unit}</span>
      </div>
      {idealLabel && (
        <p className="text-[11px] text-gray-400 mt-2">{idealLabel}</p>
      )}
    </motion.div>
  )
}
