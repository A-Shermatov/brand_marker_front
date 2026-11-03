import Link from "next/link"
import { BrandLogo } from "@/components/bm"

type Props = {
  children: React.ReactNode
}

/** Centered card layout shared by login-like pages (forgot / reset password). */
export function AuthShell({ children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-4 lg:px-8">
        <BrandLogo />
        <Link
          href="/"
          className="text-[14px] font-semibold text-mute hover:text-ink"
        >
          На главную
        </Link>
      </div>

      <div className="grid flex-1 place-items-center px-4 py-10">
        <div className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(28,28,26,.05),0_20px_40px_-28px_rgba(28,28,26,.35)] sm:p-9">
          {children}
        </div>
      </div>
    </div>
  )
}
