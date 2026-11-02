'use client';
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
      className={`button ${className}`}
      data-variant={variant}
    >
      {loading && (
        <LoaderCircle
          size={16}
          className="loading-spin"
          aria-hidden="true"
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
});
