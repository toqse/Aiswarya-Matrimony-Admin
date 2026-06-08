import ChatPage from "@/pages/ChatPage";

export function generateStaticParams() {
  // Static export (cPanel): pre-generate demo chat pages.
  const profileIds = [1, 2, 3, 4, 5, 6, 7, 8];
  return profileIds.map((profileId) => ({ profileId: String(profileId) }));
}

export default function ChatRoutePage() {
  return <ChatPage />;
}
