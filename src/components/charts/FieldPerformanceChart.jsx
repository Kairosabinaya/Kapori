import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { generateChartData } from '../../data'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Hari ke-{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: item.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: <span className="font-semibold">{item.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function FieldPerformanceChart({ farm = 'Semua Farm', time = 'Hari Ini' }) {
  const data = useMemo(() => generateChartData(farm, time), [farm, time])

  const periodLabel = time === 'Hari Ini' ? '24 jam terakhir' :
    time === '7 Hari Terakhir' ? '7 hari terakhir' : '30 hari terakhir'

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Analitik Performa Lahan</h3>
        <span className="text-xs text-gray-400">{periodLabel} · {farm}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="hari"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            align="right"
            verticalAlign="top"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
          />
          <Line
            type="monotone"
            dataKey="kelembaban"
            name="Kelembaban (%)"
            stroke="#2D6A4F"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#2D6A4F' }}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="suhu"
            name="Suhu (°C)"
            stroke="#F59E0B"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#F59E0B' }}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
