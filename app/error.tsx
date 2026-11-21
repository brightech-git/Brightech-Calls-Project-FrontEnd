'use client';

import { buttonClass, buttonVariants } from '@/lib/styles';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
export default function WorkspaceError({
  unstable_retry,
}: {
  error: Error & {
    digest?: string;
  };
  unstable_retry: () => void;
}) {
  return (
    <section
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 text-center [&>span]:mb-6 [&>span]:grid [&>span]:size-18 [&>span]:place-items-center [&>span]:rounded-2xl [&>span]:bg-rose-50 [&>span]:text-rose-600 [&>h2]:mb-3 [&>h2]:text-2xl [&>p]:mb-7 [&>p]:text-sm [&>p]:leading-8 [&>p]:text-muted [&>div]:flex [&>div]:flex-wrap [&>div]:justify-center [&>div]:gap-3"
      role="alert"
    >
      <span>
        <AlertCircle size={32} />
      </span>
      <h2>We couldn’t open this page</h2>
      <p>
        Please try again. If this continues, return to your overview and contact your
        administrator.
      </p>
      <div>
        <button
          className={cn(buttonClass, buttonVariants.primary)}
          onClick={unstable_retry}
        >
          <RefreshCw size={16} />
          Try again
        </button>
        <Link
          href="/Home"
          className={buttonClass}
        >
          <ArrowLeft size={16} />
          Back to overview
        </Link>
      </div>
    </section>
  );
}
