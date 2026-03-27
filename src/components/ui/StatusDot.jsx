import clsx from 'clsx'

export default function StatusDot({ status }) {
  if (status === 'online') {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex rounded-full h-3 w-3',
        status === 'peringatan' && 'bg-amber-400',
        status === 'offline' && 'bg-red-500',
      )}
    />
  )
}
