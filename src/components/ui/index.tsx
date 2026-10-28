"use client";

import React from 'react';

// ================================================================
// Button — Maroon primary, with smooth hover transitions
// ================================================================
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', className = '' }: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

  const variants = {
    primary: "bg-maroon-900 text-white hover:bg-maroon-800 focus:ring-maroon-500 shadow-sm hover:shadow-md",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    outline: "bg-white text-maroon-900 border-2 border-maroon-200 hover:bg-maroon-50 focus:ring-maroon-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ================================================================
// Card — Clean white with subtle shadow
// ================================================================
export function Card({ children, title, subtitle, className = '', action, noPadding }: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  action?: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow duration-200 hover:shadow-md ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
          <div>
            {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

// ================================================================
// Input — With floating label feel
// ================================================================
export function Input({ label, name, type = 'text', value, onChange, placeholder, required, error, prefix, suffix, disabled, className = '' }: {
  label?: string
  name: string
  type?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  error?: string
  prefix?: string
  suffix?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-maroon-600">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`block w-full text-sm rounded-xl transition-all duration-200 focus:outline-none focus:ring-2
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}
            ${error 
              ? 'border-red-300 text-red-900 focus:ring-red-200 focus:border-red-400' 
              : 'border-gray-200 focus:ring-maroon-100 focus:border-maroon-400'
            }
            ${prefix ? 'pl-10' : 'pl-3.5'}
            ${suffix ? 'pr-10' : 'pr-3.5'}
            py-2.5 border`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ================================================================
// Select
// ================================================================
export function Select({ label, name, value, onChange, options, placeholder, required, error, className = '' }: {
  label?: string
  name: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string | number; label: string }[]
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-maroon-600">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full pl-3.5 pr-10 py-2.5 text-sm border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-300 text-red-900 focus:ring-red-200 focus:border-red-400' 
            : 'border-gray-200 focus:ring-maroon-100 focus:border-maroon-400'
          }`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ================================================================
// Textarea
// ================================================================
export function Textarea({ label, name, value, onChange, placeholder, rows = 3, required, error, className = '' }: {
  label?: string
  name: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  required?: boolean
  error?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-maroon-600">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`block w-full border rounded-xl py-2.5 px-3.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-300 text-red-900 focus:ring-red-200 focus:border-red-400' 
            : 'border-gray-200 focus:ring-maroon-100 focus:border-maroon-400'
          }`}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ================================================================
// Badge — With maroon variants
// ================================================================
export function Badge({ children, variant = 'default', className = '' }: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'maroon'
  className?: string
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
    maroon: "bg-maroon-50 text-maroon-900",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ================================================================
// Alert
// ================================================================
export function Alert({ children, variant = 'info', title }: {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
}) {
  const variants = {
    info: "bg-sky-50 border-sky-300 text-sky-800",
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
    error: "bg-red-50 border-red-300 text-red-800"
  };

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌"
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-xl ${variants[variant]}`}>
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5 shrink-0">{icons[variant]}</span>
        <div>
          {title && <h3 className="text-sm font-bold mb-1">{title}</h3>}
          <div className={`text-sm ${title ? '' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Modal — With backdrop blur
// ================================================================
export function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl"
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        />
        <div className={`relative bg-white rounded-2xl shadow-2xl transform transition-all w-full ${sizes[size]} animate-fade-in-up`}>
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900" id="modal-title">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none rounded-lg hover:bg-gray-100 p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Table — With maroon header
// ================================================================
export function Table({ headers, children, className = '' }: {
  headers: string[]
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-100 ${className}`}>
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50/80">
            {headers.map((header, i) => (
              <th key={i} scope="col" className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ================================================================
// StatCard — For dashboard with icon and gradient options
// ================================================================
export function StatCard({ title, value, icon, trend, trendLabel, variant = 'default' }: {
  title: string
  value: string | React.ReactNode
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'maroon'
}) {
  const bgColors = {
    default: 'bg-white',
    success: 'bg-white',
    warning: 'bg-white',
    danger: 'bg-white',
    maroon: 'bg-gradient-to-br from-maroon-900 to-maroon-800',
  };

  const textColors = {
    default: 'text-gray-900',
    success: 'text-gray-900',
    warning: 'text-gray-900',
    danger: 'text-gray-900',
    maroon: 'text-white',
  };

  const subtitleColors = {
    default: 'text-gray-500',
    success: 'text-gray-500',
    warning: 'text-gray-500',
    danger: 'text-gray-500',
    maroon: 'text-maroon-200',
  };

  const iconBgs = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    maroon: 'bg-white/15 text-white',
  };

  return (
    <div className={`rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col transition-shadow duration-200 hover:shadow-md ${bgColors[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${subtitleColors[variant]}`}>{title}</h3>
        {icon && <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${iconBgs[variant]}`}>{icon}</div>}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className={`text-2xl font-bold ${textColors[variant]}`}>{value}</div>
        {trend && (
          <div className="mt-2 flex items-center text-xs font-medium">
            {trend === 'up' && <span className="text-emerald-500 mr-1">↑</span>}
            {trend === 'down' && <span className="text-red-500 mr-1">↓</span>}
            {trend === 'neutral' && <span className="text-gray-400 mr-1">—</span>}
            {trendLabel && <span className={subtitleColors[variant]}>{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// Loading spinner — Maroon themed
// ================================================================
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  return (
    <svg className={`animate-spin text-maroon-700 ${sizes[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

// ================================================================
// Empty state
// ================================================================
export function EmptyState({ title, description, action, icon }: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: string
}) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
