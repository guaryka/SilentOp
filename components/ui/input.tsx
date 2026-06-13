import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="input-wrapper">
        {label && (
          <label className="input-label">
            {label}
          </label>
        )}
        <div className="input-container">
          {icon && (
            <span className="input-icon">
              {icon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              'input-field',
              icon && 'has-icon',
              error && 'has-error',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="input-error-text">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
