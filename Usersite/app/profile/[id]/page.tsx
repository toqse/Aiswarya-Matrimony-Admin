import ProfileDetail from "@/pages/ProfileDetail";

export function generateStaticParams() {
  // Static export (cPanel): pre-generate demo profile pages.
  const ids = [1, 2, 3, 4, 5, 6, 7, 8];
  return ids.map((id) => ({ id: String(id) }));
}

export default function ProfilePage() {
  return <ProfileDetail />;
}
