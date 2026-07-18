import NotFoundView from "@/components/NotFoundView";

// Next.js App Router convention: automatically rendered for any URL that
// doesn't match a route (including the static export's 404.html).
export default function NotFound() {
  return <NotFoundView />;
}
