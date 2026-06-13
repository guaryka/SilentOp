import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient'
  size?: 'sm' | 'default' | 'lg' | 'icon' | 'icon-sm'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'btn',
          `btn-variant-${variant}`,
          `btn-size-${size}`,
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: '1rem',
              height: '1rem',
              marginRight: '0.5rem',
              animation: 'spin-slow 1s linear infinite',
              display: 'inline-block'
            }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
