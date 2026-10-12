"use client";

import { ui } from "@/utils/ui";
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
export default function WorkspaceError({
  unstable_retry
}: {
  error: Error & {
    digest?: string;
  };
  unstable_retry: () => void;
}) {
  return <section className={ui("workspace-error-state")} role="alert"><span><AlertCircle size={32} /></span><h2>We couldn’t open this page</h2><p>Please try again. If this continues, return to your overview and contact your administrator.</p><div><button className={ui("ui-button primary")} onClick={unstable_retry}><RefreshCw size={16} />Try again</button><Link href="/Home" className={ui("ui-button")}><ArrowLeft size={16} />Back to overview</Link></div></section>;
}
