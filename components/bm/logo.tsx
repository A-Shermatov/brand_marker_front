import Link from "next/link"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  href?: string
  dark?: boolean
  small?: boolean
  className?: string
  showWordmark?: boolean
}

function LogoMark({ dark = false, small = false }: { dark?: boolean; small?: boolean }) {
  const fill = dark ? "#FFFFFF" : "#16181D"
  const stroke = dark ? "#16181D" : "#FFFFFF"
  return (
    <svg
      className={cn(small ? "h-8 w-8" : "h-9 w-9", "shrink-0")}
      viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="10" fill={fill} />
      <path
        d="M12 9.5h7.6a4.6 4.6 0 0 1 1.9 8.8 4.9 4.9 0 0 1-1.6 9.7H12z"
        fill="none"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M12 18.4h9" stroke={stroke} strokeWidth="2.6" />
      <circle cx="27" cy="27" r="3.2" fill="#12A06E" />
    </svg>
  )
}

export function BrandLogo({
  href = "/",
  dark = false,
  small = false,
  className,
  showWordmark = true,
}: BrandLogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex max-w-none shrink-0 select-none items-center gap-2.5 whitespace-nowrap",
        className,
      )}
    >
      <LogoMark dark={dark} small={small} />
      {showWordmark ? (
        <span
          className={cn(
            "whitespace-nowrap leading-none font-bold tracking-[-0.02em]",
            small ? "text-[17px]" : "text-[20px]",
            dark ? "text-white" : "text-ink",
          )}
        >
          Brend&nbsp;Market
        </span>
      ) : null}
    </span>
  )

  if (!href) return content
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 whitespace-nowrap"
      aria-label="Brend Market — на главную"
    >
      {content}
    </Link>
  )
}
