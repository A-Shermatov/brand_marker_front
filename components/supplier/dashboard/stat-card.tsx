import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

type StatCardProps = {
  Icon: PhosphorIcon
  label: string
  value: string
  accent: string
  subValue?: string
  href?: string
}

const cardClass = "block bg-card border border-border rounded-xl p-4"
const linkCardClass =
  "transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export const StatCard = ({ Icon, label, value, accent, subValue, href }: StatCardProps) => {
  const content = (
    <>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${accent}`}>
        <Icon size={16} />
      </div>
      <div className="text-xl font-bold text-foreground leading-none">{value}</div>
      {subValue && (
        <div className="text-[11px] text-muted-foreground mt-1">{subValue}</div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </>
  )

  if (!href) return <div className={cardClass}>{content}</div>

  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}`}
      className={`${cardClass} ${linkCardClass}`}
    >
      {content}
    </Link>
  )
}
