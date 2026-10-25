import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, disabled, ...props }, ref) => {
    const baseClasses =
      'min-h-[56px] px-6 py-3 text-lg font-semibold transition-all duration-200 ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed w-full';

    const variantClasses = {
      primary:
        'bg-[var(--primary)] text-white rounded-full shadow-md hover:shadow-lg hover:bg-[#0a5555] active:scale-[0.98] focus:ring-[var(--primary)]',
      secondary:
        'bg-[var(--surface-raised)] text-[var(--text)] rounded-2xl border-2 border-[var(--border)] hover:border-[var(--primary)] hover:bg-[#F5F2ED] focus:ring-[var(--border)]',
      danger:
        'bg-[var(--owe)] text-white rounded-full shadow-md hover:bg-[#8b3326] focus:ring-[var(--owe)]',
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
