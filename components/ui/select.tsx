'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value: string
  onChange: (value: any) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  size?: 'sm' | 'default'
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  style,
  disabled = false,
  size = 'default',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('custom-select-container', className)}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'custom-select-trigger',
          isOpen && 'custom-select-trigger-open',
          size === 'sm' && 'custom-select-trigger-sm',
          disabled && 'custom-select-trigger-disabled'
        )}
      >
        <span className="custom-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'custom-select-chevron',
            isOpen && 'custom-select-chevron-open',
            size === 'sm' && 'custom-select-chevron-sm'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="custom-select-dropdown"
          >
            <div className="custom-select-options-list">
              {options.length === 0 ? (
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No options
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected = opt.value === value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value)
                        setIsOpen(false)
                      }}
                      className={cn(
                        'custom-select-option',
                        isSelected && 'custom-select-option-selected',
                        size === 'sm' && 'custom-select-option-sm'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="custom-select-check-icon" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
