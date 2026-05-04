import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  // Neutral primary — matches the pp-btn primary used across the dashboard /
  // ongoing-project pages (black on light, white on dark). Avoids the brand
  // tint bleeding through child pages.
  primary:
    'bg-(--color-ink) text-(--color-bg) border border-(--color-ink) hover:opacity-90 active:translate-y-[0.5px]',
  secondary:
    'bg-(--color-surface) text-(--color-ink) border border-(--color-border) hover:bg-(--color-surface-2)',
  ghost: 'bg-transparent text-(--color-ink) hover:bg-(--color-surface-2)',
  danger: 'bg-(--color-danger) text-white hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[13px] rounded-md gap-1.5',
  md: 'h-8 px-3 text-sm rounded-md gap-2',
  lg: 'h-10 px-4 text-base rounded-lg gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
});
