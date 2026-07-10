"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Staff Master was a disconnected duplicate of User Master (it called
// /staff endpoints that never existed on the backend). Staff/Admin
// creation now lives entirely in User Master. This route just redirects
// there so any old links/bookmarks still land somewhere useful.
export default function StaffMasterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Master/UserMaster");
  }, [router]);

  return null;
}
