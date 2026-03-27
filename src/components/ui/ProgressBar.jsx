import { motion } from 'framer-motion'
import clsx from 'clsx'

const colorMap = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  kapori: 'bg-kapori-500',
}

const bgColorMap = {
  green: 'bg-green-100',
  amber: 'bg-amber-100',
  red: 'bg-red-100',
  blue: 'bg-blue-100',
  kapori: 'bg-kapori-100',
}

export default function ProgressBar({ value, max = 100, color = 'kapori' }) {
  const percent = Math.min((value / max) * 100, 100)

  return (
    <div className={clsx('w-full rounded-full h-2 overflow-hidden', bgColorMap[color] || 'bg-gray-100')}>
      <motion.div
        className={clsx('h-full rounded-full', colorMap[color] || 'bg-kapori-500')}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}
