import type { Metadata } from "next"
import { InviteContent } from "./invite-content"

export const metadata: Metadata = {
  title: "Приглашение в компанию — Brend Market",
  robots: { index: false, follow: false },
}

type InvitePageProps = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  return <InviteContent token={token} />
}
