import { motion } from 'framer-motion'

export default function ChariotLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} text-blue-600`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2 v 7" />
        <path d="M12 15 v 7" />
        <path d="M22 12 h -7" />
        <path d="M9 12 h -7" />
        <path d="m19.07 4.93-5 5" />
        <path d="m9.93 14.07-5 5" />
        <path d="m4.93 4.93 5 5" />
        <path d="m14.07 14.07 5 5" />
      </svg>
    </motion.div>
  )
}
