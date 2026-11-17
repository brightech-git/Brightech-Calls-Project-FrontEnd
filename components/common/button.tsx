'use client';
import { cn } from '@/lib/utils';
import { buttonClass, buttonVariants } from '@/lib/styles';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    loading?: boolean;
    loadingText?: string;
  }
>(function Button(
  {
    variant = 'secondary',
    loading,
    loadingText = 'Please wait…',
    disabled,
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={!!loading}
      className={cn(buttonClass, buttonVariants[variant], className)}
      data-variant={variant}
    >
      {loading && (
        <LoaderCircle
          size={14}
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
});
