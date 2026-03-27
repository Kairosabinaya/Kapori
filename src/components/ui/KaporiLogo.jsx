import logo from '../../assets/logo.png'
import clsx from 'clsx'

export default function KaporiLogo({ variant = 'default', className = '', height = 36 }) {
  return (
    <img
      src={logo}
      alt="KAPORI"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={clsx(
        className,
        variant === 'white' && 'logo-white',
        variant === 'black' && 'logo-black',
      )}
    />
  )
}
