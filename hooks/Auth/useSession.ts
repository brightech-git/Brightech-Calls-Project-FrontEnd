"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("calls-session-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("calls-session-change", callback); };
}
function snapshot() {
  try {
    return JSON.stringify({ loggedIn: localStorage.getItem("isLoggedIn") === "true" && !!localStorage.getItem("calls_token"), userId: localStorage.getItem("userId") ?? "", username: localStorage.getItem("username") ?? "", menuIds: localStorage.getItem("menuIds") });
  } catch { return "{}"; }
}
export function useSession() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  return JSON.parse(raw) as { loggedIn?: boolean; userId?: string; username?: string; menuIds?: string | null };
}
