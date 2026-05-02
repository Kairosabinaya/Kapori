import toast from 'react-hot-toast'

const baseStyle = {
  background: '#fff',
  color: '#1B4332',
  borderLeft: '4px solid #2D6A4F',
}

const warningStyle = {
  background: '#fff',
  color: '#92400E',
  borderLeft: '4px solid #F59E0B',
}

const errorStyle = {
  background: '#fff',
  color: '#991B1B',
  borderLeft: '4px solid #DC2626',
}

const neutralStyle = {
  background: '#fff',
  color: '#374151',
  borderLeft: '4px solid #9CA3AF',
}

export const notify = {
  success(message) {
    return toast(message, { style: baseStyle })
  },
  warning(message) {
    return toast(message, { style: warningStyle })
  },
  error(message) {
    return toast(message, { style: errorStyle })
  },
  info(message) {
    return toast(message, { style: neutralStyle })
  },
}
