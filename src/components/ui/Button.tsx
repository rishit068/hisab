import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, disabled, ...props }, ref) => {
    const baseClasses =
      'min-h-[56px] px-6 py-3 rounded-xl text-lg font-semibold transition-colors duration-150 ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed w-full';

    const variantClasses = {
      primary:
        'bg-[var(--primary)] text-white hover:bg-[#0a5555] focus:ring-[var(--primary)]',
      secondary:
        'bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--border)] ' +
        'hover:bg-gray-50 focus:ring-[var(--border)]',
      danger:
        'bg-[var(--owe)] text-white hover:bg-[#8b3326] focus:ring-[var(--owe)]',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
