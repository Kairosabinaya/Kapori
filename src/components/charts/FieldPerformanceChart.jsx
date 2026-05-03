import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { generateChartData } from '../../data'
import { SENSOR_THRESHOLDS } from '../../lib/sensor-thresholds'

const CustomTooltip = ({ active, payload, label, isHourly, suffix }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">
        {isHourly ? `Pukul ${label}` : `Hari ke-${label}`}
      </p>
      {payload.map((item, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: item.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="font-semibold">{item.value}{suffix}</span>
        </p>
      ))}
    </div>
  )
}

function MetricChart({ data, dataKey, color, title, unit, isHourly, optimalMin, optimalMax }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <span className="text-[11px] text-gray-400">Ideal {optimalMin}–{optimalMax}{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hari"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip isHourly={isHourly} suffix={unit} />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
            isAnimationActive
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function FieldPerformanceChart({ farm = 'Semua Area', time = 'Hari Ini' }) {
  const data = useMemo(() => generateChartData(farm, time), [farm, time])
  const isHourly = time === 'Hari Ini'

  const periodLabel = isHourly ? '24 jam terakhir'
    : time === '7 Hari Terakhir' ? '7 hari terakhir'
    : '30 hari terakhir'

  const tKel = SENSOR_THRESHOLDS.kelembaban
  const tSuh = SENSOR_THRESHOLDS.suhu

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="text-base font-bold text-gray-800">Analitik performa lahan</h3>
        <span className="text-xs text-gray-400">{periodLabel} · {farm}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <MetricChart
          data={data}
          dataKey="kelembaban"
          color="#2D6A4F"
          title="Kelembaban tanah"
          unit="%"
          isHourly={isHourly}
          optimalMin={tKel.optimalMin}
          optimalMax={tKel.optimalMax}
        />
        <MetricChart
          data={data}
          dataKey="suhu"
          color="#B8870F"
          title="Suhu"
          unit="°C"
          isHourly={isHourly}
          optimalMin={tSuh.optimalMin}
          optimalMax={tSuh.optimalMax}
        />
      </div>
    </div>
  )
}
