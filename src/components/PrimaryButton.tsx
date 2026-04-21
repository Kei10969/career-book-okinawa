import { ButtonHTMLAttributes } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blue' | 'orange' | 'green' | 'red' | 'gray'
  fullWidth?: boolean
}

const variantStyles: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  green: 'bg-[#06C755] hover:bg-[#05b34c] text-white',
  red: 'bg-red-500 hover:bg-red-600 text-white',
  gray: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
}

export default function PrimaryButton({
  variant = 'blue',
  fullWidth = true,
  className = '',
  disabled,
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        font-bold text-base py-3.5 px-6 rounded-2xl
        transition-all active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
