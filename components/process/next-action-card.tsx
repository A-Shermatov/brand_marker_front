import { cn } from "@/lib/utils"

type NextActionCardProps = {
  title: string
  text?: React.ReactNode
  /** Buttons row. Keep a single primary button per card. */
  actions?: React.ReactNode
  /** Extra content between text and actions (submission preview, review form, etc). */
  children?: React.ReactNode
  /** `true` when the current user must act ("Нужно ваше действие"), otherwise "Сейчас". */
  hot?: boolean
  tone?: "default" | "danger"
  className?: string
}

export const NextActionCard = ({
  title,
  text,
  actions,
  children,
  hot = false,
  tone = "default",
  className,
}: NextActionCardProps) => {
  const isDanger = tone === "danger"
  const eyebrow = hot ? "Нужно ваше действие" : "Сейчас"

  return (
    <section
      aria-label={`${eyebrow}: ${title}`}
      className={cn(
        "grid gap-3 rounded-2xl border p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]",
        isDanger
          ? "border-destructive/30 bg-destructive/5"
          : hot
            ? "border-brand-300 bg-brand-50/60"
            : "border-line bg-card",
        className,
      )}
    >
      <span
        className={cn(
          "text-[12.5px] font-medium",
          isDanger ? "text-destructive" : hot ? "text-brand-700" : "text-mute",
        )}
      >
        {eyebrow}
      </span>
      <h2 className="text-[20px] font-bold tracking-[-0.02em] text-balance text-ink">
        {title}
      </h2>
      {text ? <div className="text-[15px] text-mute">{text}</div> : null}
      {children}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}
